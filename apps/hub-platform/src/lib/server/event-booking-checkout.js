try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getServerEnv } from "@/lib/config/env";
import {
  getEventBookingById,
  updateEventBookingPaymentState,
} from "@/lib/data/event-bookings";
import {
  createNativePaymentTransaction,
  getNativePaymentTransactionById,
  updateNativePaymentTransaction,
} from "@/lib/data/native-payment-transactions";
import {
  getPaymentRecordById,
  getPaymentRecordByNativeTransactionId,
  upsertPaymentRecordBySource,
  updatePaymentRecord,
} from "@/lib/data/payment-records";
import { getHubPaymentConfigurationByHubId } from "@/lib/data/hub-payment-configurations";
import { resolveOfferingRegistrationLedgerState } from "@/lib/domain/payment-records";
import { buildHubRuntimeHref } from "@/lib/domain/hub-runtime-paths";
import { getFallbackRegionalMarket } from "@/lib/domain/regional-markets";
import { queueEventBookingConfirmedAfterPayment } from "@/lib/server/booking-notification-outbox";
import { getStripeServerClient } from "@/lib/server/stripe";

function normalizeString(value) {
  return String(value || "").trim();
}

async function queueEventBookingConfirmedAfterPaymentSafely(args) {
  try {
    await queueEventBookingConfirmedAfterPayment(args);
  } catch (error) {
    console.error("[hub-platform] unable to queue event booking Stripe confirmation", error);
  }
}

function normalizeHost(value) {
  return normalizeString(value).toLowerCase();
}

function normalizeHostWithoutPort(value) {
  return normalizeHost(value).replace(/:\d+$/, "");
}

const zeroDecimalCurrencies = new Set([
  "BIF",
  "CLP",
  "DJF",
  "GNF",
  "JPY",
  "KMF",
  "KRW",
  "MGA",
  "PYG",
  "RWF",
  "UGX",
  "VND",
  "VUV",
  "XAF",
  "XOF",
  "XPF",
]);

function getHubBaseUrl(hostname, fallbackHub) {
  const host = normalizeHost(hostname) || normalizeHost(fallbackHub?.domain);
  const hostWithoutPort = normalizeHostWithoutPort(host);

  if (!host) {
    throw new Error("Hub domain is required to build Stripe return URLs.");
  }

  const isLocalHost =
    hostWithoutPort === "localhost" ||
    hostWithoutPort === "127.0.0.1" ||
    hostWithoutPort === "[::1]" ||
    hostWithoutPort.endsWith(".localhost");
  const protocol = isLocalHost ? "http" : "https";

  return `${protocol}://${host}`;
}

function normalizeMoneyAmountToMinor(amount, currency = getFallbackRegionalMarket().defaultCurrency) {
  const numeric = Number.parseFloat(String(amount || ""));
  const normalizedCurrency = normalizeString(currency).toUpperCase() || getFallbackRegionalMarket().defaultCurrency;

  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new Error("A valid paid booking amount is required.");
  }

  if (zeroDecimalCurrencies.has(normalizedCurrency)) {
    return Math.round(numeric);
  }

  return Math.round(numeric * 100);
}

function calculateApplicationFeeAmount(amountMinor) {
  const feeBps = Number.parseInt(String(getServerEnv().hubforjPlatformFeeBps || ""), 10) || 0;

  if (feeBps <= 0 || amountMinor <= 0) {
    return 0;
  }

  return Math.floor((amountMinor * feeBps) / 10000);
}

