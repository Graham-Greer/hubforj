try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { getFallbackRegionalMarket } from "@/lib/domain/regional-markets";
import { listPaymentItemsByHubId } from "./payment-items.js";

export const PAYMENT_SUMMARY_SCHEMA_VERSION = 1;

const SUMMARY_BUCKET_KEYS = ["all", "membership", "event", "course"];
const SUMMARY_PAYMENT_STATUS_KEYS = [
  "paid",
  "unpaid",
  "overdue",
  "failed",
  "refunded",
  "partially_refunded",
  "not_required",
];

function normalizeString(value) {
  return String(value || "").trim();
}

function parseInteger(value) {
  const numeric = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(numeric) ? numeric : 0;
}

function getPaymentSummaryRef(hubId) {
  return getFirebaseAdminDb().collection("hubs").doc(hubId).collection("system").doc("paymentSummary");
}

function createEmptyRevenueTotals() {
  return {};
}

function createEmptySummaryBucket() {
  return {
    total: 0,
    actionRequired: 0,
    settled: 0,
    membership: 0,
    bookings: 0,
    overdueItems: 0,
    recordCounts: {
      paid: 0,
      refunded: 0,
      failed: 0,
    },
    collectedRevenueMinorByCurrency: createEmptyRevenueTotals(),
    refundedRevenueMinorByCurrency: createEmptyRevenueTotals(),
  };
}

function createEmptySummaryBuckets() {
  return SUMMARY_BUCKET_KEYS.reduce(
    (buckets, key) => ({
      ...buckets,
      [key]: createEmptySummaryBucket(),
    }),
    {}
  );
}

function createEmptyPaymentStatusBuckets() {
  return SUMMARY_PAYMENT_STATUS_KEYS.reduce(
    (buckets, key) => ({
      ...buckets,
      [key]: createEmptySummaryBucket(),
    }),
    {}
  );
}

function addMinorTotal(totals, currency, amountMinor) {
  const normalizedCurrency = normalizeString(currency).toUpperCase() || getFallbackRegionalMarket().defaultCurrency;
  const normalizedAmountMinor = parseInteger(amountMinor);

  totals[normalizedCurrency] = parseInteger(totals[normalizedCurrency]) + normalizedAmountMinor;
}

export function mapPaymentItemTypeToAdminKind(type) {
  const normalizedType = normalizeString(type);

  if (normalizedType === "eventBooking") {
    return "event";
  }

  if (normalizedType === "courseRegistration") {
    return "course";
  }

  return "membership";
}

