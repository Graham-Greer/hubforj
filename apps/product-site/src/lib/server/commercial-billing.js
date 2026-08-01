import "server-only";

import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import {
  mapStripeSubscriptionStatusToPackageStatus,
  isPaidPackageTier,
  normalizeStripeSubscriptionStatus,
} from "@/lib/domain/commercial-billing";
import { getCommercialPackageIntent } from "@/lib/domain/package-catalog";
import {
  getCommercialAccountById,
  getCommercialAccountByStripeCustomerId,
  getCommercialAccountByStripeSubscriptionId,
  appendCommercialAccountAuditEvent,
  updateCommercialAccountPackageIntent,
  updateCommercialAccountStripeCustomer,
  updateCommercialAccountStripeSubscription,
} from "@/lib/data/commercial-accounts";
import {
  assertStripePriceMatchesSelection,
  getPackageCurrencyForStripePriceId,
  getPackageTierAndCurrencyForStripePriceId,
  getPackageTierForStripePriceId,
  getStripeBillingEnvironmentState,
  getStripeServerClient,
  resolveStripePriceSelection,
} from "@/lib/server/stripe";
import { updateHubPackageAuthorityFromProductSite } from "@/lib/server/hub-package-authority";

const STRIPE_EVENT_COLLECTION = "commercialStripeEvents";
const productSiteBillingCountry = "GB";
const productSiteBillingLocale = "en-GB";
const productSiteBillingCurrency = "GBP";

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeEmail(value) {
  return normalizeString(value).toLowerCase();
}

function normalizeBaseUrl(value) {
  return normalizeString(value).replace(/\/+$/, "");
}

const supportedStripeCheckoutLocales = new Set([
  "bg",
  "cs",
  "da",
  "de",
  "el",
  "en",
  "en-GB",
  "es",
  "et",
  "fi",
  "fr",
  "fr-CA",
  "hr",
  "hu",
  "it",
  "ja",
  "lt",
  "lv",
  "ms",
  "mt",
  "nb",
  "nl",
  "pl",
  "pt",
  "pt-BR",
  "ro",
  "sk",
  "sl",
  "sv",
  "zh-HK",
]);

function resolveStripeCheckoutLocale(locale) {
  const normalizedLocale = normalizeString(locale);

  if (!normalizedLocale) {
    return "auto";
  }

  if (supportedStripeCheckoutLocales.has(normalizedLocale)) {
    return normalizedLocale;
  }

  const [language = ""] = normalizedLocale.split("-");

  if (supportedStripeCheckoutLocales.has(language)) {
    return language;
  }

  if (normalizedLocale.toLowerCase() === "en-us") {
    return "en";
  }

  return "auto";
}

function resolveCheckoutRegionalContext(currentHub = {}) {
  void currentHub;

  return {
    country: productSiteBillingCountry,
    locale: resolveStripeCheckoutLocale(productSiteBillingLocale),
    defaultCurrency: productSiteBillingCurrency,
  };
}

function resolvePackageCheckoutCurrency({ account = null, currentHub = null, checkoutRegion = null, targetTier = "" } = {}) {
  void account;
  void currentHub;
  void checkoutRegion;
  void targetTier;

  return productSiteBillingCurrency;
}

function normalizeUnixTimestampToIso(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return "";
  }

  return new Date(numericValue * 1000).toISOString();
}

function buildReturnUrl(pathname) {
  const { productSiteBaseUrl } = getStripeBillingEnvironmentState();
  return `${normalizeBaseUrl(productSiteBaseUrl)}${pathname}`;
}

function getPrimarySubscriptionPriceId(subscription) {
  return normalizeString(subscription?.items?.data?.[0]?.price?.id);
}

function getPrimarySubscriptionItem(subscription) {
  return subscription?.items?.data?.[0] || null;
}

async function resolveStripeSubscriptionRenewalDateDetails({
  stripe,
  subscription,
  customerId = "",
  scheduledPackageEffectiveAt = "",
} = {}) {
  if (normalizeString(scheduledPackageEffectiveAt)) {
    return {
      date: normalizeString(scheduledPackageEffectiveAt),
      source: "scheduled_package_effective_at",
      directPeriodEnd: "",
      upcomingInvoicePeriodEnd: "",
      upcomingInvoiceLinePeriodEnd: "",
      upcomingInvoiceNextPaymentAttempt: "",
    };
  }

  const directPeriodEnd = normalizeUnixTimestampToIso(subscription?.current_period_end);
  const itemPeriodEnd = normalizeUnixTimestampToIso(subscription?.items?.data?.[0]?.current_period_end);

  if (directPeriodEnd) {
    return {
      date: directPeriodEnd,
      source: "subscription.current_period_end",
      directPeriodEnd,
      itemPeriodEnd,
      upcomingInvoicePeriodEnd: "",
      upcomingInvoiceLinePeriodEnd: "",
      upcomingInvoiceNextPaymentAttempt: "",
    };
  }

  if (itemPeriodEnd) {
    return {
      date: itemPeriodEnd,
      source: "subscription_item.current_period_end",
      directPeriodEnd,
      itemPeriodEnd,
      upcomingInvoicePeriodEnd: "",
      upcomingInvoiceLinePeriodEnd: "",
      upcomingInvoiceNextPaymentAttempt: "",
    };
  }

  const normalizedCustomerId = normalizeString(subscription?.customer) || normalizeString(customerId);
  const normalizedSubscriptionId = normalizeString(subscription?.id);

  if (!stripe || !normalizedCustomerId || !normalizedSubscriptionId) {
    return {
      date: "",
      source: "unavailable",
      directPeriodEnd: "",
      itemPeriodEnd: "",
      upcomingInvoicePeriodEnd: "",
      upcomingInvoiceLinePeriodEnd: "",
      upcomingInvoiceNextPaymentAttempt: "",
    };
  }

  async function tryRetrieveUpcomingInvoice(request = {}) {
    const normalizedRequest = Object.fromEntries(
      Object.entries(request).filter(([, value]) => normalizeString(value))
    );

    if (!Object.keys(normalizedRequest).length) {
      return null;
    }

    if (typeof stripe?.invoices?.retrieveUpcoming === "function") {
      return stripe.invoices.retrieveUpcoming(normalizedRequest);
    }

    if (typeof stripe?.invoices?.createPreview === "function") {
      return stripe.invoices.createPreview(normalizedRequest);
    }

    throw new Error("Stripe invoice preview methods are unavailable.");
  }

  const invoicePreviewAttempts = [
    {
      label: "retrieveUpcoming.customer+subscription",
      request: {
        customer: normalizedCustomerId,
        subscription: normalizedSubscriptionId,
      },
    },
    {
      label: "retrieveUpcoming.subscription",
      request: {
        subscription: normalizedSubscriptionId,
      },
    },
    {
      label: "retrieveUpcoming.customer",
      request: {
        customer: normalizedCustomerId,
      },
    },
    {
      label: "createPreview.customer+subscription",
      request: {
        customer: normalizedCustomerId,
        subscription: normalizedSubscriptionId,
      },
      method: "createPreview",
    },
    {
      label: "createPreview.customer",
      request: {
        customer: normalizedCustomerId,
      },
      method: "createPreview",
    },
  ];

  let invoicePreviewError = "";

  try {
    let upcomingInvoice = null;
    let previewSource = "";

    for (const attempt of invoicePreviewAttempts) {
      try {
        const invoiceClient =
          attempt.method === "createPreview" && typeof stripe?.invoices?.createPreview === "function"
            ? { preview: stripe.invoices.createPreview.bind(stripe.invoices) }
            : { preview: tryRetrieveUpcomingInvoice };

        upcomingInvoice = await invoiceClient.preview(attempt.request);
        previewSource = attempt.label;
        break;
      } catch (error) {
        const message = normalizeString(error?.message || error?.raw?.message || error?.code || "unknown_error");
        invoicePreviewError = invoicePreviewError
          ? `${invoicePreviewError}; ${attempt.label}: ${message}`
          : `${attempt.label}: ${message}`;
      }
    }

    if (!upcomingInvoice) {
      return {
        date: "",
        source: "invoice.lookup_failed",
        directPeriodEnd: "",
        itemPeriodEnd: "",
        upcomingInvoicePeriodEnd: "",
        upcomingInvoiceLinePeriodEnd: "",
        upcomingInvoiceNextPaymentAttempt: "",
        invoicePreviewError,
      };
    }

    const invoiceLinePeriodEnds = Array.isArray(upcomingInvoice?.lines?.data)
      ? upcomingInvoice.lines.data
          .map((line) => Number(line?.period?.end || 0))
          .filter((value) => Number.isFinite(value) && value > 0)
          .sort((left, right) => right - left)
      : [];

    const upcomingInvoicePeriodEnd = normalizeUnixTimestampToIso(upcomingInvoice?.period_end);
    const upcomingInvoiceLinePeriodEnd = normalizeUnixTimestampToIso(invoiceLinePeriodEnds[0]);
    const upcomingInvoiceNextPaymentAttempt = normalizeUnixTimestampToIso(upcomingInvoice?.next_payment_attempt);
    const date =
      upcomingInvoicePeriodEnd ||
      upcomingInvoiceLinePeriodEnd ||
      upcomingInvoiceNextPaymentAttempt ||
      "";
    const source = upcomingInvoicePeriodEnd
      ? "invoice.period_end"
      : upcomingInvoiceLinePeriodEnd
        ? "invoice.lines.period.end"
        : upcomingInvoiceNextPaymentAttempt
          ? "invoice.next_payment_attempt"
          : previewSource
            ? `${previewSource}.empty`
            : "invoice.empty";

    return {
      date,
      source,
      directPeriodEnd: "",
      itemPeriodEnd: "",
      upcomingInvoicePeriodEnd,
      upcomingInvoiceLinePeriodEnd,
      upcomingInvoiceNextPaymentAttempt,
      invoicePreviewError,
    };
  } catch (error) {
    return {
      date: "",
      source: "invoice.lookup_failed",
      directPeriodEnd: "",
      itemPeriodEnd: "",
      upcomingInvoicePeriodEnd: "",
      upcomingInvoiceLinePeriodEnd: "",
      upcomingInvoiceNextPaymentAttempt: "",
      invoicePreviewError: normalizeString(
        error?.message || error?.raw?.message || error?.code || invoicePreviewError
      ),
    };
  }
}

