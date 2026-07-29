try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import {
  getHubPaymentConfigurationByHubId,
  getHubPaymentConfigurationByStripeAccountId,
  upsertHubPaymentConfiguration,
} from "@/lib/data/hub-payment-configurations";
import {
  approveMembershipUpgradeRequest,
  getMembershipUpgradeRequestById,
  updateMembershipUpgradeRequestPaymentState,
} from "@/lib/data/memberships";
import {
  updateCourseRegistrationNativePaymentState,
  updateCourseRegistrationPaymentStatus,
} from "@/lib/data/course-registrations";
import {
  getEventBookingById,
  updateEventBookingPaymentState,
} from "@/lib/data/event-bookings";
import {
  updateEventRegistrationNativePaymentState,
  updateEventRegistrationPaymentStatus,
} from "@/lib/data/legacy-event-registrations";
import {
  getNativePaymentTransactionById,
  getNativePaymentTransactionByPaymentIntentId,
  updateNativePaymentTransaction,
} from "@/lib/data/native-payment-transactions";
import {
  getPaymentRecordById,
  getPaymentRecordByNativeTransactionId,
  updatePaymentRecord,
} from "@/lib/data/payment-records";
import {
  claimStripeWebhookEventProcessing,
  getProcessedStripeWebhookEventById,
  releaseStripeWebhookEventProcessing,
  recordProcessedStripeWebhookEvent,
} from "@/lib/data/stripe-webhook-events";
import {
  resolveMembershipUpgradeLedgerState,
  resolveOfferingRegistrationLedgerState,
} from "@/lib/domain/payment-records";
import { getFallbackRegionalMarket } from "@/lib/domain/regional-markets";
import { assertStripeConnectEventOwnsTransaction } from "@/lib/domain/stripe-connect-webhook-ownership";
import {
  queueCourseRegistrationConfirmedAfterPaymentByIds,
  queueEventBookingConfirmedAfterPaymentByIds,
  queueLegacyEventRegistrationConfirmedAfterPaymentByIds,
} from "@/lib/server/booking-notification-outbox";
import { mapStripeAccountToPaymentConfiguration } from "@/lib/server/hub-payment-connect";

function normalizeString(value) {
  return String(value || "").trim();
}

function resolveStripeCheckoutSessionPaymentIntentId(session = {}) {
  if (typeof session.payment_intent === "string") {
    return normalizeString(session.payment_intent);
  }

  return normalizeString(session?.payment_intent?.id);
}

function resolveStripeRefundPaymentIntentId(refund = {}) {
  if (typeof refund.payment_intent === "string") {
    return normalizeString(refund.payment_intent);
  }

  return normalizeString(refund?.payment_intent?.id);
}

function resolveStripeChargePaymentIntentId(charge = {}) {
  if (typeof charge.payment_intent === "string") {
    return normalizeString(charge.payment_intent);
  }

  return normalizeString(charge?.payment_intent?.id);
}

function normalizeMinorAmountToDisplay(amountMinor, currency = getFallbackRegionalMarket().defaultCurrency) {
  const normalizedCurrency = normalizeString(currency).toUpperCase() || getFallbackRegionalMarket().defaultCurrency;
  const amount = Number.parseInt(String(amountMinor || ""), 10) || 0;
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

  if (zeroDecimalCurrencies.has(normalizedCurrency)) {
    return String(amount);
  }

  const major = amount / 100;
  return Number.isInteger(major) ? String(major) : major.toFixed(2).replace(/\.?0+$/, "");
}

function resolveStripeCheckoutSessionStatus(eventType, session = {}) {
  const paymentStatus = normalizeString(session.payment_status);

  if (eventType === "checkout.session.async_payment_failed" || eventType === "payment_intent.payment_failed") {
    return "payment_failed";
  }

  if (eventType === "checkout.session.expired") {
    return "checkout_cancelled";
  }

  if (paymentStatus === "paid" || eventType === "checkout.session.async_payment_succeeded") {
    return "payment_received";
  }

  return "checkout_completed";
}

function shouldPreserveFinalTransactionState(existingStatus, nextStatus) {
  return existingStatus === "payment_received" && nextStatus !== "payment_received";
}

function isPartialRefund(transaction, refundAmountMinor) {
  const normalizedTransactionAmountMinor = Number.parseInt(String(transaction?.amountMinor || ""), 10) || 0;
  const normalizedRefundAmountMinor = Number.parseInt(String(refundAmountMinor || ""), 10) || 0;

  return normalizedRefundAmountMinor > 0 && normalizedTransactionAmountMinor > 0 && normalizedRefundAmountMinor < normalizedTransactionAmountMinor;
}

