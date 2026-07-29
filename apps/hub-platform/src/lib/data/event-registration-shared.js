try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { normalizeEventRecord, withEventMedia } from "./event-shared.js";

export function normalizeString(value) {
  return String(value || "").trim();
}

export function normalizeRegistrationRecord(registration, user = null) {
  if (!registration) {
    return null;
  }

  return {
    id: normalizeString(registration.id),
    hubId: normalizeString(registration.hubId),
    eventId: normalizeString(registration.eventId),
    userId: normalizeString(registration.userId),
    status: normalizeString(registration.status) || "registered",
    paymentStatus: normalizeString(registration.paymentStatus) || "not_required",
    attendanceStatus: normalizeString(registration.attendanceStatus) || "pending",
    attendanceMarkedAt: normalizeString(registration.attendanceMarkedAt),
    nativePaymentTransactionId: normalizeString(registration.nativePaymentTransactionId),
    nativePaymentStatus: normalizeString(registration.nativePaymentStatus),
    nativePaymentCheckoutUrl: normalizeString(registration.nativePaymentCheckoutUrl),
    nativePaymentSessionId: normalizeString(registration.nativePaymentSessionId),
    paymentCompletedAt: normalizeString(registration.paymentCompletedAt),
    notes: normalizeString(registration.notes),
    createdAt: normalizeString(registration.createdAt),
    updatedAt: normalizeString(registration.updatedAt),
    userName: normalizeString(user?.name),
    userEmail: normalizeString(user?.email).toLowerCase(),
  };
}

export async function getUsersByIds(userIds) {
  const normalizedUserIds = [...new Set(userIds.map(normalizeString).filter(Boolean))];

  if (!normalizedUserIds.length) {
    return new Map();
  }

  const db = getFirebaseAdminDb();
  const refs = normalizedUserIds.map((userId) => db.collection("users").doc(userId));
  const docs = await db.getAll(...refs);

  return new Map(
    docs
      .filter((doc) => doc.exists)
      .map((doc) => [doc.id, { id: doc.id, ...doc.data() }])
  );
}

export async function getEventsByIds(hubId, eventIds) {
  const normalizedEventIds = [...new Set(eventIds.map(normalizeString).filter(Boolean))];

  if (!normalizedEventIds.length) {
    return new Map();
  }

  const db = getFirebaseAdminDb();
  const refs = normalizedEventIds.map((eventId) =>
    db.collection("hubs").doc(hubId).collection("events").doc(eventId)
  );
  const docs = await db.getAll(...refs);

  const normalizedEvents = docs
    .filter((doc) => doc.exists)
    .map((doc) => normalizeEventRecord({ id: doc.id, hubId, ...doc.data() }))
    .filter(Boolean);
  const eventsWithMedia = await withEventMedia(hubId, normalizedEvents);

  return new Map(eventsWithMedia.map((event) => [event.id, event]));
}

export async function listUserEventRegistrationsAcrossHub(hubId, userId) {
  const db = getFirebaseAdminDb();
  const eventSnapshot = await db.collection("hubs").doc(hubId).collection("events").get();
  const normalizedUserId = normalizeString(userId);

  if (eventSnapshot.empty) {
    return [];
  }

  const registrationSnapshots = await Promise.all(
    eventSnapshot.docs.map((eventDoc) => eventDoc.ref.collection("registrations").get())
  );

  return registrationSnapshots
    .flatMap((snapshot) =>
      snapshot.docs.map((doc) =>
        normalizeRegistrationRecord({
          id: doc.id,
          ...doc.data(),
        })
      )
    )
    .filter((row) => row.userId === normalizedUserId);
}

export async function getRegistrationDoc(hubId, eventId, registrationId) {
  return getFirebaseAdminDb()
    .collection("hubs")
    .doc(hubId)
    .collection("events")
    .doc(eventId)
    .collection("registrations")
    .doc(registrationId)
    .get();
}

export async function listRegistrationDocsByUser(hubId, eventId, userId) {
  const snapshot = await getFirebaseAdminDb()
    .collection("hubs")
    .doc(hubId)
    .collection("events")
    .doc(eventId)
    .collection("registrations")
    .where("userId", "==", userId)
    .get();

  if (snapshot.empty) {
    return [];
  }

  return snapshot.docs;
}

export async function getRegistrationDocByUser(hubId, eventId, userId) {
  const docs = await listRegistrationDocsByUser(hubId, eventId, userId);
  return docs[0] || null;
}

export async function countRegisteredBookings(hubId, eventId) {
  const snapshot = await getFirebaseAdminDb()
    .collection("hubs")
    .doc(hubId)
    .collection("events")
    .doc(eventId)
    .collection("registrations")
    .where("status", "==", "registered")
    .get();

  return snapshot.size;
}