function parseTimestampMs(value) {
  const normalizedValue = normalizeString(value);

  if (!normalizedValue) {
    return null;
  }

  const date = new Date(normalizedValue);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function getPaymentItemRevenueTimestampMs(item = {}) {
  return (
    parseTimestampMs(item.paidAt) ||
    parseTimestampMs(item.occurredAt) ||
    parseTimestampMs(item.updatedAt) ||
    parseTimestampMs(item.createdAt) ||
    parseTimestampMs(item.sortAt)
  );
}

function buildProjectedMembershipRevenueValueKey(item = {}) {
  const parts = [
    normalizeString(item.userId),
    String(parseInteger(item.amountMinor)),
    normalizeString(item.currency).toUpperCase(),
  ];

  if (parts.some((part) => !part)) {
    return "";
  }

  return parts.join("::");
}

export function filterDuplicateProjectedMembershipCyclePaymentItems(items = []) {
  const duplicateItemIds = new Set();
  const membershipCycleCandidatesByValue = new Map();
  const maxDuplicateWindowMs = 45 * 24 * 60 * 60 * 1000;

  items
    .filter((item) => {
      const type = normalizeString(item.type);
      return (
        type === "membership" &&
        normalizeString(item.reportingEligibility) !== "informational_only" &&
        normalizeString(item.paymentStatus) === "paid"
      );
    })
    .forEach((item) => {
      const valueKey = buildProjectedMembershipRevenueValueKey(item);

      if (!valueKey) {
        return;
      }

      const rows = membershipCycleCandidatesByValue.get(valueKey) || [];
      rows.push(item);
      membershipCycleCandidatesByValue.set(valueKey, rows);
    });

  items
    .filter((item) => {
      const type = normalizeString(item.type);
      return (
        type === "upgradeRequest" &&
        normalizeString(item.reportingEligibility) !== "informational_only" &&
        normalizeString(item.paymentStatus) === "paid"
      );
    })
    .forEach((upgradeItem) => {
      const valueKey = buildProjectedMembershipRevenueValueKey(upgradeItem);
      const upgradeTimestampMs = getPaymentItemRevenueTimestampMs(upgradeItem);
      const candidates = membershipCycleCandidatesByValue.get(valueKey) || [];

      if (!valueKey || !candidates.length || !upgradeTimestampMs) {
        return;
      }

      const closestCandidate = candidates
        .filter((candidate) => normalizeString(candidate.id) && !duplicateItemIds.has(normalizeString(candidate.id)))
        .map((candidate) => ({
          candidate,
          distanceMs: Math.abs((getPaymentItemRevenueTimestampMs(candidate) || 0) - upgradeTimestampMs),
        }))
        .filter((entry) => entry.distanceMs <= maxDuplicateWindowMs)
        .sort((left, right) => left.distanceMs - right.distanceMs)[0];

      if (closestCandidate?.candidate?.id) {
        duplicateItemIds.add(normalizeString(closestCandidate.candidate.id));
      }
    });

  if (!duplicateItemIds.size) {
    return items;
  }

  return items.filter((item) => !duplicateItemIds.has(normalizeString(item.id)));
}

function addPaymentItemToSummaryBucket(bucket, item = {}) {
  const paymentStatus = normalizeString(item.paymentStatus);
  const kind = mapPaymentItemTypeToAdminKind(item.type);
  const amountMinor = parseInteger(item.amountMinor);
  const refundAmountMinor = parseInteger(item.refundAmountMinor);
  const currency = normalizeString(item.currency).toUpperCase() || getFallbackRegionalMarket().defaultCurrency;

  bucket.total += 1;

  if (paymentStatus === "unpaid" || paymentStatus === "overdue" || paymentStatus === "failed") {
    bucket.actionRequired += 1;
  }

  if (paymentStatus === "paid" || paymentStatus === "not_required" || paymentStatus === "partially_refunded") {
    bucket.settled += 1;
  }

  if (kind === "membership") {
    bucket.membership += 1;
  }

  if (kind === "event" || kind === "course") {
    bucket.bookings += 1;
  }

  if (paymentStatus === "overdue") {
    bucket.overdueItems += 1;
  }

  if (paymentStatus === "paid") {
    bucket.recordCounts.paid += 1;
    addMinorTotal(bucket.collectedRevenueMinorByCurrency, currency, amountMinor - refundAmountMinor);
  } else if (paymentStatus === "refunded" || paymentStatus === "partially_refunded") {
    bucket.recordCounts.refunded += 1;
  } else if (paymentStatus === "failed") {
    bucket.recordCounts.failed += 1;
  }

  if (refundAmountMinor > 0) {
    addMinorTotal(bucket.refundedRevenueMinorByCurrency, currency, refundAmountMinor);
  } else if (paymentStatus === "refunded") {
    addMinorTotal(bucket.refundedRevenueMinorByCurrency, currency, amountMinor);
  }
}

export function buildPaymentSummaryFromPaymentItems(items = []) {
  const byAdminType = createEmptySummaryBuckets();
  const byPaymentStatus = createEmptyPaymentStatusBuckets();
  const reportableItems = filterDuplicateProjectedMembershipCyclePaymentItems(
    items.filter((item) => normalizeString(item.reportingEligibility) !== "informational_only")
  );

  reportableItems.forEach((item) => {
    const kind = mapPaymentItemTypeToAdminKind(item.type);
    const paymentStatus = normalizeString(item.paymentStatus);

    addPaymentItemToSummaryBucket(byAdminType.all, item);

    if (byAdminType[kind]) {
      addPaymentItemToSummaryBucket(byAdminType[kind], item);
    }

    if (byPaymentStatus[paymentStatus]) {
      addPaymentItemToSummaryBucket(byPaymentStatus[paymentStatus], item);
    }
  });

  return {
    schemaVersion: PAYMENT_SUMMARY_SCHEMA_VERSION,
    byAdminType,
    byPaymentStatus,
    totalSourceItems: items.length,
    reportableItems: reportableItems.length,
  };
}

export function normalizePaymentSummary(summary = {}) {
  return {
    schemaVersion: parseInteger(summary.schemaVersion),
    hubId: normalizeString(summary.hubId),
    rebuiltAt: normalizeString(summary.rebuiltAt),
    updatedAt: normalizeString(summary.updatedAt),
    rebuiltBy: normalizeString(summary.rebuiltBy),
    totalSourceItems: parseInteger(summary.totalSourceItems),
    reportableItems: parseInteger(summary.reportableItems),
    byAdminType: summary.byAdminType || createEmptySummaryBuckets(),
    byPaymentStatus: summary.byPaymentStatus || createEmptyPaymentStatusBuckets(),
  };
}

export async function getPaymentSummaryByHubId(hubId) {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    return null;
  }

  const snapshot = await getPaymentSummaryRef(normalizedHubId).get();

  if (!snapshot.exists) {
    return null;
  }

  return normalizePaymentSummary({
    hubId: normalizedHubId,
    ...snapshot.data(),
  });
}

