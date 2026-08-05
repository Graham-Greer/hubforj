try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getHubBySlug } from "@/lib/data/hubs";
import { getEventById } from "@/lib/data/events";
import {
  getMembershipPaymentRecordById,
  listMembershipPaymentItemsByHub,
  listPendingMembershipUpgradeRequestsByHub,
} from "@/lib/data/memberships";
import {
  getPaymentRecordById,
  getPaymentRecordByNativeTransactionId,
  listPaymentRecordsByHub,
} from "@/lib/data/payment-records";
import { listPaymentItemPageByHubId } from "@/lib/data/payment-items";
import {
  getNativePaymentTransactionById,
  listNativePaymentTransactionsByHub,
} from "@/lib/data/native-payment-transactions";
import { listUsersByHub } from "@/lib/data/users";
import { getEventBookingById, listEventBookingPaymentItemsByHub } from "@/lib/data/event-bookings";
import { getEventRegistrationById } from "@/lib/data/legacy-event-registrations";
import { getCourseRegistrationById, listCoursePaymentItemsByHub } from "@/lib/data/course-registrations";
import {
  filterDuplicateMembershipCyclePaymentRecords,
  summarizeHubPaymentItems,
  summarizeLedgerRecordCounts,
  summarizePaymentItemCollectedRevenue,
  summarizePaymentItemRefundedRevenue,
} from "@/lib/domain/payments";
import { formatMoney } from "@/lib/domain/memberships";
import {
  getFallbackRegionalMarket,
  resolveLaunchFormattingLocale,
} from "@/lib/domain/regional-markets";
import { buildHubRuntimeHref, normalizeHubRouteMode } from "@/lib/domain/hub-runtime-paths";

function normalizeString(value) {
  return String(value || "").trim();
}

export function isPaymentItemsReadModelEnabled() {
  return normalizeString(process.env.HUB_PLATFORM_PAYMENT_ITEMS_READ_MODEL_ENABLED).toLowerCase() === "true";
}

function parseDisplayAmountToMinor(amount, currency = getFallbackRegionalMarket().defaultCurrency) {
  const numeric = Number.parseFloat(normalizeString(amount));
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 0;
  }

  const normalizedCurrency = normalizeString(currency).toUpperCase() || getFallbackRegionalMarket().defaultCurrency;
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
    return Math.round(numeric);
  }

  return Math.round(numeric * 100);
}

function sortItems(items) {
  return [...items].sort((left, right) =>
    String(right.lifecycleDate || right.dueDate || "").localeCompare(String(left.lifecycleDate || left.dueDate || ""))
  );
}

function mapNativeTransactionStatusToPaymentStatus(transaction) {
  if (transaction.status === "payment_received") {
    return "paid";
  }

  if (transaction.status === "payment_failed") {
    return "failed";
  }

  return "unpaid";
}

function isNativeTransactionOperationallyRelevant(transaction) {
  const status = normalizeString(transaction?.status);

  return (
    status === "checkout_open" ||
    status === "checkout_completed" ||
    status === "payment_received" ||
    status === "payment_failed"
  );
}

function isPendingNativeUpgradeTransaction(transaction, pendingUpgradeRequestsById) {
  const requestId = normalizeString(transaction?.membershipUpgradeRequestId);

  if (!requestId) {
    return false;
  }

  return pendingUpgradeRequestsById.has(requestId);
}

function mapPaymentRecordKindToItemKind(kind) {
  const normalizedKind = normalizeString(kind);

  if (normalizedKind === "course_registration") {
    return "course";
  }

  if (normalizedKind === "event_registration" || normalizedKind === "event_booking") {
    return "event";
  }

  return "membership";
}

function mapProjectedPaymentItemTypeToItemKind(type) {
  const normalizedType = normalizeString(type);

  if (normalizedType === "eventBooking") {
    return "event";
  }

  if (normalizedType === "courseRegistration") {
    return "course";
  }

  return "membership";
}