async function resolveStripeSubscriptionRenewalDate(args = {}) {
  const details = await resolveStripeSubscriptionRenewalDateDetails(args);
  return normalizeString(details?.date);
}

function getSubscriptionPriority(subscription) {
  const status = normalizeStripeSubscriptionStatus(subscription?.status);

  return (
    {
      active: 70,
      trialing: 65,
      past_due: 60,
      unpaid: 55,
      incomplete: 50,
      paused: 45,
      canceled: 20,
      cancelled: 20,
      incomplete_expired: 10,
    }[status] || 0
  );
}

function getSubscriptionRelevanceScore(subscription, { accountId = "", targetSubscriptionId = "" } = {}) {
  const metadata = getAccountStripeLookupMetadata(subscription);
  let score = getSubscriptionPriority(subscription);

  if (accountId && metadata.accountId === accountId) {
    score += 1000;
  }

  if (targetSubscriptionId && normalizeString(subscription?.id) === targetSubscriptionId) {
    score += 250;
  }

  if (subscription?.cancel_at_period_end === true) {
    score += 25;
  }

  return score;
}

function sortSubscriptionsByRelevance(left, right, context = {}) {
  const priorityDifference =
    getSubscriptionRelevanceScore(right, context) - getSubscriptionRelevanceScore(left, context);

  if (priorityDifference !== 0) {
    return priorityDifference;
  }

  const rightPeriodEnd = Number(right?.current_period_end || 0);
  const leftPeriodEnd = Number(left?.current_period_end || 0);

  if (rightPeriodEnd !== leftPeriodEnd) {
    return rightPeriodEnd - leftPeriodEnd;
  }

  return Number(right?.created || 0) - Number(left?.created || 0);
}

function summarizeStripeSubscriptionCandidate(subscription, context = {}) {
  const metadata = getAccountStripeLookupMetadata(subscription);

  return {
    id: normalizeString(subscription?.id),
    status: normalizeString(subscription?.status),
    cancelAtPeriodEnd: subscription?.cancel_at_period_end === true,
    cancelAt: normalizeUnixTimestampToIso(subscription?.cancel_at),
    canceledAt: normalizeUnixTimestampToIso(subscription?.canceled_at),
    currentPeriodEnd: normalizeUnixTimestampToIso(subscription?.current_period_end),
    currentPeriodStart: normalizeUnixTimestampToIso(subscription?.current_period_start),
    endedAt: normalizeUnixTimestampToIso(subscription?.ended_at),
    schedule: normalizeString(subscription?.schedule),
    customer: normalizeString(subscription?.customer),
    metadataAccountId: metadata.accountId,
    metadataHubId: metadata.hubId,
    metadataHubSlug: metadata.hubSlug,
    relevanceScore: getSubscriptionRelevanceScore(subscription, context),
  };
}

function shouldLogSubscriptionRefreshInspection({
  candidates = [],
  account = {},
  selectedSubscription = null,
  subscriptionChanged = false,
} = {}) {
  if (subscriptionChanged) {
    return true;
  }

  if ((candidates || []).length > 1) {
    return true;
  }

  const selectedMetadata = getAccountStripeLookupMetadata(selectedSubscription);

  if (
    normalizeString(selectedMetadata.accountId) !== normalizeString(account?.id) &&
    normalizeString(account?.id)
  ) {
    return true;
  }

  return false;
}

function getAccountStripeLookupMetadata(record = {}) {
  return {
    accountId: normalizeString(record?.metadata?.accountId),
    hubId: normalizeString(record?.metadata?.hubId),
    hubSlug: normalizeString(record?.metadata?.hubSlug),
  };
}

async function getStripeEventRef(eventId) {
  return getFirebaseAdminDb().collection(STRIPE_EVENT_COLLECTION).doc(eventId);
}

async function getStripeEventSnapshot(eventId) {
  const normalizedEventId = normalizeString(eventId);

  if (!normalizedEventId) {
    return null;
  }

  const doc = await (await getStripeEventRef(normalizedEventId)).get();

  if (!doc.exists) {
    return null;
  }

  return {
    id: doc.id,
    ...doc.data(),
  };
}

export async function hasProcessedStripeEvent(eventId) {
  const snapshot = await getStripeEventSnapshot(eventId);
  return normalizeString(snapshot?.status).toLowerCase() === "processed";
}

export async function claimStripeEventProcessing(event) {
  const eventId = normalizeString(event?.id);

  if (!eventId) {
    return {
      claimed: false,
      reason: "invalid_event",
    };
  }

  const ref = await getStripeEventRef(eventId);
  const now = new Date().toISOString();
  let result = {
    claimed: false,
    status: "",
  };

  await getFirebaseAdminDb().runTransaction(async (transaction) => {
    const doc = await transaction.get(ref);

    if (!doc.exists) {
      transaction.create(ref, {
        eventId,
        type: normalizeString(event?.type),
        livemode: event?.livemode === true,
        status: "processing",
        firstReceivedAt: now,
        lastReceivedAt: now,
        attemptCount: 1,
      });
      result = {
        claimed: true,
        status: "processing",
      };
      return;
    }

    const existing = doc.data() || {};
    const existingStatus = normalizeString(existing.status).toLowerCase();
    const nextAttemptCount = Number(existing.attemptCount || 0) + 1;

    if (existingStatus === "processed" || existingStatus === "processing") {
      transaction.set(
        ref,
        {
          lastReceivedAt: now,
          duplicateCount: Number(existing.duplicateCount || 0) + 1,
        },
        { merge: true }
      );
      result = {
        claimed: false,
        status: existingStatus || "duplicate",
      };
      return;
    }

    transaction.set(
      ref,
      {
        type: normalizeString(event?.type),
        livemode: event?.livemode === true,
        status: "processing",
        lastReceivedAt: now,
        lastRetryAt: now,
        attemptCount: nextAttemptCount,
        lastError: "",
        errorAt: "",
      },
      { merge: true }
    );
    result = {
      claimed: true,
      status: "processing",
    };
  });

  return result;
}

