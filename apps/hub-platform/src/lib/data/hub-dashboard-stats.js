try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { listCoursesByHub } from "@/lib/data/courses";
import { listCoursePaymentItemsByHub } from "@/lib/data/course-registrations";
import { listEventSeriesByHub } from "@/lib/data/event-series";
import { listEventsByHub } from "@/lib/data/events";
import { getHubPaymentConfigurationByHubId } from "@/lib/data/hub-payment-configurations";
import { countPendingInvitesByHub } from "@/lib/data/invites";
import { getHubCoreBySlug } from "@/lib/data/hubs";
import { getMemberDirectorySummaryByHubId } from "@/lib/data/member-directory";
import { getPaymentSummaryByHubId, selectPaymentSummaryBucket } from "@/lib/data/payment-summary";
import { summarizeMembersByHub } from "@/lib/data/users";
import { isActiveUpcomingPublishedCourse } from "@/lib/domain/courses";
import { isActiveUpcomingPublishedEvent } from "@/lib/domain/events";
import { hubUsesInternalNativePayments, getHubPaymentSetupState } from "@/lib/domain/hub-payment-configuration";
import { buildHubRuntimeHref, normalizeHubRouteMode } from "@/lib/domain/hub-runtime-paths";
import { formatMoney } from "@/lib/domain/memberships";
import { summarizePaymentItemCollectedRevenue } from "@/lib/domain/payments";
import { resolveLaunchFormattingLocale } from "@/lib/domain/regional-markets";

export const HUB_ADMIN_DASHBOARD_STATS_SCHEMA_VERSION = 1;
export const HUB_ADMIN_DASHBOARD_OVERVIEW_SCHEMA_VERSION = 1;

function normalizeString(value) {
  return String(value || "").trim();
}

function parseInteger(value) {
  const numeric = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(numeric) ? numeric : 0;
}

function normalizeCurrencyCode(value, fallbackCurrency = "USD") {
  return normalizeString(value).toUpperCase() || fallbackCurrency;
}

function parseAmount(value) {
  const numeric = Number.parseFloat(normalizeString(value));
  return Number.isFinite(numeric) ? numeric : null;
}

function getDashboardStatsRef(hubId) {
  return getFirebaseAdminDb().collection("hubs").doc(hubId).collection("stats").doc("current");
}

function getDashboardOverviewRef(hubId) {
  return getFirebaseAdminDb().collection("hubs").doc(hubId).collection("stats").doc("dashboardOverview");
}

function buildAdminHref(hubSlug, pathname, routeMode = "path") {
  return buildHubRuntimeHref(hubSlug, pathname, normalizeHubRouteMode(routeMode));
}

function normalizeDateForFirestoreBoundary(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 16);
  }

  return date.toISOString().slice(0, 16);
}

function getSortableTimestamp(value) {
  const normalized = normalizeString(value);

  if (!normalized) {
    return "";
  }

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return normalized;
  }

  return date.toISOString();
}

