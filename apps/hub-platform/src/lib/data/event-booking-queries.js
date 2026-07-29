try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { getFallbackRegionalMarket } from "@/lib/domain/regional-markets";
import {
  getEventBookingAttendeeCollection,
  getEventBookingCollection,
  getEventBookingDoc,
  getEventsByIds,
  getUsersByIds,
  listEventBookingDocsByBooker,
  listUserEventBookingsAcrossHub,
  normalizeEventBookingAttendeeRecord,
  normalizeEventBookingRecord,
  normalizeString,
} from "./event-booking-shared.js";

function sortBookingRowsByCreatedAtDesc(rows = []) {
  return [...rows].sort((left, right) =>
    String(right.createdAt || right.updatedAt || "").localeCompare(String(left.createdAt || left.updatedAt || ""))
  );
}

export async function listEventBookings(hubId, eventId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedEventId = normalizeString(eventId);

  if (!normalizedHubId || !normalizedEventId) {
    return [];
  }

  const snapshot = await getEventBookingCollection(normalizedHubId, normalizedEventId)
    .orderBy("createdAt", "desc")
    .get();

  const baseRows = snapshot.docs.map((doc) =>
    normalizeEventBookingRecord({
      id: doc.id,
      hubId: normalizedHubId,
      eventId: normalizedEventId,
      ...doc.data(),
    })
  );

  const usersById = await getUsersByIds(baseRows.map((row) => row.bookerUserId));

  return baseRows.map((row) => normalizeEventBookingRecord(row, usersById.get(row.bookerUserId)));
}

export async function listWaitlistedEventBookings(hubId, eventId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedEventId = normalizeString(eventId);

  if (!normalizedHubId || !normalizedEventId) {
    return [];
  }

  const snapshot = await getEventBookingCollection(normalizedHubId, normalizedEventId).get();

  return snapshot.docs
    .map((doc) =>
      normalizeEventBookingRecord({
        id: doc.id,
        hubId: normalizedHubId,
        eventId: normalizedEventId,
        ...doc.data(),
      })
    )
    .filter((booking) => booking.status === "waitlisted")
    .sort((left, right) => String(left.createdAt || "").localeCompare(String(right.createdAt || "")));
}

export async function listEventBookingAttendees(hubId, eventId, bookingId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedEventId = normalizeString(eventId);
  const normalizedBookingId = normalizeString(bookingId);

  if (!normalizedHubId || !normalizedEventId || !normalizedBookingId) {
    return [];
  }

  const snapshot = await getEventBookingAttendeeCollection(normalizedHubId, normalizedEventId, normalizedBookingId)
    .orderBy("createdAt", "asc")
    .get();

  return snapshot.docs.map((doc) =>
    normalizeEventBookingAttendeeRecord({
      id: doc.id,
      hubId: normalizedHubId,
      eventId: normalizedEventId,
      bookingId: normalizedBookingId,
      ...doc.data(),
    })
  );
}

export async function countActiveEventBookingAttendees(hubId, eventId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedEventId = normalizeString(eventId);

  if (!normalizedHubId || !normalizedEventId) {
    return 0;
  }

  const snapshot = await getEventBookingCollection(normalizedHubId, normalizedEventId)
    .where("status", "==", "active")
    .get();

  return snapshot.docs.reduce((sum, doc) => {
    const row = normalizeEventBookingRecord({ id: doc.id, ...doc.data() });
    return sum + Math.max(0, row.activeAttendeeCount);
  }, 0);
}

export async function countWaitlistedEventBookingAttendees(hubId, eventId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedEventId = normalizeString(eventId);

  if (!normalizedHubId || !normalizedEventId) {
    return 0;
  }

  const snapshot = await getEventBookingCollection(normalizedHubId, normalizedEventId)
    .where("status", "==", "waitlisted")
    .get();

  return snapshot.docs.reduce((sum, doc) => {
    const row = normalizeEventBookingRecord({ id: doc.id, ...doc.data() });
    return sum + Math.max(0, row.waitlistedAttendeeCount || row.attendeeCount);
  }, 0);
}