export async function markStripeEventProcessed(event, metadata = {}) {
  const eventId = normalizeString(event?.id);

  if (!eventId) {
    return;
  }

  const ref = await getStripeEventRef(eventId);

  await ref.set({
    eventId,
    type: normalizeString(event?.type),
    livemode: event?.livemode === true,
    status: "processed",
    processedAt: new Date().toISOString(),
    ...metadata,
  });
}

export async function markStripeEventFailed(event, metadata = {}) {
  const eventId = normalizeString(event?.id);

  if (!eventId) {
    return;
  }

  const ref = await getStripeEventRef(eventId);

  await ref.set(
    {
      eventId,
      type: normalizeString(event?.type),
      livemode: event?.livemode === true,
      status: "failed",
      errorAt: new Date().toISOString(),
      ...metadata,
    },
    { merge: true }
  );
}

async function appendCommercialBillingAuditEvent(accountId, values = {}) {
  if (!normalizeString(accountId)) {
    return null;
  }

  try {
    return await appendCommercialAccountAuditEvent(accountId, values);
  } catch {
    return null;
  }
}

export async function resolveCommercialAccountFromStripeObject(record = {}) {
  const metadata = getAccountStripeLookupMetadata(record);
  const customerId = normalizeString(record?.customer);
  const subscriptionId = normalizeString(record?.id && record.object === "subscription" ? record.id : record?.subscription);

  return (
    (metadata.accountId ? await getCommercialAccountById(metadata.accountId) : null) ||
    (subscriptionId ? await getCommercialAccountByStripeSubscriptionId(subscriptionId) : null) ||
    (customerId ? await getCommercialAccountByStripeCustomerId(customerId) : null) ||
    null
  );
}

export async function createOrResolveStripeCustomer({ account, currentHub }) {
  const stripe = getStripeServerClient();
  const ownerEmail = normalizeEmail(account?.ownerEmail);
  const ownerName = normalizeString(account?.ownerFullName);

  if (!account?.id || !ownerEmail) {
    throw new Error("Commercial account context is required for Stripe customer sync.");
  }

  let customer = null;

  if (account.stripeCustomerId) {
    try {
      customer = await stripe.customers.retrieve(account.stripeCustomerId);
      if (customer?.deleted) {
        customer = null;
      }
    } catch {
      customer = null;
    }
  }

  const customerPayload = {
    email: ownerEmail,
    name: ownerName || undefined,
    metadata: {
      accountId: account.id,
      hubId: normalizeString(currentHub?.id),
      hubSlug: normalizeString(currentHub?.slug),
      ownerEmail,
    },
  };

  if (customer) {
    customer = await stripe.customers.update(customer.id, customerPayload);
  } else {
    customer = await stripe.customers.create(customerPayload);
  }

  return updateCommercialAccountStripeCustomer(account.id, {
    stripeCustomerId: customer.id,
    stripeBillingEmail: customer.email || ownerEmail,
  });
}

export async function getLatestCommercialCheckoutState({ account } = {}) {
  const stripeEnvironment = getStripeBillingEnvironmentState();
  const checkoutSessionId = normalizeString(account?.stripeLastCheckoutSessionId);

  if (!stripeEnvironment.configuredForCheckout || !checkoutSessionId) {
    return null;
  }

  try {
    const stripe = getStripeServerClient();
    const session = await stripe.checkout.sessions.retrieve(checkoutSessionId);

    return {
      id: normalizeString(session?.id),
      status: normalizeString(session?.status).toLowerCase(),
      paymentStatus: normalizeString(session?.payment_status).toLowerCase(),
      customerId: normalizeString(session?.customer),
      subscriptionId: normalizeString(session?.subscription),
      url: normalizeString(session?.url),
    };
  } catch {
    return null;
  }
}

export async function refreshCommercialAccountSubscriptionState(account) {
  const stripeEnvironment = getStripeBillingEnvironmentState();
  const subscriptionId = normalizeString(account?.stripeSubscriptionId);
  const customerId = normalizeString(account?.stripeCustomerId);
  const accountId = normalizeString(account?.id);

  if (!stripeEnvironment.configuredForCheckout || (!subscriptionId && !customerId)) {
    return account;
  }

  try {
    const stripe = getStripeServerClient();
    const candidates = [];

    if (subscriptionId) {
      try {
        const retrievedSubscription = await stripe.subscriptions.retrieve(subscriptionId);

        if (retrievedSubscription && !retrievedSubscription.deleted) {
          candidates.push(retrievedSubscription);
        }
      } catch {
        // fall through to customer-level subscription resolution
      }
    }

    if (customerId) {
      const subscriptionList = await stripe.subscriptions.list({
        customer: customerId,
        status: "all",
        limit: 20,
      });

      for (const item of subscriptionList.data || []) {
        if (!candidates.find((candidate) => normalizeString(candidate?.id) === normalizeString(item?.id))) {
          candidates.push(item);
        }
      }
    }

    const selectionContext = {
      accountId,
      targetSubscriptionId: subscriptionId,
    };
    const subscription = [...candidates].sort((left, right) =>
      sortSubscriptionsByRelevance(left, right, {
        accountId,
        targetSubscriptionId: subscriptionId,
      })
    )[0];

    if (!subscription) {
      return account;
    }

    const priceId = getPrimarySubscriptionPriceId(subscription);
    const priceSelection = getPackageTierAndCurrencyForStripePriceId(priceId);
    let scheduledPackageEffectiveAt = getScheduledPackageEffectiveAt({
      account,
      currentTier: priceSelection.tier || "",
    });

    if (!scheduledPackageEffectiveAt && normalizeString(account?.pendingPackageStatus).toLowerCase() === "scheduled_downgrade") {
      const scheduleId = normalizeString(subscription?.schedule) || normalizeString(account?.stripeSubscriptionScheduleId);

      if (scheduleId) {
        try {
          const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId);
          scheduledPackageEffectiveAt = normalizeUnixTimestampToIso(
            schedule?.current_phase?.end_date || schedule?.phases?.[0]?.end_date
          );
        } catch {
          scheduledPackageEffectiveAt = "";
        }
      }
    }

    const nextStripeSubscriptionId = normalizeString(subscription?.id);
    const nextStripeStatus = normalizeString(subscription?.status);
    const nextCancelAt = normalizeUnixTimestampToIso(subscription?.cancel_at);
    const nextCancelAtPeriodEnd = subscription?.cancel_at_period_end === true;
    const renewalDateResolution = await resolveStripeSubscriptionRenewalDateDetails({
      stripe,
      subscription,
      customerId,
      scheduledPackageEffectiveAt,
    });
    const nextCurrentPeriodEnd = normalizeString(renewalDateResolution?.date);
    const refreshedAccount = await updateCommercialAccountStripeSubscription(account.id, {
      stripeCustomerId: normalizeString(subscription?.customer) || customerId,
      stripeSubscriptionId: nextStripeSubscriptionId,
      stripePriceId: priceId || normalizeString(account?.stripePriceId),
      packageCurrency: priceSelection.currency || normalizeString(account?.packageCurrency),
      stripeSubscriptionStatus: nextStripeStatus,
      stripeCancelAt: nextCancelAt,
      stripeCurrentPeriodEnd: nextCurrentPeriodEnd,
      stripeCancelAtPeriodEnd: nextCancelAtPeriodEnd,
      stripeBillingEmail: normalizeString(account?.stripeBillingEmail || account?.ownerEmail),
      stripeLastCheckoutSessionId: normalizeString(account?.stripeLastCheckoutSessionId),
      stripeLastEventId: normalizeString(account?.stripeLastEventId),
      stripeLastEventType: normalizeString(account?.stripeLastEventType),
      stripeLastSyncedAt: new Date().toISOString(),
    });

    if (
      normalizeString(account?.pendingPackageStatus).toLowerCase() === "scheduled_downgrade" &&
      scheduledPackageEffectiveAt &&
      scheduledPackageEffectiveAt !== normalizeString(account?.pendingPackageEffectiveAt)
    ) {
      await updateCommercialAccountPackageIntent(account.id, {
        pendingPackageTier: normalizeString(account?.pendingPackageTier),
        pendingPackageCurrency: normalizeString(account?.pendingPackageCurrency),
        pendingPackageStatus: normalizeString(account?.pendingPackageStatus),
        pendingPackageEffectiveAt: scheduledPackageEffectiveAt,
        pendingPackageUpdatedAt: normalizeString(account?.pendingPackageUpdatedAt),
      });
    }

    const subscriptionChanged =
      nextStripeSubscriptionId !== normalizeString(account?.stripeSubscriptionId) ||
      nextStripeStatus !== normalizeString(account?.stripeSubscriptionStatus) ||
      nextCancelAt !== normalizeString(account?.stripeCancelAt) ||
      nextCancelAtPeriodEnd !== (account?.stripeCancelAtPeriodEnd === true) ||
      nextCurrentPeriodEnd !== normalizeString(account?.stripeCurrentPeriodEnd);

    if (
      shouldLogSubscriptionRefreshInspection({
        candidates,
        account,
        selectedSubscription: subscription,
        subscriptionChanged,
      }) ||
      process.env.NODE_ENV !== "production"
    ) {
      await appendCommercialBillingAuditEvent(account.id, {
        type: subscriptionChanged
          ? "billing.subscription_refresh_resolved"
          : "billing.subscription_refresh_inspected",
        title: "Live billing state refreshed",
        summary: `Stripe refresh resolved ${nextStripeSubscriptionId || "no subscription"} for this account.`,
        metadata: {
          previousSubscriptionId: normalizeString(account?.stripeSubscriptionId),
          previousSubscriptionStatus: normalizeString(account?.stripeSubscriptionStatus),
          previousCancelAt: normalizeString(account?.stripeCancelAt),
          previousCancelAtPeriodEnd: account?.stripeCancelAtPeriodEnd === true,
          previousCurrentPeriodEnd: normalizeString(account?.stripeCurrentPeriodEnd),
          selectedSubscriptionId: nextStripeSubscriptionId,
          selectedSubscriptionStatus: nextStripeStatus,
          selectedCancelAt: nextCancelAt,
          selectedCancelAtPeriodEnd: nextCancelAtPeriodEnd,
          selectedCurrentPeriodEnd: nextCurrentPeriodEnd,
          selectedRenewalDateSource: normalizeString(renewalDateResolution?.source),
          renewalDateResolution: renewalDateResolution,
          selectedRawStripeFields: {
            id: normalizeString(subscription?.id),
            status: normalizeString(subscription?.status),
            cancelAtPeriodEnd: subscription?.cancel_at_period_end === true,
            cancelAt: normalizeUnixTimestampToIso(subscription?.cancel_at),
            canceledAt: normalizeUnixTimestampToIso(subscription?.canceled_at),
            currentPeriodEnd: normalizeUnixTimestampToIso(subscription?.current_period_end),
            currentPeriodStart: normalizeUnixTimestampToIso(subscription?.current_period_start),
            itemCurrentPeriodEnd: normalizeUnixTimestampToIso(subscription?.items?.data?.[0]?.current_period_end),
            itemCurrentPeriodStart: normalizeUnixTimestampToIso(subscription?.items?.data?.[0]?.current_period_start),
            endedAt: normalizeUnixTimestampToIso(subscription?.ended_at),
            schedule: normalizeString(subscription?.schedule),
            customer: normalizeString(subscription?.customer),
            invoicePreviewError: normalizeString(renewalDateResolution?.invoicePreviewError),
            metadata: {
              accountId: getAccountStripeLookupMetadata(subscription).accountId,
              hubId: getAccountStripeLookupMetadata(subscription).hubId,
              hubSlug: getAccountStripeLookupMetadata(subscription).hubSlug,
            },
          },
          candidateCount: candidates.length,
          candidates: candidates.slice(0, 5).map((candidate) =>
            summarizeStripeSubscriptionCandidate(candidate, selectionContext)
          ),
        },
      });
    }

    return refreshedAccount;
  } catch {
    return account;
  }
}