async function assertWebhookOwnsNativeTransaction(event, hubId, transaction, context) {
  const hubPaymentConfiguration = await getHubPaymentConfigurationByHubId(hubId);

  return assertStripeConnectEventOwnsTransaction({
    event,
    transaction,
    hubPaymentConfiguration,
    context,
  });
}

async function syncConnectedAccountFromWebhook(account = {}, actorId = "stripe-webhook") {
  const stripeAccountId = normalizeString(account.id);

  if (!stripeAccountId) {
    return {
      kind: "account.updated",
      ignored: true,
      reason: "missing_stripe_account_id",
    };
  }

  const configurationRecord = await getHubPaymentConfigurationByStripeAccountId(stripeAccountId);

  if (!configurationRecord?.hubId) {
    return {
      kind: "account.updated",
      ignored: true,
      reason: "hub_not_found",
      stripeAccountId,
    };
  }

  const existingConfiguration = await getHubPaymentConfigurationByHubId(configurationRecord.hubId);
  const mapped = mapStripeAccountToPaymentConfiguration(account);
  const now = new Date().toISOString();

  await upsertHubPaymentConfiguration(
    configurationRecord.hubId,
    {
      ...mapped,
      onboardingStartedAt: normalizeString(existingConfiguration.onboardingStartedAt) || now,
      onboardingCompletedAt:
        mapped.chargesEnabled && mapped.payoutsEnabled && mapped.detailsSubmitted
          ? normalizeString(existingConfiguration.onboardingCompletedAt) || now
          : normalizeString(existingConfiguration.onboardingCompletedAt),
    },
    actorId
  );

  return {
    kind: "account.updated",
    stripeAccountId,
    hubId: configurationRecord.hubId,
    status: mapped.disabledReason ? "disabled" : "synced",
  };
}

async function reconcileMembershipUpgradeCheckout(event, actorId = "stripe-webhook") {
  const session = event?.data?.object || {};
  const metadata = session?.metadata || {};
  const hubId = normalizeString(metadata.hubId);
  const transactionId = normalizeString(metadata.nativePaymentTransactionId || session.client_reference_id);
  const requestId = normalizeString(metadata.membershipUpgradeRequestId);

  if (!hubId || !transactionId || !requestId) {
    return {
      kind: "membership_upgrade_checkout",
      ignored: true,
      reason: "missing_checkout_metadata",
    };
  }

  const [transaction, upgradeRequest] = await Promise.all([
    getNativePaymentTransactionById(hubId, transactionId),
    getMembershipUpgradeRequestById(hubId, requestId),
  ]);

  if (!transaction) {
    throw new Error(`Native payment transaction not found for Stripe webhook: ${transactionId}`);
  }

  if (!upgradeRequest) {
    throw new Error(`Membership upgrade request not found for Stripe webhook: ${requestId}`);
  }

  await assertWebhookOwnsNativeTransaction(event, hubId, transaction, "membership_upgrade_checkout");

  const nextStatus = resolveStripeCheckoutSessionStatus(event.type, session);
  const preservedStatus = shouldPreserveFinalTransactionState(transaction.status, nextStatus)
    ? transaction.status
    : nextStatus;
  const now = new Date().toISOString();
  const stripeCheckoutSessionId = normalizeString(session.id) || transaction.stripeCheckoutSessionId;
  const stripePaymentIntentId = resolveStripeCheckoutSessionPaymentIntentId(session) || transaction.stripePaymentIntentId;
  const checkoutCompletedAt =
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded" ||
    event.type === "checkout.session.async_payment_failed"
      ? normalizeString(transaction.checkoutCompletedAt) || now
      : normalizeString(transaction.checkoutCompletedAt);
  const paymentReceivedAt =
    preservedStatus === "payment_received"
      ? normalizeString(transaction.paymentReceivedAt) || now
      : normalizeString(transaction.paymentReceivedAt);

  await updateNativePaymentTransaction(
    hubId,
    transaction.id,
    {
      status: preservedStatus,
      stripeCheckoutSessionId,
      stripePaymentIntentId,
      checkoutCompletedAt,
      paymentReceivedAt,
    },
    actorId
  );

  await updateMembershipUpgradeRequestPaymentState(
    hubId,
    upgradeRequest.id,
    {
      nativePaymentTransactionId: transaction.id,
      nativePaymentStatus: preservedStatus,
      nativePaymentCheckoutUrl: transaction.checkoutUrl,
      nativePaymentSessionId: stripeCheckoutSessionId,
      paymentCompletedAt: preservedStatus === "payment_received" ? paymentReceivedAt : "",
    },
    actorId
  );

  let membershipApplied = false;

  if (preservedStatus === "payment_received" && upgradeRequest.status === "pending") {
    await approveMembershipUpgradeRequest(hubId, upgradeRequest.id, {
      paymentStatus: "paid",
      actorId,
    });
    membershipApplied = true;
  }
  const paymentRecord = transaction.paymentRecordId
    ? await getPaymentRecordById(hubId, transaction.paymentRecordId)
    : await getPaymentRecordByNativeTransactionId(hubId, transaction.id);
  const ledgerState = resolveMembershipUpgradeLedgerState(preservedStatus, {
    membershipApplied: membershipApplied || normalizeString(upgradeRequest.status) === "approved",
  });

  if (paymentRecord) {
    await updatePaymentRecord(
      hubId,
      paymentRecord.id,
      {
        operationalStatus: ledgerState.operationalStatus,
        financialStatus: ledgerState.financialStatus,
        stripeCheckoutSessionId,
        stripePaymentIntentId,
        paidAt: preservedStatus === "payment_received" ? paymentReceivedAt : "",
      },
      actorId
    );
  }

  return {
    kind: "membership_upgrade_checkout",
    hubId,
    transactionId: transaction.id,
    requestId: upgradeRequest.id,
    status: preservedStatus,
    membershipApplied,
    requestStatus: upgradeRequest.status,
  };
}

