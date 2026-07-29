try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getEventById } from "@/lib/data/events";
import {
  cancelEventBookingAttendee,
  getEventBookingById,
  listEventBookingAttendees,
  updateEventBookingPaymentState,
  updateEventBookingStatus,
} from "@/lib/data/event-bookings";
import { getHubById } from "@/lib/data/hubs";
import {
  getNativePaymentTransactionById,
  updateNativePaymentTransaction,
} from "@/lib/data/native-payment-transactions";
import {
  getPaymentRecordById,
  getPaymentRecordByNativeTransactionId,
  updatePaymentRecord,
} from "@/lib/data/payment-records";
import { resolveOfferingRegistrationLedgerState } from "@/lib/domain/payment-records";
import { evaluateEventRefundEligibility } from "@/lib/domain/events";
import { resolveEventBookingRefundState } from "@/lib/domain/event-bookings";
import { getFallbackRegionalMarket } from "@/lib/domain/regional-markets";
import { getEventBookingAttendeeDocRef } from "@/lib/data/event-booking-shared.js";
import { getStripeServerClient } from "@/lib/server/stripe";

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeInteger(value, fallback = 0) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeMoneyDisplayFromMinor(amountMinor, currency = getFallbackRegionalMarket().defaultCurrency) {
  const normalizedCurrency = normalizeString(currency).toUpperCase() || getFallbackRegionalMarket().defaultCurrency;
  const numeric = Number.isFinite(Number(amountMinor)) ? Number(amountMinor) / 100 : 0;

  return new Intl.NumberFormat(getFallbackRegionalMarket().defaultLocale, {
    style: "currency",
    currency: normalizedCurrency,
  }).format(numeric);
}

function usesInternalEventPayments(hub, event) {
  return (
    normalizeString(hub?.packagePaymentProcessingMode) === "internal" &&
    normalizeString(event?.pricingMode) === "paid"
  );
}

function canAutoRefundBookingPaymentStatus(paymentStatus) {
  return new Set(["paid", "partially_refunded"]).has(normalizeString(paymentStatus));
}

function resolveRemainingRefundAmountMinor(transaction) {
  const totalAmountMinor = Math.max(0, normalizeInteger(transaction?.amountMinor, 0));
  const refundedAmountMinor = Math.max(0, normalizeInteger(transaction?.refundAmountMinor, 0));
  return Math.max(0, totalAmountMinor - refundedAmountMinor);
}

function buildBookingPaymentStatusFromRefundTotal(totalRefundAmountMinor, transaction) {
  return totalRefundAmountMinor >= Math.max(0, normalizeInteger(transaction?.amountMinor, 0))
    ? "refunded"
    : "partially_refunded";
}

async function applyBookingStripeRefund({
  hub,
  event,
  booking,
  transaction,
  refundAmountMinor,
  actorId,
  metadata = {},
}) {
  if (!transaction?.stripePaymentIntentId || !transaction?.stripeAccountId) {
    throw new Error("This booking payment cannot be refunded automatically right now.");
  }

  const stripe = getStripeServerClient();
  const refundPayload = {
    payment_intent: transaction.stripePaymentIntentId,
    amount: refundAmountMinor,
    metadata: {
      kind: "event_booking_refund",
      hubId: normalizeString(hub?.id),
      hubSlug: normalizeString(hub?.slug),
      eventId: normalizeString(event?.id || booking?.eventId),
      bookingId: normalizeString(booking?.id),
      nativePaymentTransactionId: transaction.id,
      ...metadata,
    },
  };

  if (Number(transaction.applicationFeeAmountMinor) > 0) {
    refundPayload.refund_application_fee = true;
  }

  const refund = await stripe.refunds.create(refundPayload, {
    stripeAccount: transaction.stripeAccountId,
  });

  const now = new Date().toISOString();
  const totalRefundAmountMinor = Math.min(
    Math.max(0, normalizeInteger(transaction.amountMinor, 0)),
    Math.max(0, normalizeInteger(transaction.refundAmountMinor, 0)) + refundAmountMinor
  );
  const refundStatus = buildBookingPaymentStatusFromRefundTotal(totalRefundAmountMinor, transaction);
  const refundDisplay = normalizeMoneyDisplayFromMinor(totalRefundAmountMinor, transaction.currency);

  await updateNativePaymentTransaction(
    normalizeString(hub?.id),
    transaction.id,
    {
      refundStatus,
      refundAmountMinor: totalRefundAmountMinor,
      refundAmount: refundDisplay,
      refundedAt: now,
      stripeRefundId: normalizeString(refund.id),
    },
    actorId
  );

  const paymentRecord = transaction.paymentRecordId
    ? await getPaymentRecordById(normalizeString(hub?.id), transaction.paymentRecordId)
    : await getPaymentRecordByNativeTransactionId(normalizeString(hub?.id), transaction.id);

  await updateEventBookingPaymentState(
    normalizeString(hub?.id),
    normalizeString(event?.id || booking?.eventId),
    normalizeString(booking?.id),
    {
      paymentStatus: refundStatus,
    },
    actorId
  );

  if (paymentRecord) {
    const ledgerState = resolveOfferingRegistrationLedgerState(transaction.status, {
      refunded: totalRefundAmountMinor > 0,
      refundAmountMinor: totalRefundAmountMinor,
      totalAmountMinor: transaction.amountMinor,
    });

    await updatePaymentRecord(
      normalizeString(hub?.id),
      paymentRecord.id,
      {
        operationalStatus: ledgerState.operationalStatus,
        financialStatus: ledgerState.financialStatus,
        refundedAt: now,
        refundAmountMinor: totalRefundAmountMinor,
        refundDisplay,
        stripeRefundId: normalizeString(refund.id),
      },
      actorId
    );
  }

  return {
    refund,
    refundStatus,
    refundAmountMinor: totalRefundAmountMinor,
    refundedAt: now,
  };
}

