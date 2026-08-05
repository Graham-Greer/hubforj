try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import crypto from "node:crypto";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { getEventById } from "@/lib/data/events";
import { getHubById } from "@/lib/data/hubs";
import {
  assertEventCanAcceptBooking,
  buildPrimaryBookerAttendee,
  canPromoteWaitlistedBooking,
  canHubUseGroupBookings,
  normalizeEventBookingRequestedAttendees,
  resolveBookingStatusFromAttendees,
  resolveEventBookingConfiguration,
  resolveRemainingEventAttendeeCapacity,
  resolveEventBookingRefundState,
  resolveInitialEventBookingPaymentStatus,
  resolveInitialEventBookingStatus,
  summarizeEventBookingAttendees,
} from "@/lib/domain/event-bookings";
import {
  getEventBookingAttendeeCollection,
  getEventBookingCollection,
  getEventBookingAttendeeDocRef,
  getEventBookingBookerSentinelRef,
  getEventBookingDocRef,
  normalizeEventBookingAttendeeRecord,
  normalizeEventBookingRecord,
  normalizeString,
} from "./event-booking-shared.js";
import { getPaymentRecordBySource, upsertPaymentRecordBySource } from "./payment-records.js";
import { getFallbackRegionalMarket } from "@/lib/domain/regional-markets";

function normalizeInteger(value, fallback = 0) {
  const next = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(next) ? next : fallback;
}

function normalizeMoneyDisplayFromMinor(amountMinor, currency = getFallbackRegionalMarket().defaultCurrency) {
  const normalizedCurrency = normalizeString(currency).toUpperCase() || getFallbackRegionalMarket().defaultCurrency;
  const numeric = Number.isFinite(Number(amountMinor)) ? Number(amountMinor) / 100 : 0;

  return new Intl.NumberFormat(getFallbackRegionalMarket().defaultLocale, {
    style: "currency",
    currency: normalizedCurrency,
  }).format(numeric);
}

function parsePriceToMinor(price) {
  const numeric = Number.parseFloat(String(price || ""));

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 0;
  }

  return Math.round(numeric * 100);
}

async function maintainDashboardProjectionsForEventBookingChange(
  hubId,
  actorId,
  reason = "event-booking-change"
) {
  try {
    const { maintainHubAdminDashboardProjectionsByHubId } = await import("./hub-dashboard-stats.js");
    return maintainHubAdminDashboardProjectionsByHubId(hubId, actorId, { reason });
  } catch (error) {
    console.warn("Unable to start dashboard projection maintenance after event booking change", {
      hubId: normalizeString(hubId),
      actorId: normalizeString(actorId) || "system",
      reason,
      error: String(error?.message || "Unable to maintain dashboard projections."),
    });
    return null;
  }
}

function resolvePaymentRecordReportingEligibility(amountMinor, paymentStatus) {
  if (Number.parseInt(String(amountMinor || ""), 10) <= 0) {
    return "informational_only";
  }

  return normalizeString(paymentStatus) === "not_required" ? "informational_only" : "count_in_revenue";
}

function buildBookingLedgerState(paymentStatus, bookingStatus, amountMinor, existingRecord = {}, now = new Date().toISOString()) {
  const normalizedPaymentStatus = normalizeString(paymentStatus).toLowerCase();
  const normalizedBookingStatus = normalizeString(bookingStatus).toLowerCase();
  const totalAmountMinor = normalizeInteger(amountMinor, 0);
  const existingRefundAmountMinor = normalizeInteger(existingRecord.refundAmountMinor, 0);
  const existingPaidAt = normalizeString(existingRecord.paidAt);
  const existingRefundedAt = normalizeString(existingRecord.refundedAt);

  if (normalizedPaymentStatus === "paid") {
    return {
      operationalStatus: "completed",
      financialStatus: "paid",
      paidAt: existingPaidAt || now,
      refundedAt: "",
      refundAmountMinor: 0,
      refundDisplay: "",
    };
  }

  if (normalizedPaymentStatus === "partially_refunded") {
    const refundAmountMinor = Math.max(0, Math.min(totalAmountMinor, existingRefundAmountMinor));

    return {
      operationalStatus: "completed",
      financialStatus: "partially_refunded",
      paidAt: existingPaidAt || now,
      refundedAt: existingRefundedAt || (refundAmountMinor > 0 ? now : ""),
      refundAmountMinor,
      refundDisplay:
        refundAmountMinor > 0 ? normalizeMoneyDisplayFromMinor(refundAmountMinor, existingRecord.currency || getFallbackRegionalMarket().defaultCurrency) : "",
    };
  }

  if (normalizedPaymentStatus === "refunded") {
    return {
      operationalStatus: "cancelled",
      financialStatus: "refunded",
      paidAt: existingPaidAt || now,
      refundedAt: existingRefundedAt || now,
      refundAmountMinor: totalAmountMinor,
      refundDisplay:
        totalAmountMinor > 0 ? normalizeMoneyDisplayFromMinor(totalAmountMinor, existingRecord.currency || getFallbackRegionalMarket().defaultCurrency) : "",
    };
  }

  if (normalizedPaymentStatus === "failed") {
    return {
      operationalStatus: normalizedBookingStatus === "cancelled" ? "cancelled" : "open",
      financialStatus: "failed",
      paidAt: "",
      refundedAt: "",
      refundAmountMinor: 0,
      refundDisplay: "",
    };
  }

  if (normalizedPaymentStatus === "not_required") {
    return {
      operationalStatus: normalizedBookingStatus === "cancelled" ? "cancelled" : "completed",
      financialStatus: "not_required",
      paidAt: "",
      refundedAt: "",
      refundAmountMinor: 0,
      refundDisplay: "",
    };
  }

  return {
    operationalStatus: normalizedBookingStatus === "cancelled" ? "cancelled" : "open",
    financialStatus: "unpaid",
    paidAt: "",
    refundedAt: "",
    refundAmountMinor: 0,
    refundDisplay: "",
  };
}

