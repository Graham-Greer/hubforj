import {
  getSharedPaymentStatusLabel,
  getSharedPaymentStatusTone,
  sharedPaymentStatusLabels,
  sharedPaymentStatusTones,
} from "@/lib/domain/payment-statuses";

function normalizeString(value) {
  return String(value || "").trim();
}

function parseDateString(value) {
  const normalized = normalizeString(value);

  if (!normalized) {
    return null;
  }

  const date = new Date(`${normalized}T00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
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

function resolveCourseRegistrationCutoff(course) {
  return parseIsoDate(course?.endAt) || parseIsoDate(course?.startAt);
}

export function courseAllowsWaitlist(course) {
  return normalizeBoolean(course?.allowWaitlist, true);
}

export function isCourseAtCapacity(course, enrolledCount = 0) {
  const capacity = Number.parseInt(String(course?.capacity || "0"), 10);

  if (!Number.isFinite(capacity) || capacity <= 0) {
    return false;
  }

  return Number(enrolledCount) >= capacity;
}

export const courseRegistrationStatusLabels = {
  enrolled: "Enrolled",
  waitlisted: "Waitlisted",
  cancelled: "Cancelled",
};

export const courseRegistrationStatusTones = {
  enrolled: "success",
  waitlisted: "warning",
  cancelled: "danger",
};

export const coursePaymentStatusLabels = {
  ...sharedPaymentStatusLabels,
  not_required: "No payment required",
};

export const coursePaymentStatusTones = sharedPaymentStatusTones;

const allowedCoursePaymentStatuses = new Set(["not_required", "unpaid", "overdue", "failed", "paid", "refunded"]);

export const courseAttendanceStatusLabels = {
  pending: "Pending",
  in_progress: "In progress",
  completed: "Completed",
  withdrawn: "Withdrawn",
};

export const courseAttendanceStatusTones = {
  pending: "neutral",
  in_progress: "accent",
  completed: "success",
  withdrawn: "danger",
};

export function getCourseRegistrationStatusLabel(status) {
  return courseRegistrationStatusLabels[normalizeString(status)] || "Unknown";
}

export function getCourseRegistrationStatusTone(status) {
  return courseRegistrationStatusTones[normalizeString(status)] || "neutral";
}

export function getCoursePaymentStatusLabel(status) {
  const normalized = normalizeString(status);

  if (normalized === "not_required") {
    return "No payment required";
  }

  return getSharedPaymentStatusLabel(normalized);
}

export function getCoursePaymentStatusTone(status) {
  return getSharedPaymentStatusTone(status);
}

export function getCourseAttendanceStatusLabel(status) {
  return courseAttendanceStatusLabels[normalizeString(status)] || "Unknown";
}

export function getCourseAttendanceStatusTone(status) {
  return courseAttendanceStatusTones[normalizeString(status)] || "neutral";
}

export function summarizeCourseRegistrations(registrations) {
  return registrations.reduce(
    (summary, registration) => {
      summary.total += 1;
      if (registration.status === "enrolled") summary.enrolled += 1;
      if (registration.status === "waitlisted") summary.waitlisted += 1;
      if (
        normalizeString(registration.status) !== "cancelled" &&
        ["unpaid", "overdue", "failed"].includes(normalizeString(registration.paymentStatus))
      ) {
        summary.paymentAttention += 1;
      }
      if (registration.attendanceStatus === "completed") summary.completed += 1;
      if (registration.attendanceStatus === "withdrawn") summary.withdrawn += 1;
      return summary;
    },
    {
      total: 0,
      enrolled: 0,
      waitlisted: 0,
      paymentAttention: 0,
      completed: 0,
      withdrawn: 0,
    }
  );
}

export function splitCourseRegistrationsByTimeline(registrations) {
  const upcoming = [];
  const history = [];

  for (const registration of registrations) {
    if (["completed", "withdrawn", "cancelled"].includes(normalizeString(registration.attendanceStatus || registration.status))) {
      history.push(registration);
    } else {
      upcoming.push(registration);
    }
  }

  return { upcoming, history };
}

export function resolveInitialCourseRegistrationStatus(course, enrolledCount = 0) {
  if (isCourseAtCapacity(course, enrolledCount) && courseAllowsWaitlist(course)) {
    return "waitlisted";
  }

  return "enrolled";
}

export function resolveInitialCoursePaymentStatus(course) {
  return normalizeString(course?.pricingMode) === "paid" ? "unpaid" : "not_required";
}

export function assertCourseCanAcceptRegistration(course, enrolledCount = 0) {
  if (!course) {
    throw new Error("Course not found.");
  }

  if (normalizeString(course.status) !== "published") {
    throw new Error("Only published courses can accept enrolments.");
  }

  const cutoff = resolveCourseRegistrationCutoff(course);

  if (cutoff && cutoff.getTime() < Date.now()) {
    throw new Error("Registration for this course is closed.");
  }

  const today = startOfDay(new Date());
  const registrationOpenDate = parseDateString(course.registrationOpenDate);
  const registrationCloseDate = parseDateString(course.registrationCloseDate);

  if (registrationOpenDate && registrationOpenDate > today) {
    throw new Error("Registration for this course is not open yet.");
  }

  if (registrationCloseDate && registrationCloseDate < today) {
    throw new Error("Registration for this course is closed.");
  }

  if (isCourseAtCapacity(course, enrolledCount) && !courseAllowsWaitlist(course)) {
    throw new Error("This course is sold out.");
  }
}

export function assertCourseRegistrationStatusTransition(currentStatus, nextStatus) {
  const current = normalizeString(currentStatus);
  const next = normalizeString(nextStatus);

  if (!courseRegistrationStatusLabels[next]) {
    throw new Error("Unsupported course registration status.");
  }

  if (current === next) {
    return next;
  }

  const transitions = {
    enrolled: ["waitlisted", "cancelled"],
    waitlisted: ["enrolled", "cancelled"],
    cancelled: ["waitlisted"],
  };

  if (!transitions[current]?.includes(next)) {
    throw new Error("That course registration transition is not allowed.");
  }

  return next;
}

export function canUpdateCourseAttendance(status) {
  return normalizeString(status) === "enrolled";
}

const allowedCourseAttendanceTransitions = {
  pending: ["in_progress", "completed", "withdrawn"],
  in_progress: ["completed", "withdrawn"],
  completed: [],
  withdrawn: [],
};

export function getAllowedCourseAttendanceTransitions(currentStatus) {
  const current = normalizeString(currentStatus) || "pending";
  return [...(allowedCourseAttendanceTransitions[current] || [])];
}

export function courseAttendanceTransitionRequiresConfirmation(currentStatus, nextStatus) {
  const next = normalizeString(nextStatus);

  if (!getAllowedCourseAttendanceTransitions(currentStatus).includes(next)) {
    return false;
  }

  return next === "withdrawn";
}

export function assertCourseAttendanceStatusTransition(currentStatus, nextStatus) {
  const current = normalizeString(currentStatus) || "pending";
  const next = normalizeString(nextStatus);

  if (!courseAttendanceStatusLabels[next]) {
    throw new Error("Unsupported course attendance status.");
  }

  if (current === next) {
    return next;
  }

  if (!allowedCourseAttendanceTransitions[current]?.includes(next)) {
    throw new Error("That course attendance transition is not allowed.");
  }

  return next;
}

export function assertCoursePaymentStatusTransition(currentPaymentStatus, nextPaymentStatus) {
  const current = normalizeString(currentPaymentStatus) || "unpaid";
  const next = normalizeString(nextPaymentStatus);

  if (!allowedCoursePaymentStatuses.has(next)) {
    throw new Error("A valid payment status is required.");
  }

  if (current === "not_required" && next !== "not_required") {
    throw new Error("Free course registrations do not require payment follow-up.");
  }

  if (current !== "not_required" && next === "not_required") {
    throw new Error("Only free course registrations can be marked as not required.");
  }

  return next;
}
