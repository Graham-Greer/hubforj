try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getServerEnv } from "@/lib/config/env";
import { createNativePaymentTransaction, getNativePaymentTransactionById, updateNativePaymentTransaction } from "@/lib/data/native-payment-transactions";
import { getPaymentRecordById, getPaymentRecordByNativeTransactionId, updatePaymentRecord, upsertPaymentRecordBySource } from "@/lib/data/payment-records";
import { getHubPaymentConfigurationByHubId } from "@/lib/data/hub-payment-configurations";
import { resolveMembershipUpgradeLedgerState } from "@/lib/domain/payment-records";
import { buildHubRuntimeHref } from "@/lib/domain/hub-runtime-paths";
import { getFallbackRegionalMarket } from "@/lib/domain/regional-markets";
import { cancelMembershipUpgradeRequest, createMembershipUpgradeRequest, updateMembershipUpgradeRequestPaymentState } from "@/lib/data/memberships";
import { resolveMembershipPlanPricingMode } from "@/lib/domain/memberships";
import { getStripeServerClient } from "@/lib/server/stripe";

function normalizeString(value) {
  return String(value || "").trim();
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
    throw new Error("A valid paid membership amount is required.");
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

export async function startMembershipUpgradeCheckout({
  hub,
  memberSession,
  plan,
  actorId = "member",
  requestHost = "",
  routeMode = "path",
}) {
  const normalizedActorId = normalizeString(actorId) || "member";
  const pricingMode = resolveMembershipPlanPricingMode(plan);

  if (pricingMode !== "paid") {
    throw new Error("Only paid membership upgrades can start native checkout.");
  }

  const paymentConfiguration = await getHubPaymentConfigurationByHubId(hub.id);

  if (!paymentConfiguration?.isReady || !paymentConfiguration?.stripeAccountId) {
    throw new Error("Native payments are not ready for this hub yet.");
  }

  const upgradeRequest = await createMembershipUpgradeRequest(hub.id, memberSession.user.id, plan.id, normalizedActorId);
  const amountMinor = normalizeMoneyAmountToMinor(plan.price, plan.currency);
  const applicationFeeAmountMinor = calculateApplicationFeeAmount(amountMinor);

  const transaction = await createNativePaymentTransaction(
    hub.id,
    {
      kind: "membership_upgrade",
      status: "checkout_open",
      provider: "stripe",
      userId: memberSession.user.id,
      stripeAccountId: paymentConfiguration.stripeAccountId,
      membershipUpgradeRequestId: upgradeRequest.id,
      membershipId: "",
      planId: plan.id,
      planTitle: plan.title,
      amountMinor,
      amount: normalizeString(plan.price),
      currency: normalizeString(plan.currency).toUpperCase() || getFallbackRegionalMarket().defaultCurrency,
      applicationFeeAmountMinor,
    },
    normalizedActorId
  );
  const paymentRecord = await upsertPaymentRecordBySource(
    hub.id,
    {
      userId: memberSession.user.id,
      kind: "membership_upgrade",
      sourceType: "membershipUpgradeRequest",
      sourceId: upgradeRequest.id,
      title: plan.title ? `${plan.title} upgrade` : "Membership upgrade",
      description: normalizeString(hub?.name) ? `Membership upgrade for ${hub.name}` : "Membership upgrade",
      amountMinor,
      amountDisplay: normalizeString(plan.price),
      currency: normalizeString(plan.currency).toUpperCase() || getFallbackRegionalMarket().defaultCurrency,
      paymentMode: "native",
      provider: "stripe",
      operationalStatus: "open",
      financialStatus: "unpaid",
      occurredAt: transaction.createdAt,
      dueAt: transaction.createdAt,
      nativeTransactionId: transaction.id,
      membershipId: "",
      membershipUpgradeRequestId: upgradeRequest.id,
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
  const checkoutReturnPath = buildHubRuntimeHref(hub.slug, "/account/membership/checkout-return", routeMode);
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
              currency: normalizeString(plan.currency).toLowerCase() || getFallbackRegionalMarket().defaultCurrency.toLowerCase(),
              unit_amount: amountMinor,
              product_data: {
                name: `${plan.title} membership upgrade`,
                description: normalizeString(hub?.name) ? `Upgrade for ${hub.name}` : "Membership upgrade",
              },
            },
          },
        ],
        payment_intent_data: {
          application_fee_amount: applicationFeeAmountMinor > 0 ? applicationFeeAmountMinor : undefined,
          metadata: {
            hubId: normalizeString(hub.id),
            hubSlug: normalizeString(hub.slug),
            userId: normalizeString(memberSession.user.id),
            membershipUpgradeRequestId: normalizeString(upgradeRequest.id),
            nativePaymentTransactionId: normalizeString(transaction.id),
            planId: normalizeString(plan.id),
          },
        },
        metadata: {
          hubId: normalizeString(hub.id),
          hubSlug: normalizeString(hub.slug),
          userId: normalizeString(memberSession.user.id),
          membershipUpgradeRequestId: normalizeString(upgradeRequest.id),
          nativePaymentTransactionId: normalizeString(transaction.id),
          planId: normalizeString(plan.id),
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
    await cancelMembershipUpgradeRequest(hub.id, upgradeRequest.id, normalizedActorId);
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

  await updateMembershipUpgradeRequestPaymentState(
    hub.id,
    upgradeRequest.id,
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
    upgradeRequestId: upgradeRequest.id,
  };
}

export async function finalizeMembershipUpgradeCheckoutReturn({
  hub,
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
    transaction.status === "payment_received" || isPaid
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
  const ledgerState = resolveMembershipUpgradeLedgerState(preservedStatus, {
    membershipApplied: false,
  });

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

  await updateMembershipUpgradeRequestPaymentState(
    hub.id,
    transaction.membershipUpgradeRequestId,
    {
      nativePaymentTransactionId: transaction.id,
      nativePaymentStatus: preservedStatus,
      nativePaymentCheckoutUrl: transaction.checkoutUrl,
      nativePaymentSessionId: normalizeString(session.id),
      paymentCompletedAt: preservedStatus === "payment_received" ? paymentReceivedAt : "",
    },
    normalizedActorId
  );
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

  return {
    paid: isPaid,
    status: preservedStatus,
  };
}