function formatShortDate(value, locale = "en-US") {
  const normalized = normalizeString(value);

  if (!normalized) {
    return "Date to be confirmed";
  }

  const date = normalized.includes("T") ? new Date(normalized) : new Date(`${normalized}T00:00`);

  if (Number.isNaN(date.getTime())) {
    return "Date to be confirmed";
  }

  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
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

function buildDisplayAmountRevenueSummary(items, locale = "en-US", fallbackCurrency = "USD") {
  const totalsByCurrency = new Map();
  let settledItemCount = 0;

  items.forEach((item) => {
    const paymentStatus = normalizeString(item?.paymentStatus);
    const itemStatus = normalizeString(item?.status);

    if (paymentStatus !== "paid") {
      return;
    }

    if (["event", "course"].includes(normalizeString(item?.kind)) && itemStatus === "cancelled") {
      return;
    }

    const amount = parseAmount(item?.amount);
    const currency = normalizeCurrencyCode(item?.currency, fallbackCurrency);

    settledItemCount += 1;

    if (!Number.isFinite(amount)) {
      return;
    }

    totalsByCurrency.set(currency, (totalsByCurrency.get(currency) || 0) + amount);
  });

  if (!totalsByCurrency.size) {
    return {
      amount: 0,
      currency: fallbackCurrency,
      formatted: formatMoney(0, fallbackCurrency, locale),
      settledItemCount,
      isMixedCurrency: false,
      hasDisplayableAmount: false,
    };
  }

  if (totalsByCurrency.size === 1) {
    const [currency, amount] = [...totalsByCurrency.entries()][0];

    return {
      amount,
      currency,
      formatted: formatMoney(amount, currency, locale),
      settledItemCount,
      isMixedCurrency: false,
      hasDisplayableAmount: true,
    };
  }

  return {
    amount: null,
    currency: "",
    formatted: "Mixed",
    settledItemCount,
    isMixedCurrency: true,
    hasDisplayableAmount: true,
  };
}

function buildCoursePerformanceById(items, locale = "en-US", fallbackCurrency = "USD") {
  const aggregates = new Map();

  items.forEach((item) => {
    if (normalizeString(item?.kind) !== "course") {
      return;
    }

    const courseId = normalizeString(item?.courseId);

    if (!courseId) {
      return;
    }

    const current = aggregates.get(courseId) || {
      enrolledCount: 0,
      revenueItems: [],
    };

    if (normalizeString(item?.status) === "enrolled") {
      current.enrolledCount += 1;
    }

    current.revenueItems.push(item);
    aggregates.set(courseId, current);
  });

  return new Map(
    [...aggregates.entries()].map(([courseId, aggregate]) => [
      courseId,
      {
        enrolledCount: aggregate.enrolledCount,
        revenue: buildDisplayAmountRevenueSummary(aggregate.revenueItems, locale, fallbackCurrency),
      },
    ])
  );
}

function buildRecentEventProjectionItems(events = [], eventSeries = [], hub = {}, locale = "en-US") {
  const seriesById = new Map(eventSeries.map((series) => [series.id, series]));
  const seriesItemsById = new Map();
  const standaloneItems = [];

  events
    .filter((event) => isActiveUpcomingPublishedEvent(event))
    .forEach((event) => {
      const registeredCount = parseInteger(event?.registeredAttendeeCount);

      if (normalizeString(event?.eventKind) === "series_occurrence" && normalizeString(event?.seriesId)) {
        const seriesId = normalizeString(event.seriesId);
        const existingItem = seriesItemsById.get(seriesId);
        const series = seriesById.get(seriesId) || null;
        const occurrenceSortValue = getSortableTimestamp(event.startAt || event.startDate);

        if (!existingItem) {
          seriesItemsById.set(seriesId, {
            id: seriesId,
            title: series?.title || event.title || "Untitled recurring event",
            imageUrl: series?.imageAsset?.publicUrl || event.imageAsset?.publicUrl || "",
            imageAlt:
              series?.imageAlt ||
              series?.imageAsset?.alt ||
              event.imageAlt ||
              event.imageAsset?.alt ||
              series?.title ||
              event.title ||
              "Recurring event image",
            dateLabel: formatShortDate(event.startDate || event.startAt, locale),
            registeredCount,
            adminPath: `/admin/events/series/${seriesId}`,
            sortValue: occurrenceSortValue,
          });
          return;
        }

        existingItem.registeredCount += registeredCount;

        if (occurrenceSortValue && (!existingItem.sortValue || occurrenceSortValue < existingItem.sortValue)) {
          existingItem.dateLabel = formatShortDate(event.startDate || event.startAt, locale);
          existingItem.sortValue = occurrenceSortValue;
        }

        return;
      }

      standaloneItems.push({
        id: event.id,
        title: event.title || "Untitled event",
        imageUrl: event.imageAsset?.publicUrl || "",
        imageAlt: event.imageAlt || event.imageAsset?.alt || event.title || "Event image",
        dateLabel: formatShortDate(event.startDate || event.startAt, locale),
        registeredCount,
        adminPath: `/admin/events/${event.id}`,
        sortValue: getSortableTimestamp(event.startAt || event.startDate),
      });
    });

  return [...standaloneItems, ...seriesItemsById.values()]
    .sort((left, right) => String(left.sortValue || "").localeCompare(String(right.sortValue || "")))
    .slice(0, 3)
    .map(({ sortValue, ...item }) => item);
}

function buildTopCourseProjectionItems(courses = [], coursePaymentItems = [], hub = {}, locale = "en-US") {
  const defaultCurrency = hub.defaultCurrency || "USD";
  const coursePerformanceById = buildCoursePerformanceById(coursePaymentItems, locale, defaultCurrency);

  return courses
    .filter((course) => isActiveUpcomingPublishedCourse(course))
    .map((course) => {
      const performance = coursePerformanceById.get(course.id) || {
        enrolledCount: parseInteger(course.enrolledRegistrationCount),
        revenue: buildEmptyRevenue(hub),
      };
      const enrolledCount = parseInteger(course.enrolledRegistrationCount) || performance.enrolledCount;

      return {
        id: course.id,
        title: course.title || "Untitled course",
        imageUrl: course.imageAsset?.publicUrl || "",
        imageAlt: course.imageAlt || course.imageAsset?.alt || course.title || "Course image",
        enrolledCount,
        revenueLabel: performance.revenue?.hasDisplayableAmount === false ? "" : performance.revenue?.formatted || "",
        revenueAmount: performance.revenue?.amount,
        adminPath: `/admin/courses/${course.id}`,
      };
    })
    .sort((left, right) => {
      if (right.enrolledCount !== left.enrolledCount) {
        return right.enrolledCount - left.enrolledCount;
      }

      return (right.revenueAmount || 0) - (left.revenueAmount || 0);
    })
    .slice(0, 3);
}

function buildAttentionProjectionItems({ hub, stats, paymentConfiguration }) {
  const paymentSetupState = getHubPaymentSetupState(hub, paymentConfiguration);

  return [
    hubUsesInternalNativePayments(hub) && paymentSetupState.key !== "ready"
      ? {
          id: "stripe-setup",
          label: "Stripe setup",
          count: 1,
          adminPath: "/admin/payments?view=setup",
        }
      : null,
    {
      id: "admin-invites",
      label: "Admin invites",
      count: parseInteger(stats?.pendingInviteCount),
      adminPath: "/admin/admins",
    },
    {
      id: "membership-upgrades",
      label: "Upgrade requests",
      count: parseInteger(stats?.pendingUpgradeRequestCount),
      adminPath: "/admin/payments?view=plans",
    },
    {
      id: "payment-attention",
      label: "Payment attention",
      count: parseInteger(stats?.openPaymentAttentionCount),
      adminPath: "/admin/members",
    },
    {
      id: "suspended-members",
      label: "Suspended members",
      count: parseInteger(stats?.suspendedMemberCount),
      adminPath: "/admin/members",
    },
  ].filter((item) => item && item.count > 0);
}

async function listNewestMemberProjectionItems(hub, locale = "en-US") {
  const normalizedHubId = normalizeString(hub?.id);

  if (!normalizedHubId) {
    return [];
  }

  const snapshot = await getFirebaseAdminDb()
    .collection("hubs")
    .doc(normalizedHubId)
    .collection("memberDirectory")
    .orderBy("joinedAt", "desc")
    .limit(5)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data() || {};
    const name = normalizeString(data.displayName || data.email) || "Unknown member";
    const membershipPlanName = normalizeString(data.membershipPlanName);
    const email = normalizeString(data.email);
    const joinedAt = normalizeString(data.joinedAt || data.createdAt || data.updatedAt);

    return {
      id: doc.id,
      name,
      secondary: membershipPlanName || email || "Membership not assigned yet",
      createdAtLabel: joinedAt ? formatShortDate(joinedAt, locale) : "Recently joined",
      status: normalizeString(data.status) || "active",
      adminPath: `/admin/members/${doc.id}`,
    };
  });
}