export async function listEventBookingsByBooker(hubId, userId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedUserId = normalizeString(userId);

  if (!normalizedHubId || !normalizedUserId) {
    return [];
  }

  const rows = (await listUserEventBookingsAcrossHub(normalizedHubId, normalizedUserId)).filter(
    (row) => row.hubId === normalizedHubId && row.eventId
  );
  const [eventsById, usersById] = await Promise.all([
    getEventsByIds(
      normalizedHubId,
      rows.map((row) => row.eventId)
    ),
    getUsersByIds(rows.map((row) => row.bookerUserId)),
  ]);

  return rows
    .map((row) => {
      const event = eventsById.get(row.eventId);
      const booker = usersById.get(row.bookerUserId);

      return {
        ...normalizeEventBookingRecord(row, booker),
        eventTitle: normalizeString(event?.title) || row.eventTitleSnapshot,
        eventSlug: normalizeString(event?.slug) || row.eventSlugSnapshot,
        eventKind: normalizeString(event?.eventKind) || "single",
        seriesId: normalizeString(event?.seriesId),
        occurrenceDate: normalizeString(event?.occurrenceDate),
        isSeriesManaged: event?.isSeriesManaged === true,
        eventImageUrl: normalizeString(event?.imageAsset?.publicUrl),
        eventImageAlt: normalizeString(event?.imageAlt || event?.imageAsset?.alt || event?.title || row.eventTitleSnapshot),
        eventStartDate: normalizeString(event?.startDate),
        eventEndDate: normalizeString(event?.endDate),
        eventStartTime: normalizeString(event?.startTime),
        eventEndTime: normalizeString(event?.endTime),
        eventStartAt: normalizeString(event?.startAt) || row.eventStartAtSnapshot,
        eventEndAt: normalizeString(event?.endAt) || row.eventEndAtSnapshot,
        eventLocation: normalizeString(event?.location) || row.eventLocationSnapshot,
        price: normalizeString(event?.price),
        currency: normalizeString(event?.currency).toUpperCase() || row.currency || getFallbackRegionalMarket().defaultCurrency,
        pricingMode: normalizeString(event?.pricingMode) || "free",
        externalPaymentUrl: normalizeString(event?.externalPaymentUrl),
        paymentInstructions: normalizeString(event?.paymentInstructions),
        refundWindowMode: normalizeString(event?.refundWindowMode) || row.refundWindowModeSnapshot || "default",
        refundWindowHours: Number.parseInt(String(event?.refundWindowHours || row.refundWindowHoursSnapshot || ""), 10) || 48,
        refundPolicy: normalizeString(event?.refundPolicy) || row.refundPolicySnapshot || "full_refund_before_window",
      };
    })
    .sort((left, right) => String(left.eventStartAt || "").localeCompare(String(right.eventStartAt || "")));
}

export async function listEventBookingPaymentItemsByHub(hubId) {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    return [];
  }

  const db = getFirebaseAdminDb();
  const eventSnapshot = await db.collection("hubs").doc(normalizedHubId).collection("events").get();

  if (eventSnapshot.empty) {
    return [];
  }

  const bookingSnapshots = await Promise.all(
    eventSnapshot.docs.map((eventDoc) => eventDoc.ref.collection("bookings").get())
  );

  const baseRows = bookingSnapshots
    .flatMap((snapshot) =>
      snapshot.docs.map((doc) =>
        normalizeEventBookingRecord({
          id: doc.id,
          ...doc.data(),
        })
      )
    )
    .filter((row) => row.hubId === normalizedHubId && row.eventId);

  const [eventsById, usersById] = await Promise.all([
    getEventsByIds(
      normalizedHubId,
      baseRows.map((row) => row.eventId)
    ),
    getUsersByIds(baseRows.map((row) => row.bookerUserId)),
  ]);

  return baseRows.map((row) => {
    const event = eventsById.get(row.eventId);
    const booker = usersById.get(row.bookerUserId);

    return {
      id: `event_${row.id}`,
      recordId: row.id,
      kind: "event",
      title: normalizeString(event?.title) || row.eventTitleSnapshot || "Event booking",
      status: row.status,
      paymentStatus: row.paymentStatus,
      amount: row.amountDisplay || normalizeString(event?.price),
      currency: row.currency || normalizeString(event?.currency).toUpperCase() || getFallbackRegionalMarket().defaultCurrency,
      dueDate: normalizeString(event?.startAt) || row.eventStartAtSnapshot,
      detail: normalizeString(event?.location) || row.eventLocationSnapshot || "Event booking payment state.",
      userId: row.bookerUserId,
      userName: normalizeString(booker?.name) || row.bookerNameSnapshot,
      userEmail: normalizeString(booker?.email).toLowerCase() || row.bookerEmailSnapshot,
      eventId: row.eventId,
      attendeeCount: row.attendeeCount,
      nativePaymentTransactionId: normalizeString(row.nativePaymentTransactionId),
      nativePaymentStatus: normalizeString(row.nativePaymentStatus),
      paymentCompletedAt: normalizeString(row.paymentCompletedAt),
      createdAt: normalizeString(row.createdAt),
      updatedAt: normalizeString(row.updatedAt),
    };
  });
}