export async function syncEventBookingPaymentRecord(hubId, eventId, booking, actorId = "system", options = {}) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedEventId = normalizeString(eventId);

  if (!normalizedHubId || !normalizedEventId || !booking?.id) {
    return null;
  }

  const [hub, event, existingRecord] = await Promise.all([
    getHubById(normalizedHubId),
    getEventById(normalizedHubId, normalizedEventId),
    getPaymentRecordBySource(normalizedHubId, "eventBooking", booking.id),
  ]);
  const now = new Date().toISOString();
  const amountMinor = normalizeInteger(booking.amountMinor, 0);
  const currency = normalizeString(booking.currency || existingRecord?.currency).toUpperCase() || getFallbackRegionalMarket().defaultCurrency;
  const amountDisplay =
    normalizeString(booking.amountDisplay) ||
    normalizeString(existingRecord?.amountDisplay) ||
    normalizeMoneyDisplayFromMinor(amountMinor, currency);
  const ledgerState = buildBookingLedgerState(booking.paymentStatus, booking.status, amountMinor, {
    ...existingRecord,
    currency,
  }, now);
  const nativeTransactionId =
    normalizeString(booking.nativePaymentTransactionId) || normalizeString(existingRecord?.nativeTransactionId);
  const paymentMode =
    normalizeString(existingRecord?.paymentMode) || (nativeTransactionId ? "native" : "external");
  const provider =
    normalizeString(existingRecord?.provider) || (nativeTransactionId ? "stripe" : "manual");

  return upsertPaymentRecordBySource(
    normalizedHubId,
    {
      userId: normalizeString(booking.bookerUserId || existingRecord?.userId),
      kind: "event_booking",
      sourceType: "eventBooking",
      sourceId: booking.id,
      sourceSlug: normalizeString(event?.slug) || normalizeString(existingRecord?.sourceSlug),
      title:
        normalizeString(event?.title) ||
        normalizeString(booking.eventTitleSnapshot) ||
        normalizeString(existingRecord?.title) ||
        "Event booking",
      description:
        normalizeString(existingRecord?.description) ||
        (normalizeString(hub?.name) ? `Event booking for ${hub.name}` : "Event booking"),
      amountMinor,
      amountDisplay,
      currency,
      paymentMode,
      provider,
      operationalStatus: ledgerState.operationalStatus,
      financialStatus: ledgerState.financialStatus,
      occurredAt:
        normalizeString(existingRecord?.occurredAt) || normalizeString(booking.createdAt) || now,
      dueAt:
        normalizeString(event?.startAt) ||
        normalizeString(booking.eventStartAtSnapshot) ||
        normalizeString(existingRecord?.dueAt) ||
        normalizeString(booking.createdAt) ||
        now,
      paidAt: ledgerState.paidAt,
      refundedAt: ledgerState.refundedAt,
      refundAmountMinor: ledgerState.refundAmountMinor,
      refundDisplay: ledgerState.refundDisplay,
      nativeTransactionId,
      stripeCheckoutSessionId: normalizeString(existingRecord?.stripeCheckoutSessionId),
      stripePaymentIntentId: normalizeString(existingRecord?.stripePaymentIntentId),
      stripeRefundId: normalizeString(existingRecord?.stripeRefundId),
      eventId: normalizedEventId,
      eventBookingId: booking.id,
      packageTierAtTime:
        normalizeString(existingRecord?.packageTierAtTime) || normalizeString(hub?.packageTier),
      paymentProcessingModeAtTime:
        normalizeString(existingRecord?.paymentProcessingModeAtTime) ||
        normalizeString(hub?.packagePaymentProcessingMode),
      sourceConfidence:
        normalizeString(existingRecord?.sourceConfidence) || (nativeTransactionId ? "authoritative" : "declared"),
      reportingEligibility: resolvePaymentRecordReportingEligibility(amountMinor, booking.paymentStatus),
    },
    actorId,
    options
  );
}

export async function backfillEventBookingPaymentRecordsToLedger(hubId, actorId = "event-booking-payment-backfill", options = {}) {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    return { total: 0, scanned: 0, synced: 0, skipped: 0, latestSourceTimestamp: "" };
  }

  const db = getFirebaseAdminDb();
  const eventSnapshot = await db.collection("hubs").doc(normalizedHubId).collection("events").get();
  let scanned = 0;
  let synced = 0;
  let skipped = 0;
  let latestSourceTimestamp = "";
  const since = normalizeString(options.since);

  for (const eventDoc of eventSnapshot.docs) {
    const bookingSnapshot = await eventDoc.ref.collection("bookings").get();

    for (const bookingDoc of bookingSnapshot.docs) {
      scanned += 1;
      const booking = normalizeEventBookingRecord({
        id: bookingDoc.id,
        hubId: normalizedHubId,
        eventId: eventDoc.id,
        ...bookingDoc.data(),
      });
      const candidateTimestamp = normalizeString(booking.updatedAt || booking.createdAt);

      if (candidateTimestamp && (!latestSourceTimestamp || candidateTimestamp > latestSourceTimestamp)) {
        latestSourceTimestamp = candidateTimestamp;
      }

      if (since && candidateTimestamp && candidateTimestamp <= since) {
        skipped += 1;
        continue;
      }

      await syncEventBookingPaymentRecord(normalizedHubId, eventDoc.id, booking, actorId, {
        rebuildPaymentSummary: false,
        syncMemberDirectory: false,
      });
      synced += 1;
    }
  }

  return {
    total: scanned,
    scanned,
    synced,
    skipped,
    latestSourceTimestamp,
  };
}

function buildGuestEligibleAttendees(booker, inputAttendees = []) {
  const normalizedAttendees = normalizeEventBookingRequestedAttendees(inputAttendees);
  const includesPrimaryBooker = normalizedAttendees.some((attendee) => attendee.isPrimaryBooker === true);

  if (includesPrimaryBooker) {
    return normalizedAttendees.map((attendee) =>
      attendee.isPrimaryBooker
        ? {
            ...attendee,
            memberUserId: attendee.memberUserId || normalizeString(booker?.id || booker?.userId),
            email: attendee.email || normalizeString(booker?.email).toLowerCase(),
          }
        : attendee
    );
  }

  return normalizedAttendees;
}

function buildRequestedAttendees(event, booker, payload = {}) {
  const bookingConfiguration = resolveEventBookingConfiguration(event);

  if (bookingConfiguration.registrationEligibility === "members-only") {
    return [buildPrimaryBookerAttendee(booker)];
  }

  const attendees = buildGuestEligibleAttendees(booker, payload.attendees);

  if (!attendees.length) {
    throw new Error("At least one attendee is required.");
  }

  if (attendees.length > bookingConfiguration.maxAttendeesPerBooking) {
    throw new Error("This booking exceeds the maximum attendees allowed for the event.");
  }

  return attendees;
}

function buildBookingSnapshots(event, bookingConfiguration) {
  return {
    bookingPolicySnapshot:
      bookingConfiguration.registrationEligibility === "members-only" ? "members_only_single_attendee" : "group_booking",
    registrationEligibilitySnapshot: bookingConfiguration.registrationEligibility,
    bookingModeSnapshot: bookingConfiguration.bookingMode,
    maxAttendeesPerBookingSnapshot: bookingConfiguration.maxAttendeesPerBooking,
    eventTitleSnapshot: normalizeString(event?.title),
    eventSlugSnapshot: normalizeString(event?.slug),
    eventStartAtSnapshot: normalizeString(event?.startAt),
    eventEndAtSnapshot: normalizeString(event?.endAt),
    eventLocationSnapshot: normalizeString(event?.location),
    refundPolicySnapshot: normalizeString(event?.refundPolicy),
    refundWindowModeSnapshot: normalizeString(event?.refundWindowMode),
    refundWindowHoursSnapshot: normalizeInteger(event?.refundWindowHours, 48),
  };
}

