try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { getFallbackRegionalMarket } from "@/lib/domain/regional-markets";
import { normalizeEventRecord, withEventMedia } from "./event-shared.js";

export function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeInteger(value, fallback = 0) {
  const next = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(next) ? next : fallback;
}

function isMemberAccountCollectionGroupEnabled() {
  return normalizeString(process.env.HUB_PLATFORM_MEMBER_ACCOUNT_COLLECTION_GROUP_ENABLED).toLowerCase() === "true";
}

function normalizeMemberAccountLimit(value, fallback = 200) {
  const next = Number.parseInt(String(value || ""), 10);
  return Math.min(Math.max(Number.isFinite(next) ? next : fallback, 1), 500);
}

export function normalizeEventBookingRecord(booking, bookerUser = null) {
  if (!booking) {
    return null;
  }

  return {
    id: normalizeString(booking.id),
    hubId: normalizeString(booking.hubId),
    eventId: normalizeString(booking.eventId),
    bookerUserId: normalizeString(booking.bookerUserId),
    bookerNameSnapshot: normalizeString(booking.bookerNameSnapshot),
    bookerEmailSnapshot: normalizeString(booking.bookerEmailSnapshot).toLowerCase(),
    status: normalizeString(booking.status) || "active",
    paymentStatus: normalizeString(booking.paymentStatus) || "not_required",
    attendeeCount: normalizeInteger(booking.attendeeCount, 0),
    activeAttendeeCount: normalizeInteger(booking.activeAttendeeCount, 0),
    waitlistedAttendeeCount: normalizeInteger(booking.waitlistedAttendeeCount, 0),
    cancelledAttendeeCount: normalizeInteger(booking.cancelledAttendeeCount, 0),
    amountMinor: normalizeInteger(booking.amountMinor, 0),
    amountDisplay: normalizeString(booking.amountDisplay),
    currency: normalizeString(booking.currency).toUpperCase() || getFallbackRegionalMarket().defaultCurrency,
    pricingMode: normalizeString(booking.pricingMode) || "free",
    nativePaymentTransactionId: normalizeString(booking.nativePaymentTransactionId),
    nativePaymentStatus: normalizeString(booking.nativePaymentStatus),
    nativePaymentCheckoutUrl: normalizeString(booking.nativePaymentCheckoutUrl),
    nativePaymentSessionId: normalizeString(booking.nativePaymentSessionId),
    paymentCompletedAt: normalizeString(booking.paymentCompletedAt),
    eventTitleSnapshot: normalizeString(booking.eventTitleSnapshot),
    eventSlugSnapshot: normalizeString(booking.eventSlugSnapshot),
    eventStartAtSnapshot: normalizeString(booking.eventStartAtSnapshot),
    eventEndAtSnapshot: normalizeString(booking.eventEndAtSnapshot),
    eventLocationSnapshot: normalizeString(booking.eventLocationSnapshot),
    bookingPolicySnapshot: normalizeString(booking.bookingPolicySnapshot),
    registrationEligibilitySnapshot: normalizeString(booking.registrationEligibilitySnapshot),
    bookingModeSnapshot: normalizeString(booking.bookingModeSnapshot),
    maxAttendeesPerBookingSnapshot: normalizeInteger(booking.maxAttendeesPerBookingSnapshot, 0),
    refundPolicySnapshot: normalizeString(booking.refundPolicySnapshot),
    refundWindowModeSnapshot: normalizeString(booking.refundWindowModeSnapshot),
    refundWindowHoursSnapshot: normalizeInteger(booking.refundWindowHoursSnapshot, 0),
    notes: normalizeString(booking.notes),
    createdAt: normalizeString(booking.createdAt),
    updatedAt: normalizeString(booking.updatedAt),
    createdBy: normalizeString(booking.createdBy),
    updatedBy: normalizeString(booking.updatedBy),
    cancelledAt: normalizeString(booking.cancelledAt),
    cancelledByUserId: normalizeString(booking.cancelledByUserId),
    bookerName: normalizeString(bookerUser?.name),
    bookerEmail: normalizeString(bookerUser?.email).toLowerCase(),
  };
}

