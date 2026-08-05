import { countActiveUpcomingPublishedEventsByHub } from "@/lib/data/events";
import { listEventsByHub } from "@/lib/data/events";
import { listEventSeriesByHub } from "@/lib/data/event-series";
import { listInvitesByHub } from "@/lib/data/invites";
import { getHubCoreBySlug } from "@/lib/data/hubs";
import {
  getHubAdminDashboardOverviewWithFallback,
  getHubAdminDashboardStatsWithFallback,
} from "@/lib/data/hub-dashboard-stats";
import { getHubPaymentConfigurationByHubId } from "@/lib/data/hub-payment-configurations";
import { listMembershipsByHub } from "@/lib/data/memberships";
import { listPendingMembershipUpgradeRequestsByHub } from "@/lib/data/memberships";
import { getHubPaymentReportByHub } from "@/lib/data/hub-payments";
import { listEventBookingPaymentItemsByHub } from "@/lib/data/event-bookings";
import { listCoursePaymentItemsByHub } from "@/lib/data/course-registrations";
import { listCoursesByHub } from "@/lib/data/courses";
import { countActiveMembersByHub, listUsersByHub } from "@/lib/data/users";
import {
  isActiveUpcomingPublishedEvent,
} from "@/lib/domain/events";
import {
  isActiveUpcomingPublishedCourse,
} from "@/lib/domain/courses";
import { formatMoney } from "@/lib/domain/memberships";
import { resolveHubPackageEntitlements } from "@/lib/domain/hub-package";
import { buildHubRuntimeHref, normalizeHubRouteMode } from "@/lib/domain/hub-runtime-paths";
import { getHubPaymentSetupState, hubUsesInternalNativePayments } from "@/lib/domain/hub-payment-configuration";
import { resolveLaunchFormattingLocale } from "@/lib/domain/regional-markets";
import { isHubOperatorRole } from "@/lib/domain/users";

function normalizeString(value) {
  return String(value || "").trim();
}

function buildAdminHref(hubSlug, pathname, routeMode = "path") {
  return buildHubRuntimeHref(hubSlug, pathname, normalizeHubRouteMode(routeMode));
}

function normalizeCurrencyCode(value, fallbackCurrency = "USD") {
  return normalizeString(value).toUpperCase() || fallbackCurrency;
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

function parseAmount(value) {
  const numeric = Number.parseFloat(normalizeString(value));
  return Number.isFinite(numeric) ? numeric : null;
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

function buildRevenueSummary(items, locale = "en-US", fallbackCurrency = "USD") {
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

function buildEventRegistrationCounts(items) {
  const counts = new Map();

  items.forEach((item) => {
    if (normalizeString(item?.kind) !== "event" || normalizeString(item?.status) !== "active") {
      return;
    }

    const eventId = normalizeString(item?.eventId);

    if (!eventId) {
      return;
    }

    const attendeeCount = Number.parseInt(
      String(item?.attendeeCount || item?.activeAttendeeCount || ""),
      10
    );

    counts.set(eventId, (counts.get(eventId) || 0) + (Number.isFinite(attendeeCount) && attendeeCount > 0 ? attendeeCount : 1));
  });

  return counts;
}

function buildRecentEventItems(events, eventSeries, eventRegistrationCounts, hub, locale = "en-US", routeMode = "path") {
  const seriesById = new Map(eventSeries.map((series) => [series.id, series]));
  const seriesItemsById = new Map();
  const standaloneItems = [];

  events
    .filter((event) => isActiveUpcomingPublishedEvent(event))
    .forEach((event) => {
      const registeredCount =
        Number.parseInt(String(event?.registeredAttendeeCount || ""), 10) || eventRegistrationCounts.get(event.id) || 0;

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
            href: buildAdminHref(hub.slug, `/admin/events/series/${seriesId}`, routeMode),
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
        href: buildAdminHref(hub.slug, `/admin/events/${event.id}`, routeMode),
        sortValue: getSortableTimestamp(event.startAt || event.startDate),
      });
    });

  return [...standaloneItems, ...seriesItemsById.values()]
    .sort((left, right) => String(left.sortValue || "").localeCompare(String(right.sortValue || "")))
    .slice(0, 3)
    .map(({ sortValue, ...item }) => item);
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
        revenue: buildRevenueSummary(aggregate.revenueItems, locale, fallbackCurrency),
      },
    ])
  );
}