async function promoteOneWaitlistedEventBooking(hubId, eventId, bookingId, actorId = "system") {
  const normalizedHubId = normalizeString(hubId);
  const normalizedEventId = normalizeString(eventId);
  const normalizedBookingId = normalizeString(bookingId);

  if (!normalizedHubId || !normalizedEventId || !normalizedBookingId) {
    return { promoted: false, blockedByCapacity: false, booking: null };
  }

  const db = getFirebaseAdminDb();
  const eventRef = db.collection("hubs").doc(normalizedHubId).collection("events").doc(normalizedEventId);
  const bookingRef = getEventBookingDocRef(normalizedHubId, normalizedEventId, normalizedBookingId);
  const now = new Date().toISOString();
  let outcome = { promoted: false, blockedByCapacity: false, booking: null };

  await db.runTransaction(async (transaction) => {
    const [eventDoc, bookingDoc, attendeeSnapshot] = await Promise.all([
      transaction.get(eventRef),
      transaction.get(bookingRef),
      transaction.get(getEventBookingAttendeeCollection(normalizedHubId, normalizedEventId, normalizedBookingId)),
    ]);

    if (!eventDoc.exists || !bookingDoc.exists) {
      return;
    }

    const event = { id: eventDoc.id, hubId: normalizedHubId, ...eventDoc.data() };
    const booking = normalizeEventBookingRecord({
      id: bookingDoc.id,
      hubId: normalizedHubId,
      eventId: normalizedEventId,
      ...bookingDoc.data(),
    });

    if (booking.status !== "waitlisted") {
      outcome = { promoted: false, blockedByCapacity: false, booking };
      return;
    }

    const attendees = attendeeSnapshot.docs.map((doc) =>
      normalizeEventBookingAttendeeRecord({
        id: doc.id,
        hubId: normalizedHubId,
        eventId: normalizedEventId,
        bookingId: normalizedBookingId,
        ...doc.data(),
      })
    );
    const attendeeSummary = summarizeEventBookingAttendees(attendees);
    const requestedAttendeeCount = Math.max(
      1,
      attendeeSummary.waitlistedAttendeeCount || booking.waitlistedAttendeeCount || booking.attendeeCount
    );
    const registeredAttendeeCount = normalizeInteger(event.registeredAttendeeCount, 0);

    if (!canPromoteWaitlistedBooking(event, registeredAttendeeCount, requestedAttendeeCount)) {
      outcome = { promoted: false, blockedByCapacity: true, booking };
      return;
    }

    for (const attendee of attendees) {
      if (attendee.status !== "waitlisted") {
        continue;
      }

      transaction.update(
        getEventBookingAttendeeDocRef(normalizedHubId, normalizedEventId, normalizedBookingId, attendee.id),
        {
          status: "registered",
          updatedAt: now,
        }
      );
    }

    transaction.update(bookingRef, {
      status: "active",
      activeAttendeeCount: requestedAttendeeCount,
      waitlistedAttendeeCount: 0,
      updatedAt: now,
      updatedBy: normalizeString(actorId),
    });

    transaction.set(
      getEventBookingBookerSentinelRef(normalizedHubId, normalizedEventId, booking.bookerUserId),
      {
        bookingId: normalizedBookingId,
        eventId: normalizedEventId,
        bookerUserId: booking.bookerUserId,
        status: "active",
        updatedAt: now,
        createdAt: normalizeString(booking.createdAt) || now,
      },
      { merge: true }
    );

    transaction.update(eventRef, {
      registeredAttendeeCount: registeredAttendeeCount + requestedAttendeeCount,
      waitlistedAttendeeCount: Math.max(0, normalizeInteger(event.waitlistedAttendeeCount, 0) - requestedAttendeeCount),
      activeBookingCount: normalizeInteger(event.activeBookingCount, 0) + 1,
      updatedAt: now,
    });

    outcome = {
      promoted: true,
      blockedByCapacity: false,
      booking: normalizeEventBookingRecord({
        ...booking,
        status: "active",
        activeAttendeeCount: requestedAttendeeCount,
        waitlistedAttendeeCount: 0,
        updatedAt: now,
        updatedBy: normalizeString(actorId),
      }),
    };
  });

  return outcome;
}

