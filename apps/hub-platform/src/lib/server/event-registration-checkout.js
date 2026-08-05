try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getServerEnv } from "@/lib/config/env";
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
import {
  getEventRegistrationByUser,
  getEventRegistrationById,
  updateEventRegistrationNativePaymentState,
  updateEventRegistrationPaymentStatus,
} from "@/lib/data/legacy-event-registrations";
import { resolveOfferingRegistrationLedgerState } from "@/lib/domain/payment-records";
import { buildHubRuntimeHref } from "@/lib/domain/hub-runtime-paths";
import { getFallbackRegionalMarket } from "@/lib/domain/regional-markets";
import { queueLegacyEventRegistrationConfirmedAfterPayment } from "@/lib/server/booking-notification-outbox";
import { getStripeServerClient } from "@/lib/server/stripe";

function normalizeString(value) {
  return String(value || "").trim();
}

async function queueLegacyEventRegistrationConfirmedAfterPaymentSafely(args) {
  try {
    await queueLegacyEventRegistrationConfirmedAfterPayment(args);
  } catch (error) {
    console.error("[hub-platform] unable to queue legacy event Stripe confirmation", error);
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
    throw new Error("A valid paid event amount is required.");
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

export async function startEventRegistrationCheckout({
  hub,
  event,
  registration,
  memberSession,
  actorId = "member",
  requestHost = "",
  routeMode = "path",
}) {
  const normalizedActorId = normalizeString(actorId) || "member";

  if (normalizeString(event?.pricingMode) !== "paid") {
    throw new Error("Only paid events can start native checkout.");
  }

  if (normalizeString(registration?.status) !== "registered") {
    throw new Error("Only active event registrations can start native checkout.");
  }

  if (
    normalizeString(registration?.nativePaymentStatus) === "checkout_open" &&
    normalizeString(registration?.nativePaymentCheckoutUrl)
  ) {
    return {
      transactionId: normalizeString(registration.nativePaymentTransactionId),
      checkoutUrl: normalizeString(registration.nativePaymentCheckoutUrl),
      sessionId: normalizeString(registration.nativePaymentSessionId),
    };
  }

  const paymentConfiguration = await getHubPaymentConfigurationByHubId(hub.id);

  if (!paymentConfiguration?.isReady || !paymentConfiguration?.stripeAccountId) {
    throw new Error("Native payments are not ready for this hub yet.");
  }

  const amountMinor = normalizeMoneyAmountToMinor(event.price, event.currency);
  const applicationFeeAmountMinor = calculateApplicationFeeAmount(amountMinor);

  const transaction = await createNativePaymentTransaction(
    hub.id,
    {
      kind: "event_registration",
      status: "checkout_open",
      provider: "stripe",
      userId: memberSession.user.id,
      stripeAccountId: paymentConfiguration.stripeAccountId,
      eventId: event.id,
      eventTitle: event.title,
      registrationId: registration.id,
      amountMinor,
      amount: normalizeString(event.price),
      currency: normalizeString(event.currency).toUpperCase() || getFallbackRegionalMarket().defaultCurrency,
      applicationFeeAmountMinor,
    },
    normalizedActorId
  );
  const paymentRecord = await upsertPaymentRecordBySource(
    hub.id,
    {
      userId: memberSession.user.id,
      kind: "event_registration",
      sourceType: "eventRegistration",
      sourceId: registration.id,
      sourceSlug: event.slug,
      title: event.title || "Event booking",
      description: normalizeString(hub?.name) ? `Event booking for ${hub.name}` : "Event booking",
      amountMinor,
      amountDisplay: normalizeString(event.price),
      currency: normalizeString(event.currency).toUpperCase() || getFallbackRegionalMarket().defaultCurrency,
      paymentMode: "native",
      provider: "stripe",
      operationalStatus: "open",
      financialStatus: "unpaid",
      occurredAt: transaction.createdAt,
      dueAt: event.startAt || transaction.createdAt,
      nativeTransactionId: transaction.id,
      eventId: event.id,
      eventRegistrationId: registration.id,
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
            quantity: 1,
            price_data: {
              currency:
                normalizeString(event.currency).toLowerCase() ||
                getFallbackRegionalMarket().defaultCurrency.toLowerCase(),
              unit_amount: amountMinor,
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
            kind: "event_registration",
            hubId: normalizeString(hub.id),
            hubSlug: normalizeString(hub.slug),
            userId: normalizeString(memberSession.user.id),
            nativePaymentTransactionId: normalizeString(transaction.id),
            eventId: normalizeString(event.id),
            eventSlug: normalizeString(event.slug),
            registrationId: normalizeString(registration.id),
          },
        },
        metadata: {
          kind: "event_registration",
          hubId: normalizeString(hub.id),
          hubSlug: normalizeString(hub.slug),
          userId: normalizeString(memberSession.user.id),
          nativePaymentTransactionId: normalizeString(transaction.id),
          eventId: normalizeString(event.id),
          eventSlug: normalizeString(event.slug),
          registrationId: normalizeString(registration.id),
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

  await updateEventRegistrationNativePaymentState(
    hub.id,
    event.id,
    registration.id,
    {
      nativePaymentTransactionId: transaction.id,
      nativePaymentStatus: "checkout_open",
      nativePaymentCheckoutUrl: checkoutUrl,
      nativePaymentSessionId: sessionId,
    },
    normalizedActorId
  );

  return {
    transactionId: transaction.id,
    checkoutUrl,
    sessionId,
  };
}

export async function finalizeEventRegistrationCheckoutReturn({
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

  const registration = await getEventRegistrationById(hub.id, event.id, transaction.registrationId);

  if (!registration || registration.userId !== normalizeString(memberSession.user.id)) {
    throw new Error("Event registration not found for this checkout.");
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

  await updateEventRegistrationNativePaymentState(
    hub.id,
    event.id,
    registration.id,
    {
      nativePaymentTransactionId: transaction.id,
      nativePaymentStatus: preservedStatus,
      nativePaymentCheckoutUrl: transaction.checkoutUrl,
      nativePaymentSessionId: normalizeString(session.id),
      paymentCompletedAt: preservedStatus === "payment_received" ? paymentReceivedAt : "",
    },
    normalizedActorId
  );
  const nextRegistration = {
    ...registration,
    nativePaymentTransactionId: transaction.id,
    nativePaymentStatus: preservedStatus,
    nativePaymentCheckoutUrl: transaction.checkoutUrl,
    nativePaymentSessionId: normalizeString(session.id),
    paymentCompletedAt: preservedStatus === "payment_received" ? paymentReceivedAt : "",
    paymentStatus: preservedStatus === "payment_received" ? "paid" : registration.paymentStatus,
  };

  if (preservedStatus === "payment_received") {
    await updateEventRegistrationPaymentStatus(
      hub.id,
      event.id,
      registration.id,
      "paid",
      normalizedActorId
    );
  }
  if (paymentRecord) {
    await updatePaymentRecord(
      hub.id,
      paymentRecord.id,
      {
        operationalStatus: ledgerState.operationalStatus,
        financialStatus: ledgerState.financialStatus,
        stripeCheckoutSessionId: normalizeString(session.id),
        stripePaymentIntentId: paymentIntentId,
        paidAt: preservedStatus === "payment_received" ? paymentReceivedAt : "",
      },
      normalizedActorId
    );
  }

  if (preservedStatus === "payment_received") {
    await queueLegacyEventRegistrationConfirmedAfterPaymentSafely({
      hub,
      event,
      registration: nextRegistration,
      user: memberSession.user,
      actorId: normalizedActorId,
    });
  }

  return {
    paid: isPaid,
    status: preservedStatus,
  };
}
