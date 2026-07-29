import { getFallbackRegionalMarket } from "@/lib/domain/regional-markets";

function normalizeString(value) {
  return String(value || "").trim();
}

const statusLabels = {
  checkout_open: "Checkout open",
  checkout_cancelled: "Checkout cancelled",
  checkout_completed: "Checkout completed",
  payment_received: "Payment received",
  payment_failed: "Payment failed",
};

const statusTones = {
  checkout_open: "warning",
  checkout_cancelled: "neutral",
  checkout_completed: "warning",
  payment_received: "success",
  payment_failed: "danger",
};

const allowedKinds = new Set(["membership_upgrade", "event_registration", "event_booking", "course_registration"]);

export function normalizeNativePaymentTransactionRecord(record = {}) {
  const kind = normalizeString(record.kind) || "membership_upgrade";
  const status = normalizeString(record.status) || "checkout_open";

  return {
    id: normalizeString(record.id),
    hubId: normalizeString(record.hubId),
    userId: normalizeString(record.userId),
    kind: allowedKinds.has(kind) ? kind : "membership_upgrade",
    status,
    statusLabel: statusLabels[status] || "Unknown",
    statusTone: statusTones[status] || "neutral",
    provider: normalizeString(record.provider) || "stripe",
    paymentRecordId: normalizeString(record.paymentRecordId),
    stripeAccountId: normalizeString(record.stripeAccountId),
    stripeCheckoutSessionId: normalizeString(record.stripeCheckoutSessionId),
    stripePaymentIntentId: normalizeString(record.stripePaymentIntentId),
    membershipUpgradeRequestId: normalizeString(record.membershipUpgradeRequestId),
    membershipId: normalizeString(record.membershipId),
    planId: normalizeString(record.planId),
    planTitle: normalizeString(record.planTitle),
    eventId: normalizeString(record.eventId),
    eventTitle: normalizeString(record.eventTitle),
    eventBookingId: normalizeString(record.eventBookingId),
    courseId: normalizeString(record.courseId),
    courseTitle: normalizeString(record.courseTitle),
    registrationId: normalizeString(record.registrationId),
    amountMinor: Number.parseInt(String(record.amountMinor || ""), 10) || 0,
    amount: normalizeString(record.amount),
    currency: normalizeString(record.currency).toUpperCase() || getFallbackRegionalMarket().defaultCurrency,
    checkoutUrl: normalizeString(record.checkoutUrl),
    applicationFeeAmountMinor: Number.parseInt(String(record.applicationFeeAmountMinor || ""), 10) || 0,
    refundStatus: normalizeString(record.refundStatus),
    refundAmountMinor: Number.parseInt(String(record.refundAmountMinor || ""), 10) || 0,
    refundAmount: normalizeString(record.refundAmount),
    refundedAt: normalizeString(record.refundedAt),
    stripeRefundId: normalizeString(record.stripeRefundId),
    checkoutCompletedAt: normalizeString(record.checkoutCompletedAt),
    paymentReceivedAt: normalizeString(record.paymentReceivedAt),
    createdAt: normalizeString(record.createdAt),
    updatedAt: normalizeString(record.updatedAt),
    updatedBy: normalizeString(record.updatedBy),
  };
}