export async function createEventBookingForMember(
  hubId,
  eventId,
  booker,
  payload = {},
  actorId = "system"
) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedEventId = normalizeString(eventId);
  const normalizedBookerUserId = normalizeString(booker?.id || booker?.userId);

  if (!normalizedHubId || !normalizedEventId || !normalizedBookerUserId) {
    throw new Error("Hub, event, and booker user ids are required.");
  }

  const [hub, event] = await Promise.all([
    getHubById(normalizedHubId),
    getEventById(normalizedHubId, normalizedEventId),
  ]);

  if (!hub) {
    throw new Error("Hub not found.");
  }

  if (!event) {
    throw new Error("Event not found.");
  }

  if (resolveEventBookingConfiguration(event).bookingMode === "group_booking" && !canHubUseGroupBookings(hub)) {
    throw new Error("Group bookings are only available on the Growth package tier.");
  }

  const bookingConfiguration = resolveEventBookingConfiguration(event);
  const requestedAttendees = buildRequestedAttendees(event, booker, payload);
  const requestedAttendeeCount = requestedAttendees.length;
  const unitAmountMinor = event?.pricingMode === "paid" ? parsePriceToMinor(event?.price) : 0;
  const amountMinor = unitAmountMinor * requestedAttendeeCount;
  const currency = normalizeString(event?.currency).toUpperCase() || getFallbackRegionalMarket().defaultCurrency;
  const amountDisplay = normalizeMoneyDisplayFromMinor(amountMinor, currency);
  const snapshots = buildBookingSnapshots(event, bookingConfiguration);
  const db = getFirebaseAdminDb();
  const eventRef = db.collection("hubs").doc(normalizedHubId).collection("events").doc(normalizedEventId);
  const bookingId = `booking_${crypto.randomUUID().slice(0, 12)}`;
  const bookingRef = getEventBookingDocRef(normalizedHubId, normalizedEventId, bookingId);
  const sentinelRef = getEventBookingBookerSentinelRef(normalizedHubId, normalizedEventId, normalizedBookerUserId);
  const now = new Date().toISOString();
  let createdBookingStatus = "active";

  await db.runTransaction(async (transaction) => {
    const [eventDoc, sentinelDoc] = await Promise.all([
      transaction.get(eventRef),
      transaction.get(sentinelRef),
    ]);

    if (!eventDoc.exists) {
      throw new Error("Event not found.");
    }

    const currentEvent = { id: eventDoc.id, hubId: normalizedHubId, ...eventDoc.data() };
    const registeredAttendeeCount = normalizeInteger(currentEvent.registeredAttendeeCount, 0);
    const waitlistedAttendeeCount = normalizeInteger(currentEvent.waitlistedAttendeeCount, 0);
    const cancelledAttendeeCount = normalizeInteger(currentEvent.cancelledAttendeeCount, 0);
    const activeBookingCount = normalizeInteger(currentEvent.activeBookingCount, 0);

    assertEventCanAcceptBooking(currentEvent, registeredAttendeeCount, requestedAttendeeCount);

    if (sentinelDoc.exists) {
      const sentinelStatus = normalizeString(sentinelDoc.data()?.status);

      if (sentinelStatus === "active" || sentinelStatus === "waitlisted") {
        throw new Error("You already have a booking for this event.");
      }
    }

    const bookingStatus = resolveInitialEventBookingStatus(currentEvent, registeredAttendeeCount, requestedAttendeeCount);
    createdBookingStatus = bookingStatus;

    if (bookingStatus === "blocked") {
      throw new Error("This event does not have enough remaining places for that booking.");
    }

    const paymentStatus = resolveInitialEventBookingPaymentStatus(currentEvent);
    const activeAttendeeCount = bookingStatus === "active" ? requestedAttendeeCount : 0;
    const bookingWaitlistedAttendeeCount = bookingStatus === "waitlisted" ? requestedAttendeeCount : 0;
    const writeModel = {
      hubId: normalizedHubId,
      eventId: normalizedEventId,
      bookerUserId: normalizedBookerUserId,
      bookerNameSnapshot: normalizeString(booker?.name || `${booker?.firstName || ""} ${booker?.lastName || ""}`.trim()),
      bookerEmailSnapshot: normalizeString(booker?.email).toLowerCase(),
      status: bookingStatus,
      paymentStatus,
      attendeeCount: requestedAttendeeCount,
      activeAttendeeCount,
      waitlistedAttendeeCount: bookingWaitlistedAttendeeCount,
      cancelledAttendeeCount: 0,
      amountMinor,
      amountDisplay,
      currency,
      pricingMode: normalizeString(currentEvent?.pricingMode) || "free",
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
      cancelledAt: "",
      cancelledByUserId: "",
      ...snapshots,
    };

    transaction.set(bookingRef, writeModel);

    for (const attendee of requestedAttendees) {
      const attendeeRef = getEventBookingAttendeeCollection(normalizedHubId, normalizedEventId, bookingId)
        .doc(`attendee_${crypto.randomUUID().slice(0, 12)}`);

      transaction.set(attendeeRef, {
        hubId: normalizedHubId,
        eventId: normalizedEventId,
        bookingId,
        memberUserId: normalizeString(attendee.memberUserId),
        firstName: normalizeString(attendee.firstName),
        lastName: normalizeString(attendee.lastName),
        displayName: normalizeString(attendee.displayName),
        email: bookingConfiguration.guestDetailsMode === "name_and_email" ? normalizeString(attendee.email).toLowerCase() : "",
        relationshipLabel: normalizeString(attendee.relationshipLabel),
        status: bookingStatus === "waitlisted" ? "waitlisted" : "registered",
        attendanceStatus: "pending",
        attendanceMarkedAt: "",
        isPrimaryBooker: attendee.isPrimaryBooker === true,
        unitAmountMinorSnapshot: unitAmountMinor,
        unitAmountDisplaySnapshot: normalizeMoneyDisplayFromMinor(unitAmountMinor, currency),
        currencySnapshot: currency,
        refundPolicySnapshot: normalizeString(currentEvent?.refundPolicy),
        refundWindowModeSnapshot: normalizeString(currentEvent?.refundWindowMode),
        refundWindowHoursSnapshot: normalizeInteger(currentEvent?.refundWindowHours, 48),
        refundStatus: "not_applicable",
        refundAmountMinor: 0,
        refundAmountDisplay: "",
        refundedAt: "",
        createdAt: now,
        updatedAt: now,
        cancelledAt: "",
        cancelledByUserId: "",
      });
    }

    transaction.set(sentinelRef, {
      bookingId,
      eventId: normalizedEventId,
      bookerUserId: normalizedBookerUserId,
      status: bookingStatus,
      updatedAt: now,
      createdAt: sentinelDoc.exists ? normalizeString(sentinelDoc.data()?.createdAt) || now : now,
    });

    transaction.update(eventRef, {
      registeredAttendeeCount: registeredAttendeeCount + activeAttendeeCount,
      waitlistedAttendeeCount: waitlistedAttendeeCount + bookingWaitlistedAttendeeCount,
      cancelledAttendeeCount,
      activeBookingCount: activeBookingCount + (bookingStatus === "active" ? 1 : 0),
      updatedAt: now,
    });
  });
  await maintainDashboardProjectionsForEventBookingChange(normalizedHubId, actorId, "event-booking-create");

  return normalizeEventBookingRecord({
    id: bookingId,
    hubId: normalizedHubId,
    eventId: normalizedEventId,
    bookerUserId: normalizedBookerUserId,
    bookerNameSnapshot: normalizeString(booker?.name || `${booker?.firstName || ""} ${booker?.lastName || ""}`.trim()),
    bookerEmailSnapshot: normalizeString(booker?.email).toLowerCase(),
    status: createdBookingStatus,
    paymentStatus: resolveInitialEventBookingPaymentStatus(event),
    attendeeCount: requestedAttendeeCount,
    activeAttendeeCount: createdBookingStatus === "active" ? requestedAttendeeCount : 0,
    waitlistedAttendeeCount: createdBookingStatus === "waitlisted" ? requestedAttendeeCount : 0,
    cancelledAttendeeCount: 0,
    amountMinor,
    amountDisplay,
    currency,
    pricingMode: normalizeString(event?.pricingMode) || "free",
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
    cancelledAt: "",
    cancelledByUserId: "",
    ...snapshots,
  });
}

export async function updateEventBookingPaymentState(
  hubId,
  eventId,
  bookingId,
  payload = {},
  actorId = "system"
) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedEventId = normalizeString(eventId);
  const normalizedBookingId = normalizeString(bookingId);

  if (!normalizedHubId || !normalizedEventId || !normalizedBookingId) {
    throw new Error("Hub, event, and booking ids are required.");
  }

  const ref = getEventBookingDocRef(normalizedHubId, normalizedEventId, normalizedBookingId);
  const existing = await ref.get();

  if (!existing.exists) {
    throw new Error("Booking not found.");
  }

  const hasOwn = (key) => Object.prototype.hasOwnProperty.call(payload, key);
  const current = normalizeEventBookingRecord({
    id: normalizedBookingId,
    hubId: normalizedHubId,
    eventId: normalizedEventId,
    ...existing.data(),
  });
  const now = new Date().toISOString();
  const update = {
    updatedAt: now,
    updatedBy: normalizeString(actorId) || "system",
  };

  if (hasOwn("paymentStatus")) {
    update.paymentStatus = normalizeString(payload.paymentStatus);
  }
  if (hasOwn("nativePaymentTransactionId")) {
    update.nativePaymentTransactionId = normalizeString(payload.nativePaymentTransactionId);
  }
  if (hasOwn("nativePaymentStatus")) {
    update.nativePaymentStatus = normalizeString(payload.nativePaymentStatus);
  }
  if (hasOwn("nativePaymentCheckoutUrl")) {
    update.nativePaymentCheckoutUrl = normalizeString(payload.nativePaymentCheckoutUrl);
  }
  if (hasOwn("nativePaymentSessionId")) {
    update.nativePaymentSessionId = normalizeString(payload.nativePaymentSessionId);
  }
  if (hasOwn("paymentCompletedAt")) {
    update.paymentCompletedAt = normalizeString(payload.paymentCompletedAt);
  }
  if (hasOwn("paymentStatus") && !hasOwn("paymentCompletedAt")) {
    const normalizedPaymentStatus = normalizeString(payload.paymentStatus).toLowerCase();

    if (new Set(["paid", "partially_refunded", "refunded"]).has(normalizedPaymentStatus)) {
      update.paymentCompletedAt = normalizeString(current.paymentCompletedAt) || now;
    } else if (new Set(["pending", "failed", "not_required", "unpaid"]).has(normalizedPaymentStatus)) {
      update.paymentCompletedAt = "";
    }
  }

  await ref.update(update);

  const booking = normalizeEventBookingRecord({
    id: normalizedBookingId,
    hubId: normalizedHubId,
    eventId: normalizedEventId,
    ...existing.data(),
    ...update,
  });

  await syncEventBookingPaymentRecord(normalizedHubId, normalizedEventId, booking, actorId);

  return booking;
}

