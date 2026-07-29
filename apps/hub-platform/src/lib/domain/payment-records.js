function normalizeString(value) {
  return String(value || "").trim();
}

export function resolveOfferingRegistrationLedgerState(
  transactionStatus,
  { refunded = false, refundAmountMinor = 0, totalAmountMinor = 0 } = {}
) {
  const normalizedStatus = normalizeString(transactionStatus);
  const normalizedRefundAmountMinor = Number.parseInt(String(refundAmountMinor || ""), 10) || 0;
  const normalizedTotalAmountMinor = Number.parseInt(String(totalAmountMinor || ""), 10) || 0;

  if (refunded) {
    if (
      normalizedRefundAmountMinor > 0 &&
      normalizedTotalAmountMinor > 0 &&
      normalizedRefundAmountMinor < normalizedTotalAmountMinor
    ) {
      return {
        operationalStatus: "completed",
        financialStatus: "partially_refunded",
      };
    }

    return {
      operationalStatus: "cancelled",
      financialStatus: "refunded",
    };
  }

  if (normalizedStatus === "payment_received") {
    return {
      operationalStatus: "completed",
      financialStatus: "paid",
    };
  }

  if (normalizedStatus === "payment_failed") {
    return {
      operationalStatus: "cancelled",
      financialStatus: "failed",
    };
  }

  if (normalizedStatus === "checkout_cancelled") {
    return {
      operationalStatus: "cancelled",
      financialStatus: "unpaid",
    };
  }

  return {
    operationalStatus: "open",
    financialStatus: "unpaid",
  };
}

export function resolveMembershipUpgradeLedgerState(transactionStatus, { membershipApplied = false } = {}) {
  const normalizedStatus = normalizeString(transactionStatus);

  if (normalizedStatus === "payment_received") {
    return {
      operationalStatus: membershipApplied ? "completed" : "pending_confirmation",
      financialStatus: "paid",
    };
  }

  if (normalizedStatus === "payment_failed") {
    return {
      operationalStatus: "cancelled",
      financialStatus: "failed",
    };
  }

  if (normalizedStatus === "checkout_cancelled") {
    return {
      operationalStatus: "cancelled",
      financialStatus: "unpaid",
    };
  }

  return {
    operationalStatus: "open",
    financialStatus: "unpaid",
  };
}