async function reconcileEventRegistrationCheckout(event, actorId = "stripe-webhook") {
  const session = event?.data?.object || {};
  const metadata = session?.metadata || {};
  const hubId = normalizeString(metadata.hubId);
  const transactionId = normalizeString(metadata.nativePaymentTransactionId || session.client_reference_id);
  const eventId = normalizeString(metadata.eventId);
  const registrationId = normalizeString(metadata.registrationId);

  if (!hubId || !transactionId || !eventId || !registrationId) {
    return {
      kind: "event_registration_checkout",
      ignored: true,
      reason: "missing_checkout_metadata",
    };
  }

  const transaction = await getNativePaymentTransactionById(hubId, transactionId);

  if (!transaction) {
    throw new Error(`Native payment transaction not found for Stripe webhook: ${transactionId}`);
  }

  await assertWebhookOwnsNativeTransaction(event, hubId, transaction, "event_registration_checkout");

  const nextStatus = resolveStripeCheckoutSessionStatus(event.type, session);
  const preservedStatus = shouldPreserveFinalTransactionState(transaction.status, nextStatus)
    ? transaction.status
    : nextStatus;
  const now = new Date().toISOString();
  const stripeCheckoutSessionId = normalizeString(session.id) || transaction.stripeCheckoutSessionId;
  const stripePaymentIntentId = resolveStripeCheckoutSessionPaymentIntentId(session) || transaction.stripePaymentIntentId;
  const checkoutCompletedAt =
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded" ||
    event.type === "checkout.session.async_payment_failed"
      ? normalizeString(transaction.checkoutCompletedAt) || now
      : normalizeString(transaction.checkoutCompletedAt);
  const paymentReceivedAt =
    preservedStatus === "payment_received"
      ? normalizeString(transaction.paymentReceivedAt) || now
      : normalizeString(transaction.paymentReceivedAt);

  await updateNativePaymentTransaction(
    hubId,
    transaction.id,
    {
      status: preservedStatus,
      stripeCheckoutSessionId,
      stripePaymentIntentId,
      checkoutCompletedAt,
      paymentReceivedAt,
    },
    actorId
  );

  await updateEventRegistrationNativePaymentState(
    hubId,
    eventId,
    registrationId,
    {
      nativePaymentTransactionId: transaction.id,
      nativePaymentStatus: preservedStatus,
      nativePaymentCheckoutUrl: transaction.checkoutUrl,
      nativePaymentSessionId: stripeCheckoutSessionId,
      paymentCompletedAt: preservedStatus === "payment_received" ? paymentReceivedAt : "",
    },
    actorId
  );

  if (preservedStatus === "payment_received") {
    await updateEventRegistrationPaymentStatus(hubId, eventId, registrationId, "paid", actorId);
  } else if (preservedStatus === "payment_failed") {
    await updateEventRegistrationPaymentStatus(hubId, eventId, registrationId, "failed", actorId);
  }
  const paymentRecord = transaction.paymentRecordId
    ? await getPaymentRecordById(hubId, transaction.paymentRecordId)
    : await getPaymentRecordByNativeTransactionId(hubId, transaction.id);
  const ledgerState = resolveOfferingRegistrationLedgerState(preservedStatus);

  if (paymentRecord) {
    await updatePaymentRecord(
      hubId,
      paymentRecord.id,
      {
        operationalStatus: ledgerState.operationalStatus,
        financialStatus: ledgerState.financialStatus,
        stripeCheckoutSessionId,
        stripePaymentIntentId,
        paidAt: preservedStatus === "payment_received" ? paymentReceivedAt : "",
      },
      actorId
    );
  }

  if (preservedStatus === "payment_received") {
    await queueLegacyEventRegistrationConfirmedAfterPaymentByIds({
      hubId,
      eventId,
      registrationId,
      actorId,
    });
  }

  return {
    kind: "event_registration_checkout",
    hubId,
    eventId,
    registrationId,
    transactionId: transaction.id,
    status: preservedStatus,
  };
}