export async function createStripeCheckoutForPackageChange({
  account,
  currentHub,
  targetTier,
  successPath = "/account/billing?checkout=success",
  cancelPath = "",
}) {
  const normalizedTargetTier = normalizeString(targetTier).toLowerCase();
  const stripeEnvironment = getStripeBillingEnvironmentState();
  const existingStripeStatus = normalizeStripeSubscriptionStatus(account?.stripeSubscriptionStatus);

  if (!currentHub?.id) {
    throw new Error("The current hub context is required before starting package billing.");
  }

  if (!stripeEnvironment.configuredForCheckout) {
    throw new Error(`Stripe checkout is not configured yet. Missing: ${stripeEnvironment.missingCheckout.join(", ")}`);
  }

  if (!isPaidPackageTier(normalizedTargetTier)) {
    throw new Error("Only paid packages can be purchased through Stripe checkout.");
  }

  if (normalizedTargetTier === normalizeString(currentHub?.packageTier).toLowerCase()) {
    throw new Error("This package is already active for the current hub.");
  }

  if (
    normalizeString(account?.stripeSubscriptionId) &&
    ["trialing", "active", "past_due", "unpaid", "incomplete", "paused"].includes(existingStripeStatus)
  ) {
    throw new Error("Use the billing portal to manage changes for an existing Stripe subscription.");
  }

  const selectedBillingCurrency = resolvePackageCheckoutCurrency({
    account,
    currentHub,
    checkoutRegion: resolveCheckoutRegionalContext(currentHub),
    targetTier: normalizedTargetTier,
  });
  const priceSelection = resolveStripePriceSelection({
    tier: normalizedTargetTier,
    country: currentHub?.country,
    currency: selectedBillingCurrency,
  });
  const priceId = priceSelection.priceId;

  if (!priceId) {
    throw new Error(`The selected package is not mapped to a Stripe price for ${priceSelection.currency || selectedBillingCurrency || "the selected currency"} yet.`);
  }

  const stripe = getStripeServerClient();
  await assertStripePriceMatchesSelection({
    tier: normalizedTargetTier,
    currency: priceSelection.currency,
    priceId,
  });
  const checkoutRegion = resolveCheckoutRegionalContext(currentHub);
  const syncedAccount = await createOrResolveStripeCustomer({ account, currentHub });
  const resolvedCancelPath =
    normalizeString(cancelPath) || `/account/upgrade?tier=${encodeURIComponent(normalizedTargetTier)}&state=checkout-cancelled`;
  const successUrl = buildReturnUrl(successPath);
  const cancelUrl = buildReturnUrl(resolvedCancelPath);
  const metadata = {
    accountId: syncedAccount.id,
    hubId: normalizeString(currentHub?.id),
    hubSlug: normalizeString(currentHub?.slug),
    currentTier: normalizeString(currentHub?.packageTier).toLowerCase(),
    targetTier: normalizedTargetTier,
    ownerEmail: normalizeEmail(syncedAccount.ownerEmail),
    country: checkoutRegion.country,
    locale: checkoutRegion.locale,
    defaultCurrency: checkoutRegion.defaultCurrency,
    packageCurrency: priceSelection.currency,
  };

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: syncedAccount.stripeCustomerId,
    client_reference_id: syncedAccount.id,
    currency: priceSelection.currency.toLowerCase(),
    locale: checkoutRegion.locale,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    metadata,
    subscription_data: {
      metadata,
    },
  });

  await updateCommercialAccountStripeSubscription(syncedAccount.id, {
    stripeCustomerId: syncedAccount.stripeCustomerId,
    stripeBillingEmail: syncedAccount.ownerEmail,
    stripeLastCheckoutSessionId: session.id,
    packageCurrency: priceSelection.currency,
  });

  await updateCommercialAccountPackageIntent(syncedAccount.id, {
    pendingPackageTier: normalizedTargetTier,
    pendingPackageCurrency: priceSelection.currency,
    pendingPackageStatus: "checkout_pending",
    pendingPackageEffectiveAt: "",
  });

  await appendCommercialBillingAuditEvent(syncedAccount.id, {
    type: "billing.checkout_started",
    title: "Secure checkout started",
    summary: `${normalizedTargetTier} checkout was started for this workspace.`,
    metadata: {
      targetTier: normalizedTargetTier,
      checkoutSessionId: normalizeString(session.id),
      stripeCustomerId: normalizeString(syncedAccount.stripeCustomerId),
      currentTier: normalizeString(currentHub?.packageTier).toLowerCase(),
      packageCurrency: priceSelection.currency,
    },
  });

  return session;
}