function buildPaymentAttentionUserIds(memberships, eventPaymentItems, coursePaymentItems) {
  return new Set(
    [...memberships, ...eventPaymentItems, ...coursePaymentItems]
      .filter((item) => {
        if (["event", "course"].includes(String(item?.kind || "")) && String(item?.status || "") === "cancelled") {
          return false;
        }

        return ["unpaid", "overdue", "failed"].includes(String(item?.paymentStatus || ""));
      })
      .map((item) => item.userId)
      .filter(Boolean)
  );
}

export async function getHubAdminOverviewBySlug(hubSlug, options = {}) {
  const hub = await getHubCoreBySlug(hubSlug);
  if (!hub) {
    return null;
  }

  const routeMode = normalizeHubRouteMode(options.routeMode);
  const entitlements = resolveHubPackageEntitlements(hub);

  const [users, members, invites, activeMemberCount, activeUpcomingPublishedEventCount, paymentConfiguration, memberships, pendingUpgradeRequests, events, eventSeries, courses, eventPaymentItems, coursePaymentItems] = await Promise.all([
    listUsersByHub(hub.id),
    listUsersByHub(hub.id, { role: "member" }),
    listInvitesByHub(hub.id),
    countActiveMembersByHub(hub.id),
    countActiveUpcomingPublishedEventsByHub(hub.id),
    getHubPaymentConfigurationByHubId(hub.id),
    listMembershipsByHub(hub.id),
    listPendingMembershipUpgradeRequestsByHub(hub.id),
    listEventsByHub(hub),
    listEventSeriesByHub(hub),
    entitlements.capabilities?.coursesEnabled ? listCoursesByHub(hub) : Promise.resolve([]),
    listEventBookingPaymentItemsByHub(hub.id),
    entitlements.capabilities?.coursesEnabled ? listCoursePaymentItemsByHub(hub.id) : Promise.resolve([]),
  ]);
  const paymentReport = await getHubPaymentReportByHub(hub, {
    users,
    pendingUpgradeRequests,
    eventItems: eventPaymentItems,
    courseItems: coursePaymentItems,
  });
  const locale = resolveLaunchFormattingLocale(hub.locale, hub.country);
  const defaultCurrency = hub.defaultCurrency || "USD";
  const eventRegistrationCounts = buildEventRegistrationCounts(eventPaymentItems);
  const coursePerformanceById = buildCoursePerformanceById(coursePaymentItems, locale, defaultCurrency);
  const paymentAttentionUserIds = buildPaymentAttentionUserIds(memberships, eventPaymentItems, coursePaymentItems);
  const totalRevenue =
    paymentReport.summary?.collectedRevenue || {
      amount: 0,
      currency: defaultCurrency,
      formatted: formatMoney(0, defaultCurrency, locale),
      isMixedCurrency: false,
    };
  const paymentSetupState = getHubPaymentSetupState(hub, paymentConfiguration);
  const admins = users.filter((user) => isHubOperatorRole(user.role));
  const activeUpcomingCourses = courses.filter((course) => isActiveUpcomingPublishedCourse(course));
  const recentEvents = buildRecentEventItems(events, eventSeries, eventRegistrationCounts, hub, locale, routeMode);
  const topCourses = activeUpcomingCourses
    .map((course) => {
      const performance = coursePerformanceById.get(course.id) || {
        enrolledCount: 0,
        revenue: buildRevenueSummary([], locale, defaultCurrency),
      };

      return {
        id: course.id,
        title: course.title || "Untitled course",
        imageUrl: course.imageAsset?.publicUrl || "",
        imageAlt: course.imageAlt || course.imageAsset?.alt || course.title || "Course image",
        enrolledCount: performance.enrolledCount,
        revenueLabel: performance.revenue.hasDisplayableAmount ? performance.revenue.formatted : "",
        revenueAmount: performance.revenue.amount,
        href: buildAdminHref(hub.slug, `/admin/courses/${course.id}`, routeMode),
      };
    })
    .sort((left, right) => {
      if (right.enrolledCount !== left.enrolledCount) {
        return right.enrolledCount - left.enrolledCount;
      }

      return (right.revenueAmount || 0) - (left.revenueAmount || 0);
    })
    .slice(0, 3);
  const actionableInviteCount = invites.filter(
    (invite) => invite.derivedStatus === "pending" || invite.derivedStatus === "expired" || invite.status === "pending"
  ).length;
  const suspendedMembersCount = members.filter((member) => normalizeString(member.status) === "suspended").length;
  const attentionItems = [
    hubUsesInternalNativePayments(hub) && paymentSetupState.key !== "ready"
      ? {
          id: "stripe-setup",
          label: "Stripe setup",
          count: 1,
          href: buildAdminHref(hub.slug, "/admin/payments?view=setup", routeMode),
        }
      : null,
    {
      id: "admin-invites",
      label: "Admin invites",
      count: actionableInviteCount,
      href: buildAdminHref(hub.slug, "/admin/admins", routeMode),
    },
    {
      id: "membership-upgrades",
      label: "Upgrade requests",
      count: pendingUpgradeRequests.length,
      href: buildAdminHref(hub.slug, "/admin/payments?view=plans", routeMode),
    },
    {
      id: "payment-attention",
      label: "Payment attention",
      count: paymentAttentionUserIds.size,
      href: buildAdminHref(hub.slug, "/admin/members", routeMode),
    },
    {
      id: "suspended-members",
      label: "Suspended members",
      count: suspendedMembersCount,
      href: buildAdminHref(hub.slug, "/admin/members", routeMode),
    },
  ].filter((item) => item && item.count > 0);
  const membershipsByUserId = new Map();
  memberships.forEach((membership) => {
    if (!membership?.userId || membershipsByUserId.has(membership.userId)) {
      return;
    }

    membershipsByUserId.set(membership.userId, membership);
  });
  const newestMembers = [...members]
    .sort((left, right) =>
      getSortableTimestamp(right.createdAt || right.updatedAt).localeCompare(
        getSortableTimestamp(left.createdAt || left.updatedAt)
      )
    )
    .slice(0, 5)
    .map((member) => {
      const membership = membershipsByUserId.get(member.id) || null;
      return {
        id: member.id,
        name: member.name || member.email || "Unknown member",
        secondary: membership
          ? membership.planTitle || (membership.isDefault ? "Default membership plan" : "Membership assigned")
          : member.email || "Membership not assigned yet",
        createdAtLabel: member.createdAt || member.updatedAt ? formatShortDate(member.createdAt || member.updatedAt, locale) : "Recently joined",
        status: member.status || "active",
        href: buildAdminHref(hub.slug, `/admin/members/${member.id}`, routeMode),
      };
    });

  return {
    hub,
    package: entitlements,
    paymentConfiguration,
    adminCount: admins.length,
    memberCount: members.length,
    activeMemberCount,
    pendingInviteCount: invites.filter((invite) => invite.status === "pending").length,
    activeUpcomingPublishedEventCount,
    activeUpcomingPublishedCourseCount: activeUpcomingCourses.length,
    totalRevenue,
    recentEvents,
    topCourses,
    attentionItems,
    newestMembers,
  };
}