async function reconcileEventBookingCheckout(event, actorId = "stripe-webhook") {
  const session = event?.data?.object || {};
  const metadata = session?.metadata || {};
  const hubId = normalizeString(metadata.hubId);
  const transactionId = normalizeString(metadata.nativePaymentTransactionId || session.client_reference_id);
  const eventId = normalizeString(metadata.eventId);
  const bookingId = normalizeString(metadata.bookingId || metadata.eventBookingId);

  if (!hubId || !transactionId || !eventId || !bookingId) {
    return {
      kind: "event_booking_checkout",
      ignored: true,
      reason: "missing_checkout_metadata",
    };
  }

  const [transaction, booking] = await Promise.all([
    getNativePaymentTransactionById(hubId, transactionId),
    getEventBookingById(hubId, eventId, bookingId),
  ]);

  if (!transaction) {
    throw new Error(`Native payment transaction not found for Stripe webhook: ${transactionId}`);
  }

  if (!booking) {
    throw new Error(`Event booking not found for Stripe webhook: ${bookingId}`);
  }

  await assertWebhookOwnsNativeTransaction(event, hubId, transaction, "event_booking_checkout");

  const nextStatus = resolveStripeCheckoutSessionStatus(event.type, session);
  const preservedStatus = shouldPreserveFinalTransactionState(transaction.status, nextStatus)
    ? transaction.status
    : nextStatus;
  const now = new Date().toISOString();
  const stripeCheckoutSessionId = normalizeString(session.id) || transaction.stripeCheckoutSessionId;
  const stripePaymentIntentId = resolveStripeCheckoutSessionPaymentIntentId(session) || transaction.stripePaymentIntentId;
  const checkoutCompletedAt =
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded" ||
    event.type === "checkout.session.async_payment_failed"
      ? normalizeString(transaction.checkoutCompletedAt) || now
      : normalizeString(transaction.checkoutCompletedAt);
  const paymentReceivedAt =
    preservedStatus === "payment_received"
      ? normalizeString(transaction.paymentReceivedAt) || now
      : normalizeString(transaction.paymentReceivedAt);
  const bookingWasCancelled = normalizeString(booking.status) === "cancelled";
  const nextBookingPaymentStatus =
    preservedStatus === "payment_received"
      ? bookingWasCancelled
        ? normalizeString(booking.paymentStatus) || "pending"
        : "paid"
      : preservedStatus === "payment_failed"
        ? "failed"
        : "pending";

  await updateNativePaymentTransaction(
    hubId,
    transaction.id,
    {
      status: preservedStatus,
      stripeCheckoutSessionId,
      stripePaymentIntentId,
      checkoutCompletedAt,
      paymentReceivedAt,
    },
    actorId
  );

  await updateEventBookingPaymentState(
    hubId,
    eventId,
    bookingId,
    {
      nativePaymentTransactionId: transaction.id,
      nativePaymentStatus: preservedStatus,
      nativePaymentCheckoutUrl: transaction.checkoutUrl,
      nativePaymentSessionId: stripeCheckoutSessionId,
      paymentCompletedAt: preservedStatus === "payment_received" ? paymentReceivedAt : "",
      paymentStatus: nextBookingPaymentStatus,
    },
    actorId
  );

  const paymentRecord = transaction.paymentRecordId
    ? await getPaymentRecordById(hubId, transaction.paymentRecordId)
    : await getPaymentRecordByNativeTransactionId(hubId, transaction.id);
  const ledgerState = resolveOfferingRegistrationLedgerState(preservedStatus);

  if (paymentRecord) {
    await updatePaymentRecord(
      hubId,
      paymentRecord.id,
      {
        operationalStatus: bookingWasCancelled ? "cancelled" : ledgerState.operationalStatus,
        financialStatus: ledgerState.financialStatus,
        stripeCheckoutSessionId,
        stripePaymentIntentId,
        paidAt: preservedStatus === "payment_received" ? paymentReceivedAt : "",
      },
      actorId
    );
  }

  if (preservedStatus === "payment_received" && !bookingWasCancelled) {
    await queueEventBookingConfirmedAfterPaymentByIds({
      hubId,
      eventId,
      bookingId,
      actorId,
    });
  }

  return {
    kind: "event_booking_checkout",
    hubId,
    eventId,
    bookingId,
    transactionId: transaction.id,
    status: preservedStatus,
    bookingWasCancelled,
  };
}

