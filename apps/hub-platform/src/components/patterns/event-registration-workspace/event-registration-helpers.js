export function normalizeEventBookingPaymentState(registration, pricingMode) {
  if (pricingMode !== "paid") {
    return "free";
  }

  const paymentStatus = String(registration?.paymentStatus || "").trim();
  const allowed = new Set(["pending", "paid", "failed", "partially_refunded", "refunded"]);
  return allowed.has(paymentStatus) ? paymentStatus : "pending";
}

export function getEventBookingPaymentLabel(registration, pricingMode) {
  const normalized = normalizeEventBookingPaymentState(registration, pricingMode);

  if (normalized === "free") {
    return "Free";
  }

  if (normalized === "pending") {
    return "Pending";
  }

  if (normalized === "failed") {
    return "Failed";
  }

  if (normalized === "partially_refunded") {
    return "Partially refunded";
  }

  if (normalized === "refunded") {
    return "Refunded";
  }

  return normalized === "paid" ? "Paid" : "Pending";
}