export async function updateEventBookingStatus(
  hubId,
  eventId,
  bookingId,
  nextStatus,
  actorId = "system"
) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedEventId = normalizeString(eventId);
  const normalizedBookingId = normalizeString(bookingId);
  const normalizedNextStatus = normalizeString(nextStatus);

  if (!normalizedHubId || !normalizedEventId || !normalizedBookingId || !normalizedNextStatus) {
    throw new Error("Hub, event, booking ids and status are required.");
  }

  const allowedStatuses = new Set(["active", "waitlisted", "cancelled"]);

  if (!allowedStatuses.has(normalizedNextStatus)) {
    throw new Error("Unsupported booking status.");
  }

  const db = getFirebaseAdminDb();
  const eventRef = db.collection("hubs").doc(normalizedHubId).collection("events").doc(normalizedEventId);
  const bookingRef = getEventBookingDocRef(normalizedHubId, normalizedEventId, normalizedBookingId);
  const now = new Date().toISOString();
  let result = null;

  await db.runTransaction(async (transaction) => {
    const [eventDoc, bookingDoc, attendeeSnapshot] = await Promise.all([
      transaction.get(eventRef),
      transaction.get(bookingRef),
      transaction.get(getEventBookingAttendeeCollection(normalizedHubId, normalizedEventId, normalizedBookingId)),
    ]);

    if (!eventDoc.exists) {
      throw new Error("Event not found.");
    }

    if (!bookingDoc.exists) {
      throw new Error("Booking not found.");
    }

    const event = { id: eventDoc.id, hubId: normalizedHubId, ...eventDoc.data() };
    const booking = normalizeEventBookingRecord({
      id: bookingDoc.id,
      hubId: normalizedHubId,
      eventId: normalizedEventId,
      ...bookingDoc.data(),
    });
    const attendees = attendeeSnapshot.docs.map((doc) =>
      normalizeEventBookingAttendeeRecord({
        id: doc.id,
        hubId: normalizedHubId,
        eventId: normalizedEventId,
        bookingId: normalizedBookingId,
        ...doc.data(),
      })
    );

    const transformedAttendees = attendees.map((attendee) => {
      if (normalizedNextStatus === "cancelled") {
        const refundState = resolveEventBookingRefundState(event, booking, attendee);

        return {
          ...attendee,
          status: "cancelled",
          attendanceStatus: "pending",
          attendanceMarkedAt: "",
          refundStatus: refundState.refundStatus,
          refundAmountMinor: refundState.refundAmountMinor,
          refundAmountDisplay:
            refundState.refundAmountMinor > 0
              ? normalizeMoneyDisplayFromMinor(refundState.refundAmountMinor, attendee.currencySnapshot || booking.currency)
              : "",
          cancelledAt: now,
          cancelledByUserId: normalizeString(actorId),
          updatedAt: now,
        };
      }

      return {
        ...attendee,
        status: normalizedNextStatus === "waitlisted" ? "waitlisted" : "registered",
        attendanceStatus:
          normalizedNextStatus === "active" ? attendee.attendanceStatus || "pending" : "pending",
        attendanceMarkedAt: normalizedNextStatus === "active" ? attendee.attendanceMarkedAt || "" : "",
        cancelledAt: "",
        cancelledByUserId: "",
        updatedAt: now,
      };
    });

    const attendeeSummary = summarizeEventBookingAttendees(transformedAttendees);
    const computedBookingStatus = resolveBookingStatusFromAttendees(attendeeSummary);
    const bookingWasActive = booking.status === "active";
    const bookingWillBeActive = computedBookingStatus === "active";
    const sentinelRef = getEventBookingBookerSentinelRef(normalizedHubId, normalizedEventId, booking.bookerUserId);

    for (const attendee of transformedAttendees) {
      transaction.update(
        getEventBookingAttendeeDocRef(normalizedHubId, normalizedEventId, normalizedBookingId, attendee.id),
        {
          status: attendee.status,
          attendanceStatus: attendee.attendanceStatus,
          attendanceMarkedAt: attendee.attendanceMarkedAt,
          refundStatus: attendee.refundStatus,
          refundAmountMinor: attendee.refundAmountMinor,
          refundAmountDisplay: attendee.refundAmountDisplay,
          cancelledAt: attendee.cancelledAt,
          cancelledByUserId: attendee.cancelledByUserId,
          updatedAt: attendee.updatedAt,
        }
      );
    }

    transaction.update(bookingRef, {
      status: computedBookingStatus,
      attendeeCount: attendeeSummary.attendeeCount,
      activeAttendeeCount: attendeeSummary.activeAttendeeCount,
      waitlistedAttendeeCount: attendeeSummary.waitlistedAttendeeCount,
      cancelledAttendeeCount: attendeeSummary.cancelledAttendeeCount,
      updatedAt: now,
      updatedBy: normalizeString(actorId),
      cancelledAt: computedBookingStatus === "cancelled" ? now : "",
      cancelledByUserId: computedBookingStatus === "cancelled" ? normalizeString(actorId) : "",
    });

    transaction.set(
      sentinelRef,
      {
        bookingId: normalizedBookingId,
        eventId: normalizedEventId,
        bookerUserId: booking.bookerUserId,
        status: computedBookingStatus,
        updatedAt: now,
        createdAt: normalizeString(booking.createdAt) || now,
      },
      { merge: true }
    );

    transaction.update(eventRef, {
      registeredAttendeeCount:
        Math.max(0, normalizeInteger(event.registeredAttendeeCount, 0) - normalizeInteger(booking.activeAttendeeCount, 0)) +
        attendeeSummary.activeAttendeeCount,
      waitlistedAttendeeCount:
        Math.max(0, normalizeInteger(event.waitlistedAttendeeCount, 0) - normalizeInteger(booking.waitlistedAttendeeCount, 0)) +
        attendeeSummary.waitlistedAttendeeCount,
      cancelledAttendeeCount:
        Math.max(0, normalizeInteger(event.cancelledAttendeeCount, 0) - normalizeInteger(booking.cancelledAttendeeCount, 0)) +
        attendeeSummary.cancelledAttendeeCount,
      activeBookingCount: Math.max(
        0,
        normalizeInteger(event.activeBookingCount, 0) + (bookingWasActive === bookingWillBeActive ? 0 : bookingWillBeActive ? 1 : -1)
      ),
      updatedAt: now,
    });

    result = normalizeEventBookingRecord({
      ...booking,
      status: computedBookingStatus,
      attendeeCount: attendeeSummary.attendeeCount,
      activeAttendeeCount: attendeeSummary.activeAttendeeCount,
      waitlistedAttendeeCount: attendeeSummary.waitlistedAttendeeCount,
      cancelledAttendeeCount: attendeeSummary.cancelledAttendeeCount,
      updatedAt: now,
      updatedBy: normalizeString(actorId),
      cancelledAt: computedBookingStatus === "cancelled" ? now : "",
      cancelledByUserId: computedBookingStatus === "cancelled" ? normalizeString(actorId) : "",
    });
  });

  await maintainDashboardProjectionsForEventBookingChange(
    normalizedHubId,
    actorId,
    "event-booking-status-update"
  );

  return result;
}

