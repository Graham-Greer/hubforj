try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import {
  assertAttendanceStatusTransition,
  assertEventCanAcceptRegistration,
  assertRegistrationPaymentStatusTransition,
  assertRegistrationStatusTransition,
  resolveInitialEventRegistrationStatus,
  resolveInitialRegistrationPaymentStatus,
} from "@/lib/domain/registrations";
import { getEventById } from "@/lib/data/events";
import {
  countRegisteredBookings,
  getRegistrationDoc,
  normalizeRegistrationRecord,
  normalizeString,
} from "./event-registration-shared.js";
import { getEventRegistrationByUser } from "./event-registration-queries.js";

export async function createEventRegistrationForMember(hubId, eventId, userId, actorId = "system") {
  const normalizedHubId = normalizeString(hubId);
  const normalizedEventId = normalizeString(eventId);
  const normalizedUserId = normalizeString(userId);

  if (!normalizedHubId || !normalizedEventId || !normalizedUserId) {
    throw new Error("Hub, event, and user ids are required.");
  }

  const [event, existingRegistration, registeredCount] = await Promise.all([
    getEventById(normalizedHubId, normalizedEventId),
    getEventRegistrationByUser(normalizedHubId, normalizedEventId, normalizedUserId),
    countRegisteredBookings(normalizedHubId, normalizedEventId),
  ]);

  if (!event) {
    throw new Error("Event not found.");
  }

  assertEventCanAcceptRegistration(event, registeredCount);

  if (existingRegistration) {
    throw new Error("You already have a registration for this event.");
  }

  const now = new Date().toISOString();
  const status = resolveInitialEventRegistrationStatus(event, registeredCount);
  const paymentStatus = resolveInitialRegistrationPaymentStatus(event);
  const ref = getFirebaseAdminDb()
    .collection("hubs")
    .doc(normalizedHubId)
    .collection("events")
    .doc(normalizedEventId)
    .collection("registrations")
    .doc();

  const writeModel = {
    hubId: normalizedHubId,
    eventId: normalizedEventId,
    userId: normalizedUserId,
    status,
    paymentStatus,
    attendanceStatus: "pending",
    attendanceMarkedAt: "",
    nativePaymentTransactionId: "",
    nativePaymentStatus: "",
    nativePaymentCheckoutUrl: "",
    nativePaymentSessionId: "",
    paymentCompletedAt: "",
    notes: "",
    createdAt: now,
    updatedAt: now,
    createdBy: normalizeString(actorId),
    updatedBy: normalizeString(actorId),
  };

  await ref.set(writeModel);

  return normalizeRegistrationRecord({
    id: ref.id,
    ...writeModel,
  });
}

export async function updateEventRegistrationStatus(hubId, eventId, registrationId, nextStatus, actorId = "system") {
  const normalizedHubId = normalizeString(hubId);
  const normalizedEventId = normalizeString(eventId);
  const normalizedRegistrationId = normalizeString(registrationId);

  if (!normalizedHubId || !normalizedEventId || !normalizedRegistrationId) {
    throw new Error("Hub, event, and registration ids are required.");
  }

  const doc = await getRegistrationDoc(normalizedHubId, normalizedEventId, normalizedRegistrationId);

  if (!doc.exists) {
    throw new Error("Registration not found.");
  }

  const current = normalizeRegistrationRecord({
    id: doc.id,
    hubId: normalizedHubId,
    eventId: normalizedEventId,
    ...doc.data(),
  });
  const status = assertRegistrationStatusTransition(current.status, nextStatus);
  const now = new Date().toISOString();
  const update = {
    status,
    updatedAt: now,
    updatedBy: normalizeString(actorId),
  };

  if (status === "cancelled") {
    update.cancelledAt = now;
    update.cancelledByUserId = normalizeString(actorId);
    update.attendanceStatus = "pending";
    update.attendanceMarkedAt = "";
  } else if (current.status === "cancelled") {
    update.cancelledAt = "";
    update.cancelledByUserId = "";
  }

  await doc.ref.update(update);

  return normalizeRegistrationRecord({
    ...current,
    ...update,
  });
}