export async function createStripeBillingPortalForAccount({ account, currentHub, returnPath = "/account/billing?state=portal-returned" }) {
  const stripeEnvironment = getStripeBillingEnvironmentState();

  if (!stripeEnvironment.configuredForCheckout) {
    throw new Error(`Stripe billing is not configured yet. Missing: ${stripeEnvironment.missingCheckout.join(", ")}`);
  }

  if (!normalizeString(account?.stripeCustomerId)) {
    throw new Error("No Stripe customer exists for this commercial account yet.");
  }

  const stripe = getStripeServerClient();
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: account.stripeCustomerId,
    return_url: buildReturnUrl(returnPath),
    ...(stripeEnvironment.billingPortalConfigurationId
      ? { configuration: stripeEnvironment.billingPortalConfigurationId }
      : {}),
  });

  return portalSession;
}

export async function updateStripeSubscriptionForPackageChange({
  account,
  currentHub,
  targetTier,
}) {
  const normalizedTargetTier = normalizeString(targetTier).toLowerCase();
  const stripeEnvironment = getStripeBillingEnvironmentState();
  const existingStripeStatus = normalizeStripeSubscriptionStatus(account?.stripeSubscriptionStatus);

  if (!currentHub?.id) {
    throw new Error("The current hub context is required before changing package billing.");
  }

  if (!stripeEnvironment.configuredForCheckout) {
    throw new Error(`Stripe billing is not configured yet. Missing: ${stripeEnvironment.missingCheckout.join(", ")}`);
  }

  if (!isPaidPackageTier(normalizedTargetTier)) {
    throw new Error("Only paid packages can be selected here.");
  }

  if (normalizedTargetTier === normalizeString(currentHub?.packageTier).toLowerCase()) {
    throw new Error("This package is already active for the current hub.");
  }

  if (
    !normalizeString(account?.stripeSubscriptionId) ||
    !["trialing", "active", "past_due", "unpaid", "incomplete", "paused"].includes(existingStripeStatus)
  ) {
    throw new Error("No live Stripe subscription exists for this workspace yet.");
  }

  const selectedBillingCurrency = productSiteBillingCurrency;
  const priceSelection = resolveStripePriceSelection({
    tier: normalizedTargetTier,
    currency: selectedBillingCurrency,
  });
  const priceId = priceSelection.priceId;

  if (!priceId) {
    throw new Error(`The selected package is not mapped to a Stripe price for ${priceSelection.currency || selectedBillingCurrency || "the selected currency"} yet.`);
  }

  const stripe = getStripeServerClient();
  await assertStripePriceMatchesSelection({
    tier: normalizedTargetTier,
    currency: priceSelection.currency,
    priceId,
  });
  const subscription = await stripe.subscriptions.retrieve(normalizeString(account?.stripeSubscriptionId));
  const subscriptionItemId = normalizeString(subscription?.items?.data?.[0]?.id);

  if (!subscriptionItemId) {
    throw new Error("The current Stripe subscription does not contain a changeable subscription item.");
  }

  await updateCommercialAccountPackageIntent(account.id, {
    pendingPackageTier: normalizedTargetTier,
    pendingPackageCurrency: priceSelection.currency,
    pendingPackageStatus: "subscription_update_pending",
    pendingPackageEffectiveAt: "",
  });

  await appendCommercialBillingAuditEvent(account.id, {
    type: "billing.subscription_change_started",
    title: "Package change started",
    summary: `${normalizedTargetTier} upgrade was started for this workspace.`,
    metadata: {
      currentTier: normalizeString(currentHub?.packageTier).toLowerCase(),
      targetTier: normalizedTargetTier,
      stripeSubscriptionId: normalizeString(subscription?.id),
      stripeCustomerId: normalizeString(subscription?.customer),
      stripeSubscriptionItemId: subscriptionItemId,
      packageCurrency: priceSelection.currency,
    },
  });

  const updatedSubscription = await stripe.subscriptions.update(normalizeString(subscription?.id), {
    items: [
      {
        id: subscriptionItemId,
        price: priceId,
      },
    ],
    proration_behavior: "always_invoice",
    payment_behavior: "allow_incomplete",
    metadata: {
      ...subscription.metadata,
      accountId: account.id,
      hubId: normalizeString(currentHub?.id),
      hubSlug: normalizeString(currentHub?.slug),
      currentTier: normalizeString(currentHub?.packageTier).toLowerCase(),
      targetTier: normalizedTargetTier,
      ownerEmail: normalizeEmail(account?.ownerEmail),
    },
  });

  await syncAccountFromStripeSubscription({
    account,
    subscription: updatedSubscription,
  });

  await appendCommercialBillingAuditEvent(account.id, {
    type: "billing.subscription_change_completed",
    title: "Package change applied",
    summary: `${normalizedTargetTier} upgrade was applied to the active Stripe subscription.`,
    metadata: {
      currentTier: normalizeString(currentHub?.packageTier).toLowerCase(),
      targetTier: normalizedTargetTier,
      stripeSubscriptionId: normalizeString(updatedSubscription?.id),
      stripeCustomerId: normalizeString(updatedSubscription?.customer),
      stripePriceId: getPrimarySubscriptionPriceId(updatedSubscription),
      packageCurrency: priceSelection.currency,
      stripeStatus: normalizeString(updatedSubscription?.status),
    },
  });

  return updatedSubscription;
}

export async function scheduleStripeSubscriptionCancellation({
  account,
  currentHub,
}) {
  const stripeEnvironment = getStripeBillingEnvironmentState();
  const existingStripeStatus = normalizeStripeSubscriptionStatus(account?.stripeSubscriptionStatus);

  if (!currentHub?.id) {
    throw new Error("The current hub context is required before changing package billing.");
  }

  if (!stripeEnvironment.configuredForCheckout) {
    throw new Error(`Stripe billing is not configured yet. Missing: ${stripeEnvironment.missingCheckout.join(", ")}`);
  }

  if (
    !normalizeString(account?.stripeSubscriptionId) ||
    !["trialing", "active", "past_due", "unpaid", "incomplete", "paused"].includes(existingStripeStatus)
  ) {
    throw new Error("No live Stripe subscription exists for this workspace yet.");
  }

  if (normalizeString(currentHub?.packageTier).toLowerCase() === "free") {
    throw new Error("This workspace is already on the free package.");
  }

  const stripe = getStripeServerClient();
  const subscription = await stripe.subscriptions.retrieve(normalizeString(account?.stripeSubscriptionId));

  await appendCommercialBillingAuditEvent(account.id, {
    type: "billing.subscription_cancellation_started",
    title: "Move to Free started",
    summary: "This workspace started the move back to the Free package.",
    metadata: {
      currentTier: normalizeString(currentHub?.packageTier).toLowerCase(),
      targetTier: "free",
      stripeSubscriptionId: normalizeString(subscription?.id),
      stripeCustomerId: normalizeString(subscription?.customer),
    },
  });

  const updatedSubscription = await stripe.subscriptions.update(normalizeString(subscription?.id), {
    cancel_at_period_end: true,
    metadata: {
      ...subscription.metadata,
      accountId: account.id,
      hubId: normalizeString(currentHub?.id),
      hubSlug: normalizeString(currentHub?.slug),
      currentTier: normalizeString(currentHub?.packageTier).toLowerCase(),
      targetTier: "free",
      ownerEmail: normalizeEmail(account?.ownerEmail),
    },
  });

  await syncAccountFromStripeSubscription({
    account,
    subscription: updatedSubscription,
  });

  await appendCommercialBillingAuditEvent(account.id, {
    type: "billing.subscription_cancellation_scheduled",
    title: "Move to Free scheduled",
    summary: "This workspace will move to the Free package at the end of the current billing period.",
    metadata: {
      currentTier: normalizeString(currentHub?.packageTier).toLowerCase(),
      targetTier: "free",
      stripeSubscriptionId: normalizeString(updatedSubscription?.id),
      stripeCustomerId: normalizeString(updatedSubscription?.customer),
      stripeStatus: normalizeString(updatedSubscription?.status),
      stripeCancelAt: normalizeUnixTimestampToIso(updatedSubscription?.cancel_at),
      stripeCurrentPeriodEnd: normalizeUnixTimestampToIso(updatedSubscription?.current_period_end),
      stripeCancelAtPeriodEnd: updatedSubscription?.cancel_at_period_end === true,
    },
  });

  return updatedSubscription;
}

