import {
  formatMoney,
  formatMoneyFromMinor,
  getMembershipPaymentStatusLabel,
  getMembershipPaymentStatusTone,
} from "@/lib/domain/memberships";

export const typeFilters = [
  { value: "all", label: "All" },
  { value: "membership", label: "Membership" },
  { value: "event", label: "Events" },
  { value: "course", label: "Courses" },
];

export const statusFilters = [
  { value: "all", label: "All" },
  { value: "paid", label: "Paid" },
  { value: "unpaid", label: "Unpaid" },
  { value: "overdue", label: "Overdue" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
  { value: "partially_refunded", label: "Partially refunded" },
];

export function getTypeFilterLabel(value) {
  return typeFilters.find((filter) => filter.value === value)?.label || "All";
}

export function getStatusFilterLabel(value) {
  return statusFilters.find((filter) => filter.value === value)?.label || "All";
}

export const pricingModeOptions = [
  { value: "paid", label: "Paid plan" },
  { value: "free", label: "Free plan" },
];

export const durationUnitOptions = [
  { value: "days", label: "Days" },
  { value: "months", label: "Months" },
  { value: "years", label: "Years" },
];

export const membershipPlanStatusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "archived", label: "Archived" },
];

export const membershipPlanVisibilityOptions = [
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
];

export function getActionRequiredCount(items) {
  return items.filter((item) => item.paymentStatus === "unpaid" || item.paymentStatus === "overdue" || item.paymentStatus === "failed").length;
}

export function getSettledCount(items) {
  return items.filter((item) => item.paymentStatus === "paid" || item.paymentStatus === "not_required" || item.paymentStatus === "partially_refunded").length;
}

export function getOperationalPaymentStatus(item) {
  return item.paymentStatus === "not_required" ? "paid" : item.paymentStatus;
}

export function getOperationalPaymentStatusLabel(item) {
  return getMembershipPaymentStatusLabel(getOperationalPaymentStatus(item));
}

export function getOperationalPaymentStatusTone(item) {
  return getMembershipPaymentStatusTone(getOperationalPaymentStatus(item));
}

export function formatPaymentAmount(item, locale) {
  if (item.paymentStatus === "not_required") {
    return "Free";
  }

  if (item.kind === "membership" && String(item.amount || "") === "0") {
    return "Free";
  }

  if (Number.isFinite(Number(item.amountMinor))) {
    return formatMoneyFromMinor(item.amountMinor, item.currency, locale);
  }

  if (!item.amount) {
    return "Amount to be confirmed";
  }

  return formatMoney(item.amount, item.currency, locale);
}

export function getItemLabel(item) {
  if (item.kind === "membership") {
    return item.title || "Membership";
  }

  return item.title || (item.kind === "course" ? "Course booking" : "Event registration");
}

export function formatPlanSummary(plan, locale) {
  const priceText = plan.pricingMode === "free" ? "Free plan" : formatMoney(plan.price, plan.currency, locale);
  return `${priceText} · every ${plan.durationValue} ${plan.durationUnit}`;
}

export function getMembershipPlanValues(plan, fallbackCurrency = "USD") {
  return {
    title: plan?.title || "",
    description: plan?.description || "",
    pricingMode: plan?.pricingMode || "paid",
    price: plan?.price || "",
    currency: plan?.currency || fallbackCurrency,
    externalPaymentUrl: plan?.externalPaymentUrl || "",
    paymentInstructions: plan?.paymentInstructions || "",
    durationUnit: plan?.durationUnit || "months",
    durationValue: String(plan?.durationValue || 12),
    visibility: plan?.visibility || "public",
    status: plan?.status || "active",
  };
}

export { getMembershipPaymentStatusLabel, getMembershipPaymentStatusTone };
