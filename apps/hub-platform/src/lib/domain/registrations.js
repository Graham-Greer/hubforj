import {
  getSharedPaymentStatusLabel,
  getSharedPaymentStatusTone,
  sharedPaymentStatusLabels,
  sharedPaymentStatusTones,
} from "@/lib/domain/payment-statuses";

function normalizeString(value) {
  return String(value || "").trim();
}

function humanize(value, fallback) {
  const normalized = normalizeString(value);
  if (!normalized) {
    return fallback;
  }

  return normalized
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeBoolean(value, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  const normalized = normalizeString(value).toLowerCase();

  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  return fallback;
}

function parseIsoDate(value) {
  const normalized = normalizeString(value);

  if (!normalized) {
    return null;
  }

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function resolveEventRegistrationCutoff(event) {
  return parseIsoDate(event?.endAt) || parseIsoDate(event?.startAt);
}

export function eventAllowsWaitlist(event) {
  return normalizeBoolean(event?.allowWaitlist, true);
}

export function isEventAtCapacity(event, registeredCount = 0) {
  const capacity = Number.parseInt(String(event?.capacity || ""), 10);

  if (!Number.isFinite(capacity) || capacity <= 0) {
    return false;
  }

  return Number(registeredCount) >= capacity;
}

export function resolveInitialRegistrationPaymentStatus(event) {
  return normalizeString(event?.pricingMode) === "paid" ? "unpaid" : "not_required";
}

export function resolveInitialEventRegistrationStatus(event, registeredCount) {
  if (isEventAtCapacity(event, registeredCount) && eventAllowsWaitlist(event)) {
    return "waitlisted";
  }

  return "registered";
}

export function assertEventCanAcceptRegistration(event, registeredCount = 0) {
  const status = normalizeString(event?.status);

  if (status !== "published") {
    throw new Error("This event is not open for registration.");
  }

  const cutoff = resolveEventRegistrationCutoff(event);

  if (cutoff && cutoff.getTime() < Date.now()) {
    throw new Error("This event is not open for registration.");
  }

  if (isEventAtCapacity(event, registeredCount) && !eventAllowsWaitlist(event)) {
    throw new Error("This event is sold out.");
  }
}

export const registrationStatusLabels = {
  registered: "Registered",
  waitlisted: "Waitlisted",
  cancelled: "Cancelled",
};

export const registrationStatusTones = {
  registered: "success",
  waitlisted: "warning",
  cancelled: "danger",
};

export const paymentStatusLabels = sharedPaymentStatusLabels;

export const paymentStatusTones = sharedPaymentStatusTones;

const allowedPaymentStatuses = new Set(["paid", "unpaid", "overdue", "failed", "not_required", "refunded"]);

export const attendanceStatusLabels = {
  pending: "Pending",
  present: "Present",
  absent: "Absent",
};

export const attendanceStatusTones = {
  pending: "neutral",
  present: "success",
  absent: "danger",
};

export function getRegistrationStatusLabel(status) {
  const normalized = normalizeString(status);
  return registrationStatusLabels[normalized] || humanize(normalized, "Unknown");
}

export function getRegistrationStatusTone(status) {
  return registrationStatusTones[normalizeString(status)] || "neutral";
}

export function getPaymentStatusLabel(status) {
  const normalized = normalizeString(status);
  return getSharedPaymentStatusLabel(normalized) !== "Unknown"
    ? getSharedPaymentStatusLabel(normalized)
    : humanize(normalized, "Unknown");
}

export function getPaymentStatusTone(status) {
  return getSharedPaymentStatusTone(status);
}

export function getAttendanceStatusLabel(status) {
  const normalized = normalizeString(status);
  return attendanceStatusLabels[normalized] || humanize(normalized, "Unknown");
}

export function getAttendanceStatusTone(status) {
  return attendanceStatusTones[normalizeString(status)] || "neutral";
}

export function summarizeRegistrations(rows) {
  const summary = {
    total: rows.length,
    registered: 0,
    waitlisted: 0,
    cancelled: 0,
    paymentAttention: 0,
    present: 0,
    absent: 0,
  };

  for (const row of rows) {
    const status = normalizeString(row.status);
    const paymentStatus = normalizeString(row.paymentStatus);
    const attendanceStatus = normalizeString(row.attendanceStatus);

    if (status === "registered") {
      summary.registered += 1;
    }
    if (status === "waitlisted") {
      summary.waitlisted += 1;
    }
    if (status === "cancelled") {
      summary.cancelled += 1;
    }
    if (status !== "cancelled" && (paymentStatus === "unpaid" || paymentStatus === "overdue" || paymentStatus === "failed")) {
      summary.paymentAttention += 1;
    }
    if (attendanceStatus === "present") {
      summary.present += 1;
    }
    if (attendanceStatus === "absent") {
      summary.absent += 1;
    }
  }

  return summary;
}

export function splitRegistrationsByTimeline(rows, now = new Date()) {
  const nowValue = now instanceof Date ? now.getTime() : new Date(now).getTime();
  const upcoming = [];
  const history = [];

  for (const row of rows) {
    const startAt = Date.parse(String(row.eventStartAt || ""));

    if (Number.isFinite(startAt) && startAt >= nowValue) {
      upcoming.push(row);
      continue;
    }

    history.push(row);
  }

  return { upcoming, history };
}

const allowedRegistrationTransitions = {
  registered: ["registered", "waitlisted", "cancelled"],
  waitlisted: ["waitlisted", "registered", "cancelled"],
  cancelled: ["cancelled", "waitlisted"],
};

const allowedAttendanceTransitions = {
  pending: ["pending", "present", "absent"],
  present: ["present", "pending", "absent"],
  absent: ["absent", "pending", "present"],
};

export function canUpdateAttendance(registrationStatus) {
  return normalizeString(registrationStatus) === "registered";
}

export function assertRegistrationStatusTransition(currentStatus, nextStatus) {
  const current = normalizeString(currentStatus) || "registered";
  const next = normalizeString(nextStatus);

  if (!next) {
    throw new Error("Registration status is required.");
  }

  if (!allowedRegistrationTransitions[current]?.includes(next)) {
    throw new Error(`Cannot move registration from ${current} to ${next}.`);
  }

  return next;
}

export function assertAttendanceStatusTransition(registrationStatus, currentAttendanceStatus, nextAttendanceStatus) {
  if (!canUpdateAttendance(registrationStatus)) {
    throw new Error("Only registered attendees can be marked for attendance.");
  }

  const current = normalizeString(currentAttendanceStatus) || "pending";
  const next = normalizeString(nextAttendanceStatus);

  if (!next) {
    throw new Error("Attendance status is required.");
  }

  if (!allowedAttendanceTransitions[current]?.includes(next)) {
    throw new Error(`Cannot move attendance from ${current} to ${next}.`);
  }

  return next;
}

export function assertRegistrationPaymentStatusTransition(currentPaymentStatus, nextPaymentStatus) {
  const current = normalizeString(currentPaymentStatus) || "unpaid";
  const next = normalizeString(nextPaymentStatus);

  if (!allowedPaymentStatuses.has(next)) {
    throw new Error("A valid payment status is required.");
  }

  if (current === "not_required" && next !== "not_required") {
    throw new Error("Free registrations do not require payment follow-up.");
  }

  if (current !== "not_required" && next === "not_required") {
    throw new Error("Only free registrations can be marked as not required.");
  }

  return next;
}