export async function updateEventRegistrationAttendanceStatus(
  hubId,
  eventId,
  registrationId,
  nextAttendanceStatus,
  actorId = "system"
) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedEventId = normalizeString(eventId);
  const normalizedRegistrationId = normalizeString(registrationId);

  if (!normalizedHubId || !normalizedEventId || !normalizedRegistrationId) {
    throw new Error("Hub, event, and registration ids are required.");
  }

  const doc = await getRegistrationDoc(normalizedHubId, normalizedEventId, normalizedRegistrationId);

  if (!doc.exists) {
    throw new Error("Registration not found.");
  }

  const current = normalizeRegistrationRecord({
    id: doc.id,
    hubId: normalizedHubId,
    eventId: normalizedEventId,
    ...doc.data(),
  });
  const attendanceStatus = assertAttendanceStatusTransition(
    current.status,
    current.attendanceStatus,
    nextAttendanceStatus
  );
  const now = new Date().toISOString();
  const update = {
    attendanceStatus,
    attendanceMarkedAt: attendanceStatus === "pending" ? "" : now,
    updatedAt: now,
    updatedBy: normalizeString(actorId),
  };

  await doc.ref.update(update);

  return normalizeRegistrationRecord({
    ...current,
    ...update,
  });
}

export async function updateEventRegistrationPaymentStatus(
  hubId,
  eventId,
  registrationId,
  nextPaymentStatus,
  actorId = "system"
) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedEventId = normalizeString(eventId);
  const normalizedRegistrationId = normalizeString(registrationId);
  const normalizedPaymentStatus = normalizeString(nextPaymentStatus).toLowerCase();

  if (!normalizedHubId || !normalizedEventId || !normalizedRegistrationId) {
    throw new Error("Hub, event, and registration ids are required.");
  }

  const doc = await getRegistrationDoc(normalizedHubId, normalizedEventId, normalizedRegistrationId);

  if (!doc.exists) {
    throw new Error("Registration not found.");
  }

  const current = normalizeRegistrationRecord({
    id: doc.id,
    hubId: normalizedHubId,
    eventId: normalizedEventId,
    ...doc.data(),
  });
  const paymentStatus = assertRegistrationPaymentStatusTransition(current.paymentStatus, normalizedPaymentStatus);
  const update = {
    paymentStatus,
    updatedAt: new Date().toISOString(),
    updatedBy: normalizeString(actorId),
  };

  await doc.ref.update(update);

  return normalizeRegistrationRecord({
    ...current,
    ...update,
  });
}

export async function updateEventRegistrationNativePaymentState(
  hubId,
  eventId,
  registrationId,
  payload = {},
  actorId = "system"
) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedEventId = normalizeString(eventId);
  const normalizedRegistrationId = normalizeString(registrationId);

  if (!normalizedHubId || !normalizedEventId || !normalizedRegistrationId) {
    throw new Error("Hub, event, and registration ids are required.");
  }

  const doc = await getRegistrationDoc(normalizedHubId, normalizedEventId, normalizedRegistrationId);

  if (!doc.exists) {
    throw new Error("Registration not found.");
  }

  const current = normalizeRegistrationRecord({
    id: doc.id,
    hubId: normalizedHubId,
    eventId: normalizedEventId,
    ...doc.data(),
  });
  const hasOwn = (key) => Object.prototype.hasOwnProperty.call(payload, key);
  const update = {
    nativePaymentTransactionId: hasOwn("nativePaymentTransactionId")
      ? normalizeString(payload.nativePaymentTransactionId)
      : current.nativePaymentTransactionId,
    nativePaymentStatus: hasOwn("nativePaymentStatus")
      ? normalizeString(payload.nativePaymentStatus)
      : current.nativePaymentStatus,
    nativePaymentCheckoutUrl: hasOwn("nativePaymentCheckoutUrl")
      ? normalizeString(payload.nativePaymentCheckoutUrl)
      : current.nativePaymentCheckoutUrl,
    nativePaymentSessionId: hasOwn("nativePaymentSessionId")
      ? normalizeString(payload.nativePaymentSessionId)
      : current.nativePaymentSessionId,
    paymentCompletedAt: hasOwn("paymentCompletedAt")
      ? normalizeString(payload.paymentCompletedAt)
      : current.paymentCompletedAt,
    updatedAt: new Date().toISOString(),
    updatedBy: normalizeString(actorId),
  };

  await doc.ref.update(update);

  return normalizeRegistrationRecord({
    ...current,
    ...update,
  });
}