export async function scheduleStripeSubscriptionPackageDowngrade({
  account,
  currentHub,
  targetTier,
}) {
  const normalizedTargetTier = normalizeString(targetTier).toLowerCase();
  const stripeEnvironment = getStripeBillingEnvironmentState();
  const existingStripeStatus = normalizeStripeSubscriptionStatus(account?.stripeSubscriptionStatus);

  if (!currentHub?.id) {
    throw new Error("The current hub context is required before changing package billing.");
  }

  if (!stripeEnvironment.configuredForCheckout) {
    throw new Error(`Stripe billing is not configured yet. Missing: ${stripeEnvironment.missingCheckout.join(", ")}`);
  }

  if (!isPaidPackageTier(normalizedTargetTier)) {
    throw new Error("Only paid packages can be scheduled here.");
  }

  if (
    !normalizeString(account?.stripeSubscriptionId) ||
    !["trialing", "active", "past_due", "unpaid", "incomplete", "paused"].includes(existingStripeStatus)
  ) {
    throw new Error("No live Stripe subscription exists for this workspace yet.");
  }

  const currentSubscriptionCurrency = productSiteBillingCurrency;
  const priceSelection = resolveStripePriceSelection({
    tier: normalizedTargetTier,
    currency: currentSubscriptionCurrency,
  });
  const priceId = priceSelection.priceId;

  if (!priceId) {
    throw new Error(`The selected package is not mapped to a Stripe price for ${priceSelection.currency || currentSubscriptionCurrency || "the selected currency"} yet.`);
  }

  const stripe = getStripeServerClient();
  const subscription = await stripe.subscriptions.retrieve(normalizeString(account?.stripeSubscriptionId));
  const currentItem = getPrimarySubscriptionItem(subscription);
  const currentPriceId = getPrimarySubscriptionPriceId(subscription);
  const currentQuantity = Number(currentItem?.quantity || 1);
  const fallbackCurrentPeriodStart = Number(subscription?.current_period_start || 0);
  const fallbackCurrentPeriodEnd = Number(subscription?.current_period_end || 0);

  if (!currentPriceId) {
    throw new Error("The current Stripe subscription is missing price details needed to schedule this change.");
  }

  let scheduleId = normalizeString(subscription?.schedule) || normalizeString(account?.stripeSubscriptionScheduleId);
  let workingSchedule = null;

  if (!scheduleId) {
    const createdSchedule = await stripe.subscriptionSchedules.create({
      from_subscription: normalizeString(subscription?.id),
    });
    scheduleId = normalizeString(createdSchedule?.id);
    workingSchedule = createdSchedule;
  }

  if (!scheduleId) {
    throw new Error("A Stripe subscription schedule could not be created for this workspace.");
  }

  if (!workingSchedule) {
    workingSchedule = await stripe.subscriptionSchedules.retrieve(scheduleId);
  }

  const currentPhase = workingSchedule?.current_phase || workingSchedule?.phases?.[0] || null;
  const currentPeriodStart = Number(currentPhase?.start_date || fallbackCurrentPeriodStart || 0);
  const currentPeriodEnd = Number(currentPhase?.end_date || fallbackCurrentPeriodEnd || 0);

  if (!currentPeriodStart || !currentPeriodEnd) {
    throw new Error("The current Stripe subscription schedule is missing billing-period dates needed to schedule this change.");
  }

  await appendCommercialBillingAuditEvent(account.id, {
    type: "billing.subscription_downgrade_started",
    title: "Package downgrade started",
    summary: `${normalizedTargetTier} was scheduled for this workspace at the end of the current billing period.`,
    metadata: {
      currentTier: normalizeString(currentHub?.packageTier).toLowerCase(),
      targetTier: normalizedTargetTier,
      stripeSubscriptionId: normalizeString(subscription?.id),
      stripeScheduleId: scheduleId,
      stripeCustomerId: normalizeString(subscription?.customer),
    },
  });

  const updatedSchedule = await stripe.subscriptionSchedules.update(scheduleId, {
    end_behavior: "release",
    phases: [
      {
        start_date: currentPeriodStart,
        end_date: currentPeriodEnd,
        items: [
          {
            price: currentPriceId,
            quantity: currentQuantity,
          },
        ],
        proration_behavior: "none",
        metadata: {
          accountId: account.id,
          hubId: normalizeString(currentHub?.id),
          hubSlug: normalizeString(currentHub?.slug),
          currentTier: normalizeString(currentHub?.packageTier).toLowerCase(),
          targetTier: normalizedTargetTier,
          ownerEmail: normalizeEmail(account?.ownerEmail),
        },
      },
      {
        start_date: currentPeriodEnd,
        items: [
          {
            price: priceId,
            quantity: currentQuantity,
          },
        ],
        proration_behavior: "none",
        metadata: {
          accountId: account.id,
          hubId: normalizeString(currentHub?.id),
          hubSlug: normalizeString(currentHub?.slug),
          currentTier: normalizeString(currentHub?.packageTier).toLowerCase(),
          targetTier: normalizedTargetTier,
          ownerEmail: normalizeEmail(account?.ownerEmail),
        },
      },
    ],
  });

  await updateCommercialAccountStripeSubscription(account.id, {
    stripeCustomerId: normalizeString(subscription?.customer),
    stripeSubscriptionId: normalizeString(subscription?.id),
    stripeSubscriptionScheduleId: normalizeString(updatedSchedule?.id),
    stripePriceId: currentPriceId,
    packageCurrency: getPackageCurrencyForStripePriceId(currentPriceId) || normalizeString(account?.packageCurrency),
    stripeSubscriptionStatus: normalizeString(subscription?.status),
    stripeCancelAt: normalizeUnixTimestampToIso(subscription?.cancel_at),
    stripeCurrentPeriodEnd: normalizeUnixTimestampToIso(subscription?.current_period_end),
    stripeCancelAtPeriodEnd: subscription?.cancel_at_period_end === true,
    stripeBillingEmail: account.stripeBillingEmail || account.ownerEmail,
    stripeLastEventId: normalizeString(account?.stripeLastEventId),
    stripeLastEventType: normalizeString(account?.stripeLastEventType),
  });

  await updateCommercialAccountPackageIntent(account.id, {
    pendingPackageTier: normalizedTargetTier,
    pendingPackageCurrency: priceSelection.currency,
    pendingPackageStatus: "scheduled_downgrade",
    pendingPackageEffectiveAt: normalizeUnixTimestampToIso(currentPeriodEnd),
  });

  await appendCommercialBillingAuditEvent(account.id, {
    type: "billing.subscription_downgrade_scheduled",
    title: "Package downgrade scheduled",
    summary: `${normalizedTargetTier} will replace the current paid package when the billing period ends.`,
    metadata: {
      currentTier: normalizeString(currentHub?.packageTier).toLowerCase(),
      targetTier: normalizedTargetTier,
      stripeSubscriptionId: normalizeString(subscription?.id),
      stripeScheduleId: normalizeString(updatedSchedule?.id),
      stripeCustomerId: normalizeString(subscription?.customer),
      stripeCurrentPeriodEnd: normalizeUnixTimestampToIso(subscription?.current_period_end),
      packageCurrency: priceSelection.currency,
    },
  });

  return updatedSchedule;
}