async function reconcileCourseRegistrationCheckout(event, actorId = "stripe-webhook") {
  const session = event?.data?.object || {};
  const metadata = session?.metadata || {};
  const hubId = normalizeString(metadata.hubId);
  const transactionId = normalizeString(metadata.nativePaymentTransactionId || session.client_reference_id);
  const courseId = normalizeString(metadata.courseId);
  const registrationId = normalizeString(metadata.registrationId);

  if (!hubId || !transactionId || !courseId || !registrationId) {
    return {
      kind: "course_registration_checkout",
      ignored: true,
      reason: "missing_checkout_metadata",
    };
  }

  const transaction = await getNativePaymentTransactionById(hubId, transactionId);

  if (!transaction) {
    throw new Error(`Native payment transaction not found for Stripe webhook: ${transactionId}`);
  }

  await assertWebhookOwnsNativeTransaction(event, hubId, transaction, "course_registration_checkout");

  const nextStatus = resolveStripeCheckoutSessionStatus(event.type, session);
  const preservedStatus = shouldPreserveFinalTransactionState(transaction.status, nextStatus)
    ? transaction.status
    : nextStatus;
  const now = new Date().toISOString();
  const stripeCheckoutSessionId = normalizeString(session.id) || transaction.stripeCheckoutSessionId;
  const stripePaymentIntentId = resolveStripeCheckoutSessionPaymentIntentId(session) || transaction.stripePaymentIntentId;
  const checkoutCompletedAt =
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded" ||
    event.type === "checkout.session.async_payment_failed"
      ? normalizeString(transaction.checkoutCompletedAt) || now
      : normalizeString(transaction.checkoutCompletedAt);
  const paymentReceivedAt =
    preservedStatus === "payment_received"
      ? normalizeString(transaction.paymentReceivedAt) || now
      : normalizeString(transaction.paymentReceivedAt);

  await updateNativePaymentTransaction(
    hubId,
    transaction.id,
    {
      status: preservedStatus,
      stripeCheckoutSessionId,
      stripePaymentIntentId,
      checkoutCompletedAt,
      paymentReceivedAt,
    },
    actorId
  );

  await updateCourseRegistrationNativePaymentState(
    hubId,
    courseId,
    registrationId,
    {
      nativePaymentTransactionId: transaction.id,
      nativePaymentStatus: preservedStatus,
      nativePaymentCheckoutUrl: transaction.checkoutUrl,
      nativePaymentSessionId: stripeCheckoutSessionId,
      paymentCompletedAt: preservedStatus === "payment_received" ? paymentReceivedAt : "",
    },
    actorId
  );

  if (preservedStatus === "payment_received") {
    await updateCourseRegistrationPaymentStatus(hubId, courseId, registrationId, "paid", actorId);
  } else if (preservedStatus === "payment_failed") {
    await updateCourseRegistrationPaymentStatus(hubId, courseId, registrationId, "failed", actorId);
  }
  const paymentRecord = transaction.paymentRecordId
    ? await getPaymentRecordById(hubId, transaction.paymentRecordId)
    : await getPaymentRecordByNativeTransactionId(hubId, transaction.id);
  const ledgerState = resolveOfferingRegistrationLedgerState(preservedStatus);

  if (paymentRecord) {
    await updatePaymentRecord(
      hubId,
      paymentRecord.id,
      {
        operationalStatus: ledgerState.operationalStatus,
        financialStatus: ledgerState.financialStatus,
        stripeCheckoutSessionId,
        stripePaymentIntentId,
        paidAt: preservedStatus === "payment_received" ? paymentReceivedAt : "",
      },
      actorId
    );
  }

  if (preservedStatus === "payment_received") {
    await queueCourseRegistrationConfirmedAfterPaymentByIds({
      hubId,
      courseId,
      registrationId,
      actorId,
    });
  }

  return {
    kind: "course_registration_checkout",
    hubId,
    courseId,
    registrationId,
    transactionId: transaction.id,
    status: preservedStatus,
  };
}

