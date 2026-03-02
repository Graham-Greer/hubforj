const REGISTRATION_STATUS = ["registered", "waitlisted", "cancelled"];
const PAYMENT_STATUS = ["not-required", "unpaid", "paid"];
const ATTENDANCE_STATUS = ["unknown", "attended", "no-show"];

function assertEnum(value, allowed, field) {
  if (!allowed.includes(value)) {
    throw new Error(`${field} is invalid.`);
  }
}

export function validateRegistrationRouteInput(input) {
  const payload = input || {};
  const hubSlug = String(payload.hubSlug || "").trim();
  const eventId = String(payload.eventId || "").trim();
  const registrationId = String(payload.registrationId || "").trim();

  if (!hubSlug) throw new Error("hubSlug is required.");
  if (!eventId) throw new Error("eventId is required.");
  if (!registrationId) throw new Error("registrationId is required.");

  return { hubSlug, eventId, registrationId };
}

export function validateRegistrationStatusTransition(currentStatus, nextStatus) {
  const current = String(currentStatus || "").trim();
  const next = String(nextStatus || "").trim();

  assertEnum(current, REGISTRATION_STATUS, "current status");
  assertEnum(next, REGISTRATION_STATUS, "next status");

  if (current === next) return next;
  if (current === "waitlisted" && next === "registered") return next;
  if ((current === "registered" || current === "waitlisted") && next === "cancelled") return next;

  throw new Error(`Invalid registration status transition: ${current} -> ${next}`);
}

export function validatePaymentStatusForEvent(pricingMode, paymentStatus) {
  const pricing = String(pricingMode || "").trim();
  const payment = String(paymentStatus || "").trim();

  assertEnum(payment, PAYMENT_STATUS, "paymentStatus");

  if (pricing === "free" && payment !== "not-required") {
    throw new Error("Free events only allow paymentStatus=not-required.");
  }

  if (pricing === "paid" && payment === "not-required") {
    throw new Error("Paid events cannot use paymentStatus=not-required.");
  }

  return payment;
}

export function validateAttendanceStatus(currentRegistrationStatus, attendanceStatus) {
  const status = String(currentRegistrationStatus || "").trim();
  const attendance = String(attendanceStatus || "").trim();

  assertEnum(attendance, ATTENDANCE_STATUS, "attendanceStatus");

  if (status !== "registered" && attendance !== "unknown") {
    throw new Error("Attendance can only be marked for registered registrations.");
  }

  if (status === "cancelled" && attendance !== "unknown") {
    throw new Error("Cancelled registrations cannot have attendance markers.");
  }

  return attendance;
}

export function resolveInitialPaymentStatusForEvent(pricingMode) {
  const pricing = String(pricingMode || "").trim();
  return pricing === "paid" ? "unpaid" : "not-required";
}
