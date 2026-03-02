const MEMBERSHIP_STATUS = ["pending", "active", "expired", "inactive", "cancelled"];
const MEMBERSHIP_PAYMENT_STATUS = ["not-required", "unpaid", "paid", "refunded"];
const DURATION_UNITS = ["days", "months", "years"];

function assertEnum(value, allowed, field) {
  if (!allowed.includes(value)) {
    throw new Error(`${field} is invalid.`);
  }
}

function toPositiveInteger(value, field) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) {
    throw new Error(`${field} must be a positive integer.`);
  }
  return number;
}

export function addDurationToIso(startIso, durationUnit, durationValue) {
  const base = new Date(String(startIso || "").trim());
  if (Number.isNaN(base.getTime())) {
    throw new Error("startDate is invalid.");
  }

  const next = new Date(base);
  if (durationUnit === "days") next.setUTCDate(next.getUTCDate() + durationValue);
  if (durationUnit === "months") next.setUTCMonth(next.getUTCMonth() + durationValue);
  if (durationUnit === "years") next.setUTCFullYear(next.getUTCFullYear() + durationValue);
  return next.toISOString();
}

export function validateMembershipPlanInput(input) {
  const payload = input || {};

  const title = String(payload.title || "").trim();
  if (!title) throw new Error("title is required.");

  const description = String(payload.description || "").trim();
  const durationUnit = String(payload.durationUnit || "").trim();
  assertEnum(durationUnit, DURATION_UNITS, "durationUnit");

  const durationValue = toPositiveInteger(payload.durationValue, "durationValue");
  const price = Number(payload.price);
  if (!Number.isFinite(price) || price < 0) {
    throw new Error("price must be a non-negative number.");
  }

  return {
    title,
    description,
    durationUnit,
    durationValue,
    price,
    active: Boolean(payload.active),
  };
}

export function deriveMembershipStatus(membership, hubGraceDays = 0, now = Date.now()) {
  const status = String(membership?.status || "").trim();
  assertEnum(status, MEMBERSHIP_STATUS, "status");

  if (status !== "active") return status;

  const renewalDate = new Date(String(membership?.renewalDate || "").trim());
  if (Number.isNaN(renewalDate.getTime())) return status;

  const override = membership?.gracePeriodDaysOverride;
  const graceDays = Number.isFinite(Number(override)) ? Number(override) : Number(hubGraceDays || 0);
  const threshold = renewalDate.getTime() + Math.max(0, graceDays) * 24 * 60 * 60 * 1000;

  return now > threshold ? "expired" : "active";
}

export function validateMembershipStatusTransition(currentStatus, nextStatus, options = {}) {
  const current = String(currentStatus || "").trim();
  const next = String(nextStatus || "").trim();
  const isSystem = Boolean(options.isSystem);

  assertEnum(current, MEMBERSHIP_STATUS, "current status");
  assertEnum(next, MEMBERSHIP_STATUS, "next status");

  if (current === next) return next;

  if (next === "expired" && !isSystem) {
    throw new Error("expired is system-derived and cannot be set manually.");
  }

  if (current === "pending" && (next === "active" || next === "cancelled")) return next;
  if (current === "active" && (next === "inactive" || next === "cancelled" || (next === "expired" && isSystem))) return next;
  if (current === "inactive" && (next === "active" || next === "cancelled")) return next;
  if (current === "expired" && (next === "active" || next === "cancelled")) return next;

  throw new Error(`Invalid membership status transition: ${current} -> ${next}`);
}

export function validateMembershipPaymentStatus(value) {
  const paymentStatus = String(value || "").trim();
  assertEnum(paymentStatus, MEMBERSHIP_PAYMENT_STATUS, "paymentStatus");
  return paymentStatus;
}

export function validateMembershipRouteInput(input) {
  const payload = input || {};
  const hubSlug = String(payload.hubSlug || "").trim();
  const membershipId = String(payload.membershipId || "").trim();

  if (!hubSlug) throw new Error("hubSlug is required.");
  if (!membershipId) throw new Error("membershipId is required.");
  return { hubSlug, membershipId };
}

export function validateCreateMembershipInput(input) {
  const payload = input || {};
  const userId = String(payload.userId || "").trim();
  const planId = String(payload.planId || "").trim();
  const startDateRaw = String(payload.startDate || "").trim();

  if (!userId) throw new Error("userId is required.");
  if (!planId) throw new Error("planId is required.");

  const startDate = startDateRaw
    ? (() => {
        const parsed = new Date(startDateRaw);
        if (Number.isNaN(parsed.getTime())) throw new Error("startDate is invalid.");
        return parsed.toISOString();
      })()
    : new Date().toISOString();

  return { userId, planId, startDate };
}
