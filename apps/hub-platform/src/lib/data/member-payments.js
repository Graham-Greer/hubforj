try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getCurrentMembershipByUser } from "@/lib/data/memberships";
import { listCourseRegistrationsByUser } from "@/lib/data/course-registrations";
import { listEventBookingsByBooker } from "@/lib/data/event-bookings";
import { listPaymentRecordsByUser } from "@/lib/data/payment-records";
import { listPaymentItemPageByHubId } from "@/lib/data/payment-items";
import { filterDuplicateProjectedMembershipCyclePaymentItems, mapPaymentItemTypeToAdminKind } from "@/lib/data/payment-summary";
import { buildMemberPaymentItems } from "@/lib/domain/member-account";
import { getFallbackRegionalMarket } from "@/lib/domain/regional-markets";

function normalizeString(value) {
  return String(value || "").trim();
}

function parseInteger(value) {
  const numeric = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(numeric) ? numeric : 0;
}

function isPaymentItemsReadModelEnabled() {
  return normalizeString(process.env.HUB_PLATFORM_PAYMENT_ITEMS_READ_MODEL_ENABLED).toLowerCase() === "true";
}

function resolveProjectionBillingDate(item = {}) {
  const paymentStatus = normalizeString(item.paymentStatus);

  if (paymentStatus === "paid") {
    return (
      normalizeString(item.paidAt) ||
      normalizeString(item.occurredAt) ||
      normalizeString(item.updatedAt) ||
      normalizeString(item.createdAt)
    );
  }

  return (
    normalizeString(item.dueAt) ||
    normalizeString(item.paidAt) ||
    normalizeString(item.refundedAt) ||
    normalizeString(item.occurredAt) ||
    normalizeString(item.sortAt) ||
    normalizeString(item.updatedAt) ||
    normalizeString(item.createdAt)
  );
}

function resolveProjectionBillingDetail(item = {}) {
  const kind = mapPaymentItemTypeToAdminKind(item.type);
  const paymentStatus = normalizeString(item.paymentStatus);

  if (kind === "event") {
    return paymentStatus === "paid"
      ? "Payment received for your event booking."
      : paymentStatus === "failed"
        ? "Payment failed for your event booking."
        : "Event booking payment state.";
  }

  if (kind === "course") {
    return paymentStatus === "paid"
      ? "Payment received for your course enrolment."
      : paymentStatus === "failed"
        ? "Payment failed for your course enrolment."
        : "Course enrolment payment state.";
  }

  if (normalizeString(item.type) === "upgradeRequest") {
    return paymentStatus === "paid"
      ? "Payment received for your membership upgrade."
      : paymentStatus === "failed"
        ? "Payment failed for your membership upgrade."
        : normalizeString(item.status) === "cancelled"
          ? "Checkout was cancelled before payment completed."
          : "Membership upgrade payment state.";
  }

  return "Membership payment record.";
}

function mapProjectionToMemberPaymentItem(item = {}) {
  const kind = mapPaymentItemTypeToAdminKind(item.type);
  const sourceSlug = normalizeString(item.sourceSlug);

  return {
    id: item.id,
    recordId: item.paymentRecordId || item.sourceId || item.id,
    sourceId: item.sourceId,
    userId: item.userId,
    kind,
    title: item.title || (kind === "course" ? "Course enrolment" : kind === "event" ? "Event booking" : "Membership"),
    status: item.status,
    paymentStatus: normalizeString(item.paymentStatus) || "unpaid",
    amountMinor: parseInteger(item.amountMinor),
    amount: normalizeString(item.amountDisplay),
    currency: normalizeString(item.currency).toUpperCase() || getFallbackRegionalMarket().defaultCurrency,
    dueDate: resolveProjectionBillingDate(item),
    detail: resolveProjectionBillingDetail(item),
    eventId: kind === "event" ? item.sourceParentId : "",
    eventSlug: kind === "event" ? sourceSlug : "",
    courseId: kind === "course" ? item.sourceParentId : "",
    courseSlug: kind === "course" ? sourceSlug : "",
    membershipId: kind === "membership" ? item.sourceParentId : "",
    nativePaymentTransactionId: item.nativeTransactionId,
  };
}

async function listMemberProjectedPaymentItems(hubId, userId, options = {}) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedUserId = normalizeString(userId);

  if (!normalizedHubId || !normalizedUserId) {
    return [];
  }

  const page = await listPaymentItemPageByHubId(normalizedHubId, {
    userId: normalizedUserId,
    limit: options.limit || 100,
  });

  const projectedItems = filterDuplicateProjectedMembershipCyclePaymentItems(page.items)
    .map(mapProjectionToMemberPaymentItem)
    .sort((left, right) => String(right.dueDate || "").localeCompare(String(left.dueDate || "")));

  return projectedItems;
}

async function listMemberLegacyPaymentItems(hubId, userId) {
  const [membership, eventBookings, courseRegistrations, paymentRecords] = await Promise.all([
    getCurrentMembershipByUser(hubId, userId),
    listEventBookingsByBooker(hubId, userId),
    listCourseRegistrationsByUser(hubId, userId),
    listPaymentRecordsByUser(hubId, userId),
  ]);

  const items = buildMemberPaymentItems({ membership, eventBookings, courseRegistrations });
  const paymentRecordsByNativeTransactionId = new Map(
    paymentRecords
      .filter((record) => normalizeString(record.nativeTransactionId))
      .map((record) => [normalizeString(record.nativeTransactionId), record])
  );
  const ledgerUpgradeItems = paymentRecords
    .filter((record) => normalizeString(record.kind) === "membership_upgrade")
    .filter((record) => normalizeString(record.reportingEligibility) !== "informational_only")
    .map((record) => ({
      id: `native_${record.nativeTransactionId || record.id}`,
      recordId: record.nativeTransactionId || record.id,
      userId,
      kind: "membership",
      title: record.title || "Membership upgrade",
      paymentStatus: normalizeString(record.financialStatus) || "unpaid",
      amount: record.amountDisplay,
      currency: record.currency,
      dueDate: record.paidAt || record.occurredAt || record.updatedAt || record.createdAt,
      detail:
        record.financialStatus === "paid"
          ? "Payment received for your membership upgrade."
          : record.financialStatus === "failed"
            ? "Payment failed for your membership upgrade."
            : record.operationalStatus === "cancelled"
              ? "Checkout was cancelled before payment completed."
              : "Checkout is in progress for your membership upgrade.",
      nativePaymentTransactionId: record.nativeTransactionId,
    }));

  return [...items, ...ledgerUpgradeItems]
    .map((item) => {
      const paymentRecord = paymentRecordsByNativeTransactionId.get(normalizeString(item.nativePaymentTransactionId));

      if (!paymentRecord || normalizeString(item.kind) === "membership") {
        return item;
      }

      return {
        ...item,
        paymentStatus: normalizeString(paymentRecord.financialStatus) || item.paymentStatus,
        amount: paymentRecord.amountDisplay || item.amount,
        currency: paymentRecord.currency || item.currency,
        dueDate: paymentRecord.paidAt || paymentRecord.dueAt || item.dueDate,
      };
    })
    .sort((left, right) => String(right.dueDate || "").localeCompare(String(left.dueDate || "")));
}

export async function listMemberPaymentItems(hubId, userId, options = {}) {
  if (isPaymentItemsReadModelEnabled()) {
    return listMemberProjectedPaymentItems(hubId, userId, options);
  }

  return listMemberLegacyPaymentItems(hubId, userId);
}
