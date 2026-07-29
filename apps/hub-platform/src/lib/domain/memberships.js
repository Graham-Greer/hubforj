import {
  normalizeOfferingPaymentConfiguration,
  resolveOfferingPaymentConfiguration,
} from "@/lib/domain/offering-payments";
import {
  getSharedPaymentStatusLabel,
  getSharedPaymentStatusTone,
  sharedPaymentStatusLabels,
  sharedPaymentStatusTones,
} from "@/lib/domain/payment-statuses";
import { buildHubRuntimeHref } from "@/lib/domain/hub-runtime-paths";
import {
  getFallbackRegionalMarket,
  resolveLaunchFormattingLocale,
} from "@/lib/domain/regional-markets";

function normalizeString(value) {
  return String(value || "").trim();
}

function buildHubFooterContactHref(hubSlug, routeMode = "path") {
  return `${buildHubRuntimeHref(normalizeString(hubSlug), "/", routeMode)}#footer-contact`;
}

function parseIsoDate(value) {
  const normalized = normalizeString(value);
  if (!normalized) {
    return null;
  }

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addDuration(date, unit, value) {
  const next = new Date(date);

  if (unit === "days") {
    next.setDate(next.getDate() + value);
    return next;
  }

  if (unit === "months") {
    next.setMonth(next.getMonth() + value);
    return next;
  }

  if (unit === "years") {
    next.setFullYear(next.getFullYear() + value);
    return next;
  }

  return next;
}

const allowedMembershipPlanStatuses = new Set(["active", "inactive", "archived"]);
const allowedMembershipDurationUnits = new Set(["days", "months", "years"]);
const allowedMembershipPricingModes = new Set(["free", "paid"]);
const allowedMembershipPlanVisibilities = new Set(["public", "private"]);
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

export const membershipStatusLabels = {
  active: "Active",
  inactive: "Inactive",
  cancelled: "Cancelled",
  expired: "Expired",
};

export const membershipStatusTones = {
  active: "success",
  inactive: "warning",
  cancelled: "danger",
  expired: "danger",
};

export const paymentStatusLabels = sharedPaymentStatusLabels;

export const paymentStatusTones = sharedPaymentStatusTones;

const allowedMembershipPaymentStatuses = new Set(["paid", "unpaid", "overdue", "failed", "not_required", "refunded", "partially_refunded"]);

export function buildDefaultMembershipPlanPayload(overrides = {}) {
  return {
    title: "Community Membership",
    description: "Default membership for everyone who joins the hub.",
    pricingMode: "free",
    price: "0",
    currency: getFallbackRegionalMarket().defaultCurrency,
    externalPaymentUrl: "",
    paymentInstructions: "",
    durationUnit: "months",
    durationValue: 12,
    visibility: "public",
    status: "active",
    ...overrides,
  };
}

export function findDefaultMembershipPlan(plans = []) {
  return plans.find((plan) => plan?.isDefault === true) || null;
}

export function getAvailableMembershipUpgradePlans(plans = [], currentMembership = null) {
  const currentPlanId = normalizeString(currentMembership?.planId);

  return plans.filter((plan) => {
    if (!plan || normalizeString(plan.status) !== "active") {
      return false;
    }

    if (plan.isDefault === true) {
      return false;
    }

    if (normalizeString(plan.visibility).toLowerCase() !== "public") {
      return false;
    }

    return normalizeString(plan.id) !== currentPlanId;
  });
}

export function buildMembershipUpgradeCta({
  hubSlug,
  plan,
  paymentProcessingMode = "none",
  routeMode = "path",
}) {
  const pricingMode = resolveMembershipPlanPricingMode(plan);
  const externalPaymentUrl = normalizeString(plan?.externalPaymentUrl);
  const paymentInstructions = normalizeString(plan?.paymentInstructions);

  if (pricingMode === "paid" && paymentProcessingMode === "external" && externalPaymentUrl) {
    return {
      label: "Continue to payment",
      href: externalPaymentUrl,
      external: true,
      supportingText:
        paymentInstructions
        || "Payment is handled on an external checkout page. The hub team will confirm your upgraded membership after payment.",
      tone: "external",
    };
  }

  if (pricingMode === "paid" && paymentProcessingMode === "internal") {
    return {
      label: "Upgrade with card",
      href: "",
      supportingText:
        "Complete a secure Stripe checkout to start this upgrade. Your current membership stays active until payment is confirmed and the upgrade is applied.",
      tone: "native",
    };
  }

  return {
    label: "Contact the hub to switch plans",
    href: buildHubFooterContactHref(hubSlug, routeMode),
    supportingText:
      "This plan is available, but plan changes are still handled by the hub team.",
    tone: "contact",
  };
}

export function deriveMembershipStatus(membership, now = new Date()) {
  const status = normalizeString(membership?.status);
  if (status && status !== "active") {
    return status;
  }

  const renewalDate = parseIsoDate(membership?.renewalDate);
  const nowValue = now instanceof Date ? now.getTime() : new Date(now).getTime();

  if (renewalDate && renewalDate.getTime() < nowValue) {
    return "expired";
  }

  return "active";
}

export function getMembershipStatusLabel(status) {
  return membershipStatusLabels[normalizeString(status)] || "Unknown";
}

export function getMembershipStatusTone(status) {
  return membershipStatusTones[normalizeString(status)] || "neutral";
}

export function getMembershipPaymentStatusLabel(status) {
  const normalized = normalizeString(status);

  if (normalized === "not_required") {
    return "Free";
  }

  return getSharedPaymentStatusLabel(normalized);
}

export function getMembershipPaymentStatusTone(status) {
  return getSharedPaymentStatusTone(status);
}

export function formatMembershipDate(value, locale = getFallbackRegionalMarket().defaultLocale) {
  const date = parseIsoDate(value);
  const resolvedLocale = resolveLaunchFormattingLocale(locale);

  if (!date) {
    return "To be confirmed";
  }

  return new Intl.DateTimeFormat(resolvedLocale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatMembershipPlanCadence(plan) {
  const durationUnit = normalizeString(plan?.durationUnit).toLowerCase();
  const durationValue = Number.parseInt(String(plan?.durationValue || ""), 10);

  if (!allowedMembershipDurationUnits.has(durationUnit) || !Number.isFinite(durationValue) || durationValue <= 0) {
    return "Renewal schedule to be confirmed";
  }

  const singularUnit = durationUnit.endsWith("s") ? durationUnit.slice(0, -1) : durationUnit;
  const unitLabel = durationValue === 1 ? singularUnit : durationUnit;

  return `Every ${durationValue} ${unitLabel}`;
}

function parseMoneyInput(amount) {
  if (typeof amount === "number" && Number.isFinite(amount)) {
    return amount;
  }

  const normalized = normalizeString(amount);

  if (!normalized) {
    return null;
  }

  const directNumeric = Number.parseFloat(normalized);

  if (Number.isFinite(directNumeric) && /^-?\d+(\.\d+)?$/.test(normalized)) {
    return directNumeric;
  }

  let sanitized = normalized.replace(/[^\d,.-]/g, "");

  if (!sanitized) {
    return null;
  }

  if (sanitized.includes(",") && sanitized.includes(".")) {
    if (sanitized.lastIndexOf(",") > sanitized.lastIndexOf(".")) {
      sanitized = sanitized.replace(/\./g, "").replace(",", ".");
    } else {
      sanitized = sanitized.replace(/,/g, "");
    }
  } else if (sanitized.includes(",")) {
    const commaParts = sanitized.split(",");

    sanitized =
      commaParts.length === 2 && commaParts[1].length <= 2
        ? `${commaParts[0]}.${commaParts[1]}`
        : sanitized.replace(/,/g, "");
  }

  const numeric = Number.parseFloat(sanitized);
  return Number.isFinite(numeric) ? numeric : null;
}

export function formatMoney(
  amount,
  currency = getFallbackRegionalMarket().defaultCurrency,
  locale = getFallbackRegionalMarket().defaultLocale
) {
  const normalizedAmount = normalizeString(amount);
  const numeric = parseMoneyInput(amount);
  const normalizedCurrency = normalizeString(currency).toUpperCase() || getFallbackRegionalMarket().defaultCurrency;
  const resolvedLocale = resolveLaunchFormattingLocale(locale);

  if (!Number.isFinite(numeric)) {
    return normalizedAmount || normalizedCurrency;
  }

  const formatter = new Intl.NumberFormat(resolvedLocale, {
    style: "currency",
    currency: normalizedCurrency,
  });
  const parts = formatter.formatToParts(numeric);
  const currencyPart = parts.find((part) => part.type === "currency")?.value || normalizedCurrency;
  const amountText = parts
    .filter((part) => part.type !== "currency")
    .map((part) => part.value)
    .join("")
    .trim();
  const needsSpace = /[A-Za-z]/.test(currencyPart);

  return amountText ? `${currencyPart}${needsSpace ? " " : ""}${amountText}` : currencyPart;
}

export function formatMoneyFromMinor(
  amountMinor,
  currency = getFallbackRegionalMarket().defaultCurrency,
  locale = getFallbackRegionalMarket().defaultLocale
) {
  const normalizedCurrency = normalizeString(currency).toUpperCase() || getFallbackRegionalMarket().defaultCurrency;
  const numericMinor = Number.parseInt(String(amountMinor || ""), 10);

  if (!Number.isFinite(numericMinor)) {
    return normalizedCurrency;
  }

  const amount = zeroDecimalCurrencies.has(normalizedCurrency) ? numericMinor : numericMinor / 100;
  return formatMoney(amount, normalizedCurrency, locale);
}

export function summarizePaymentItems(items) {
  const isCancelledBooking = (item) =>
    ["event", "course"].includes(normalizeString(item?.kind)) && normalizeString(item?.status) === "cancelled";

  return {
    total: items.length,
    due: items.filter(
      (item) =>
        !isCancelledBooking(item) &&
        (item.paymentStatus === "unpaid" || item.paymentStatus === "overdue" || item.paymentStatus === "failed")
    ).length,
    paid: items.filter((item) => item.paymentStatus === "paid" || item.paymentStatus === "not_required").length,
  };
}

export function resolveMembershipPlanPricingMode(plan) {
  const explicit = normalizeString(plan?.pricingMode).toLowerCase();
  if (allowedMembershipPricingModes.has(explicit)) {
    return explicit;
  }

  const numericPrice = Number.parseFloat(String(plan?.price || ""));
  return Number.isFinite(numericPrice) && numericPrice <= 0 ? "free" : "paid";
}

export function assertMembershipPaymentStatusUpdate(plan, nextPaymentStatus) {
  const normalizedStatus = normalizeString(nextPaymentStatus).toLowerCase();

  if (!allowedMembershipPaymentStatuses.has(normalizedStatus)) {
    throw new Error("A valid membership payment status is required.");
  }

  if (resolveMembershipPlanPricingMode(plan) === "free") {
    if (normalizedStatus !== "not_required") {
      throw new Error("Free membership plans are always settled.");
    }

    return "not_required";
  }

  if (normalizedStatus === "not_required") {
    throw new Error("Only free membership plans can be marked as not required.");
  }

  return normalizedStatus;
}

export function normalizeMembershipAssignmentPayload(payload, plan = null, existingMembership = null) {
  const planId = normalizeString(payload.planId);
  const status = normalizeString(payload.status).toLowerCase() || "active";
  const requestedPaymentStatus = normalizeString(payload.paymentStatus).toLowerCase() || "unpaid";
  const notes = normalizeString(payload.notes);
  const startDateInput = normalizeString(payload.startDate);
  const renewalDateInput = normalizeString(payload.renewalDate);

  if (!planId) {
    throw new Error("A membership plan is required.");
  }

  if (!plan || normalizeString(plan.id) !== planId) {
    throw new Error("A valid membership plan is required.");
  }

  if (!["active", "inactive", "cancelled"].includes(status)) {
    throw new Error("A valid membership status is required.");
  }

  if (plan?.isDefault === true && status !== "active") {
    throw new Error("Default membership must stay active. Suspend the member instead if access should be blocked.");
  }

  const paymentStatus = assertMembershipPaymentStatusUpdate(plan, requestedPaymentStatus);

  const startDate = parseIsoDate(startDateInput || existingMembership?.startDate || new Date().toISOString());
  if (!startDate) {
    throw new Error("A valid membership start date is required.");
  }

  const renewalFallback = existingMembership?.renewalDate
    ? parseIsoDate(existingMembership.renewalDate)
    : addDuration(startDate, normalizeString(plan.durationUnit), Number.parseInt(String(plan.durationValue || ""), 10) || 0);

  const renewalDate = parseIsoDate(renewalDateInput || renewalFallback?.toISOString());
  if (!renewalDate) {
    throw new Error("A valid renewal date is required.");
  }

  if (renewalDate.getTime() < startDate.getTime()) {
    throw new Error("Renewal date must be after the membership start date.");
  }

  return {
    planId,
    status,
    paymentStatus,
    startDate: startDate.toISOString(),
    renewalDate: renewalDate.toISOString(),
    notes,
  };
}

export function normalizeMembershipPlanPayload(payload) {
  const title = normalizeString(payload.title);
  const description = normalizeString(payload.description);
  const pricingMode = normalizeString(payload.pricingMode).toLowerCase() || "paid";
  const price = normalizeString(payload.price);
  const currency = normalizeString(payload.currency).toUpperCase() || getFallbackRegionalMarket().defaultCurrency;
  const durationUnit = normalizeString(payload.durationUnit).toLowerCase();
  const durationValue = Number.parseInt(String(payload.durationValue || ""), 10);
  const visibility = normalizeString(payload.visibility).toLowerCase() || "public";
  const status = normalizeString(payload.status).toLowerCase() || "active";
  const paymentConfiguration = normalizeOfferingPaymentConfiguration(payload);

  if (!title) {
    throw new Error("A membership plan title is required.");
  }

  if (!allowedMembershipPlanStatuses.has(status)) {
    throw new Error("A valid membership plan status is required.");
  }

  if (!allowedMembershipPricingModes.has(pricingMode)) {
    throw new Error("A valid pricing mode is required.");
  }

  if (!allowedMembershipDurationUnits.has(durationUnit)) {
    throw new Error("A valid duration unit is required.");
  }

  if (!allowedMembershipPlanVisibilities.has(visibility)) {
    throw new Error("A valid membership plan visibility is required.");
  }

  if (!Number.isFinite(durationValue) || durationValue <= 0) {
    throw new Error("A valid duration value is required.");
  }

  if (pricingMode === "paid" && (!price || !Number.isFinite(Number.parseFloat(price)))) {
    throw new Error("A valid plan price is required.");
  }

  const normalizedPrice =
    pricingMode === "free"
      ? "0"
      : String(Number.parseFloat(price));

  return {
    title,
    description,
    pricingMode,
    price: normalizedPrice,
    currency,
    externalPaymentUrl: paymentConfiguration.externalPaymentUrl,
    paymentInstructions: paymentConfiguration.paymentInstructions,
    durationUnit,
    durationValue,
    visibility,
    status,
  };
}

export function resolveMembershipPlanPaymentConfiguration(plan, paymentProcessingMode = "none") {
  return resolveOfferingPaymentConfiguration({
    pricingMode: plan?.pricingMode,
    paymentProcessingMode,
    externalPaymentUrl: plan?.externalPaymentUrl,
    paymentInstructions: plan?.paymentInstructions,
    offeringLabel: "Paid memberships",
  });
}
