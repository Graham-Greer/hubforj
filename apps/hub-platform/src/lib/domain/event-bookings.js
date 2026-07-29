import { resolveHubPackageEntitlements } from "@/lib/domain/hub-package";
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

function resolveRefundCutoffAt(startAtValue, refundWindowHours) {
  const startAt = parseIsoDate(startAtValue);

  if (!startAt) {
    return null;
  }

  return new Date(startAt.getTime() - (refundWindowHours * 60 * 60 * 1000));
}

export const eventRegistrationEligibilityOptions = [
  { value: "members-only", label: "Members only" },
  { value: "guests-allowed", label: "Members may book guests" },
];

export const eventBookingModeOptions = [
  { value: "single_attendee", label: "Single attendee only" },
  { value: "group_booking", label: "Allow multiple attendees in one booking" },
];

export const eventGuestDetailsModeOptions = [
  { value: "name_only", label: "Name only" },
];

export const eventMaxAttendeesPerBookingOptions = [
  { value: "2", label: "2 attendees" },
  { value: "3", label: "3 attendees" },
  { value: "4", label: "4 attendees" },
  { value: "5", label: "5 attendees" },
  { value: "6", label: "6 attendees" },
];

export const eventBookingStatusLabels = {
  active: "Active",
  waitlisted: "Waitlisted",
  cancelled: "Cancelled",
};

export const eventBookingStatusTones = {
  active: "success",
  waitlisted: "warning",
  cancelled: "danger",
};

export const eventBookingPaymentStatusLabels = {
  ...sharedPaymentStatusLabels,
  pending: "Pending",
};

export const eventBookingPaymentStatusTones = {
  ...sharedPaymentStatusTones,
  pending: "warning",
};

export const eventBookingAttendeeStatusLabels = {
  registered: "Registered",
  waitlisted: "Waitlisted",
  cancelled: "Cancelled",
};

export const eventBookingAttendeeStatusTones = {
  registered: "success",
  waitlisted: "warning",
  cancelled: "danger",
};

export const eventBookingAttendanceStatusLabels = {
  pending: "Pending",
  present: "Present",
  absent: "Absent",
};

export const eventBookingAttendanceStatusTones = {
  pending: "neutral",
  present: "success",
  absent: "danger",
};

export function normalizeEventRegistrationEligibility(value, fallback = "members-only") {
  const normalized = normalizeString(value).toLowerCase();
  return normalized === "guests-allowed" ? "guests-allowed" : fallback;
}

export function normalizeEventBookingMode(value, fallback = "single_attendee") {
  const normalized = normalizeString(value).toLowerCase();
  return normalized === "group_booking" ? "group_booking" : fallback;
}

export function normalizeEventGuestDetailsMode(value, fallback = "name_only") {
  return fallback;
}

export function normalizeEventMaxAttendeesPerBooking(value, fallback = 1) {
  const next = Number.parseInt(String(value || ""), 10);

  if (!Number.isFinite(next) || next <= 0) {
    return fallback;
  }

  return next;
}

export function normalizeEventBookingRequestedAttendees(attendees = []) {
  if (!Array.isArray(attendees)) {
    return [];
  }

  return attendees
    .map((attendee) => {
      const providedDisplayName =
        normalizeString(attendee?.displayName) || normalizeString(attendee?.fullName);
      const firstName = normalizeString(attendee?.firstName);
      const lastName = normalizeString(attendee?.lastName);
      const displayName = providedDisplayName || `${firstName} ${lastName}`.trim();
      const [derivedFirstName = "", ...derivedRest] = displayName.split(/\s+/).filter(Boolean);
      const resolvedFirstName = firstName || derivedFirstName;
      const resolvedLastName = lastName || derivedRest.join(" ");

      if (!displayName || !resolvedFirstName) {
        return null;
      }

      return {
        firstName: resolvedFirstName,
        lastName: resolvedLastName,
        displayName,
        email: normalizeString(attendee?.email).toLowerCase(),
        relationshipLabel: normalizeString(attendee?.relationshipLabel),
        memberUserId: normalizeString(attendee?.memberUserId),
        isPrimaryBooker: attendee?.isPrimaryBooker === true,
      };
    })
    .filter(Boolean);
}

