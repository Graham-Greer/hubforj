import {
  getAttendanceStatusLabel,
  getAttendanceStatusTone,
  getPaymentStatusLabel,
  getPaymentStatusTone,
  getRegistrationStatusLabel,
  getRegistrationStatusTone,
} from "@/lib/domain/registrations";
import {
  getCourseAttendanceStatusLabel,
  getCourseAttendanceStatusTone,
  getCoursePaymentStatusLabel,
  getCoursePaymentStatusTone,
  getCourseRegistrationStatusLabel,
  getCourseRegistrationStatusTone,
} from "@/lib/domain/course-registrations";

export function getEventAttendanceDisplay(status) {
  if (status === "pending") {
    return { label: "Attendance unmarked", tone: "neutral", asBadge: true };
  }

  return {
    label: getAttendanceStatusLabel(status),
    tone: getAttendanceStatusTone(status),
    asBadge: true,
  };
}

export function getCourseAttendanceDisplay(status) {
  if (status === "pending") {
    return { label: "Progress unmarked", tone: "neutral", asBadge: true };
  }

  return {
    label: getCourseAttendanceStatusLabel(status),
    tone: getCourseAttendanceStatusTone(status),
    asBadge: true,
  };
}

export function getEventRegistrationDisplay(status) {
  return {
    label: getRegistrationStatusLabel(status),
    tone: getRegistrationStatusTone(status),
    asBadge: true,
  };
}

export function getCourseRegistrationDisplay(status) {
  return {
    label: getCourseRegistrationStatusLabel(status),
    tone: getCourseRegistrationStatusTone(status),
    asBadge: true,
  };
}

export function getEventPaymentDisplay(status, pricingMode) {
  if (pricingMode !== "paid") {
    return { label: "Free", tone: "neutral", asBadge: false };
  }

  return {
    label: getPaymentStatusLabel(status),
    tone: getPaymentStatusTone(status),
    asBadge: true,
  };
}

export function getCoursePaymentDisplay(status, pricingMode) {
  if (pricingMode !== "paid") {
    return { label: "Free", tone: "neutral", asBadge: false };
  }

  return {
    label: getCoursePaymentStatusLabel(status),
    tone: getCoursePaymentStatusTone(status),
    asBadge: true,
  };
}