export async function startEventBookingCheckout({
  hub,
  event,
  booking,
  memberSession,
  actorId = "member",
  requestHost = "",
  routeMode = "path",
}) {
  const normalizedActorId = normalizeString(actorId) || "member";

  if (normalizeString(event?.pricingMode) !== "paid") {
    throw new Error("Only paid event bookings can start native checkout.");
  }

  if (normalizeString(booking?.status) !== "active") {
    throw new Error("Only active event bookings can start native checkout.");
  }

  if (normalizeString(booking?.paymentStatus) === "paid") {
    throw new Error("This booking has already been paid.");
  }

  if (
    normalizeString(booking?.nativePaymentStatus) === "checkout_open" &&
    normalizeString(booking?.nativePaymentCheckoutUrl)
  ) {
    return {
      transactionId: normalizeString(booking.nativePaymentTransactionId),
      checkoutUrl: normalizeString(booking.nativePaymentCheckoutUrl),
      sessionId: normalizeString(booking.nativePaymentSessionId),
    };
  }

  const paymentConfiguration = await getHubPaymentConfigurationByHubId(hub.id);

  if (!paymentConfiguration?.isReady || !paymentConfiguration?.stripeAccountId) {
    throw new Error("Native payments are not ready for this hub yet.");
  }

  const amountMinor =
    Number.parseInt(String(booking.amountMinor || ""), 10) > 0
      ? Number.parseInt(String(booking.amountMinor || ""), 10)
      : normalizeMoneyAmountToMinor(booking.amountDisplay, booking.currency);
  const attendeeCount = Math.max(1, Number.parseInt(String(booking.attendeeCount || ""), 10) || 1);
  const unitAmountMinor = Math.max(1, Math.round(amountMinor / attendeeCount));
  const applicationFeeAmountMinor = calculateApplicationFeeAmount(amountMinor);

  const transaction = await createNativePaymentTransaction(
    hub.id,
    {
      kind: "event_booking",
      status: "checkout_open",
      provider: "stripe",
      userId: memberSession.user.id,
      stripeAccountId: paymentConfiguration.stripeAccountId,
      eventId: event.id,
      eventTitle: event.title,
      eventBookingId: booking.id,
      amountMinor,
      amount: normalizeString(booking.amountDisplay),
      currency: normalizeString(booking.currency).toUpperCase() || getFallbackRegionalMarket().defaultCurrency,
      applicationFeeAmountMinor,
    },
    normalizedActorId
  );

  const paymentRecord = await upsertPaymentRecordBySource(
    hub.id,
    {
      userId: memberSession.user.id,
      kind: "event_booking",
      sourceType: "eventBooking",
      sourceId: booking.id,
      sourceSlug: event.slug,
      title: event.title || "Event booking",
      description: normalizeString(hub?.name) ? `Event booking for ${hub.name}` : "Event booking",
      amountMinor,
      amountDisplay: normalizeString(booking.amountDisplay),
      currency: normalizeString(booking.currency).toUpperCase() || getFallbackRegionalMarket().defaultCurrency,
      paymentMode: "native",
      provider: "stripe",
      operationalStatus: "open",
      financialStatus: "unpaid",
      occurredAt: transaction.createdAt,
      dueAt: event.startAt || transaction.createdAt,
      nativeTransactionId: transaction.id,
      eventId: event.id,
      eventBookingId: booking.id,
      packageTierAtTime: normalizeString(hub.packageTier),
      paymentProcessingModeAtTime: normalizeString(hub.packagePaymentProcessingMode),
      sourceConfidence: "authoritative",
      reportingEligibility: "count_in_revenue",
    },
    normalizedActorId
  );

  await updateNativePaymentTransaction(
    hub.id,
    transaction.id,
    {
      paymentRecordId: paymentRecord.id,
    },
    normalizedActorId
  );

  const baseUrl = getHubBaseUrl(requestHost, hub);
  const checkoutReturnPath = buildHubRuntimeHref(hub.slug, `/events/${event.slug}/booking/checkout-return`, routeMode);
  const successUrl = `${baseUrl}${checkoutReturnPath}?transaction=${encodeURIComponent(transaction.id)}&state=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${baseUrl}${checkoutReturnPath}?transaction=${encodeURIComponent(transaction.id)}&state=cancelled`;
  let session;

  try {
    const stripe = getStripeServerClient();
    session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        success_url: successUrl,
        cancel_url: cancelUrl,
        client_reference_id: transaction.id,
        customer_email: normalizeString(memberSession?.user?.email) || undefined,
        line_items: [
          {
            quantity: attendeeCount,
            price_data: {
              currency: normalizeString(booking.currency).toLowerCase() || getFallbackRegionalMarket().defaultCurrency.toLowerCase(),
              unit_amount: unitAmountMinor,
              product_data: {
                name: event.title || "Event booking",
                description: normalizeString(hub?.name) ? `Booking for ${hub.name}` : "Event booking",
              },
            },
          },
        ],
        payment_intent_data: {
          application_fee_amount: applicationFeeAmountMinor > 0 ? applicationFeeAmountMinor : undefined,
          metadata: {
            kind: "event_booking",
            hubId: normalizeString(hub.id),
            hubSlug: normalizeString(hub.slug),
            userId: normalizeString(memberSession.user.id),
            nativePaymentTransactionId: normalizeString(transaction.id),
            eventId: normalizeString(event.id),
            eventSlug: normalizeString(event.slug),
            bookingId: normalizeString(booking.id),
            eventBookingId: normalizeString(booking.id),
          },
        },
        metadata: {
          kind: "event_booking",
          hubId: normalizeString(hub.id),
          hubSlug: normalizeString(hub.slug),
          userId: normalizeString(memberSession.user.id),
          nativePaymentTransactionId: normalizeString(transaction.id),
          eventId: normalizeString(event.id),
          eventSlug: normalizeString(event.slug),
          bookingId: normalizeString(booking.id),
          eventBookingId: normalizeString(booking.id),
        },
      },
      {
        stripeAccount: paymentConfiguration.stripeAccountId,
      }
    );
  } catch (error) {
    await updateNativePaymentTransaction(
      hub.id,
      transaction.id,
      {
        status: "payment_failed",
      },
      normalizedActorId
    );
    await updatePaymentRecord(
      hub.id,
      paymentRecord.id,
      {
        operationalStatus: "cancelled",
        financialStatus: "failed",
      },
      normalizedActorId
    );
    throw error;
  }

  const checkoutUrl = normalizeString(session.url);
  const sessionId = normalizeString(session.id);

  await updateNativePaymentTransaction(
    hub.id,
    transaction.id,
    {
      stripeCheckoutSessionId: sessionId,
      checkoutUrl,
    },
    normalizedActorId
  );
  await updatePaymentRecord(
    hub.id,
    paymentRecord.id,
    {
      stripeCheckoutSessionId: sessionId,
    },
    normalizedActorId
  );
  await updateEventBookingPaymentState(
    hub.id,
    event.id,
    booking.id,
    {
      nativePaymentTransactionId: transaction.id,
      nativePaymentStatus: "checkout_open",
      nativePaymentCheckoutUrl: checkoutUrl,
      nativePaymentSessionId: sessionId,
      paymentStatus: "pending",
    },
    normalizedActorId
  );

  return {
    transactionId: transaction.id,
    checkoutUrl,
    sessionId,
  };
}