export function resolveEventBookingConfiguration(event = {}) {
  const registrationEligibility = normalizeEventRegistrationEligibility(event.registrationEligibility);
  const requestedBookingMode = normalizeEventBookingMode(event.bookingMode);
  const bookingMode = registrationEligibility === "members-only" ? "single_attendee" : requestedBookingMode;
  const guestDetailsMode =
    bookingMode === "group_booking"
      ? normalizeEventGuestDetailsMode(event.guestDetailsMode, "name_only")
      : "name_only";
  const maxAttendeesPerBooking =
    bookingMode === "group_booking"
      ? Math.max(2, normalizeEventMaxAttendeesPerBooking(event.maxAttendeesPerBooking, 2))
      : 1;

  return {
    registrationEligibility,
    bookingMode,
    maxAttendeesPerBooking,
    guestDetailsMode,
  };
}

export function eventAllowsWaitlist(event) {
  return normalizeBoolean(event?.allowWaitlist, true);
}

export function countActiveEventAttendeeSpaces(event = {}) {
  return Math.max(0, normalizeEventMaxAttendeesPerBooking(event?.registeredAttendeeCount, 0));
}

export function resolveInitialEventBookingPaymentStatus(event) {
  return normalizeString(event?.pricingMode) === "paid" ? "pending" : "not_required";
}

export function resolveEventBookingRefundState(event, booking = {}, attendee = {}, now = new Date()) {
  const paymentStatus = normalizeString(booking?.paymentStatus);

  if (!new Set(["paid", "partially_refunded"]).has(paymentStatus)) {
    return {
      refundStatus: "not_applicable",
      refundAmountMinor: 0,
      refundable: false,
      reason: "payment_not_refundable",
    };
  }

  const startAt = normalizeString(attendee?.eventStartAtSnapshot || booking?.eventStartAtSnapshot || event?.startAt);
  const pricingMode = normalizeString(booking?.pricingMode || event?.pricingMode || "free");
  const refundPolicy = normalizeString(attendee?.refundPolicySnapshot || booking?.refundPolicySnapshot || event?.refundPolicy);
  const refundWindowMode = normalizeString(
    attendee?.refundWindowModeSnapshot || booking?.refundWindowModeSnapshot || event?.refundWindowMode
  );
  const refundWindowHours = normalizeEventMaxAttendeesPerBooking(
    attendee?.refundWindowHoursSnapshot || booking?.refundWindowHoursSnapshot || event?.refundWindowHours,
    48
  );
  const unitAmountMinor = normalizeEventMaxAttendeesPerBooking(attendee?.unitAmountMinorSnapshot, 0);
  const nowValue = now instanceof Date ? now : new Date(now || Date.now());
  const startAtDate = parseIsoDate(startAt);
  const cutoffAt = refundWindowMode === "custom" ? resolveRefundCutoffAt(startAt, refundWindowHours) : resolveRefundCutoffAt(startAt, 48);

  let evaluation = {
    refundable: false,
    reason: "payment_not_refundable",
    refundPolicy,
    refundWindowHours,
    cutoffAt,
    startAt: startAtDate,
  };

  if (pricingMode === "paid" && new Set(["paid", "partially_refunded"]).has(paymentStatus)) {
    if (refundPolicy === "non_refundable") {
      evaluation = {
        ...evaluation,
        reason: "policy_non_refundable",
      };
    } else if (!startAtDate || Number.isNaN(nowValue.getTime())) {
      evaluation = {
        ...evaluation,
        reason: "timing_unavailable",
      };
    } else if (nowValue.getTime() >= startAtDate.getTime()) {
      evaluation = {
        ...evaluation,
        reason: "event_started",
      };
    } else {
      const refundable = !cutoffAt || nowValue.getTime() <= cutoffAt.getTime();
      evaluation = {
        ...evaluation,
        refundable,
        reason: refundable ? "before_cutoff" : "outside_refund_window",
      };
    }
  }

  if (!evaluation.refundable) {
    return {
      refundStatus: "not_refunded",
      refundAmountMinor: 0,
      refundable: false,
      reason: evaluation.reason,
      evaluation,
    };
  }

  return {
    refundStatus: "pending",
    refundAmountMinor: unitAmountMinor,
    refundable: true,
    reason: evaluation.reason,
    evaluation,
  };
}