function mapProjectionItemHref(hubSlug, item = {}, routeMode = "path") {
  return {
    ...item,
    href: buildAdminHref(hubSlug, item.adminPath || "/admin", routeMode),
  };
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

function normalizeDashboardOverviewRecord(record = {}, hub = null, routeMode = "path") {
  const hubSlug = normalizeString(hub?.slug);

  return {
    schemaVersion: parseInteger(record.schemaVersion),
    hubId: normalizeString(record.hubId),
    recentEvents: Array.isArray(record.recentEvents)
      ? record.recentEvents.map((item) => mapProjectionItemHref(hubSlug, item, routeMode))
      : [],
    topCourses: Array.isArray(record.topCourses)
      ? record.topCourses.map((item) => mapProjectionItemHref(hubSlug, item, routeMode))
      : [],
    attentionItems: Array.isArray(record.attentionItems)
      ? record.attentionItems.map((item) => mapProjectionItemHref(hubSlug, item, routeMode))
      : [],
    newestMembers: Array.isArray(record.newestMembers)
      ? record.newestMembers.map((item) => mapProjectionItemHref(hubSlug, item, routeMode))
      : [],
    updatedAt: normalizeString(record.updatedAt),
    reconciledAt: normalizeString(record.reconciledAt),
    reconciliationStatus: normalizeString(record.reconciliationStatus) || "unknown",
    rebuiltBy: normalizeString(record.rebuiltBy),
    projectionSources: record.projectionSources || {},
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

async function buildDashboardOverviewFromSources(hub, options = {}) {
  const normalizedHubId = normalizeString(hub?.id);

  if (!normalizedHubId) {
    return null;
  }

  const locale = resolveLaunchFormattingLocale(hub.locale, hub.country);
  const stats = options.stats || await getHubAdminDashboardStatsWithFallback(hub, options);
  const [
    events,
    eventSeries,
    courses,
    coursePaymentItems,
    paymentConfiguration,
    newestMembers,
  ] = await Promise.all([
    listEventsByHub(hub),
    listEventSeriesByHub(hub),
    options.coursesEnabled === false ? Promise.resolve([]) : listCoursesByHub(hub),
    options.coursesEnabled === false ? Promise.resolve([]) : listCoursePaymentItemsByHub(normalizedHubId),
    getHubPaymentConfigurationByHubId(normalizedHubId),
    listNewestMemberProjectionItems(hub, locale),
  ]);

  return {
    schemaVersion: HUB_ADMIN_DASHBOARD_OVERVIEW_SCHEMA_VERSION,
    hubId: normalizedHubId,
    recentEvents: buildRecentEventProjectionItems(events, eventSeries, hub, locale),
    topCourses: buildTopCourseProjectionItems(courses, coursePaymentItems, hub, locale),
    attentionItems: buildAttentionProjectionItems({ hub, stats, paymentConfiguration }),
    newestMembers,
    projectionSources: {
      recentEvents: "events/eventSeries-source-scan",
      topCourses: options.coursesEnabled === false ? "disabled" : "courses/coursePaymentItems-source-scan",
      attentionItems: "dashboardStats/paymentConfiguration",
      newestMembers: "memberDirectory",
    },
  };
}

export async function getHubAdminDashboardOverviewByHubId(hubId, hub = null, options = {}) {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    return null;
  }

  const snapshot = await getDashboardOverviewRef(normalizedHubId).get();

  if (!snapshot.exists) {
    return null;
  }

  const overview = normalizeDashboardOverviewRecord(
    snapshot.data(),
    hub,
    options.routeMode
  );

  return overview.schemaVersion === HUB_ADMIN_DASHBOARD_OVERVIEW_SCHEMA_VERSION ? overview : null;
}

export async function rebuildHubAdminDashboardOverview(hubOrSlug, actorId = "dashboard-overview-rebuild", options = {}) {
  const hub = typeof hubOrSlug === "string" ? await getHubCoreBySlug(hubOrSlug) : hubOrSlug;

  if (!hub?.id) {
    throw new Error("Hub is required to rebuild dashboard overview.");
  }

  const now = normalizeString(options.updatedAt) || new Date().toISOString();
  const overview = await buildDashboardOverviewFromSources(hub, options);
  const writeModel = {
    ...overview,
    updatedAt: now,
    reconciledAt: now,
    reconciliationStatus: "reconciled",
    rebuiltBy: normalizeString(actorId) || "dashboard-overview-rebuild",
  };

  await getDashboardOverviewRef(hub.id).set(writeModel, { merge: true });

  return normalizeDashboardOverviewRecord(writeModel, hub, options.routeMode);
}

export async function getHubAdminDashboardOverviewWithFallback(hub, options = {}) {
  if (!hub?.id) {
    return null;
  }

  const projectedOverview = await getHubAdminDashboardOverviewByHubId(hub.id, hub, options);

  if (projectedOverview) {
    return {
      ...projectedOverview,
      readModelState: "projected",
    };
  }

  console.warn("Admin dashboard overview projection missing; using legacy dashboard deferred overview fallback.", {
    hubId: hub.id,
    hubSlug: hub.slug,
  });

  const fallbackOverview = await buildDashboardOverviewFromSources(hub, options);

  return fallbackOverview
    ? {
        ...normalizeDashboardOverviewRecord(fallbackOverview, hub, options.routeMode),
        readModelState: "fallback",
      }
    : null;
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