async function expireOpenCheckoutIfNeeded(hub, booking, transaction, actorId) {
  if (
    !transaction ||
    normalizeString(transaction.status) !== "checkout_open" ||
    !normalizeString(transaction.stripeCheckoutSessionId) ||
    !normalizeString(transaction.stripeAccountId)
  ) {
    return false;
  }

  const stripe = getStripeServerClient();

  await stripe.checkout.sessions.expire(
    transaction.stripeCheckoutSessionId,
    {},
    {
      stripeAccount: transaction.stripeAccountId,
    }
  );

  await updateNativePaymentTransaction(
    hub.id,
    transaction.id,
    {
      status: "checkout_cancelled",
    },
    actorId
  );

  await updateEventBookingPaymentState(
    hub.id,
    booking.eventId,
    booking.id,
    {
      nativePaymentStatus: "checkout_cancelled",
      nativePaymentCheckoutUrl: "",
      nativePaymentSessionId: "",
    },
    actorId
  );

  const paymentRecord = transaction?.paymentRecordId
    ? await getPaymentRecordById(hub.id, transaction.paymentRecordId)
    : await getPaymentRecordByNativeTransactionId(hub.id, transaction?.id);

  if (paymentRecord) {
    const ledgerState = resolveOfferingRegistrationLedgerState("checkout_cancelled");

    await updatePaymentRecord(
      hub.id,
      paymentRecord.id,
      {
        operationalStatus: ledgerState.operationalStatus,
        financialStatus: ledgerState.financialStatus,
      },
      actorId
    );
  }

  return true;
}

function buildCancellationOutcomeMessage({ refunded, refundEvaluation, checkoutExpired, paymentStatus }) {
  if (refunded) {
    return "Booking cancelled and refund initiated.";
  }

  if (checkoutExpired) {
    return "Booking cancelled and the open checkout was closed.";
  }

  if (normalizeString(paymentStatus) === "paid") {
    if (refundEvaluation?.reason === "policy_non_refundable") {
      return "Booking cancelled. This event is non-refundable.";
    }

    if (refundEvaluation?.reason === "outside_refund_window" || refundEvaluation?.reason === "event_started") {
      return "Booking cancelled. This booking was outside the refund window, so no refund was issued.";
    }
  }

  return "Booking cancelled.";
}

export async function cancelEventBookingWithRefundHandling({
  hub,
  event,
  booking,
  actorId = "system",
}) {
  const normalizedHubId = normalizeString(hub?.id);
  const normalizedEventId = normalizeString(event?.id || booking?.eventId);
  const normalizedBookingId = normalizeString(booking?.id);

  if (!normalizedHubId || !normalizedEventId || !normalizedBookingId) {
    throw new Error("Hub, event, and booking are required.");
  }

  const resolvedEvent = event || (await getEventById(normalizedHubId, normalizedEventId));

  if (!resolvedEvent) {
    throw new Error("Event not found.");
  }

  const transaction = booking.nativePaymentTransactionId
    ? await getNativePaymentTransactionById(normalizedHubId, booking.nativePaymentTransactionId)
    : null;

  const checkoutExpired = await expireOpenCheckoutIfNeeded(hub, booking, transaction, actorId);
  const usesInternalPayments = usesInternalEventPayments(hub, resolvedEvent);
  const refundEvaluation = usesInternalPayments
    ? evaluateEventRefundEligibility(resolvedEvent, { paymentStatus: booking.paymentStatus })
    : null;

  let refunded = false;

  if (usesInternalPayments && canAutoRefundBookingPaymentStatus(booking.paymentStatus) && refundEvaluation?.refundable) {
    const refundAmountMinor = resolveRemainingRefundAmountMinor(transaction);

    if (refundAmountMinor > 0) {
      await applyBookingStripeRefund({
        hub,
        event: resolvedEvent,
        booking,
        transaction,
        refundAmountMinor,
        actorId,
      });
      refunded = true;
    }
  }

  const updatedBooking =
    normalizeString(booking.status) === "cancelled"
      ? booking
      : await updateEventBookingStatus(
          normalizedHubId,
          normalizedEventId,
          normalizedBookingId,
          "cancelled",
          actorId
        );

  return {
    booking: updatedBooking,
    refunded,
    checkoutExpired,
    refundEvaluation,
    message: buildCancellationOutcomeMessage({
      refunded,
      refundEvaluation,
      checkoutExpired,
      paymentStatus: booking.paymentStatus,
    }),
  };
}