export function resolveInitialEventBookingStatus(event, activeAttendeeCount = 0, requestedAttendeeCount = 1) {
  const capacity = normalizeEventMaxAttendeesPerBooking(event?.capacity, 0);
  const activeCount = Math.max(0, Number.parseInt(String(activeAttendeeCount || ""), 10) || 0);
  const requestedCount = Math.max(1, Number.parseInt(String(requestedAttendeeCount || ""), 10) || 1);

  if (capacity <= 0) {
    return "active";
  }

  const remaining = Math.max(0, capacity - activeCount);

  if (remaining >= requestedCount) {
    return "active";
  }

  return eventAllowsWaitlist(event) ? "waitlisted" : "blocked";
}

export function summarizeEventBookingAttendees(attendees = []) {
  return attendees.reduce(
    (summary, attendee) => {
      const status = normalizeString(attendee?.status) || "registered";

      summary.attendeeCount += 1;

      if (status === "registered") {
        summary.activeAttendeeCount += 1;
      } else if (status === "waitlisted") {
        summary.waitlistedAttendeeCount += 1;
      } else if (status === "cancelled") {
        summary.cancelledAttendeeCount += 1;
      }

      return summary;
    },
    {
      attendeeCount: 0,
      activeAttendeeCount: 0,
      waitlistedAttendeeCount: 0,
      cancelledAttendeeCount: 0,
    }
  );
}

export function resolveBookingStatusFromAttendees(summary = {}) {
  const activeAttendeeCount = normalizeEventMaxAttendeesPerBooking(summary.activeAttendeeCount, 0);
  const waitlistedAttendeeCount = normalizeEventMaxAttendeesPerBooking(summary.waitlistedAttendeeCount, 0);

  if (activeAttendeeCount > 0) {
    return "active";
  }

  if (waitlistedAttendeeCount > 0) {
    return "waitlisted";
  }

  return "cancelled";
}

export function resolveRemainingEventAttendeeCapacity(event = {}, activeAttendeeCount = 0) {
  const capacity = normalizeEventMaxAttendeesPerBooking(event?.capacity, 0);

  if (capacity <= 0) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.max(0, capacity - Math.max(0, normalizeEventMaxAttendeesPerBooking(activeAttendeeCount, 0)));
}

export function canPromoteWaitlistedBooking(event = {}, activeAttendeeCount = 0, requestedAttendeeCount = 0) {
  const remainingCapacity = resolveRemainingEventAttendeeCapacity(event, activeAttendeeCount);
  const requested = Math.max(1, normalizeEventMaxAttendeesPerBooking(requestedAttendeeCount, 1));

  if (remainingCapacity === Number.POSITIVE_INFINITY) {
    return true;
  }

  return remainingCapacity >= requested;
}

export function assertEventCanAcceptBooking(event, activeAttendeeCount = 0, requestedAttendeeCount = 1) {
  const status = normalizeString(event?.status);

  if (status !== "published") {
    throw new Error("This event is not open for booking.");
  }

  const cutoff = parseIsoDate(event?.endAt) || parseIsoDate(event?.startAt);

  if (cutoff && cutoff.getTime() < Date.now()) {
    throw new Error("This event is not open for booking.");
  }

  const initialStatus = resolveInitialEventBookingStatus(event, activeAttendeeCount, requestedAttendeeCount);

  if (initialStatus === "blocked") {
    throw new Error("This event does not have enough remaining places for that booking.");
  }
}