async function findTransactionForRefundEvent(event) {
  const object = event?.data?.object || {};
  const metadata = object?.metadata || {};
  const metadataHubId = normalizeString(metadata.hubId);
  const metadataTransactionId = normalizeString(metadata.nativePaymentTransactionId);
  const stripePaymentIntentId =
    resolveStripeRefundPaymentIntentId(object) || resolveStripeChargePaymentIntentId(object);

  if (metadataHubId && metadataTransactionId) {
    const transaction = await getNativePaymentTransactionById(metadataHubId, metadataTransactionId);

    return {
      hubId: metadataHubId,
      transaction,
      stripePaymentIntentId,
    };
  }

  if (metadataHubId && stripePaymentIntentId) {
    const transaction = await getNativePaymentTransactionByPaymentIntentId(metadataHubId, stripePaymentIntentId);

    return {
      hubId: metadataHubId,
      transaction,
      stripePaymentIntentId,
    };
  }

  const stripeAccountId = normalizeString(event?.account);
  let configurationRecord = null;

  if (stripeAccountId) {
    try {
      configurationRecord = await getHubPaymentConfigurationByStripeAccountId(stripeAccountId);
    } catch (error) {
      if (error?.code !== 9) {
        throw error;
      }
    }
  }

  const hubId = normalizeString(configurationRecord?.hubId);

  if (!hubId || !stripePaymentIntentId) {
    return {
      hubId,
      transaction: null,
      stripePaymentIntentId,
    };
  }

  const transaction = await getNativePaymentTransactionByPaymentIntentId(hubId, stripePaymentIntentId);

  return {
    hubId,
    transaction,
    stripePaymentIntentId,
  };
}

async function reconcileEventRegistrationRefund(event, actorId = "stripe-webhook") {
  const object = event?.data?.object || {};
  const eventType = normalizeString(event?.type);
  const { hubId, transaction, stripePaymentIntentId } = await findTransactionForRefundEvent(event);

  if (!hubId || !transaction || !["event_registration", "event_booking", "course_registration"].includes(transaction.kind)) {
    return {
      kind: "offering_registration_refund",
      ignored: true,
      reason: "transaction_not_found",
      stripePaymentIntentId,
    };
  }

  await assertWebhookOwnsNativeTransaction(event, hubId, transaction, "offering_registration_refund");

  const refundStatus = normalizeString(object.status) || (eventType === "charge.refunded" ? "succeeded" : "");
  const normalizedRefundState = refundStatus === "succeeded" ? "refunded" : refundStatus;
  const refundAmountMinor = Number.parseInt(
    String(
      eventType === "charge.refunded"
        ? object.amount_refunded || object.amount || transaction.refundAmountMinor || 0
        : object.amount || transaction.refundAmountMinor || 0
    ),
    10
  ) || 0;
  const refundedAt = normalizedRefundState === "refunded" ? normalizeString(transaction.refundedAt) || new Date().toISOString() : normalizeString(transaction.refundedAt);
  const latestChargeRefund =
    eventType === "charge.refunded"
      ? object?.refunds?.data?.find((refund) => normalizeString(refund?.payment_intent) === stripePaymentIntentId) ||
        object?.refunds?.data?.[object?.refunds?.data?.length - 1]
      : null;
  const stripeRefundId =
    normalizeString(eventType === "charge.refunded" ? latestChargeRefund?.id : object.id) ||
    normalizeString(transaction.stripeRefundId);
  const partialRefund = normalizedRefundState === "refunded" && isPartialRefund(transaction, refundAmountMinor);
  const storedRefundStatus = partialRefund ? "partially_refunded" : normalizedRefundState;

  await updateNativePaymentTransaction(
    hubId,
    transaction.id,
    {
      refundStatus: storedRefundStatus,
      refundAmountMinor,
      refundAmount: normalizeMinorAmountToDisplay(refundAmountMinor, transaction.currency),
      refundedAt,
      stripeRefundId,
    },
    actorId
  );
  const paymentRecord = transaction.paymentRecordId
    ? await getPaymentRecordById(hubId, transaction.paymentRecordId)
    : await getPaymentRecordByNativeTransactionId(hubId, transaction.id);

  if (transaction.kind === "event_booking" && transaction.eventId && transaction.eventBookingId) {
    await updateEventBookingPaymentState(
      hubId,
      transaction.eventId,
      transaction.eventBookingId,
      {
        nativePaymentTransactionId: transaction.id,
        nativePaymentStatus: transaction.status,
        paymentStatus: partialRefund ? "partially_refunded" : normalizedRefundState === "refunded" ? "refunded" : "paid",
        paymentCompletedAt: normalizeString(transaction.paymentReceivedAt),
      },
      actorId
    );
  } else if (normalizedRefundState === "refunded" && !partialRefund) {
    if (transaction.kind === "event_registration" && transaction.eventId && transaction.registrationId) {
      await updateEventRegistrationPaymentStatus(hubId, transaction.eventId, transaction.registrationId, "refunded", actorId);
      await updateEventRegistrationNativePaymentState(
        hubId,
        transaction.eventId,
        transaction.registrationId,
        {
          nativePaymentTransactionId: transaction.id,
          nativePaymentStatus: transaction.status,
        },
        actorId
      );
    } else if (transaction.kind === "course_registration" && transaction.courseId && transaction.registrationId) {
      await updateCourseRegistrationPaymentStatus(hubId, transaction.courseId, transaction.registrationId, "refunded", actorId);
      await updateCourseRegistrationNativePaymentState(
        hubId,
        transaction.courseId,
        transaction.registrationId,
        {
          nativePaymentTransactionId: transaction.id,
          nativePaymentStatus: transaction.status,
        },
        actorId
      );
    }
  }

  if (paymentRecord) {
    const ledgerState = resolveOfferingRegistrationLedgerState(transaction.status, {
      refunded: normalizedRefundState === "refunded",
      refundAmountMinor,
      totalAmountMinor: transaction.amountMinor,
    });

    await updatePaymentRecord(
      hubId,
      paymentRecord.id,
      {
        operationalStatus: ledgerState.operationalStatus,
        financialStatus: ledgerState.financialStatus,
        refundedAt,
        refundAmountMinor,
        refundDisplay: normalizeMinorAmountToDisplay(refundAmountMinor, transaction.currency),
        stripeRefundId,
      },
      actorId
    );
  }

  return {
    kind:
      transaction.kind === "course_registration"
        ? "course_registration_refund"
        : transaction.kind === "event_booking"
          ? "event_booking_refund"
          : "event_registration_refund",
    hubId,
    transactionId: transaction.id,
    stripePaymentIntentId,
    refundStatus: storedRefundStatus,
  };
}

