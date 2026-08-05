try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { countPendingInvitesByHub } from "@/lib/data/invites";
import { getHubCoreBySlug } from "@/lib/data/hubs";
import { getMemberDirectorySummaryByHubId } from "@/lib/data/member-directory";
import { getPaymentSummaryByHubId, selectPaymentSummaryBucket } from "@/lib/data/payment-summary";
import { summarizeMembersByHub } from "@/lib/data/users";
import { isActiveUpcomingPublishedCourse } from "@/lib/domain/courses";
import { formatMoney } from "@/lib/domain/memberships";
import { summarizePaymentItemCollectedRevenue } from "@/lib/domain/payments";
import { resolveLaunchFormattingLocale } from "@/lib/domain/regional-markets";

export const HUB_ADMIN_DASHBOARD_STATS_SCHEMA_VERSION = 1;

function normalizeString(value) {
  return String(value || "").trim();
}

function parseInteger(value) {
  const numeric = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(numeric) ? numeric : 0;
}

function getDashboardStatsRef(hubId) {
  return getFirebaseAdminDb().collection("hubs").doc(hubId).collection("stats").doc("current");
}

function normalizeDateForFirestoreBoundary(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 16);
  }

  return date.toISOString().slice(0, 16);
}

async function countActiveUpcomingPublishedEventsForStats(hubId, now = new Date()) {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    return 0;
  }

  const cutoff = normalizeDateForFirestoreBoundary(now);
  const snapshot = await getFirebaseAdminDb()
    .collection("hubs")
    .doc(normalizedHubId)
    .collection("events")
    .where("status", "==", "published")
    .select("startAt", "endAt")
    .get();

  return snapshot.docs.filter((doc) => {
    const data = doc.data() || {};
    return normalizeString(data.endAt) >= cutoff || normalizeString(data.startAt) >= cutoff;
  }).length;
}

async function countActiveUpcomingPublishedCoursesForStats(hubId, now = new Date()) {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    return 0;
  }

  const snapshot = await getFirebaseAdminDb()
    .collection("hubs")
    .doc(normalizedHubId)
    .collection("courses")
    .where("status", "==", "published")
    .select("startAt", "endAt")
    .get();

  return snapshot.docs.filter((doc) =>
    isActiveUpcomingPublishedCourse({
      id: doc.id,
      hubId: normalizedHubId,
      ...doc.data(),
    })
  ).length;
}

function buildEmptyRevenue(hub = {}) {
  const locale = resolveLaunchFormattingLocale(hub.locale, hub.country);
  const fallbackCurrency = hub.defaultCurrency || "USD";

  return {
    amount: 0,
    currency: fallbackCurrency,
    formatted: formatMoney(0, fallbackCurrency, locale),
    settledItemCount: 0,
    isMixedCurrency: false,
    hasDisplayableAmount: false,
  };
}

function buildSyntheticRevenueItemsFromMinorTotals(totals = {}) {
  return Object.entries(totals || {})
    .map(([currency, amountMinor]) => ({
      paymentStatus: "paid",
      amountMinor: parseInteger(amountMinor),
      refundAmountMinor: 0,
      currency,
    }))
    .filter((item) => item.amountMinor !== 0);
}

function mapPaymentSummaryToRevenue(paymentSummary, hub = {}) {
  const bucket = selectPaymentSummaryBucket(paymentSummary);
  const locale = resolveLaunchFormattingLocale(hub.locale, hub.country);
  const fallbackCurrency = hub.defaultCurrency || "USD";
  const revenueItems = buildSyntheticRevenueItemsFromMinorTotals(bucket?.collectedRevenueMinorByCurrency);

  if (!revenueItems.length) {
    return buildEmptyRevenue(hub);
  }

  return summarizePaymentItemCollectedRevenue(
    revenueItems,
    (amount, currency) => formatMoney(amount, currency, locale),
    fallbackCurrency
  );
}

function normalizeDashboardStatsRecord(record = {}, hub = null) {
  return {
    schemaVersion: parseInteger(record.schemaVersion),
    hubId: normalizeString(record.hubId),
    memberCount: parseInteger(record.memberCount),
    activeMemberCount: parseInteger(record.activeMemberCount),
    pendingInviteCount: parseInteger(record.pendingInviteCount),
    pendingUpgradeRequestCount: parseInteger(record.pendingUpgradeRequestCount),
    suspendedMemberCount: parseInteger(record.suspendedMemberCount),
    openPaymentAttentionCount: parseInteger(record.openPaymentAttentionCount),
    activeUpcomingPublishedEventCount: parseInteger(record.activeUpcomingPublishedEventCount),
    activeUpcomingPublishedCourseCount: parseInteger(record.activeUpcomingPublishedCourseCount),
    totalRevenue: record.totalRevenue || buildEmptyRevenue(hub || {}),
    updatedAt: normalizeString(record.updatedAt),
    reconciledAt: normalizeString(record.reconciledAt),
    reconciliationStatus: normalizeString(record.reconciliationStatus) || "unknown",
    rebuiltBy: normalizeString(record.rebuiltBy),
    counterSources: record.counterSources || {},
  };
}

