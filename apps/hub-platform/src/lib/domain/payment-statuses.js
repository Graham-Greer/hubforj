function normalizeString(value) {
  return String(value || "").trim();
}

export const sharedPaymentStatusLabels = {
  paid: "Paid",
  unpaid: "Unpaid",
  overdue: "Overdue",
  failed: "Failed",
  not_required: "Not required",
  refunded: "Refunded",
  partially_refunded: "Partially refunded",
};

export const sharedPaymentStatusTones = {
  paid: "success",
  unpaid: "warning",
  overdue: "danger",
  failed: "danger",
  not_required: "neutral",
  refunded: "info",
  partially_refunded: "info",
};

export function getSharedPaymentStatusLabel(status) {
  return sharedPaymentStatusLabels[normalizeString(status)] || "Unknown";
}

export function getSharedPaymentStatusTone(status) {
  return sharedPaymentStatusTones[normalizeString(status)] || "neutral";
}