function getPaymentItemRevenueTimestampMs(item = {}) {
  const normalizedValue = normalizeString(item.paidAt || item.sortAt || item.updatedAt || item.createdAt);

  if (!normalizedValue) {
    return null;
  }

  const date = new Date(normalizedValue);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function buildProjectedMembershipRevenueValueKey(item = {}) {
  const parts = [
    normalizeString(item.userId),
    String(Number.parseInt(String(item.amountMinor || ""), 10) || 0),
    normalizeString(item.currency).toUpperCase(),
  ];

  if (parts.some((part) => !part)) {
    return "";
  }

  return parts.join("::");
}

function filterDuplicateProjectedMembershipCyclePaymentItems(items = []) {
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

function isMembershipUpgradeRecord(record) {
  return normalizeString(record?.kind) === "membership_upgrade" || normalizeString(record?.sourceType) === "membershipUpgradeRequest";
}

function normalizeMembershipCommercialTitle(title) {
  return normalizeString(title).replace(/\s+upgrade$/i, "");
}

function buildAdminHref(hubSlug, pathname, routeMode = "path") {
  return buildHubRuntimeHref(hubSlug, pathname, normalizeHubRouteMode(routeMode));
}

function buildPaymentDetailHref(hubSlug, paymentItemId, routeMode = "path") {
  return buildAdminHref(hubSlug, `/admin/payments/${paymentItemId}`, routeMode);
}

function buildMemberHref(hubSlug, userId, routeMode = "path") {
  const normalizedUserId = normalizeString(userId);
  return normalizedUserId ? buildAdminHref(hubSlug, `/admin/members/${normalizedUserId}`, routeMode) : "";
}

function buildLinkedRecordDetail(hubSlug, item, record = null, routeMode = "path") {
  if (item.kind === "event") {
    return {
      label: "Event booking",
      title: item.title || "Event booking",
      supportingText: item.detail || "This payment is linked to an event booking.",
      href: item.eventId ? buildAdminHref(hubSlug, `/admin/events/${item.eventId}/registrations`, routeMode) : "",
      hrefLabel: "Open bookings",
      stateLabel: normalizeString(record?.status) || normalizeString(item.status) || "active",
    };
  }

  if (item.kind === "course") {
    return {
      label: "Course enrolment",
      title: item.title || "Course enrolment",
      supportingText: item.detail || "This payment is linked to a course enrolment.",
      href: item.courseId ? buildAdminHref(hubSlug, `/admin/courses/${item.courseId}/registrations`, routeMode) : "",
      hrefLabel: "Open registrations",
      stateLabel: normalizeString(record?.status) || normalizeString(item.status) || "enrolled",
    };
  }

  return {
    label: "Membership plan",
    title: item.title || "Membership plan",
    supportingText: item.operationalLabel ? "This payment is for a membership upgrade." : "This payment is part of the member's membership plan.",
    href: buildAdminHref(hubSlug, "/admin/payments?view=plans", routeMode),
    hrefLabel: "Open membership plans",
    stateLabel: normalizeString(record?.operationalStatus || record?.status) || "",
  };
}

function buildEventSnapshotComparison(record = null, currentEvent = null) {
  if (!record) {
    return [];
  }

  const bookedTitle = normalizeString(record?.eventTitleSnapshot || record?.eventTitle || currentEvent?.title);
  const currentTitle = normalizeString(currentEvent?.title || record?.eventTitle || record?.eventTitleSnapshot);
  const bookedStart = normalizeString(record?.eventStartAtSnapshot || record?.eventStartAt);
  const currentStart = normalizeString(currentEvent?.startAt || record?.eventStartAtSnapshot || record?.eventStartAt);
  const bookedLocation = normalizeString(record?.eventLocationSnapshot || record?.eventLocation);
  const currentLocation = normalizeString(currentEvent?.location || record?.eventLocationSnapshot || record?.eventLocation);
  const hasBookingSnapshots =
    Boolean(normalizeString(record?.eventTitleSnapshot)) ||
    Boolean(normalizeString(record?.eventStartAtSnapshot)) ||
    Boolean(normalizeString(record?.eventLocationSnapshot));
  const attendeeCount = Number.parseInt(
    String(record?.attendeeCount || record?.activeAttendeeCount || record?.waitlistedAttendeeCount || ""),
    10
  ) || 0;

  if (!hasBookingSnapshots) {
    return attendeeCount > 0
      ? [{ label: "Attendees", value: `${attendeeCount} attendee${attendeeCount === 1 ? "" : "s"}` }]
      : [];
  }

  const rows = [
    { label: "Booked snapshot", value: bookedTitle || "Event booking" },
    { label: "Current event", value: currentTitle || "Event booking" },
    { label: "Booked start", value: bookedStart || "Not available" },
    { label: "Current start", value: currentStart || "Not available" },
    { label: "Booked location", value: bookedLocation || "Not available" },
    { label: "Current location", value: currentLocation || "Not available" },
  ];

  if (attendeeCount > 0) {
    rows.push({
      label: "Attendees",
      value: `${attendeeCount} attendee${attendeeCount === 1 ? "" : "s"}`,
    });
  }

  return rows;
}

function hasEventSnapshotDrift(record = null, currentEvent = null) {
  if (!record || !currentEvent) {
    return false;
  }

  const hasBookingSnapshots =
    Boolean(normalizeString(record?.eventTitleSnapshot)) ||
    Boolean(normalizeString(record?.eventStartAtSnapshot)) ||
    Boolean(normalizeString(record?.eventLocationSnapshot));

  if (!hasBookingSnapshots) {
    return false;
  }

  return (
    normalizeString(record?.eventTitleSnapshot) !== normalizeString(currentEvent?.title) ||
    normalizeString(record?.eventStartAtSnapshot) !== normalizeString(currentEvent?.startAt) ||
    normalizeString(record?.eventLocationSnapshot) !== normalizeString(currentEvent?.location)
  );
}

function buildMemberDetail(hubSlug, item, routeMode = "path") {
  const memberRecordAvailable = item?.memberRecordAvailable !== false;
  const fallbackName = item.userName || item.userEmail || "Former member";

  return {
    name: fallbackName,
    email: item.userEmail,
    href: memberRecordAvailable ? buildMemberHref(hubSlug, item.userId, routeMode) : "",
    rows: [
      { label: "Name", value: fallbackName },
      { label: "Email", value: item.userEmail || "Email not available" },
    ],
  };
}

function resolveLifecycleDateInfo({
  paymentStatus = "",
  paidAt = "",
  refundedAt = "",
  dueAt = "",
  occurredAt = "",
  updatedAt = "",
  createdAt = "",
  fallbackLabel = "Recorded",
}) {
  const normalizedStatus = normalizeString(paymentStatus);

  if ((normalizedStatus === "refunded" || normalizedStatus === "partially_refunded") && normalizeString(refundedAt)) {
    return { lifecycleDate: normalizeString(refundedAt), lifecycleLabel: "Refunded" };
  }

  if (normalizedStatus === "paid" && normalizeString(paidAt)) {
    return { lifecycleDate: normalizeString(paidAt), lifecycleLabel: "Paid" };
  }

  if (normalizedStatus === "failed") {
    return {
      lifecycleDate: normalizeString(updatedAt) || normalizeString(dueAt) || normalizeString(createdAt),
      lifecycleLabel: "Failed",
    };
  }

  if (normalizedStatus === "overdue") {
    return {
      lifecycleDate: normalizeString(updatedAt) || normalizeString(dueAt) || normalizeString(createdAt),
      lifecycleLabel: "Overdue",
    };
  }

  if (normalizedStatus === "unpaid") {
    return {
      lifecycleDate: normalizeString(dueAt) || normalizeString(occurredAt) || normalizeString(createdAt),
      lifecycleLabel: "Due",
    };
  }

  if (normalizedStatus === "not_required") {
    return {
      lifecycleDate: normalizeString(occurredAt) || normalizeString(createdAt) || normalizeString(updatedAt),
      lifecycleLabel: fallbackLabel,
    };
  }

  return {
    lifecycleDate: normalizeString(dueAt) || normalizeString(occurredAt) || normalizeString(updatedAt) || normalizeString(createdAt),
    lifecycleLabel: fallbackLabel,
  };
}

function mapLedgerRecordToPaymentItem(record, hubSlug, user = null, fallback = null, routeMode = "path") {
  const kind = mapPaymentRecordKindToItemKind(record.kind);
  const isMembershipUpgrade = isMembershipUpgradeRecord(record);
  const lifecycle = resolveLifecycleDateInfo({
    paymentStatus: record.financialStatus,
    paidAt: record.paidAt,
    refundedAt: record.refundedAt,
    dueAt: record.dueAt,
    occurredAt: record.occurredAt,
    updatedAt: record.updatedAt,
    createdAt: record.createdAt,
    fallbackLabel: kind === "membership" ? "Renewal" : "Recorded",
  });
  const title =
    (kind === "membership" ? normalizeMembershipCommercialTitle(record.title) : record.title) ||
    fallback?.title ||
    (kind === "course" ? "Course enrolment" : kind === "event" ? "Event booking" : "Membership");
  const detail =
    fallback?.detail ||
    (kind === "membership"
      ? isMembershipUpgrade
        ? record.financialStatus === "paid"
          ? "Stripe payment received for a membership upgrade."
          : record.financialStatus === "failed"
            ? "Stripe payment failed for a membership upgrade."
            : record.operationalStatus === "cancelled"
              ? "Stripe checkout was cancelled before payment completed."
              : "Stripe checkout is in progress for a membership upgrade."
        : record.renewalDate
          ? "Membership renewal cycle."
          : "Membership plan payment record."
      : kind === "course"
        ? "Course enrolment payment state."
        : "Event booking payment state.");

  return {
    id: `ledger_${record.id}`,
    ledgerRecordId: record.id,
    recordId: record.id,
    kind,
    title,
    status: fallback?.status || "",
    paymentStatus: normalizeString(record.financialStatus) || fallback?.paymentStatus || "unpaid",
    amountMinor: Number.isFinite(Number(record.amountMinor)) ? Number(record.amountMinor) : parseDisplayAmountToMinor(record.amountDisplay, record.currency),
    amount: record.amountDisplay || fallback?.amount || "",
    currency: record.currency || fallback?.currency || getFallbackRegionalMarket().defaultCurrency,
    refundAmountMinor: Number.isFinite(Number(record.refundAmountMinor)) ? Number(record.refundAmountMinor) : 0,
    lifecycleDate: lifecycle.lifecycleDate,
    lifecycleLabel: lifecycle.lifecycleLabel,
    dueDate: record.paidAt || record.dueAt || record.occurredAt || record.updatedAt || record.createdAt,
    detail,
    userId: record.userId,
    userName: normalizeString(user?.name) || fallback?.userName || "",
    userEmail: normalizeString(user?.email).toLowerCase() || fallback?.userEmail || "",
    eventId: record.eventId || fallback?.eventId || "",
    courseId: record.courseId || fallback?.courseId || "",
    nativePaymentTransactionId: record.nativeTransactionId || fallback?.nativePaymentTransactionId || "",
    operationalLabel: "",
    detailHref: buildPaymentDetailHref(hubSlug, `ledger_${record.id}`, routeMode),
  };
}

function mapProjectedPaymentItemToPaymentItem(item, hubSlug, routeMode = "path") {
  const kind = mapProjectedPaymentItemTypeToItemKind(item.type);
  const paymentRecordId = normalizeString(item.paymentRecordId);
  const detailItemId = paymentRecordId ? `ledger_${paymentRecordId}` : item.id;
  const userName = normalizeString(item.displayName);
  const userEmail = normalizeString(item.email).toLowerCase();

  return {
    id: item.id,
    ledgerRecordId: paymentRecordId,
    recordId: paymentRecordId || item.sourceId,
    kind,
    title: item.title || (kind === "course" ? "Course enrolment" : kind === "event" ? "Event booking" : "Membership"),
    status: item.status,
    paymentStatus: item.paymentStatus || "unpaid",
    amountMinor: item.amountMinor,
    amount: item.amountDisplay,
    currency: item.currency || getFallbackRegionalMarket().defaultCurrency,
    refundAmountMinor: item.refundAmountMinor,
    lifecycleDate: item.sortAt || item.paidAt || item.dueAt || item.updatedAt || item.createdAt,
    lifecycleLabel:
      item.paymentStatus === "paid"
        ? "Paid"
        : item.paymentStatus === "refunded"
          ? "Refunded"
          : item.paymentStatus === "failed"
            ? "Failed"
            : item.paymentStatus === "overdue"
              ? "Overdue"
              : "Due",
    dueDate: item.dueAt || item.sortAt || item.updatedAt || item.createdAt,
    detail:
      kind === "course"
        ? "Course enrolment payment state."
        : kind === "event"
          ? "Event booking payment state."
          : "Membership payment record.",
    userId: item.userId,
    userName,
    userEmail,
    eventId: kind === "event" ? item.sourceParentId : "",
    courseId: kind === "course" ? item.sourceParentId : "",
    nativePaymentTransactionId: item.nativeTransactionId,
    operationalLabel: "",
    detailHref: buildPaymentDetailHref(hubSlug, detailItemId, routeMode),
    memberRecordAvailable: Boolean(item.userId),
    memberHref: buildMemberHref(hubSlug, item.userId, routeMode),
  };
}

function buildSummaryRows(item, record = null, transaction = null) {
  const lifecycleLabel = normalizeString(item.lifecycleLabel);
  const rows = [
    { label: "Amount", value: normalizeString(item.amount) || "Amount to be confirmed" },
    { label: "Currency", value: normalizeString(item.currency) || getFallbackRegionalMarket().defaultCurrency },
    { label: lifecycleLabel ? `${lifecycleLabel} date` : "Recorded date", value: normalizeString(item.lifecycleDate || item.dueDate) || "To be confirmed" },
  ];

  if (item.kind === "membership") {
    rows.push({
      label: transaction ? "Checkout status" : "Membership status",
      value:
        transaction?.statusLabel ||
        normalizeString(record?.derivedStatus || record?.operationalStatus || record?.status || record?.financialStatus) ||
        "active",
    });
  }

  if (item.kind === "event" || item.kind === "course") {
    rows.push({
      label: item.kind === "course" ? "Enrolment status" : "Booking status",
      value: normalizeString(record?.status || item.status) || (item.kind === "course" ? "enrolled" : "registered"),
    });
  }

  return rows;
}

function buildLifecycleRows(item, record = null, transaction = null, paymentRecord = null) {
  const rows = [];

  const addRow = (label, value) => {
    const normalizedValue = normalizeString(value);

    if (normalizedValue) {
      rows.push({ label, value: normalizedValue });
    }
  };

  addRow(
    "Payment received",
    paymentRecord?.paidAt || record?.paidAt || record?.paymentCompletedAt || record?.paymentDate || transaction?.paymentReceivedAt
  );
  if (
    normalizeString(transaction?.status) === "payment_failed" ||
    normalizeString(paymentRecord?.financialStatus) === "failed"
  ) {
    addRow("Payment failed", transaction?.updatedAt || paymentRecord?.updatedAt);
  }
  if (normalizeString(record?.status || record?.operationalStatus) === "cancelled") {
    addRow(item.kind === "course" ? "Enrolment cancelled" : "Booking cancelled", record?.updatedAt);
  }
  addRow("Refunded", paymentRecord?.refundedAt || transaction?.refundedAt);

  return rows;
}

export async function listHubPaymentItemsBySlug(hubSlug, options = {}) {
  const hub = await getHubBySlug(hubSlug);
  if (!hub) {
    return { hub: null, items: [], summary: summarizeHubPaymentItems([]) };
  }

  return getHubPaymentReportByHub(hub, options);
}

function resolvePreloadedCollection(preloaded, key, fallback) {
  return Array.isArray(preloaded?.[key]) ? Promise.resolve(preloaded[key]) : fallback();
}

export async function getHubPaymentReportByHub(hub, preloaded = {}) {
  if (!hub?.id) {
    return { hub: null, items: [], summary: summarizeHubPaymentItems([]) };
  }

  const routeMode = normalizeHubRouteMode(preloaded.routeMode);
  const [memberships, paymentRecords, nativeTransactions, pendingUpgradeRequests, users, eventItems, courseItems] = await Promise.all([
    resolvePreloadedCollection(preloaded, "memberships", () => listMembershipPaymentItemsByHub(hub.id)),
    resolvePreloadedCollection(preloaded, "paymentRecords", () => listPaymentRecordsByHub(hub.id)),
    resolvePreloadedCollection(preloaded, "nativeTransactions", () => listNativePaymentTransactionsByHub(hub.id)),
    resolvePreloadedCollection(preloaded, "pendingUpgradeRequests", () => listPendingMembershipUpgradeRequestsByHub(hub.id)),
    resolvePreloadedCollection(preloaded, "users", () => listUsersByHub(hub.id)),
    resolvePreloadedCollection(preloaded, "eventItems", () => listEventBookingPaymentItemsByHub(hub.id)),
    resolvePreloadedCollection(preloaded, "courseItems", () => listCoursePaymentItemsByHub(hub.id)),
  ]);
  const reportablePaymentRecords = filterDuplicateMembershipCyclePaymentRecords(paymentRecords);
  const usersById = new Map(users.map((user) => [user.id, user]));
  const pendingUpgradeRequestsById = new Map(
    pendingUpgradeRequests.map((request) => [request.id, request])
  );
  const ledgerNativeTransactionIds = new Set(
    reportablePaymentRecords
      .map((record) => normalizeString(record.nativeTransactionId))
      .filter(Boolean)
  );
  const usersByPaymentRecordUserId = new Map(users.map((user) => [normalizeString(user.id), user]));
  const eventItemsByBookingId = new Map(eventItems.map((item) => [normalizeString(item.recordId), item]));
  const courseItemsByRegistrationId = new Map(courseItems.map((item) => [normalizeString(item.recordId), item]));
  const ledgerMembershipUpgradeKeys = new Set(
    reportablePaymentRecords
      .filter((record) => normalizeString(record.kind) === "membership_upgrade")
      .map((record) =>
        [
          normalizeString(record.userId),
          normalizeMembershipCommercialTitle(record.title),
          normalizeString(record.amountDisplay),
          normalizeString(record.currency).toUpperCase(),
        ].join("::")
      )
  );
  const ledgerMembershipPaymentSourceIds = new Set(
    reportablePaymentRecords
      .filter((record) => normalizeString(record.sourceType) === "membershipPayment")
      .map((record) => normalizeString(record.sourceId))
      .filter(Boolean)
  );

  const membershipItems = memberships.map((membership) => ({
      id: `membership_payment_${membership.id}`,
      recordId: membership.id,
      kind: "membership",
      title: membership.title || "Membership",
      pricingMode: membership.pricingMode,
      paymentStatus: membership.paymentStatus,
      amountMinor: parseDisplayAmountToMinor(membership.amount, membership.currency),
      amount: membership.amount,
      currency: membership.currency,
      refundAmountMinor: 0,
      lifecycleDate:
        normalizeString(membership.paymentStatus) === "paid"
          ? normalizeString(membership.paymentDate)
          : normalizeString(membership.updatedAt) || normalizeString(membership.renewalDate) || normalizeString(membership.createdAt),
      lifecycleLabel:
        normalizeString(membership.paymentStatus) === "paid"
          ? "Paid"
          : normalizeString(membership.paymentStatus) === "overdue"
            ? "Overdue"
            : normalizeString(membership.paymentStatus) === "failed"
              ? "Failed"
              : "Due",
      dueDate: membership.renewalDate,
      detail: membership.renewalDate ? "Membership renewal cycle." : "Membership plan payment record.",
      userId: membership.userId,
      userName: normalizeString(membership.userName),
      userEmail: normalizeString(membership.userEmail).toLowerCase(),
      detailHref: buildPaymentDetailHref(hub.slug, `membership_payment_${membership.id}`, routeMode),
    }))
    .filter((membership) => {
      if (ledgerMembershipPaymentSourceIds.has(normalizeString(membership.recordId))) {
        return false;
      }

      if (normalizeString(membership.paymentStatus) === "not_required") {
        return false;
      }

      const key = [
        normalizeString(membership.userId),
        normalizeMembershipCommercialTitle(membership.title),
        normalizeString(membership.amount),
        normalizeString(membership.currency).toUpperCase(),
      ].join("::");

      if (
        normalizeString(membership.pricingMode) === "paid" &&
        normalizeString(membership.paymentStatus) === "paid" &&
        ledgerMembershipUpgradeKeys.has(key)
      ) {
        return false;
      }

      return true;
    });

  const ledgerItems = reportablePaymentRecords
    .filter((record) => normalizeString(record.reportingEligibility) !== "informational_only")
    .map((record) => {
      const user = usersByPaymentRecordUserId.get(normalizeString(record.userId));
      const fallback =
        normalizeString(record.kind) === "event_registration"
          ? eventItemsByBookingId.get(normalizeString(record.eventRegistrationId || record.sourceId))
          : normalizeString(record.kind) === "event_booking"
            ? eventItemsByBookingId.get(normalizeString(record.eventBookingId || record.sourceId))
          : normalizeString(record.kind) === "course_registration"
            ? courseItemsByRegistrationId.get(normalizeString(record.courseRegistrationId || record.sourceId))
            : null;

      return mapLedgerRecordToPaymentItem(record, hub.slug, user, fallback, routeMode);
    });
  const legacyNativeMembershipUpgradeItems = nativeTransactions
    .filter(
      (transaction) =>
        !ledgerNativeTransactionIds.has(normalizeString(transaction.id)) &&
        isNativeTransactionOperationallyRelevant(transaction) &&
        isPendingNativeUpgradeTransaction(transaction, pendingUpgradeRequestsById)
    )
    .map((transaction) => {
      const user = usersById.get(transaction.userId);

      return {
        id: `native_${transaction.id}`,
        recordId: transaction.id,
        kind: "membership",
        operationalLabel: "Stripe upgrade",
        title: transaction.planTitle
          ? `${transaction.planTitle} upgrade`
          : "Membership upgrade",
        paymentStatus: mapNativeTransactionStatusToPaymentStatus(transaction),
        amountMinor: Number.isFinite(Number(transaction.amountMinor)) ? Number(transaction.amountMinor) : parseDisplayAmountToMinor(transaction.amount, transaction.currency),
        amount: transaction.amount,
        currency: transaction.currency,
        refundAmountMinor: Number.isFinite(Number(transaction.refundAmountMinor)) ? Number(transaction.refundAmountMinor) : 0,
        lifecycleDate:
          normalizeString(transaction.status) === "payment_received"
            ? normalizeString(transaction.paymentReceivedAt)
            : normalizeString(transaction.updatedAt) || normalizeString(transaction.createdAt),
        lifecycleLabel: normalizeString(transaction.status) === "payment_received" ? "Paid" : "Recorded",
        dueDate: transaction.paymentReceivedAt || transaction.checkoutCompletedAt || transaction.updatedAt || transaction.createdAt,
        detail:
          transaction.status === "payment_received"
            ? "Stripe payment received for a membership upgrade."
            : transaction.status === "payment_failed"
              ? "Stripe payment failed for a membership upgrade."
              : transaction.status === "checkout_cancelled"
                ? "Stripe checkout was cancelled before payment completed."
                : "Stripe checkout is in progress for a membership upgrade.",
        userId: transaction.userId,
        userName: normalizeString(user?.name),
        userEmail: normalizeString(user?.email).toLowerCase(),
        detailHref: buildPaymentDetailHref(hub.slug, `native_${transaction.id}`, routeMode),
      };
    });
  const fallbackEventItems = eventItems
    .filter((item) => !ledgerNativeTransactionIds.has(normalizeString(item.nativePaymentTransactionId)))
    .map((item) => ({
      ...item,
      amountMinor: parseDisplayAmountToMinor(item.amount, item.currency),
      refundAmountMinor: 0,
      lifecycleDate:
        normalizeString(item.paymentStatus) === "paid"
          ? normalizeString(item.paymentCompletedAt)
          : normalizeString(item.paymentStatus) === "refunded"
            ? normalizeString(item.updatedAt)
            : normalizeString(item.paymentStatus) === "failed" || normalizeString(item.paymentStatus) === "overdue"
              ? normalizeString(item.updatedAt)
              : normalizeString(item.createdAt),
      lifecycleLabel:
        normalizeString(item.paymentStatus) === "paid"
          ? "Paid"
          : normalizeString(item.paymentStatus) === "refunded"
            ? "Refunded"
            : normalizeString(item.paymentStatus) === "failed"
              ? "Failed"
              : normalizeString(item.paymentStatus) === "overdue"
                ? "Overdue"
                : "Recorded",
      detailHref: buildPaymentDetailHref(hub.slug, item.id, routeMode),
    }));
  const fallbackCourseItems = courseItems
    .filter((item) => !ledgerNativeTransactionIds.has(normalizeString(item.nativePaymentTransactionId)))
    .map((item) => ({
      ...item,
      amountMinor: parseDisplayAmountToMinor(item.amount, item.currency),
      refundAmountMinor: 0,
      lifecycleDate:
        normalizeString(item.paymentStatus) === "paid"
          ? normalizeString(item.paymentCompletedAt)
          : normalizeString(item.paymentStatus) === "refunded"
            ? normalizeString(item.updatedAt)
            : normalizeString(item.paymentStatus) === "failed" || normalizeString(item.paymentStatus) === "overdue"
              ? normalizeString(item.updatedAt)
              : normalizeString(item.createdAt),
      lifecycleLabel:
        normalizeString(item.paymentStatus) === "paid"
          ? "Paid"
          : normalizeString(item.paymentStatus) === "refunded"
            ? "Refunded"
            : normalizeString(item.paymentStatus) === "failed"
              ? "Failed"
              : normalizeString(item.paymentStatus) === "overdue"
                ? "Overdue"
                : "Recorded",
      detailHref: buildPaymentDetailHref(hub.slug, item.id, routeMode),
    }));

  const items = sortItems([
    ...membershipItems,
    ...ledgerItems,
    ...legacyNativeMembershipUpgradeItems,
    ...fallbackEventItems,
    ...fallbackCourseItems,
  ]).map((item) => ({
    ...item,
    memberRecordAvailable: usersById.has(normalizeString(item.userId)),
    memberHref: buildMemberHref(hub.slug, item.userId, routeMode),
  }));
  const locale = resolveLaunchFormattingLocale(hub.locale, hub.country);

  return {
    hub,
    items,
    summary: {
      ...summarizeHubPaymentItems(items),
      collectedRevenue: summarizePaymentItemCollectedRevenue(
        items,
        (amount, currency) => formatMoney(amount, currency, locale),
        hub.defaultCurrency || "USD"
      ),
      refundedRevenue: summarizePaymentItemRefundedRevenue(
        items,
        (amount, currency) => formatMoney(amount, currency, locale),
        hub.defaultCurrency || "USD"
      ),
      recordCounts: summarizeLedgerRecordCounts({
        paymentRecords: reportablePaymentRecords,
        nativeTransactions,
      }),
    },
  };
}

export async function getHubPaymentProjectionReportByHub(hub, options = {}) {
  if (!hub?.id) {
    return {
      hub: null,
      items: [],
      summary: summarizeHubPaymentItems([]),
      pageInfo: {
        nextCursor: "",
        hasMore: false,
      },
    };
  }

  const routeMode = normalizeHubRouteMode(options.routeMode);
  const page = await listPaymentItemPageByHubId(hub.id, {
    limit: options.limit || 100,
    cursor: options.cursor,
    status: options.status,
    paymentStatus: options.paymentStatus,
    attentionStatus: options.attentionStatus,
    type: options.type,
    userId: options.userId,
    memberId: options.memberId,
  });
  const reportableProjectionItems = filterDuplicateProjectedMembershipCyclePaymentItems(page.items);
  const items = reportableProjectionItems
    .filter((item) => normalizeString(item.reportingEligibility) !== "informational_only")
    .map((item) => mapProjectedPaymentItemToPaymentItem(item, hub.slug, routeMode));
  const locale = resolveLaunchFormattingLocale(hub.locale, hub.country);

  return {
    hub,
    items,
    summary: {
      ...summarizeHubPaymentItems(items),
      collectedRevenue: summarizePaymentItemCollectedRevenue(
        items,
        (amount, currency) => formatMoney(amount, currency, locale),
        hub.defaultCurrency || "USD"
      ),
      refundedRevenue: summarizePaymentItemRefundedRevenue(
        items,
        (amount, currency) => formatMoney(amount, currency, locale),
        hub.defaultCurrency || "USD"
      ),
      recordCounts: {
        paid: items.filter((item) => normalizeString(item.paymentStatus) === "paid").length,
        refunded: items.filter((item) => {
          const paymentStatus = normalizeString(item.paymentStatus);
          return paymentStatus === "refunded" || paymentStatus === "partially_refunded";
        }).length,
        failed: items.filter((item) => normalizeString(item.paymentStatus) === "failed").length,
      },
    },
    pageInfo: {
      nextCursor: page.nextCursor,
      hasMore: page.hasMore,
    },
  };
}

export async function getHubPaymentItemDetailBySlug(hubSlug, paymentItemId, options = {}) {
  const normalizedPaymentItemId = normalizeString(paymentItemId);
  const routeMode = normalizeHubRouteMode(options.routeMode);
  const { hub, items } = await listHubPaymentItemsBySlug(hubSlug, { routeMode });

  if (!hub || !normalizedPaymentItemId) {
    return { hub: null, item: null, detail: null };
  }

  const item = items.find((candidate) => candidate.id === normalizedPaymentItemId);

  if (!item) {
    return { hub, item: null, detail: null };
  }

  let record = null;
  let transaction = null;
  let paymentRecord = null;
  let currentEvent = null;

  if (normalizedPaymentItemId.startsWith("ledger_")) {
    paymentRecord = await getPaymentRecordById(hub.id, item.recordId);

    if (paymentRecord?.nativeTransactionId) {
      transaction = await getNativePaymentTransactionById(hub.id, paymentRecord.nativeTransactionId);
    }

    if (normalizeString(paymentRecord?.kind) === "event_registration" && paymentRecord?.eventId && paymentRecord?.eventRegistrationId) {
      record = await getEventRegistrationById(hub.id, paymentRecord.eventId, paymentRecord.eventRegistrationId);
    } else if (normalizeString(paymentRecord?.kind) === "event_booking" && paymentRecord?.eventId && paymentRecord?.eventBookingId) {
      record = await getEventBookingById(hub.id, paymentRecord.eventId, paymentRecord.eventBookingId);
    } else if (
      normalizeString(paymentRecord?.kind) === "course_registration" &&
      paymentRecord?.courseId &&
      paymentRecord?.courseRegistrationId
    ) {
      record = await getCourseRegistrationById(hub.id, paymentRecord.courseId, paymentRecord.courseRegistrationId);
    } else {
      record = paymentRecord;
    }
  } else if (normalizedPaymentItemId.startsWith("native_")) {
    transaction = await getNativePaymentTransactionById(hub.id, item.recordId);

    if (transaction?.paymentRecordId) {
      paymentRecord = await getPaymentRecordById(hub.id, transaction.paymentRecordId);
    }

    if (!paymentRecord) {
      paymentRecord = await getPaymentRecordByNativeTransactionId(hub.id, item.recordId);
    }

    if (!transaction && paymentRecord?.nativeTransactionId) {
      transaction = await getNativePaymentTransactionById(hub.id, paymentRecord.nativeTransactionId);
    }
    record = paymentRecord;
  } else if (normalizedPaymentItemId.startsWith("membership_payment_")) {
    record = await getMembershipPaymentRecordById(hub.id, item.recordId);
  } else if (normalizedPaymentItemId.startsWith("event_") && item.eventId) {
    record = await getEventBookingById(hub.id, item.eventId, item.recordId);

    if (record?.nativePaymentTransactionId) {
      transaction = await getNativePaymentTransactionById(hub.id, record.nativePaymentTransactionId);

      if (transaction?.paymentRecordId) {
        paymentRecord = await getPaymentRecordById(hub.id, transaction.paymentRecordId);
      }

      if (!paymentRecord) {
        paymentRecord = await getPaymentRecordByNativeTransactionId(hub.id, record.nativePaymentTransactionId);
      }
    }
  } else if (normalizedPaymentItemId.startsWith("course_") && item.courseId) {
    record = await getCourseRegistrationById(hub.id, item.courseId, item.recordId);

    if (record?.nativePaymentTransactionId) {
      transaction = await getNativePaymentTransactionById(hub.id, record.nativePaymentTransactionId);

      if (transaction?.paymentRecordId) {
        paymentRecord = await getPaymentRecordById(hub.id, transaction.paymentRecordId);
      }

      if (!paymentRecord) {
        paymentRecord = await getPaymentRecordByNativeTransactionId(hub.id, record.nativePaymentTransactionId);
      }
    }
  }

  if (item.kind === "event" && item.eventId) {
    currentEvent = await getEventById(hub.id, item.eventId);
  }

  const linkedRecord = buildLinkedRecordDetail(hub.slug, item, record || transaction, routeMode);
  const member = buildMemberDetail(hub.slug, item, routeMode);
  const eventComparisonRows = item.kind === "event" ? buildEventSnapshotComparison(record, currentEvent) : [];

  return {
    hub,
    item,
    detail: {
      title: item.title || "Payment record",
      member,
      linkedRecord: {
        ...linkedRecord,
        comparisonRows: eventComparisonRows,
        snapshotDrift: item.kind === "event" ? hasEventSnapshotDrift(record, currentEvent) : false,
      },
      summaryRows: buildSummaryRows(item, record, transaction),
      lifecycleRows: buildLifecycleRows(item, record, transaction, paymentRecord),
      transactionStatusLabel: transaction?.statusLabel || "",
      refundStatus: normalizeString(transaction?.refundStatus),
      refundAmount: normalizeString(transaction?.refundAmount),
      refundAmountMinor: transaction?.refundAmountMinor || 0,
      recordUpdatedAt: normalizeString(paymentRecord?.updatedAt || record?.updatedAt || transaction?.updatedAt),
      nextAction: member?.href ? { href: member.href, label: "View member" } : null,
    },
  };
}