export async function listEventBookingsByBookerForEvent(hubId, eventId, userId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedEventId = normalizeString(eventId);
  const normalizedUserId = normalizeString(userId);

  if (!normalizedHubId || !normalizedEventId || !normalizedUserId) {
    return [];
  }

  const docs = await listEventBookingDocsByBooker(normalizedHubId, normalizedEventId, normalizedUserId);

  return sortBookingRowsByCreatedAtDesc(
    docs.map((doc) =>
      normalizeEventBookingRecord({
        id: doc.id,
        hubId: normalizedHubId,
        eventId: normalizedEventId,
        ...doc.data(),
      })
    )
  );
}

export async function getActiveOrWaitlistedEventBookingByBooker(hubId, eventId, userId) {
  const rows = await listEventBookingsByBookerForEvent(hubId, eventId, userId);

  return rows.find((row) => row.status === "active" || row.status === "waitlisted") || null;
}

export async function getLatestEventBookingByBooker(hubId, eventId, userId) {
  const rows = await listEventBookingsByBookerForEvent(hubId, eventId, userId);
  return rows[0] || null;
}

export async function getEventBookingById(hubId, eventId, bookingId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedEventId = normalizeString(eventId);
  const normalizedBookingId = normalizeString(bookingId);

  if (!normalizedHubId || !normalizedEventId || !normalizedBookingId) {
    return null;
  }

  const doc = await getEventBookingDoc(normalizedHubId, normalizedEventId, normalizedBookingId);

  if (!doc.exists) {
    return null;
  }

  return normalizeEventBookingRecord({
    id: doc.id,
    hubId: normalizedHubId,
    eventId: normalizedEventId,
    ...doc.data(),
  });
}

export async function listEventAdminBookingRows(hubId, eventId) {
  const bookings = await listEventBookings(hubId, eventId);

  if (!bookings.length) {
    return [];
  }

  const attendeeLists = await Promise.all(
    bookings.map((booking) => listEventBookingAttendees(hubId, eventId, booking.id))
  );

  return bookings.map((booking, index) => {
    const attendees = attendeeLists[index] || [];
    const attendeeNames = attendees
      .map((attendee) => attendee.displayName)
      .filter(Boolean)
      .join(", ");

    return {
      ...booking,
      userId: booking.bookerUserId,
      userName: booking.bookerName || booking.bookerNameSnapshot,
      userEmail: booking.bookerEmail || booking.bookerEmailSnapshot,
      attendeeNames,
      attendeePreview: attendeeNames || `${booking.attendeeCount || 0} attendee${booking.attendeeCount === 1 ? "" : "s"}`,
      createdAt: booking.createdAt,
    };
  });
}

export async function listEventAdminAttendanceRows(hubId, eventId) {
  const bookings = await listEventBookings(hubId, eventId);

  if (!bookings.length) {
    return [];
  }

  const attendeeLists = await Promise.all(
    bookings.map((booking) => listEventBookingAttendees(hubId, eventId, booking.id))
  );

  return bookings.flatMap((booking, index) => {
    const attendees = attendeeLists[index] || [];

    return attendees.map((attendee) => ({
      ...attendee,
      bookerUserId: booking.bookerUserId,
      bookerName: booking.bookerName || booking.bookerNameSnapshot,
      bookerEmail: booking.bookerEmail || booking.bookerEmailSnapshot,
      bookingStatus: booking.status,
      bookingPaymentStatus: booking.paymentStatus,
      bookingCreatedAt: booking.createdAt,
      attendeeId: attendee.id,
      userId: attendee.memberUserId || booking.bookerUserId,
      userName: attendee.displayName || booking.bookerName || booking.bookerNameSnapshot,
      userEmail: attendee.email || booking.bookerEmail || booking.bookerEmailSnapshot,
      createdAt: attendee.createdAt || booking.createdAt,
    }));
  });
}
