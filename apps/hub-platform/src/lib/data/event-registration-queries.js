try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { getFallbackRegionalMarket } from "@/lib/domain/regional-markets";
import {
  countRegisteredBookings,
  getEventsByIds,
  getRegistrationDoc,
  listRegistrationDocsByUser,
  getUsersByIds,
  listUserEventRegistrationsAcrossHub,
  normalizeRegistrationRecord,
  normalizeString,
} from "./event-registration-shared.js";

function sortRegistrationRowsByCreatedAtDesc(rows = []) {
  return [...rows].sort((left, right) =>
    String(right.createdAt || right.updatedAt || "").localeCompare(String(left.createdAt || left.updatedAt || ""))
  );
}

export async function listEventRegistrations(hubId, eventId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedEventId = normalizeString(eventId);

  if (!normalizedHubId || !normalizedEventId) {
    return [];
  }

  const snapshot = await getFirebaseAdminDb()
    .collection("hubs")
    .doc(normalizedHubId)
    .collection("events")
    .doc(normalizedEventId)
    .collection("registrations")
    .orderBy("createdAt", "desc")
    .get();

  const baseRows = snapshot.docs.map((doc) =>
    normalizeRegistrationRecord({
      id: doc.id,
      hubId: normalizedHubId,
      eventId: normalizedEventId,
      ...doc.data(),
    })
  );

  const usersById = await getUsersByIds(baseRows.map((row) => row.userId));

  return baseRows.map((row) => normalizeRegistrationRecord(row, usersById.get(row.userId)));
}

export async function countRegisteredEventRegistrations(hubId, eventId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedEventId = normalizeString(eventId);

  if (!normalizedHubId || !normalizedEventId) {
    return 0;
  }

  return countRegisteredBookings(normalizedHubId, normalizedEventId);
}

export async function listRegistrationsByUser(hubId, userId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedUserId = normalizeString(userId);

  if (!normalizedHubId || !normalizedUserId) {
    return [];
  }

  const rows = (await listUserEventRegistrationsAcrossHub(normalizedHubId, normalizedUserId)).filter(
    (row) => row.hubId === normalizedHubId && row.eventId
  );
  const eventsById = await getEventsByIds(
    normalizedHubId,
    rows.map((row) => row.eventId)
  );

  return rows
    .map((row) => {
      const event = eventsById.get(row.eventId);

      return {
        ...row,
        eventTitle: normalizeString(event?.title),
        eventSlug: normalizeString(event?.slug),
        eventImageUrl: normalizeString(event?.imageAsset?.publicUrl),
        eventImageAlt: normalizeString(event?.imageAlt || event?.imageAsset?.alt || event?.title),
        eventStartDate: normalizeString(event?.startDate),
        eventEndDate: normalizeString(event?.endDate),
        eventStartTime: normalizeString(event?.startTime),
        eventEndTime: normalizeString(event?.endTime),
        eventStartAt: normalizeString(event?.startAt),
        eventEndAt: normalizeString(event?.endAt),
        eventLocation: normalizeString(event?.location),
        price: normalizeString(event?.price),
        currency: normalizeString(event?.currency).toUpperCase() || getFallbackRegionalMarket().defaultCurrency,
        pricingMode: normalizeString(event?.pricingMode) || "free",
        externalPaymentUrl: normalizeString(event?.externalPaymentUrl),
        paymentInstructions: normalizeString(event?.paymentInstructions),
        refundWindowMode: normalizeString(event?.refundWindowMode) || "default",
        refundWindowHours: Number.parseInt(String(event?.refundWindowHours || ""), 10) || 48,
        refundPolicy: normalizeString(event?.refundPolicy) || "full_refund_before_window",
      };
    })
    .sort((left, right) => String(left.eventStartAt || "").localeCompare(String(right.eventStartAt || "")));
}

export async function listEventPaymentItemsByHub(hubId) {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    return [];
  }

  const db = getFirebaseAdminDb();
  const eventSnapshot = await db.collection("hubs").doc(normalizedHubId).collection("events").get();

  if (eventSnapshot.empty) {
    return [];
  }

  const registrationSnapshots = await Promise.all(
    eventSnapshot.docs.map((eventDoc) => eventDoc.ref.collection("registrations").get())
  );

  const baseRows = registrationSnapshots
    .flatMap((snapshot) =>
      snapshot.docs.map((doc) => normalizeRegistrationRecord({ id: doc.id, ...doc.data() }))
    )
    .filter((row) => row.hubId === normalizedHubId && row.eventId);

  const [eventsById, usersById] = await Promise.all([
    getEventsByIds(normalizedHubId, baseRows.map((row) => row.eventId)),
    getUsersByIds(baseRows.map((row) => row.userId)),
  ]);

  return baseRows
    .map((row) => {
      const event = eventsById.get(row.eventId);
      const user = usersById.get(row.userId);

      return {
        id: `event_${row.id}`,
        recordId: row.id,
        kind: "event",
        title: normalizeString(event?.title) || "Event booking",
        status: row.status,
        paymentStatus: row.paymentStatus,
        amount: normalizeString(event?.price),
        currency: normalizeString(event?.currency).toUpperCase() || getFallbackRegionalMarket().defaultCurrency,
        dueDate: normalizeString(event?.startAt),
        detail: normalizeString(event?.location) || "Event booking payment state.",
        userId: row.userId,
        userName: normalizeString(user?.name),
        userEmail: normalizeString(user?.email).toLowerCase(),
        eventId: row.eventId,
        nativePaymentTransactionId: normalizeString(row.nativePaymentTransactionId),
        nativePaymentStatus: normalizeString(row.nativePaymentStatus),
        paymentCompletedAt: normalizeString(row.paymentCompletedAt),
        createdAt: normalizeString(row.createdAt),
        updatedAt: normalizeString(row.updatedAt),
      };
    });
}

export async function listEventRegistrationsByUserForEvent(hubId, eventId, userId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedEventId = normalizeString(eventId);
  const normalizedUserId = normalizeString(userId);

  if (!normalizedHubId || !normalizedEventId || !normalizedUserId) {
    return [];
  }

  const docs = await listRegistrationDocsByUser(normalizedHubId, normalizedEventId, normalizedUserId);

  return sortRegistrationRowsByCreatedAtDesc(
    docs.map((doc) =>
      normalizeRegistrationRecord({
        id: doc.id,
        hubId: normalizedHubId,
        eventId: normalizedEventId,
        ...doc.data(),
      })
    )
  );
}

export async function getEventRegistrationByUser(hubId, eventId, userId) {
  const rows = await listEventRegistrationsByUserForEvent(hubId, eventId, userId);

  return rows.find((row) => row.status !== "cancelled") || null;
}

export async function getLatestEventRegistrationByUser(hubId, eventId, userId) {
  const rows = await listEventRegistrationsByUserForEvent(hubId, eventId, userId);

  if (!rows.length) {
    return null;
  }

  return rows[0];
}

export async function getEventRegistrationById(hubId, eventId, registrationId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedEventId = normalizeString(eventId);
  const normalizedRegistrationId = normalizeString(registrationId);

  if (!normalizedHubId || !normalizedEventId || !normalizedRegistrationId) {
    return null;
  }

  const doc = await getRegistrationDoc(normalizedHubId, normalizedEventId, normalizedRegistrationId);

  if (!doc.exists) {
    return null;
  }

  return normalizeRegistrationRecord({
    id: doc.id,
    hubId: normalizedHubId,
    eventId: normalizedEventId,
    ...doc.data(),
  });
}