export async function updateEventBookingAttendeeStatus(
  hubId,
  eventId,
  bookingId,
  attendeeId,
  nextStatus,
  actorId = "system"
) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedEventId = normalizeString(eventId);
  const normalizedBookingId = normalizeString(bookingId);
  const normalizedAttendeeId = normalizeString(attendeeId);
  const normalizedNextStatus = normalizeString(nextStatus);

  if (!normalizedHubId || !normalizedEventId || !normalizedBookingId || !normalizedAttendeeId || !normalizedNextStatus) {
    throw new Error("Hub, event, booking, attendee ids and status are required.");
  }

  const allowedStatuses = new Set(["registered", "waitlisted", "cancelled"]);

  if (!allowedStatuses.has(normalizedNextStatus)) {
    throw new Error("Unsupported attendee status.");
  }

  const db = getFirebaseAdminDb();
  const eventRef = db.collection("hubs").doc(normalizedHubId).collection("events").doc(normalizedEventId);
  const bookingRef = getEventBookingDocRef(normalizedHubId, normalizedEventId, normalizedBookingId);
  const attendeeRef = getEventBookingAttendeeDocRef(normalizedHubId, normalizedEventId, normalizedBookingId, normalizedAttendeeId);
  const now = new Date().toISOString();
  let result = null;

  await db.runTransaction(async (transaction) => {
    const [eventDoc, bookingDoc, attendeeDoc, attendeeSnapshot] = await Promise.all([
      transaction.get(eventRef),
      transaction.get(bookingRef),
      transaction.get(attendeeRef),
      transaction.get(getEventBookingAttendeeCollection(normalizedHubId, normalizedEventId, normalizedBookingId)),
    ]);

    if (!eventDoc.exists) {
      throw new Error("Event not found.");
    }

    if (!bookingDoc.exists) {
      throw new Error("Booking not found.");
    }

    if (!attendeeDoc.exists) {
      throw new Error("Attendee not found.");
    }

    const event = { id: eventDoc.id, hubId: normalizedHubId, ...eventDoc.data() };
    const booking = normalizeEventBookingRecord({
      id: bookingDoc.id,
      hubId: normalizedHubId,
      eventId: normalizedEventId,
      ...bookingDoc.data(),
    });
    const currentAttendee = normalizeEventBookingAttendeeRecord({
      id: attendeeDoc.id,
      hubId: normalizedHubId,
      eventId: normalizedEventId,
      bookingId: normalizedBookingId,
      ...attendeeDoc.data(),
    });
    const allAttendees = attendeeSnapshot.docs.map((doc) =>
      normalizeEventBookingAttendeeRecord({
        id: doc.id,
        hubId: normalizedHubId,
        eventId: normalizedEventId,
        bookingId: normalizedBookingId,
        ...doc.data(),
      })
    );

    const refundState =
      normalizedNextStatus === "cancelled"
        ? resolveEventBookingRefundState(event, booking, currentAttendee)
        : {
            refundStatus: currentAttendee.refundStatus,
            refundAmountMinor: currentAttendee.refundAmountMinor,
          };

    const updatedAttendee = {
      ...currentAttendee,
      status: normalizedNextStatus,
      attendanceStatus:
        normalizedNextStatus === "registered"
          ? currentAttendee.attendanceStatus || "pending"
          : "pending",
      attendanceMarkedAt: normalizedNextStatus === "registered" ? currentAttendee.attendanceMarkedAt || "" : "",
      refundStatus:
        normalizedNextStatus === "cancelled" ? refundState.refundStatus : "not_applicable",
      refundAmountMinor:
        normalizedNextStatus === "cancelled" ? refundState.refundAmountMinor : 0,
      refundAmountDisplay:
        normalizedNextStatus === "cancelled" && refundState.refundAmountMinor > 0
          ? normalizeMoneyDisplayFromMinor(refundState.refundAmountMinor, currentAttendee.currencySnapshot || booking.currency)
          : "",
      cancelledAt: normalizedNextStatus === "cancelled" ? now : "",
      cancelledByUserId: normalizedNextStatus === "cancelled" ? normalizeString(actorId) : "",
      updatedAt: now,
    };

    const nextAttendees = allAttendees.map((attendee) =>
      attendee.id === normalizedAttendeeId ? updatedAttendee : attendee
    );
    const attendeeSummary = summarizeEventBookingAttendees(nextAttendees);
    const nextBookingStatus = resolveBookingStatusFromAttendees(attendeeSummary);
    const bookingWasActive = booking.status === "active";
    const bookingWillBeActive = nextBookingStatus === "active";
    const sentinelRef = getEventBookingBookerSentinelRef(normalizedHubId, normalizedEventId, booking.bookerUserId);

    transaction.update(attendeeRef, {
      status: updatedAttendee.status,
      attendanceStatus: updatedAttendee.attendanceStatus,
      attendanceMarkedAt: updatedAttendee.attendanceMarkedAt,
      refundStatus: updatedAttendee.refundStatus,
      refundAmountMinor: updatedAttendee.refundAmountMinor,
      refundAmountDisplay: updatedAttendee.refundAmountDisplay,
      cancelledAt: updatedAttendee.cancelledAt,
      cancelledByUserId: updatedAttendee.cancelledByUserId,
      updatedAt: updatedAttendee.updatedAt,
    });

    transaction.update(bookingRef, {
      status: nextBookingStatus,
      attendeeCount: attendeeSummary.attendeeCount,
      activeAttendeeCount: attendeeSummary.activeAttendeeCount,
      waitlistedAttendeeCount: attendeeSummary.waitlistedAttendeeCount,
      cancelledAttendeeCount: attendeeSummary.cancelledAttendeeCount,
      updatedAt: now,
      updatedBy: normalizeString(actorId),
      cancelledAt: nextBookingStatus === "cancelled" ? now : "",
      cancelledByUserId: nextBookingStatus === "cancelled" ? normalizeString(actorId) : "",
    });

    transaction.set(
      sentinelRef,
      {
        bookingId: normalizedBookingId,
        eventId: normalizedEventId,
        bookerUserId: booking.bookerUserId,
        status: nextBookingStatus,
        updatedAt: now,
        createdAt: normalizeString(booking.createdAt) || now,
      },
      { merge: true }
    );

    transaction.update(eventRef, {
      registeredAttendeeCount:
        Math.max(0, normalizeInteger(event.registeredAttendeeCount, 0) - normalizeInteger(booking.activeAttendeeCount, 0)) +
        attendeeSummary.activeAttendeeCount,
      waitlistedAttendeeCount:
        Math.max(0, normalizeInteger(event.waitlistedAttendeeCount, 0) - normalizeInteger(booking.waitlistedAttendeeCount, 0)) +
        attendeeSummary.waitlistedAttendeeCount,
      cancelledAttendeeCount:
        Math.max(0, normalizeInteger(event.cancelledAttendeeCount, 0) - normalizeInteger(booking.cancelledAttendeeCount, 0)) +
        attendeeSummary.cancelledAttendeeCount,
      activeBookingCount: Math.max(
        0,
        normalizeInteger(event.activeBookingCount, 0) + (bookingWasActive === bookingWillBeActive ? 0 : bookingWillBeActive ? 1 : -1)
      ),
      updatedAt: now,
    });

    result = {
      booking: normalizeEventBookingRecord({
        ...booking,
        status: nextBookingStatus,
        attendeeCount: attendeeSummary.attendeeCount,
        activeAttendeeCount: attendeeSummary.activeAttendeeCount,
        waitlistedAttendeeCount: attendeeSummary.waitlistedAttendeeCount,
        cancelledAttendeeCount: attendeeSummary.cancelledAttendeeCount,
        updatedAt: now,
        updatedBy: normalizeString(actorId),
        cancelledAt: nextBookingStatus === "cancelled" ? now : "",
        cancelledByUserId: nextBookingStatus === "cancelled" ? normalizeString(actorId) : "",
      }),
      attendee: normalizeEventBookingAttendeeRecord(updatedAttendee),
    };
  });

  await maintainDashboardProjectionsForEventBookingChange(
    normalizedHubId,
    actorId,
    "event-booking-attendee-status-update"
  );

  return result;
}