async function reconcileCheckoutPaymentIntentFailure(event, actorId = "stripe-webhook") {
  const paymentIntent = event?.data?.object || {};
  const metadata = paymentIntent?.metadata || {};
  const kind = normalizeString(metadata.kind);
  const hubId = normalizeString(metadata.hubId);
  const transactionId = normalizeString(metadata.nativePaymentTransactionId);
  const stripePaymentIntentId = normalizeString(paymentIntent.id);

  if (!hubId || !transactionId) {
    return {
      kind: "checkout_payment_intent_failure",
      ignored: true,
      reason: "missing_payment_intent_metadata",
    };
  }

  const transaction = await getNativePaymentTransactionById(hubId, transactionId);

  if (!transaction) {
    throw new Error(`Native payment transaction not found for Stripe payment intent failure: ${transactionId}`);
  }

  await assertWebhookOwnsNativeTransaction(event, hubId, transaction, "checkout_payment_intent_failure");

  await updateNativePaymentTransaction(
    hubId,
    transaction.id,
    {
      status: "payment_failed",
      stripePaymentIntentId: stripePaymentIntentId || transaction.stripePaymentIntentId,
    },
    actorId
  );

  const paymentRecord = transaction.paymentRecordId
    ? await getPaymentRecordById(hubId, transaction.paymentRecordId)
    : await getPaymentRecordByNativeTransactionId(hubId, transaction.id);

  if (kind === "event_registration") {
    const eventId = normalizeString(metadata.eventId) || transaction.eventId;
    const registrationId = normalizeString(metadata.registrationId) || transaction.registrationId;

    if (eventId && registrationId) {
      await updateEventRegistrationNativePaymentState(
        hubId,
        eventId,
        registrationId,
        {
          nativePaymentTransactionId: transaction.id,
          nativePaymentStatus: "payment_failed",
          nativePaymentCheckoutUrl: transaction.checkoutUrl,
          nativePaymentSessionId: transaction.stripeCheckoutSessionId,
        },
        actorId
      );
      await updateEventRegistrationPaymentStatus(hubId, eventId, registrationId, "failed", actorId);
    }
  } else if (kind === "event_booking") {
    const eventId = normalizeString(metadata.eventId) || transaction.eventId;
    const bookingId = normalizeString(metadata.bookingId || metadata.eventBookingId) || transaction.eventBookingId;

    if (eventId && bookingId) {
      await updateEventBookingPaymentState(
        hubId,
        eventId,
        bookingId,
        {
          nativePaymentTransactionId: transaction.id,
          nativePaymentStatus: "payment_failed",
          nativePaymentCheckoutUrl: transaction.checkoutUrl,
          nativePaymentSessionId: transaction.stripeCheckoutSessionId,
          paymentStatus: "failed",
          paymentCompletedAt: "",
        },
        actorId
      );
    }
  } else if (kind === "course_registration") {
    const courseId = normalizeString(metadata.courseId) || transaction.courseId;
    const registrationId = normalizeString(metadata.registrationId) || transaction.registrationId;

    if (courseId && registrationId) {
      await updateCourseRegistrationNativePaymentState(
        hubId,
        courseId,
        registrationId,
        {
          nativePaymentTransactionId: transaction.id,
          nativePaymentStatus: "payment_failed",
          nativePaymentCheckoutUrl: transaction.checkoutUrl,
          nativePaymentSessionId: transaction.stripeCheckoutSessionId,
        },
        actorId
      );
      await updateCourseRegistrationPaymentStatus(hubId, courseId, registrationId, "failed", actorId);
    }
  } else {
    const requestId = normalizeString(metadata.membershipUpgradeRequestId) || transaction.membershipUpgradeRequestId;

    if (requestId) {
      await updateMembershipUpgradeRequestPaymentState(
        hubId,
        requestId,
        {
          nativePaymentTransactionId: transaction.id,
          nativePaymentStatus: "payment_failed",
          nativePaymentCheckoutUrl: transaction.checkoutUrl,
          nativePaymentSessionId: transaction.stripeCheckoutSessionId,
          paymentCompletedAt: "",
        },
        actorId
      );
    }
  }

  if (paymentRecord) {
    const ledgerState =
      kind === "event_registration" || kind === "event_booking" || kind === "course_registration"
        ? resolveOfferingRegistrationLedgerState("payment_failed")
        : resolveMembershipUpgradeLedgerState("payment_failed");

    await updatePaymentRecord(
      hubId,
      paymentRecord.id,
      {
        operationalStatus: ledgerState.operationalStatus,
        financialStatus: ledgerState.financialStatus,
        stripePaymentIntentId: stripePaymentIntentId || transaction.stripePaymentIntentId,
      },
      actorId
    );
  }

  return {
    kind: `${kind || "membership_upgrade"}_payment_failed`,
    hubId,
    transactionId: transaction.id,
    stripePaymentIntentId,
    status: "payment_failed",
  };
}