export function normalizeEventBookingAttendeeRecord(attendee) {
  if (!attendee) {
    return null;
  }

  return {
    id: normalizeString(attendee.id),
    hubId: normalizeString(attendee.hubId),
    eventId: normalizeString(attendee.eventId),
    bookingId: normalizeString(attendee.bookingId),
    memberUserId: normalizeString(attendee.memberUserId),
    firstName: normalizeString(attendee.firstName),
    lastName: normalizeString(attendee.lastName),
    displayName: normalizeString(attendee.displayName),
    email: normalizeString(attendee.email).toLowerCase(),
    relationshipLabel: normalizeString(attendee.relationshipLabel),
    status: normalizeString(attendee.status) || "registered",
    attendanceStatus: normalizeString(attendee.attendanceStatus) || "pending",
    attendanceMarkedAt: normalizeString(attendee.attendanceMarkedAt),
    isPrimaryBooker: attendee.isPrimaryBooker === true,
    unitAmountMinorSnapshot: normalizeInteger(attendee.unitAmountMinorSnapshot, 0),
    unitAmountDisplaySnapshot: normalizeString(attendee.unitAmountDisplaySnapshot),
    currencySnapshot: normalizeString(attendee.currencySnapshot).toUpperCase() || getFallbackRegionalMarket().defaultCurrency,
    refundPolicySnapshot: normalizeString(attendee.refundPolicySnapshot),
    refundWindowModeSnapshot: normalizeString(attendee.refundWindowModeSnapshot),
    refundWindowHoursSnapshot: normalizeInteger(attendee.refundWindowHoursSnapshot, 0),
    refundStatus: normalizeString(attendee.refundStatus) || "not_applicable",
    refundAmountMinor: normalizeInteger(attendee.refundAmountMinor, 0),
    refundAmountDisplay: normalizeString(attendee.refundAmountDisplay),
    refundedAt: normalizeString(attendee.refundedAt),
    createdAt: normalizeString(attendee.createdAt),
    updatedAt: normalizeString(attendee.updatedAt),
    cancelledAt: normalizeString(attendee.cancelledAt),
    cancelledByUserId: normalizeString(attendee.cancelledByUserId),
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

export function getEventBookingCollection(hubId, eventId) {
  return getFirebaseAdminDb()
    .collection("hubs")
    .doc(hubId)
    .collection("events")
    .doc(eventId)
    .collection("bookings");
}

export function getEventBookingBookerSentinelRef(hubId, eventId, bookerUserId) {
  return getFirebaseAdminDb()
    .collection("hubs")
    .doc(hubId)
    .collection("events")
    .doc(eventId)
    .collection("bookingBookers")
    .doc(bookerUserId);
}

export function getEventBookingDocRef(hubId, eventId, bookingId) {
  return getEventBookingCollection(hubId, eventId).doc(bookingId);
}

export function getEventBookingAttendeeCollection(hubId, eventId, bookingId) {
  return getEventBookingDocRef(hubId, eventId, bookingId).collection("attendees");
}

export function getEventBookingAttendeeDocRef(hubId, eventId, bookingId, attendeeId) {
  return getEventBookingAttendeeCollection(hubId, eventId, bookingId).doc(attendeeId);
}

export async function getEventBookingDoc(hubId, eventId, bookingId) {
  return getEventBookingDocRef(hubId, eventId, bookingId).get();
}

export async function listEventBookingDocsByBooker(hubId, eventId, bookerUserId) {
  const snapshot = await getEventBookingCollection(hubId, eventId)
    .where("bookerUserId", "==", bookerUserId)
    .get();

  return snapshot.empty ? [] : snapshot.docs;
}

async function listUserEventBookingsAcrossHubFanOut(hubId, userId) {
  const db = getFirebaseAdminDb();
  const eventSnapshot = await db.collection("hubs").doc(hubId).collection("events").get();
  const normalizedUserId = normalizeString(userId);

  if (eventSnapshot.empty) {
    return [];
  }

  const bookingSnapshots = await Promise.all(
    eventSnapshot.docs.map((eventDoc) => eventDoc.ref.collection("bookings").get())
  );

  return bookingSnapshots
    .flatMap((snapshot) =>
      snapshot.docs.map((doc) =>
        normalizeEventBookingRecord({
          id: doc.id,
          ...doc.data(),
        })
      )
    )
    .filter((row) => row.bookerUserId === normalizedUserId);
}

async function listUserEventBookingsAcrossHubCollectionGroup(hubId, userId, options = {}) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedUserId = normalizeString(userId);
  const limit = normalizeMemberAccountLimit(options.limit);

  if (!normalizedHubId || !normalizedUserId) {
    return [];
  }

  const snapshot = await getFirebaseAdminDb()
    .collectionGroup("bookings")
    .where("hubId", "==", normalizedHubId)
    .where("bookerUserId", "==", normalizedUserId)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) =>
    normalizeEventBookingRecord({
      id: doc.id,
      ...doc.data(),
    })
  );
}

export async function listUserEventBookingsAcrossHub(hubId, userId, options = {}) {
  if (!isMemberAccountCollectionGroupEnabled()) {
    return listUserEventBookingsAcrossHubFanOut(hubId, userId);
  }

  try {
    return await listUserEventBookingsAcrossHubCollectionGroup(hubId, userId, options);
  } catch (error) {
    console.warn("Falling back to member event booking fan-out query.", {
      hubId: normalizeString(hubId),
      userId: normalizeString(userId),
      error: String(error?.message || "Unable to query member event bookings."),
    });
    return listUserEventBookingsAcrossHubFanOut(hubId, userId);
  }
}