export async function updateEventBookingAttendeeAttendanceStatus(
  hubId,
  eventId,
  bookingId,
  attendeeId,
  attendanceStatus,
  actorId = "system"
) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedEventId = normalizeString(eventId);
  const normalizedBookingId = normalizeString(bookingId);
  const normalizedAttendeeId = normalizeString(attendeeId);
  const normalizedAttendanceStatus = normalizeString(attendanceStatus);

  if (!normalizedHubId || !normalizedEventId || !normalizedBookingId || !normalizedAttendeeId || !normalizedAttendanceStatus) {
    throw new Error("Hub, event, booking, attendee ids and attendance status are required.");
  }

  const allowedStatuses = new Set(["pending", "present", "absent"]);

  if (!allowedStatuses.has(normalizedAttendanceStatus)) {
    throw new Error("Unsupported attendance status.");
  }

  const attendeeRef = getEventBookingAttendeeDocRef(
    normalizedHubId,
    normalizedEventId,
    normalizedBookingId,
    normalizedAttendeeId
  );
  const attendeeDoc = await attendeeRef.get();

  if (!attendeeDoc.exists) {
    throw new Error("Attendee not found.");
  }

  const attendee = normalizeEventBookingAttendeeRecord({
    id: attendeeDoc.id,
    hubId: normalizedHubId,
    eventId: normalizedEventId,
    bookingId: normalizedBookingId,
    ...attendeeDoc.data(),
  });

  if (attendee.status !== "registered") {
    throw new Error("Only registered attendees can have attendance updated.");
  }

  const now = new Date().toISOString();

  await attendeeRef.update({
    attendanceStatus: normalizedAttendanceStatus,
    attendanceMarkedAt: now,
    updatedAt: now,
  });

  return normalizeEventBookingAttendeeRecord({
    ...attendee,
    attendanceStatus: normalizedAttendanceStatus,
    attendanceMarkedAt: now,
    updatedAt: now,
  });
}