export async function processHubStripeWebhookEvent(event) {
  const existing = await getProcessedStripeWebhookEventById(event?.id);

  if (existing?.processingStatus === "completed") {
    return {
      duplicate: true,
      eventId: normalizeString(event?.id),
      type: normalizeString(event?.type),
      processingStatus: existing.processingStatus,
    };
  }

  const claim = await claimStripeWebhookEventProcessing(event);

  if (!claim.claimed) {
    return {
      duplicate: true,
      eventId: normalizeString(event?.id),
      type: normalizeString(event?.type),
      processingStatus: claim.record?.processingStatus || "processing",
    };
  }

  try {
    let result;

    if (event?.type === "account.updated") {
      result = await syncConnectedAccountFromWebhook(event?.data?.object || {});
    } else if (
      event?.type === "checkout.session.completed" ||
      event?.type === "checkout.session.async_payment_succeeded" ||
      event?.type === "checkout.session.async_payment_failed" ||
      event?.type === "checkout.session.expired"
    ) {
      const metadataKind = normalizeString(event?.data?.object?.metadata?.kind);

      if (metadataKind === "event_registration") {
        result = await reconcileEventRegistrationCheckout(event);
      } else if (metadataKind === "event_booking") {
        result = await reconcileEventBookingCheckout(event);
      } else if (metadataKind === "course_registration") {
        result = await reconcileCourseRegistrationCheckout(event);
      } else {
        result = await reconcileMembershipUpgradeCheckout(event);
      }
    } else if (event?.type === "payment_intent.payment_failed") {
      result = await reconcileCheckoutPaymentIntentFailure(event);
    } else if (
      event?.type === "refund.created" ||
      event?.type === "refund.updated" ||
      event?.type === "charge.refunded"
    ) {
      result = await reconcileEventRegistrationRefund(event);
    } else {
      result = {
        ignored: true,
        type: normalizeString(event?.type),
      };
    }

    await recordProcessedStripeWebhookEvent(event, result);

    return result;
  } catch (error) {
    await releaseStripeWebhookEventProcessing(event?.id);
    throw error;
  }
}
