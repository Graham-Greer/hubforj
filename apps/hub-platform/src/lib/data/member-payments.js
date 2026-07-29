try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getCurrentMembershipByUser } from "@/lib/data/memberships";
import { listCourseRegistrationsByUser } from "@/lib/data/course-registrations";
import { listEventBookingsByBooker } from "@/lib/data/event-bookings";
import { listPaymentRecordsByUser } from "@/lib/data/payment-records";
import { buildMemberPaymentItems } from "@/lib/domain/member-account";

function normalizeString(value) {
  return String(value || "").trim();
}

export async function listMemberPaymentItems(hubId, userId) {
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