export async function finalizeEventBookingCheckoutReturn({
  hub,
  event,
  memberSession,
  transactionId,
  sessionId,
  actorId = "member",
}) {
  const normalizedTransactionId = normalizeString(transactionId);
  const normalizedSessionId = normalizeString(sessionId);
  const normalizedActorId = normalizeString(actorId) || "member";

  if (!normalizedTransactionId || !normalizedSessionId) {
    throw new Error("Stripe checkout return context is required.");
  }

  const transaction = await getNativePaymentTransactionById(hub.id, normalizedTransactionId);

  if (!transaction) {
    throw new Error("Native payment transaction not found.");
  }

  if (transaction.userId !== normalizeString(memberSession.user.id)) {
    throw new Error("This checkout does not belong to the current member.");
  }

  const booking = await getEventBookingById(hub.id, event.id, transaction.eventBookingId);

  if (!booking || booking.bookerUserId !== normalizeString(memberSession.user.id)) {
    throw new Error("Event booking not found for this checkout.");
  }

  const stripe = getStripeServerClient();
  const session = await stripe.checkout.sessions.retrieve(
    normalizedSessionId,
    { expand: ["payment_intent"] },
    { stripeAccount: transaction.stripeAccountId }
  );

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? normalizeString(session.payment_intent)
      : normalizeString(session.payment_intent?.id);
  const checkoutCompletedAt = new Date().toISOString();
  const isPaid = normalizeString(session.payment_status) === "paid";
  const preservedStatus =
    transaction.status === "payment_received"
      ? "payment_received"
      : isPaid
        ? "payment_received"
        : "checkout_completed";
  const paymentReceivedAt =
    preservedStatus === "payment_received"
      ? normalizeString(transaction.paymentReceivedAt) || checkoutCompletedAt
      : normalizeString(transaction.paymentReceivedAt);
  const paymentRecord =
    (transaction.paymentRecordId
      ? await getPaymentRecordById(hub.id, transaction.paymentRecordId)
      : await getPaymentRecordByNativeTransactionId(hub.id, transaction.id)) || null;
  const ledgerState = resolveOfferingRegistrationLedgerState(preservedStatus);
  const bookingWasCancelled = normalizeString(booking.status) === "cancelled";
  const nextBookingPaymentStatus =
    preservedStatus === "payment_received"
      ? bookingWasCancelled
        ? normalizeString(booking.paymentStatus) || "pending"
        : "paid"
      : "pending";

  await updateNativePaymentTransaction(
    hub.id,
    transaction.id,
    {
      status: preservedStatus,
      stripeCheckoutSessionId: normalizeString(session.id),
      stripePaymentIntentId: paymentIntentId,
      checkoutCompletedAt: normalizeString(transaction.checkoutCompletedAt) || checkoutCompletedAt,
      paymentReceivedAt,
    },
    normalizedActorId
  );
  await updateEventBookingPaymentState(
    hub.id,
    event.id,
    booking.id,
    {
      nativePaymentTransactionId: transaction.id,
      nativePaymentStatus: preservedStatus,
      nativePaymentCheckoutUrl: transaction.checkoutUrl,
      nativePaymentSessionId: normalizeString(session.id),
      paymentCompletedAt: preservedStatus === "payment_received" ? paymentReceivedAt : "",
      paymentStatus: nextBookingPaymentStatus,
    },
    normalizedActorId
  );
  const nextBooking = {
    ...booking,
    nativePaymentTransactionId: transaction.id,
    nativePaymentStatus: preservedStatus,
    nativePaymentCheckoutUrl: transaction.checkoutUrl,
    nativePaymentSessionId: normalizeString(session.id),
    paymentCompletedAt: preservedStatus === "payment_received" ? paymentReceivedAt : "",
    paymentStatus: nextBookingPaymentStatus,
  };

  if (paymentRecord) {
    await updatePaymentRecord(
      hub.id,
      paymentRecord.id,
      {
        operationalStatus: bookingWasCancelled ? "cancelled" : ledgerState.operationalStatus,
        financialStatus: ledgerState.financialStatus,
        stripeCheckoutSessionId: normalizeString(session.id),
        stripePaymentIntentId: paymentIntentId,
        paidAt: preservedStatus === "payment_received" ? paymentReceivedAt : "",
      },
      normalizedActorId
    );
  }

  if (preservedStatus === "payment_received" && !bookingWasCancelled) {
    await queueEventBookingConfirmedAfterPaymentSafely({
      hub,
      event,
      booking: nextBooking,
      bookerUser: memberSession.user,
      actorId: normalizedActorId,
    });
  }

  return {
    paid: isPaid,
    status: preservedStatus,
  };
}