export async function cancelScheduledStripePackageChange({
  account,
  currentHub,
}) {
  const stripeEnvironment = getStripeBillingEnvironmentState();
  const existingStripeStatus = normalizeStripeSubscriptionStatus(account?.stripeSubscriptionStatus);
  const pendingStatus = normalizeString(account?.pendingPackageStatus).toLowerCase();
  const pendingTier = normalizeString(account?.pendingPackageTier).toLowerCase();
  const hasScheduledDowngrade = pendingStatus === "scheduled_downgrade" && Boolean(pendingTier);
  const hasScheduledCancellation =
    !hasScheduledDowngrade &&
    (account?.stripeCancelAtPeriodEnd === true || Boolean(normalizeString(account?.stripeCancelAt)));

  if (!currentHub?.id) {
    throw new Error("The current hub context is required before changing package billing.");
  }

  if (!stripeEnvironment.configuredForCheckout) {
    throw new Error(`Stripe billing is not configured yet. Missing: ${stripeEnvironment.missingCheckout.join(", ")}`);
  }

  if (
    !normalizeString(account?.stripeSubscriptionId) ||
    !["trialing", "active", "past_due", "unpaid", "incomplete", "paused"].includes(existingStripeStatus)
  ) {
    throw new Error("No live Stripe subscription exists for this workspace yet.");
  }

  const stripe = getStripeServerClient();
  const subscription = await stripe.subscriptions.retrieve(normalizeString(account?.stripeSubscriptionId));

  if (hasScheduledDowngrade) {
    const scheduleId = normalizeString(subscription?.schedule) || normalizeString(account?.stripeSubscriptionScheduleId);

    if (!scheduleId) {
      throw new Error("No scheduled package change exists for this workspace.");
    }

    await appendCommercialBillingAuditEvent(account.id, {
      type: "billing.subscription_downgrade_cancellation_started",
      title: "Scheduled package change cancellation started",
      summary: `The scheduled move to ${pendingTier} is being removed for this workspace.`,
      metadata: {
        currentTier: normalizeString(currentHub?.packageTier).toLowerCase(),
        pendingTier,
        stripeSubscriptionId: normalizeString(subscription?.id),
        stripeScheduleId: scheduleId,
        stripeCustomerId: normalizeString(subscription?.customer),
      },
    });

    await stripe.subscriptionSchedules.release(scheduleId);
    const refreshedSubscription = await stripe.subscriptions.retrieve(normalizeString(subscription?.id));

    await updateCommercialAccountStripeSubscription(account.id, {
      stripeCustomerId: normalizeString(refreshedSubscription?.customer),
      stripeSubscriptionId: normalizeString(refreshedSubscription?.id),
      stripeSubscriptionScheduleId: "",
      stripePriceId: getPrimarySubscriptionPriceId(refreshedSubscription),
      packageCurrency: getPackageCurrencyForStripePriceId(getPrimarySubscriptionPriceId(refreshedSubscription)) || normalizeString(account?.packageCurrency),
      stripeSubscriptionStatus: normalizeString(refreshedSubscription?.status),
      stripeCancelAt: normalizeUnixTimestampToIso(refreshedSubscription?.cancel_at),
      stripeCurrentPeriodEnd: normalizeUnixTimestampToIso(refreshedSubscription?.current_period_end),
      stripeCancelAtPeriodEnd: refreshedSubscription?.cancel_at_period_end === true,
      stripeBillingEmail: account.stripeBillingEmail || account.ownerEmail,
      stripeLastEventId: normalizeString(account?.stripeLastEventId),
      stripeLastEventType: normalizeString(account?.stripeLastEventType),
    });

    await updateCommercialAccountPackageIntent(account.id, {
      pendingPackageTier: "",
      pendingPackageCurrency: "",
      pendingPackageStatus: "",
      pendingPackageEffectiveAt: "",
      pendingPackageUpdatedAt: "",
    });

    await appendCommercialBillingAuditEvent(account.id, {
      type: "billing.subscription_downgrade_cancelled",
      title: "Scheduled package change cancelled",
      summary: `The scheduled move to ${pendingTier} was cancelled for this workspace.`,
      metadata: {
        currentTier: normalizeString(currentHub?.packageTier).toLowerCase(),
        cancelledPendingTier: pendingTier,
        stripeSubscriptionId: normalizeString(refreshedSubscription?.id),
        stripeCustomerId: normalizeString(refreshedSubscription?.customer),
      },
    });

    return {
      mode: "scheduled_downgrade",
      subscription: refreshedSubscription,
    };
  }

  if (hasScheduledCancellation) {
    await appendCommercialBillingAuditEvent(account.id, {
      type: "billing.subscription_cancellation_reversal_started",
      title: "Scheduled move to Free cancellation started",
      summary: "The scheduled move to Free is being removed for this workspace.",
      metadata: {
        currentTier: normalizeString(currentHub?.packageTier).toLowerCase(),
        targetTier: "free",
        stripeSubscriptionId: normalizeString(subscription?.id),
        stripeCustomerId: normalizeString(subscription?.customer),
      },
    });

    const updatedSubscription = await stripe.subscriptions.update(normalizeString(subscription?.id), {
      cancel_at_period_end: false,
      metadata: {
        ...subscription.metadata,
        accountId: account.id,
        hubId: normalizeString(currentHub?.id),
        hubSlug: normalizeString(currentHub?.slug),
        currentTier: normalizeString(currentHub?.packageTier).toLowerCase(),
        targetTier: normalizeString(currentHub?.packageTier).toLowerCase(),
        ownerEmail: normalizeEmail(account?.ownerEmail),
      },
    });

    await syncAccountFromStripeSubscription({
      account,
      subscription: updatedSubscription,
    });

    await appendCommercialBillingAuditEvent(account.id, {
      type: "billing.subscription_cancellation_reversed",
      title: "Scheduled move to Free cancelled",
      summary: "The workspace will stay on the current paid package unless another change is made.",
      metadata: {
        currentTier: normalizeString(currentHub?.packageTier).toLowerCase(),
        stripeSubscriptionId: normalizeString(updatedSubscription?.id),
        stripeCustomerId: normalizeString(updatedSubscription?.customer),
        stripeStatus: normalizeString(updatedSubscription?.status),
      },
    });

    return {
      mode: "scheduled_cancellation",
      subscription: updatedSubscription,
    };
  }

  throw new Error("No scheduled package change exists for this workspace.");
}