export async function cancelEventBookingAttendee(
  hubId,
  eventId,
  bookingId,
  attendeeId,
  actorId = "system"
) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedEventId = normalizeString(eventId);
  const normalizedBookingId = normalizeString(bookingId);
  const normalizedAttendeeId = normalizeString(attendeeId);

  if (!normalizedHubId || !normalizedEventId || !normalizedBookingId || !normalizedAttendeeId) {
    throw new Error("Hub, event, booking, and attendee ids are required.");
  }

  const db = getFirebaseAdminDb();
  const eventRef = db.collection("hubs").doc(normalizedHubId).collection("events").doc(normalizedEventId);
  const bookingRef = getEventBookingDocRef(normalizedHubId, normalizedEventId, normalizedBookingId);
  const attendeeRef = getEventBookingAttendeeDocRef(normalizedHubId, normalizedEventId, normalizedBookingId, normalizedAttendeeId);
  const now = new Date().toISOString();
  let result = null;

  await db.runTransaction(async (transaction) => {
    const [eventDoc, bookingDoc, attendeeDoc, attendeeSnapshot] = await Promise.all([
      transaction.get(eventRef),
      transaction.get(bookingRef),
      transaction.get(attendeeRef),
      transaction.get(getEventBookingAttendeeCollection(normalizedHubId, normalizedEventId, normalizedBookingId)),
    ]);

    if (!eventDoc.exists) {
      throw new Error("Event not found.");
    }

    if (!bookingDoc.exists) {
      throw new Error("Booking not found.");
    }

    if (!attendeeDoc.exists) {
      throw new Error("Attendee not found.");
    }

    const event = { id: eventDoc.id, hubId: normalizedHubId, ...eventDoc.data() };
    const booking = normalizeEventBookingRecord({
      id: bookingDoc.id,
      hubId: normalizedHubId,
      eventId: normalizedEventId,
      ...bookingDoc.data(),
    });
    const currentAttendee = normalizeEventBookingAttendeeRecord({
      id: attendeeDoc.id,
      hubId: normalizedHubId,
      eventId: normalizedEventId,
      bookingId: normalizedBookingId,
      ...attendeeDoc.data(),
    });

    if (currentAttendee.status === "cancelled") {
      result = {
        booking,
        attendee: currentAttendee,
        refundState: resolveEventBookingRefundState(event, booking, currentAttendee),
      };
      return;
    }

    const allAttendees = attendeeSnapshot.docs.map((doc) =>
      normalizeEventBookingAttendeeRecord({
        id: doc.id,
        hubId: normalizedHubId,
        eventId: normalizedEventId,
        bookingId: normalizedBookingId,
        ...doc.data(),
      })
    );

    const refundState = resolveEventBookingRefundState(event, booking, currentAttendee);
    const updatedAttendee = {
      ...currentAttendee,
      status: "cancelled",
      attendanceStatus: "pending",
      attendanceMarkedAt: "",
      refundStatus: refundState.refundStatus,
      refundAmountMinor: refundState.refundAmountMinor,
      refundAmountDisplay:
        refundState.refundAmountMinor > 0
          ? normalizeMoneyDisplayFromMinor(refundState.refundAmountMinor, currentAttendee.currencySnapshot || booking.currency)
          : "",
      cancelledAt: now,
      cancelledByUserId: normalizeString(actorId),
      updatedAt: now,
    };

    const nextAttendees = allAttendees.map((attendee) =>
      attendee.id === normalizedAttendeeId ? updatedAttendee : attendee
    );
    const attendeeSummary = summarizeEventBookingAttendees(nextAttendees);
    const nextBookingStatus = resolveBookingStatusFromAttendees(attendeeSummary);
    const bookingWasActive = booking.status === "active";
    const bookingWillBeActive = nextBookingStatus === "active";
    const previousAttendeeStatus = currentAttendee.status;
    const registeredDelta = previousAttendeeStatus === "registered" ? -1 : 0;
    const waitlistedDelta = previousAttendeeStatus === "waitlisted" ? -1 : 0;
    const cancelledDelta = previousAttendeeStatus === "cancelled" ? 0 : 1;
    const sentinelRef = getEventBookingBookerSentinelRef(normalizedHubId, normalizedEventId, booking.bookerUserId);
    const nextBooking = {
      ...booking,
      status: nextBookingStatus,
      attendeeCount: attendeeSummary.attendeeCount,
      activeAttendeeCount: attendeeSummary.activeAttendeeCount,
      waitlistedAttendeeCount: attendeeSummary.waitlistedAttendeeCount,
      cancelledAttendeeCount: attendeeSummary.cancelledAttendeeCount,
      updatedAt: now,
      updatedBy: normalizeString(actorId),
      cancelledAt: nextBookingStatus === "cancelled" ? now : "",
      cancelledByUserId: nextBookingStatus === "cancelled" ? normalizeString(actorId) : "",
    };

    transaction.update(attendeeRef, {
      status: updatedAttendee.status,
      attendanceStatus: updatedAttendee.attendanceStatus,
      attendanceMarkedAt: updatedAttendee.attendanceMarkedAt,
      refundStatus: updatedAttendee.refundStatus,
      refundAmountMinor: updatedAttendee.refundAmountMinor,
      refundAmountDisplay: updatedAttendee.refundAmountDisplay,
      cancelledAt: updatedAttendee.cancelledAt,
      cancelledByUserId: updatedAttendee.cancelledByUserId,
      updatedAt: updatedAttendee.updatedAt,
    });

    transaction.update(bookingRef, {
      status: nextBooking.status,
      attendeeCount: nextBooking.attendeeCount,
      activeAttendeeCount: nextBooking.activeAttendeeCount,
      waitlistedAttendeeCount: nextBooking.waitlistedAttendeeCount,
      cancelledAttendeeCount: nextBooking.cancelledAttendeeCount,
      updatedAt: nextBooking.updatedAt,
      updatedBy: nextBooking.updatedBy,
      cancelledAt: nextBooking.cancelledAt,
      cancelledByUserId: nextBooking.cancelledByUserId,
    });

    transaction.set(
      sentinelRef,
      {
        bookingId: normalizedBookingId,
        eventId: normalizedEventId,
        bookerUserId: booking.bookerUserId,
        status: nextBooking.status,
        updatedAt: now,
        createdAt: normalizeString(booking.createdAt) || now,
      },
      { merge: true }
    );

    transaction.update(eventRef, {
      registeredAttendeeCount: Math.max(0, normalizeInteger(event.registeredAttendeeCount, 0) + registeredDelta),
      waitlistedAttendeeCount: Math.max(0, normalizeInteger(event.waitlistedAttendeeCount, 0) + waitlistedDelta),
      cancelledAttendeeCount: Math.max(0, normalizeInteger(event.cancelledAttendeeCount, 0) + cancelledDelta),
      activeBookingCount: Math.max(
        0,
        normalizeInteger(event.activeBookingCount, 0) + (bookingWasActive && !bookingWillBeActive ? -1 : 0)
      ),
      updatedAt: now,
    });

    result = {
      booking: nextBooking,
      attendee: normalizeEventBookingAttendeeRecord(updatedAttendee),
      refundState,
    };
  });

  if (result && normalizeInteger(result.booking?.activeAttendeeCount, 0) >= 0) {
    await promoteWaitlistedEventBookings(normalizedHubId, normalizedEventId, actorId);
  }

  return result;
}

export async function promoteWaitlistedEventBookings(hubId, eventId, actorId = "system") {
  const normalizedHubId = normalizeString(hubId);
  const normalizedEventId = normalizeString(eventId);

  if (!normalizedHubId || !normalizedEventId) {
    return {
      promotedBookingIds: [],
      blockedByCapacity: false,
      remainingCapacity: 0,
    };
  }

  const db = getFirebaseAdminDb();
  const eventRef = db.collection("hubs").doc(normalizedHubId).collection("events").doc(normalizedEventId);
  const eventDoc = await eventRef.get();

  if (!eventDoc.exists) {
    throw new Error("Event not found.");
  }

  const promotedBookingIds = [];
  let blockedByCapacity = false;

  while (true) {
    const waitlistSnapshot = await getEventBookingCollection(normalizedHubId, normalizedEventId).get();

    const nextWaitlistedDoc = waitlistSnapshot.docs
      .map((doc) => ({
        id: doc.id,
        booking: normalizeEventBookingRecord({
          id: doc.id,
          hubId: normalizedHubId,
          eventId: normalizedEventId,
          ...doc.data(),
        }),
      }))
      .filter((entry) => entry.booking.status === "waitlisted")
      .sort((left, right) => String(left.booking.createdAt || "").localeCompare(String(right.booking.createdAt || "")))[0];

    if (!nextWaitlistedDoc) {
      break;
    }

    const nextBookingId = nextWaitlistedDoc.id;
    const promotion = await promoteOneWaitlistedEventBooking(
      normalizedHubId,
      normalizedEventId,
      nextBookingId,
      actorId
    );

    if (!promotion.promoted) {
      blockedByCapacity = promotion.blockedByCapacity === true;
      break;
    }

    promotedBookingIds.push(nextBookingId);
  }

  const refreshedEventDoc = await eventRef.get();
  const refreshedEvent = refreshedEventDoc.exists ? refreshedEventDoc.data() : {};
  await maintainDashboardProjectionsForEventBookingChange(
    normalizedHubId,
    actorId,
    "event-booking-waitlist-promotion"
  );

  return {
    promotedBookingIds,
    blockedByCapacity,
    remainingCapacity: resolveRemainingEventAttendeeCapacity(
      refreshedEvent,
      normalizeInteger(refreshedEvent?.registeredAttendeeCount, 0)
    ),
  };
}