export async function getHubAdminDashboardSummaryStripBySlug(hubSlug) {
  const hub = await getHubCoreBySlug(hubSlug);
  if (!hub) {
    return null;
  }

  const entitlements = resolveHubPackageEntitlements(hub);
  const stats = await getHubAdminDashboardStatsWithFallback(hub, {
    coursesEnabled: entitlements.capabilities?.coursesEnabled,
  });
  const locale = resolveLaunchFormattingLocale(hub.locale, hub.country);
  const defaultCurrency = hub.defaultCurrency || "USD";
  const totalRevenue =
    stats?.totalRevenue || {
      amount: 0,
      currency: defaultCurrency,
      formatted: formatMoney(0, defaultCurrency, locale),
      isMixedCurrency: false,
    };

  return {
    hub,
    package: entitlements,
    memberCount: stats?.memberCount || 0,
    activeMemberCount: stats?.activeMemberCount || 0,
    pendingInviteCount: stats?.pendingInviteCount || 0,
    activeUpcomingPublishedEventCount: stats?.activeUpcomingPublishedEventCount || 0,
    activeUpcomingPublishedCourseCount: stats?.activeUpcomingPublishedCourseCount || 0,
    totalRevenue,
    statsReadModelState: stats?.readModelState || "missing",
  };
}