export function buildPrimaryBookerAttendee(booker) {
  const firstName = normalizeString(booker?.firstName);
  const lastName = normalizeString(booker?.lastName);
  const fallbackName = normalizeString(booker?.name);
  const derivedFullName = `${firstName} ${lastName}`.trim() || fallbackName;
  const [fallbackFirstName = "", ...fallbackRemainder] = fallbackName.split(/\s+/).filter(Boolean);
  const resolvedFirstName = firstName || fallbackFirstName;
  const resolvedLastName = lastName || fallbackRemainder.join(" ");

  if (!resolvedFirstName || !resolvedLastName) {
    throw new Error("Booker first and last name are required.");
  }

  return {
    firstName: resolvedFirstName,
    lastName: resolvedLastName,
    displayName: derivedFullName,
    email: normalizeString(booker?.email).toLowerCase(),
    relationshipLabel: "",
    memberUserId: normalizeString(booker?.id || booker?.userId),
    isPrimaryBooker: true,
  };
}

export function getEventBookingStatusLabel(status) {
  const normalized = normalizeString(status);
  return eventBookingStatusLabels[normalized] || humanize(normalized, "Unknown");
}

export function getEventBookingStatusTone(status) {
  return eventBookingStatusTones[normalizeString(status)] || "neutral";
}

export function getEventBookingPaymentStatusLabel(status) {
  const normalized = normalizeString(status);

  if (normalized === "pending") {
    return "Pending";
  }

  return getSharedPaymentStatusLabel(normalized) !== "Unknown"
    ? getSharedPaymentStatusLabel(normalized)
    : humanize(normalized, "Unknown");
}

export function getEventBookingPaymentStatusTone(status) {
  const normalized = normalizeString(status);
  return normalized === "pending" ? "warning" : getSharedPaymentStatusTone(normalized);
}

export function getEventBookingAttendeeStatusLabel(status) {
  const normalized = normalizeString(status);
  return eventBookingAttendeeStatusLabels[normalized] || humanize(normalized, "Unknown");
}

export function getEventBookingAttendeeStatusTone(status) {
  return eventBookingAttendeeStatusTones[normalizeString(status)] || "neutral";
}

export function getEventBookingAttendanceStatusLabel(status) {
  const normalized = normalizeString(status);
  return eventBookingAttendanceStatusLabels[normalized] || humanize(normalized, "Unknown");
}

export function getEventBookingAttendanceStatusTone(status) {
  return eventBookingAttendanceStatusTones[normalizeString(status)] || "neutral";
}

export function summarizeEventAdminBookings(rows = []) {
  return rows.reduce(
    (summary, row) => {
      summary.total += 1;

      if (row.status === "active") {
        summary.active += 1;
      } else if (row.status === "waitlisted") {
        summary.waitlisted += 1;
      } else if (row.status === "cancelled") {
        summary.cancelled += 1;
      }

      if (["pending", "failed"].includes(normalizeString(row.paymentStatus))) {
        summary.paymentAttention += 1;
      }

      return summary;
    },
    {
      total: 0,
      active: 0,
      waitlisted: 0,
      cancelled: 0,
      paymentAttention: 0,
    }
  );
}

export function summarizeEventAdminAttendees(rows = []) {
  return rows.reduce(
    (summary, row) => {
      summary.total += 1;

      if (row.status === "registered") {
        summary.registered += 1;
      } else if (row.status === "waitlisted") {
        summary.waitlisted += 1;
      } else if (row.status === "cancelled") {
        summary.cancelled += 1;
      }

      if (row.attendanceStatus === "present") {
        summary.present += 1;
      } else if (row.attendanceStatus === "absent") {
        summary.absent += 1;
      }

      return summary;
    },
    {
      total: 0,
      registered: 0,
      waitlisted: 0,
      cancelled: 0,
      present: 0,
      absent: 0,
    }
  );
}

export function canUpdateEventBookingAttendance(attendeeStatus) {
  return normalizeString(attendeeStatus) === "registered";
}

export function canHubUseGroupBookings(hub = {}) {
  return resolveHubPackageEntitlements(hub).capabilities?.groupBookingsEnabled === true;
}