export async function rebuildPaymentSummaryFromPaymentItems(hubId, options = {}) {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    return null;
  }

  const now = normalizeString(options.updatedAt) || new Date().toISOString();
  const items = Array.isArray(options.items) ? options.items : await listPaymentItemsByHubId(normalizedHubId);
  const summary = buildPaymentSummaryFromPaymentItems(items);
  const writeModel = {
    ...summary,
    hubId: normalizedHubId,
    rebuiltAt: now,
    updatedAt: now,
    rebuiltBy: normalizeString(options.actorId) || "payment-summary-rebuild",
  };

  await getPaymentSummaryRef(normalizedHubId).set(writeModel, { merge: true });

  if (options.maintainDashboardProjections !== false) {
    try {
      const { maintainHubAdminDashboardProjectionsByHubId } = await import("./hub-dashboard-stats.js");
      await maintainHubAdminDashboardProjectionsByHubId(normalizedHubId, options.actorId, {
        reason: "payment-summary-rebuild",
        updatedAt: now,
      });
    } catch (error) {
      console.warn("Unable to start dashboard projection maintenance after payment summary rebuild", {
        hubId: normalizedHubId,
        actorId: normalizeString(options.actorId) || "payment-summary-rebuild",
        error: String(error?.message || "Unable to maintain dashboard projections."),
      });
    }
  }

  return normalizePaymentSummary(writeModel);
}

export function selectPaymentSummaryBucket(summary = null, options = {}) {
  const normalizedSummary = summary ? normalizePaymentSummary(summary) : normalizePaymentSummary();
  const normalizedPaymentStatus = normalizeString(options.paymentStatus);
  const normalizedType = normalizeString(options.type);

  if (normalizedPaymentStatus && normalizedSummary.byPaymentStatus?.[normalizedPaymentStatus]) {
    return normalizedSummary.byPaymentStatus[normalizedPaymentStatus];
  }

  if (normalizedType && normalizedSummary.byAdminType?.[normalizedType]) {
    return normalizedSummary.byAdminType[normalizedType];
  }

  return normalizedSummary.byAdminType?.all || createEmptySummaryBucket();
}