export async function cancelEventBookingAttendeeWithRefundHandling({
  hub,
  event,
  booking,
  attendee,
  actorId = "system",
}) {
  const normalizedHubId = normalizeString(hub?.id);
  const normalizedEventId = normalizeString(event?.id || booking?.eventId);
  const normalizedBookingId = normalizeString(booking?.id);
  const normalizedAttendeeId = normalizeString(attendee?.id);

  if (!normalizedHubId || !normalizedEventId || !normalizedBookingId || !normalizedAttendeeId) {
    throw new Error("Hub, event, booking, and attendee are required.");
  }

  const usesInternalPayments = usesInternalEventPayments(hub, event);
  const transaction = booking.nativePaymentTransactionId
    ? await getNativePaymentTransactionById(normalizedHubId, booking.nativePaymentTransactionId)
    : null;
  const currentRefundState = resolveEventBookingRefundState(event, booking, attendee);
  const shouldAttemptRefund =
    usesInternalPayments &&
    canAutoRefundBookingPaymentStatus(booking.paymentStatus) &&
    currentRefundState.refundable &&
    currentRefundState.refundAmountMinor > 0 &&
    normalizeString(attendee.refundStatus) !== "refunded";

  if (shouldAttemptRefund && (!transaction?.stripePaymentIntentId || !transaction?.stripeAccountId)) {
    throw new Error("This attendee refund cannot be processed automatically right now.");
  }

  const cancellationResult =
    normalizeString(attendee.status) === "cancelled"
      ? {
          booking,
          attendee,
          refundState: currentRefundState,
        }
      : await cancelEventBookingAttendee(
          normalizedHubId,
          normalizedEventId,
          normalizedBookingId,
          normalizedAttendeeId,
          actorId
        );

  let refunded = false;
  let refundOutcome = null;

  if (shouldAttemptRefund) {
    const refundAmountMinor = Math.min(
      currentRefundState.refundAmountMinor,
      resolveRemainingRefundAmountMinor(transaction)
    );

    if (refundAmountMinor > 0) {
      refundOutcome = await applyBookingStripeRefund({
        hub,
        event,
        booking: cancellationResult.booking,
        transaction,
        refundAmountMinor,
        actorId,
        metadata: {
          attendeeId: normalizedAttendeeId,
          kind: "event_booking_attendee_refund",
        },
      });

      await getEventBookingAttendeeDocRef(
        normalizedHubId,
        normalizedEventId,
        normalizedBookingId,
        normalizedAttendeeId
      ).update({
        refundStatus: "refunded",
        refundedAt: refundOutcome.refundedAt,
        updatedAt: refundOutcome.refundedAt,
      });

      refunded = true;
    }
  }

  return {
    booking: cancellationResult.booking,
    attendee: cancellationResult.attendee,
    refunded,
    refundState: cancellationResult.refundState,
    refundOutcome,
  };
}

export async function cancelEventBookingAttendeeWithRefundHandlingById({
  hubId,
  eventId,
  bookingId,
  attendeeId,
  actorId = "system",
}) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedEventId = normalizeString(eventId);
  const normalizedBookingId = normalizeString(bookingId);
  const normalizedAttendeeId = normalizeString(attendeeId);

  if (!normalizedHubId || !normalizedEventId || !normalizedBookingId || !normalizedAttendeeId) {
    throw new Error("Hub, event, booking, and attendee ids are required.");
  }

  const [hub, event, booking, attendees] = await Promise.all([
    getHubById(normalizedHubId),
    getEventById(normalizedHubId, normalizedEventId),
    getEventBookingById(normalizedHubId, normalizedEventId, normalizedBookingId),
    listEventBookingAttendees(normalizedHubId, normalizedEventId, normalizedBookingId),
  ]);
  const attendee = attendees.find((entry) => normalizeString(entry.id) === normalizedAttendeeId);

  if (!hub) {
    throw new Error("Hub not found.");
  }

  if (!event) {
    throw new Error("Event not found.");
  }

  if (!booking) {
    throw new Error("Booking not found.");
  }

  if (!attendee) {
    throw new Error("Attendee not found.");
  }

  return cancelEventBookingAttendeeWithRefundHandling({
    hub,
    event,
    booking,
    attendee,
    actorId,
  });
}