async function syncAccountFromStripeSubscription({ account, subscription, event }) {
  const stripe = getStripeServerClient();
  const priceId = getPrimarySubscriptionPriceId(subscription);
  const priceSelection = getPackageTierAndCurrencyForStripePriceId(priceId);
  const packageTier =
    priceSelection.tier ||
    normalizeString(subscription?.metadata?.targetTier).toLowerCase() ||
    normalizeString(account?.stripePriceId && getPackageTierForStripePriceId(account.stripePriceId)).toLowerCase() ||
    "starter";
  const packageStatus = mapStripeSubscriptionStatusToPackageStatus(subscription?.status);
  const { pendingPackage, pendingStatus } = getCommercialPackageIntent({
    account,
    currentTier: normalizeString(account?.stripePriceId && getPackageTierForStripePriceId(account.stripePriceId)).toLowerCase() || "free",
  });
  let scheduledPackageEffectiveAt = getScheduledPackageEffectiveAt({
    account,
    currentTier: packageTier,
  });

  if (!scheduledPackageEffectiveAt && pendingStatus === "scheduled_downgrade") {
    const scheduleId = normalizeString(subscription?.schedule) || normalizeString(account?.stripeSubscriptionScheduleId);

    if (scheduleId) {
      try {
        const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId);
        scheduledPackageEffectiveAt = normalizeUnixTimestampToIso(
          schedule?.current_phase?.end_date || schedule?.phases?.[0]?.end_date
        );
      } catch {
        scheduledPackageEffectiveAt = "";
      }
    }
  }

  const updatedAccount = await updateCommercialAccountStripeSubscription(account.id, {
    stripeCustomerId: normalizeString(subscription?.customer),
    stripeSubscriptionId: normalizeString(subscription?.id),
    stripeSubscriptionScheduleId: normalizeString(subscription?.schedule) || normalizeString(account?.stripeSubscriptionScheduleId),
    stripePriceId: priceId,
    packageCurrency: priceSelection.currency || normalizeString(account?.packageCurrency),
    stripeSubscriptionStatus: normalizeString(subscription?.status),
    stripeCancelAt: normalizeUnixTimestampToIso(subscription?.cancel_at),
    stripeCurrentPeriodEnd: await resolveStripeSubscriptionRenewalDate({
      stripe,
      subscription,
      scheduledPackageEffectiveAt,
    }),
    stripeCancelAtPeriodEnd: subscription?.cancel_at_period_end === true,
    stripeBillingEmail: account.stripeBillingEmail || account.ownerEmail,
    stripeLastEventId: normalizeString(event?.id) || normalizeString(account?.stripeLastEventId),
    stripeLastEventType: normalizeString(event?.type) || normalizeString(account?.stripeLastEventType),
  });

  const shouldClearPackageIntent =
    pendingPackage?.tier === packageTier ||
    (!pendingStatus && !pendingPackage?.tier);

  if (shouldClearPackageIntent) {
    await updateCommercialAccountPackageIntent(account.id, {
      pendingPackageTier: "",
      pendingPackageCurrency: "",
      pendingPackageStatus: "",
      pendingPackageEffectiveAt: "",
      pendingPackageUpdatedAt: "",
    });
  } else if (pendingStatus === "scheduled_downgrade" && scheduledPackageEffectiveAt) {
    await updateCommercialAccountPackageIntent(account.id, {
      pendingPackageTier: normalizeString(account?.pendingPackageTier),
      pendingPackageCurrency: normalizeString(account?.pendingPackageCurrency),
      pendingPackageStatus: normalizeString(account?.pendingPackageStatus),
      pendingPackageEffectiveAt: scheduledPackageEffectiveAt,
      pendingPackageUpdatedAt: normalizeString(account?.pendingPackageUpdatedAt),
    });
  }

  const metadata = getAccountStripeLookupMetadata(subscription);
  const hubId = normalizeString(account?.lastHubId || account?.primaryHubId || metadata.hubId);

  if (hubId) {
    await updateHubPackageAuthorityFromProductSite({
      hubId,
      packageTier,
      packageStatus,
      packageSource: "product_site",
      packageAssignedAt: account?.stripeSubscriptionId ? "" : new Date().toISOString(),
    });
  }

  await appendCommercialBillingAuditEvent(account.id, {
    type: "billing.subscription_synced",
    title: "Billing subscription synced",
    summary: `${packageTier} is now synced with Stripe as ${normalizeString(subscription?.status) || "unknown"}.`,
    metadata: {
      stripeEventId: normalizeString(event?.id),
      stripeEventType: normalizeString(event?.type),
      stripeSubscriptionId: normalizeString(subscription?.id),
      stripeCustomerId: normalizeString(subscription?.customer),
      packageTier,
      packageStatus,
      stripeSubscriptionStatus: normalizeString(subscription?.status),
      hubId,
    },
  });

  return updatedAccount;
}

function getScheduledPackageEffectiveAt({ account, currentTier = "" } = {}) {
  const pendingStatus = normalizeString(account?.pendingPackageStatus).toLowerCase();
  const pendingTier = normalizeString(account?.pendingPackageTier).toLowerCase();
  const normalizedCurrentTier = normalizeString(currentTier).toLowerCase();

  if (
    pendingStatus === "scheduled_downgrade" &&
    pendingTier &&
    pendingTier !== normalizedCurrentTier
  ) {
    return normalizeString(account?.pendingPackageEffectiveAt);
  }

  return "";
}

async function syncAccountFromCheckoutSession({ session, event }) {
  const account = await resolveCommercialAccountFromStripeObject(session);

  if (!account) {
    return {
      handled: false,
      reason: "account_not_found",
    };
  }

  await updateCommercialAccountStripeSubscription(account.id, {
    stripeCustomerId: normalizeString(session?.customer),
    stripeBillingEmail:
      normalizeEmail(session?.customer_details?.email) || account.stripeBillingEmail || account.ownerEmail,
    stripeLastCheckoutSessionId: normalizeString(session?.id),
    stripeLastEventId: normalizeString(event?.id),
    stripeLastEventType: normalizeString(event?.type),
  });

  const subscriptionId = normalizeString(session?.subscription);

  await appendCommercialBillingAuditEvent(account.id, {
    type: "billing.checkout_completed",
    title: "Checkout completed",
    summary: `Stripe checkout completed for ${normalizeString(session?.metadata?.targetTier).toLowerCase() || "the selected package"}.`,
    metadata: {
      stripeEventId: normalizeString(event?.id),
      stripeEventType: normalizeString(event?.type),
      checkoutSessionId: normalizeString(session?.id),
      stripeCustomerId: normalizeString(session?.customer),
      subscriptionId,
      paymentStatus: normalizeString(session?.payment_status),
      checkoutStatus: normalizeString(session?.status),
      targetTier: normalizeString(session?.metadata?.targetTier).toLowerCase(),
    },
  });

  if (!subscriptionId) {
    return {
      handled: true,
      accountId: account.id,
      state: "checkout_recorded",
    };
  }

  const stripe = getStripeServerClient();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await syncAccountFromStripeSubscription({ account, subscription, event });

  return {
    handled: true,
    accountId: account.id,
    state: "subscription_synced",
  };
}

export async function processStripeWebhookEvent(event) {
  if (!event?.id || !event?.type) {
    return { handled: false, reason: "invalid_event" };
  }

  const claim = await claimStripeEventProcessing(event);

  if (!claim.claimed) {
    return {
      handled: claim.status === "processed" || claim.status === "processing",
      duplicate: claim.status === "processed" || claim.status === "processing",
      state: claim.status || claim.reason || "duplicate",
    };
  }

  try {
    let result = { handled: false, reason: "ignored" };

    if (event.type === "checkout.session.completed") {
      result = await syncAccountFromCheckoutSession({
        session: event.data.object,
        event,
      });
    } else if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object;
      const account = await resolveCommercialAccountFromStripeObject(subscription);

      if (account) {
        await syncAccountFromStripeSubscription({ account, subscription, event });
        result = {
          handled: true,
          accountId: account.id,
          state: "subscription_synced",
        };
      } else {
        result = { handled: false, reason: "account_not_found" };
      }
    } else if (event.type === "invoice.payment_failed" || event.type === "invoice.paid") {
      const invoice = event.data.object;
      const stripe = getStripeServerClient();
      const subscriptionId = normalizeString(invoice?.subscription);
      const account = await resolveCommercialAccountFromStripeObject(invoice);

      if (account && subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await syncAccountFromStripeSubscription({ account, subscription, event });
        await appendCommercialBillingAuditEvent(account.id, {
          type: event.type === "invoice.paid" ? "billing.invoice_paid" : "billing.invoice_payment_failed",
          title: event.type === "invoice.paid" ? "Payment received" : "Payment failed",
          summary:
            event.type === "invoice.paid"
              ? "Stripe confirmed a successful payment for this subscription."
              : "Stripe reported a failed payment for this subscription.",
          metadata: {
            stripeEventId: normalizeString(event?.id),
            stripeEventType: normalizeString(event?.type),
            invoiceId: normalizeString(invoice?.id),
            subscriptionId,
            amountPaid: Number(invoice?.amount_paid || 0),
            amountDue: Number(invoice?.amount_due || 0),
            currency: normalizeString(invoice?.currency).toUpperCase(),
          },
        });
        result = {
          handled: true,
          accountId: account.id,
          state: "invoice_driven_sync",
        };
      } else {
        result = { handled: false, reason: "account_or_subscription_not_found" };
      }
    }

    await markStripeEventProcessed(event, {
      handled: result.handled === true,
      accountId: normalizeString(result.accountId),
      state: normalizeString(result.state || result.reason),
    });

    return result;
  } catch (error) {
    await markStripeEventFailed(event, {
      handled: false,
      state: "failed",
      errorMessage: normalizeString(error?.message || "Unable to process Stripe webhook event."),
    });
    throw error;
  }
}