async function buildDashboardStatsFromSources(hub, options = {}) {
  const normalizedHubId = normalizeString(hub?.id);

  if (!normalizedHubId) {
    return null;
  }

  const entitlementsCoursesEnabled = options.coursesEnabled !== false;
  const [
    memberSummary,
    memberDirectorySummary,
    pendingInviteCount,
    activeUpcomingPublishedEventCount,
    activeUpcomingPublishedCourseCount,
    paymentSummary,
  ] = await Promise.all([
    summarizeMembersByHub(normalizedHubId),
    getMemberDirectorySummaryByHubId(normalizedHubId),
    countPendingInvitesByHub(normalizedHubId),
    countActiveUpcomingPublishedEventsForStats(normalizedHubId),
    entitlementsCoursesEnabled ? countActiveUpcomingPublishedCoursesForStats(normalizedHubId) : Promise.resolve(0),
    getPaymentSummaryByHubId(normalizedHubId),
  ]);

  return {
    schemaVersion: HUB_ADMIN_DASHBOARD_STATS_SCHEMA_VERSION,
    hubId: normalizedHubId,
    memberCount: memberSummary.memberCount,
    activeMemberCount: memberSummary.activeMemberCount,
    pendingInviteCount,
    pendingUpgradeRequestCount: memberDirectorySummary.upgradeRequests,
    suspendedMemberCount: memberDirectorySummary.suspended,
    openPaymentAttentionCount: memberDirectorySummary.paymentAttention,
    activeUpcomingPublishedEventCount,
    activeUpcomingPublishedCourseCount,
    totalRevenue: paymentSummary?.schemaVersion ? mapPaymentSummaryToRevenue(paymentSummary, hub) : buildEmptyRevenue(hub),
    counterSources: {
      members: "users-count",
      memberAttention: memberDirectorySummary.schemaVersion ? "memberDirectorySummary" : "memberDirectory-count-fallback",
      invites: "invites-count",
      events: "events-published-date-scan",
      courses: entitlementsCoursesEnabled ? "courses-source-scan" : "disabled",
      revenue: paymentSummary?.schemaVersion ? "paymentSummary" : "missing-paymentSummary",
    },
  };
}

export async function getHubAdminStatsByHubId(hubId, hub = null) {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    return null;
  }

  const snapshot = await getDashboardStatsRef(normalizedHubId).get();

  if (!snapshot.exists) {
    return null;
  }

  const stats = normalizeDashboardStatsRecord(snapshot.data(), hub);

  return stats.schemaVersion === HUB_ADMIN_DASHBOARD_STATS_SCHEMA_VERSION ? stats : null;
}

export async function rebuildHubAdminDashboardStats(hubOrSlug, actorId = "dashboard-stats-rebuild", options = {}) {
  const hub = typeof hubOrSlug === "string" ? await getHubCoreBySlug(hubOrSlug) : hubOrSlug;

  if (!hub?.id) {
    throw new Error("Hub is required to rebuild dashboard stats.");
  }

  const now = normalizeString(options.updatedAt) || new Date().toISOString();
  const stats = await buildDashboardStatsFromSources(hub, options);
  const writeModel = {
    ...stats,
    updatedAt: now,
    reconciledAt: now,
    reconciliationStatus: "reconciled",
    rebuiltBy: normalizeString(actorId) || "dashboard-stats-rebuild",
  };

  await getDashboardStatsRef(hub.id).set(writeModel, { merge: true });

  return normalizeDashboardStatsRecord(writeModel, hub);
}

export async function getHubAdminDashboardStatsWithFallback(hub, options = {}) {
  if (!hub?.id) {
    return null;
  }

  const projectedStats = await getHubAdminStatsByHubId(hub.id, hub);

  if (projectedStats) {
    return {
      ...projectedStats,
      readModelState: "projected",
    };
  }

  console.warn("Admin dashboard stats projection missing; using legacy dashboard summary fallback.", {
    hubId: hub.id,
    hubSlug: hub.slug,
  });

  const fallbackStats = await buildDashboardStatsFromSources(hub, options);

  return fallbackStats
    ? {
        ...normalizeDashboardStatsRecord(fallbackStats, hub),
        readModelState: "fallback",
      }
    : null;
}