export async function getHubAdminDashboardDeferredOverviewBySlug(hubSlug, options = {}) {
  const hub = await getHubCoreBySlug(hubSlug);
  if (!hub) {
    return null;
  }

  const routeMode = normalizeHubRouteMode(options.routeMode);
  const entitlements = resolveHubPackageEntitlements(hub);
  const overview = await getHubAdminDashboardOverviewWithFallback(hub, {
    routeMode,
    coursesEnabled: entitlements.capabilities?.coursesEnabled,
  });

  if (overview) {
    return {
      hub,
      package: entitlements,
      activeUpcomingPublishedCourseCount: 0,
      totalRevenue: null,
      recentEvents: overview.recentEvents || [],
      topCourses: overview.topCourses || [],
      attentionItems: overview.attentionItems || [],
      newestMembers: overview.newestMembers || [],
      overviewReadModelState: overview.readModelState,
    };
  }

  const [users, members, invites, paymentConfiguration, memberships, pendingUpgradeRequests, events, eventSeries, courses, eventPaymentItems, coursePaymentItems] = await Promise.all([
    listUsersByHub(hub.id),
    listUsersByHub(hub.id, { role: "member" }),
    listInvitesByHub(hub.id),
    getHubPaymentConfigurationByHubId(hub.id),
    listMembershipsByHub(hub.id),
    listPendingMembershipUpgradeRequestsByHub(hub.id),
    listEventsByHub(hub),
    listEventSeriesByHub(hub),
    entitlements.capabilities?.coursesEnabled ? listCoursesByHub(hub) : Promise.resolve([]),
    listEventBookingPaymentItemsByHub(hub.id),
    entitlements.capabilities?.coursesEnabled ? listCoursePaymentItemsByHub(hub.id) : Promise.resolve([]),
  ]);
  const paymentReport = await getHubPaymentReportByHub(hub, {
    users,
    pendingUpgradeRequests,
    eventItems: eventPaymentItems,
    courseItems: coursePaymentItems,
  });
  const locale = resolveLaunchFormattingLocale(hub.locale, hub.country);
  const defaultCurrency = hub.defaultCurrency || "USD";
  const eventRegistrationCounts = buildEventRegistrationCounts(eventPaymentItems);
  const coursePerformanceById = buildCoursePerformanceById(coursePaymentItems, locale, defaultCurrency);
  const paymentAttentionUserIds = buildPaymentAttentionUserIds(memberships, eventPaymentItems, coursePaymentItems);
  const totalRevenue =
    paymentReport.summary?.collectedRevenue || {
      amount: 0,
      currency: defaultCurrency,
      formatted: formatMoney(0, defaultCurrency, locale),
      isMixedCurrency: false,
    };
  const paymentSetupState = getHubPaymentSetupState(hub, paymentConfiguration);
  const activeUpcomingCourses = courses.filter((course) => isActiveUpcomingPublishedCourse(course));
  const recentEvents = buildRecentEventItems(events, eventSeries, eventRegistrationCounts, hub, locale, routeMode);
  const topCourses = activeUpcomingCourses
    .map((course) => {
      const performance = coursePerformanceById.get(course.id) || {
        enrolledCount: 0,
        revenue: buildRevenueSummary([], locale, defaultCurrency),
      };

      return {
        id: course.id,
        title: course.title || "Untitled course",
        imageUrl: course.imageAsset?.publicUrl || "",
        imageAlt: course.imageAlt || course.imageAsset?.alt || course.title || "Course image",
        enrolledCount: performance.enrolledCount,
        revenueLabel: performance.revenue.hasDisplayableAmount ? performance.revenue.formatted : "",
        revenueAmount: performance.revenue.amount,
        href: buildAdminHref(hub.slug, `/admin/courses/${course.id}`, routeMode),
      };
    })
    .sort((left, right) => {
      if (right.enrolledCount !== left.enrolledCount) {
        return right.enrolledCount - left.enrolledCount;
      }

      return (right.revenueAmount || 0) - (left.revenueAmount || 0);
    })
    .slice(0, 3);
  const actionableInviteCount = invites.filter(
    (invite) => invite.derivedStatus === "pending" || invite.derivedStatus === "expired" || invite.status === "pending"
  ).length;
  const suspendedMembersCount = members.filter((member) => normalizeString(member.status) === "suspended").length;
  const attentionItems = [
    hubUsesInternalNativePayments(hub) && paymentSetupState.key !== "ready"
      ? {
          id: "stripe-setup",
          label: "Stripe setup",
          count: 1,
          href: buildAdminHref(hub.slug, "/admin/payments?view=setup", routeMode),
        }
      : null,
    {
      id: "admin-invites",
      label: "Admin invites",
      count: actionableInviteCount,
      href: buildAdminHref(hub.slug, "/admin/admins", routeMode),
    },
    {
      id: "membership-upgrades",
      label: "Upgrade requests",
      count: pendingUpgradeRequests.length,
      href: buildAdminHref(hub.slug, "/admin/payments?view=plans", routeMode),
    },
    {
      id: "payment-attention",
      label: "Payment attention",
      count: paymentAttentionUserIds.size,
      href: buildAdminHref(hub.slug, "/admin/members", routeMode),
    },
    {
      id: "suspended-members",
      label: "Suspended members",
      count: suspendedMembersCount,
      href: buildAdminHref(hub.slug, "/admin/members", routeMode),
    },
  ].filter((item) => item && item.count > 0);
  const membershipsByUserId = new Map();
  memberships.forEach((membership) => {
    if (!membership?.userId || membershipsByUserId.has(membership.userId)) {
      return;
    }

    membershipsByUserId.set(membership.userId, membership);
  });
  const newestMembers = [...members]
    .sort((left, right) =>
      getSortableTimestamp(right.createdAt || right.updatedAt).localeCompare(
        getSortableTimestamp(left.createdAt || left.updatedAt)
      )
    )
    .slice(0, 5)
    .map((member) => {
      const membership = membershipsByUserId.get(member.id) || null;
      return {
        id: member.id,
        name: member.name || member.email || "Unknown member",
        secondary: membership
          ? membership.planTitle || (membership.isDefault ? "Default membership plan" : "Membership assigned")
          : member.email || "Membership not assigned yet",
        createdAtLabel: member.createdAt || member.updatedAt ? formatShortDate(member.createdAt || member.updatedAt, locale) : "Recently joined",
        status: member.status || "active",
        href: buildAdminHref(hub.slug, `/admin/members/${member.id}`, routeMode),
      };
    });

  return {
    hub,
    package: entitlements,
    activeUpcomingPublishedCourseCount: activeUpcomingCourses.length,
    totalRevenue,
    recentEvents,
    topCourses,
    attentionItems,
    newestMembers,
  };
}
