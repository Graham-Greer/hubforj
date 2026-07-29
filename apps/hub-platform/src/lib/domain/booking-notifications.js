function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeLowerString(value) {
  return normalizeString(value).toLowerCase();
}

function normalizeEmail(value) {
  return normalizeLowerString(value);
}

function normalizeIsoString(value) {
  const normalized = normalizeString(value);

  if (!normalized) {
    return "";
  }

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function parseIsoDate(value) {
  const normalized = normalizeIsoString(value);

  if (!normalized) {
    return null;
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function addRecipientRecipientMapEntry(recipientMap, recipient) {
  if (!recipient?.email) {
    return;
  }

  const userKey = normalizeString(recipient.userId);
  const emailKey = normalizeEmail(recipient.email);
  const dedupeKey = userKey ? `user:${userKey}` : `email:${emailKey}`;

  if (!dedupeKey || recipientMap.has(dedupeKey)) {
    return;
  }

  recipientMap.set(dedupeKey, recipient);
}

function buildRecipient({ role, userId = "", email = "", name = "", attendeeId = "" }) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return null;
  }

  return {
    role: normalizeString(role) || "member",
    userId: normalizeString(userId),
    attendeeId: normalizeString(attendeeId),
    email: normalizedEmail,
    name: normalizeString(name),
  };
}

function resolveActiveSourceStatuses(offeringKind) {
  return normalizeLowerString(offeringKind) === "course"
    ? new Set(["enrolled"])
    : new Set(["active", "registered"]);
}

export const bookingNotificationKinds = Object.freeze({
  eventBookingConfirmed: "event_booking_confirmed",
  eventBookingRecordedPendingPayment: "event_booking_recorded_pending_payment",
  eventBookingWaitlisted: "event_booking_waitlisted",
  eventBookingCancelled: "event_booking_cancelled",
  eventCancelledByAdmin: "event_cancelled_by_admin",
  eventBookingReminder: "event_booking_reminder",
  courseEnrolmentConfirmed: "course_enrolment_confirmed",
  courseEnrolmentRecordedPendingPayment: "course_enrolment_recorded_pending_payment",
  courseEnrolmentWaitlisted: "course_enrolment_waitlisted",
  courseEnrolmentCancelled: "course_enrolment_cancelled",
  courseCancelledByAdmin: "course_cancelled_by_admin",
  courseEnrolmentReminder: "course_enrolment_reminder",
});

const reminderNotificationKinds = new Set([
  bookingNotificationKinds.eventBookingReminder,
  bookingNotificationKinds.courseEnrolmentReminder,
]);

const waitlistNotificationKinds = new Set([
  bookingNotificationKinds.eventBookingWaitlisted,
  bookingNotificationKinds.courseEnrolmentWaitlisted,
]);

const cancellationNotificationKinds = new Set([
  bookingNotificationKinds.eventBookingCancelled,
  bookingNotificationKinds.courseEnrolmentCancelled,
  bookingNotificationKinds.eventCancelledByAdmin,
  bookingNotificationKinds.courseCancelledByAdmin,
]);

const immediateLifecycleKinds = new Set([
  bookingNotificationKinds.eventBookingConfirmed,
  bookingNotificationKinds.eventBookingRecordedPendingPayment,
  bookingNotificationKinds.eventBookingWaitlisted,
  bookingNotificationKinds.eventBookingCancelled,
  bookingNotificationKinds.courseEnrolmentConfirmed,
  bookingNotificationKinds.courseEnrolmentRecordedPendingPayment,
  bookingNotificationKinds.courseEnrolmentWaitlisted,
  bookingNotificationKinds.courseEnrolmentCancelled,
]);

export function listBookingNotificationKinds() {
  return Object.values(bookingNotificationKinds);
}

export function isBookingNotificationKind(value) {
  return listBookingNotificationKinds().includes(normalizeString(value));
}

export function resolveConfirmedNotificationKind(offeringKind) {
  return normalizeLowerString(offeringKind) === "course"
    ? bookingNotificationKinds.courseEnrolmentConfirmed
    : bookingNotificationKinds.eventBookingConfirmed;
}

export function resolveRecordedPendingPaymentNotificationKind(offeringKind) {
  return normalizeLowerString(offeringKind) === "course"
    ? bookingNotificationKinds.courseEnrolmentRecordedPendingPayment
    : bookingNotificationKinds.eventBookingRecordedPendingPayment;
}

export function resolveWaitlistedNotificationKind(offeringKind) {
  return normalizeLowerString(offeringKind) === "course"
    ? bookingNotificationKinds.courseEnrolmentWaitlisted
    : bookingNotificationKinds.eventBookingWaitlisted;
}

export function resolveCancellationNotificationKind(offeringKind) {
  return normalizeLowerString(offeringKind) === "course"
    ? bookingNotificationKinds.courseEnrolmentCancelled
    : bookingNotificationKinds.eventBookingCancelled;
}

export function resolveOfferingCancelledNotificationKind(offeringKind) {
  return normalizeLowerString(offeringKind) === "course"
    ? bookingNotificationKinds.courseCancelledByAdmin
    : bookingNotificationKinds.eventCancelledByAdmin;
}

export function resolveReminderNotificationKind(offeringKind) {
  return normalizeLowerString(offeringKind) === "course"
    ? bookingNotificationKinds.courseEnrolmentReminder
    : bookingNotificationKinds.eventBookingReminder;
}

export function resolveInitialBookingNotificationKind({
  offeringKind = "event",
  status = "",
  pricingMode = "free",
  paymentProcessingMode = "none",
  paymentStatus = "",
} = {}) {
  const normalizedStatus = normalizeLowerString(status);
  const normalizedPricingMode = normalizeLowerString(pricingMode) || "free";
  const normalizedPaymentMode = normalizeLowerString(paymentProcessingMode) || "none";
  const normalizedPaymentStatus = normalizeLowerString(paymentStatus);

  if (normalizedStatus === "waitlisted") {
    return resolveWaitlistedNotificationKind(offeringKind);
  }

  if (
    normalizedPricingMode !== "paid" ||
    normalizedPaymentStatus === "not_required" ||
    normalizedPaymentStatus === "paid"
  ) {
    return resolveConfirmedNotificationKind(offeringKind);
  }

  if (normalizedPaymentMode === "external" || normalizedPaymentMode === "internal") {
    return resolveRecordedPendingPaymentNotificationKind(offeringKind);
  }

  return resolveRecordedPendingPaymentNotificationKind(offeringKind);
}

export function buildBookingNotificationDedupeKey({
  kind = "",
  hubId = "",
  sourceType = "",
  sourceId = "",
  parentType = "",
  parentId = "",
  recipientUserId = "",
  recipientEmail = "",
  scheduledFor = "",
} = {}) {
  const normalizedKind = normalizeString(kind);
  const normalizedHubId = normalizeString(hubId);
  const normalizedSourceType = normalizeString(sourceType);
  const normalizedSourceId = normalizeString(sourceId);
  const normalizedParentType = normalizeString(parentType);
  const normalizedParentId = normalizeString(parentId);
  const normalizedRecipientUserId = normalizeString(recipientUserId);
  const normalizedRecipientEmail = normalizeEmail(recipientEmail);
  const normalizedScheduledFor = normalizeIsoString(scheduledFor);

  if (!normalizedKind || !normalizedHubId || !normalizedSourceType || !normalizedSourceId) {
    return "";
  }

  const scope = [
    normalizedKind,
    normalizedHubId,
    normalizedParentType || normalizedSourceType,
    normalizedParentId || normalizedSourceId,
    normalizedSourceType,
    normalizedSourceId,
    normalizedRecipientUserId || normalizedRecipientEmail,
  ].filter(Boolean);

  if (!scope.length || !(normalizedRecipientUserId || normalizedRecipientEmail)) {
    return "";
  }

  if (reminderNotificationKinds.has(normalizedKind) && normalizedScheduledFor) {
    scope.push(normalizedScheduledFor);
  }

  return scope.join(":");
}

export function resolveReminderScheduledFor(startAt, leadHours = 24) {
  const parsedStartAt = parseIsoDate(startAt);
  const numericLeadHours = Number.parseInt(String(leadHours || ""), 10);

  if (!parsedStartAt || !Number.isFinite(numericLeadHours) || numericLeadHours <= 0) {
    return "";
  }

  return new Date(parsedStartAt.getTime() - (numericLeadHours * 60 * 60 * 1000)).toISOString();
}

export function shouldSkipReminderSchedulingForLateBooking(createdAt, scheduledFor) {
  const createdDate = parseIsoDate(createdAt);
  const scheduledDate = parseIsoDate(scheduledFor);

  if (!createdDate || !scheduledDate) {
    return false;
  }

  return createdDate.getTime() > scheduledDate.getTime();
}

export function resolveRecurringReminderTarget(offeringKind, offering = {}) {
  const normalizedOfferingKind = normalizeLowerString(offeringKind);

  if (normalizedOfferingKind === "course") {
    return {
      parentType: "course",
      parentId: normalizeString(offering.id),
      seriesId: "",
      occurrenceDate: "",
      occurrenceOrdinal: 0,
      usesOccurrenceTarget: false,
    };
  }

  const isSeriesOccurrence =
    normalizeLowerString(offering?.eventKind) === "series_occurrence" &&
    Boolean(normalizeString(offering?.seriesId));

  return {
    parentType: isSeriesOccurrence ? "eventOccurrence" : "event",
    parentId: normalizeString(offering.id),
    seriesId: normalizeString(offering?.seriesId),
    occurrenceDate: normalizeString(offering?.occurrenceDate),
    occurrenceOrdinal: Number.parseInt(String(offering?.occurrenceOrdinal || ""), 10) || 0,
    usesOccurrenceTarget: isSeriesOccurrence,
  };
}

export function resolveEventBookingNotificationRecipients({
  booking = {},
  attendees = [],
  bookerUser = null,
  includeGuestRecipients = false,
} = {}) {
  const recipientMap = new Map();
  const normalizedAttendees = Array.isArray(attendees) ? attendees : [];
  const primaryAttendee = normalizedAttendees.find((attendee) => attendee?.isPrimaryBooker) || null;
  const primaryRecipient = buildRecipient({
    role: "primary_booker",
    userId:
      normalizeString(booking.bookerUserId) ||
      normalizeString(bookerUser?.id) ||
      normalizeString(primaryAttendee?.memberUserId),
    email:
      normalizeString(bookerUser?.email) ||
      normalizeString(booking.bookerEmail) ||
      normalizeString(booking.bookerEmailSnapshot) ||
      normalizeString(primaryAttendee?.email),
    name:
      normalizeString(bookerUser?.name) ||
      normalizeString(booking.bookerName) ||
      normalizeString(booking.bookerNameSnapshot) ||
      normalizeString(primaryAttendee?.displayName),
    attendeeId: normalizeString(primaryAttendee?.id),
  });

  addRecipientRecipientMapEntry(recipientMap, primaryRecipient);

  if (!includeGuestRecipients) {
    return [...recipientMap.values()];
  }

  for (const attendee of normalizedAttendees) {
    if (attendee?.isPrimaryBooker !== true) {
      addRecipientRecipientMapEntry(
        recipientMap,
        buildRecipient({
          role: "guest_attendee",
          userId: normalizeString(attendee?.memberUserId),
          email: normalizeString(attendee?.email),
          name: normalizeString(attendee?.displayName),
          attendeeId: normalizeString(attendee?.id),
        })
      );
    }
  }

  return [...recipientMap.values()];
}

export function resolveEventRegistrationNotificationRecipients({ registration = {}, user = null } = {}) {
  const recipient = buildRecipient({
    role: "member",
    userId: normalizeString(registration.userId) || normalizeString(user?.id),
    email: normalizeString(user?.email) || normalizeString(registration.userEmail),
    name: normalizeString(user?.name) || normalizeString(registration.userName),
  });

  return recipient ? [recipient] : [];
}

export function resolveCourseRegistrationNotificationRecipients({ registration = {}, user = null } = {}) {
  const recipient = buildRecipient({
    role: "member",
    userId: normalizeString(registration.userId) || normalizeString(user?.id),
    email: normalizeString(user?.email) || normalizeString(registration.userEmail),
    name: normalizeString(user?.name) || normalizeString(registration.userName),
  });

  return recipient ? [recipient] : [];
}

export function isReminderEligible({
  offeringKind = "event",
  status = "",
  paymentStatus = "",
  parentStatus = "published",
} = {}) {
  const allowedStatuses = resolveActiveSourceStatuses(offeringKind);
  const normalizedStatus = normalizeLowerString(status);
  const normalizedPaymentStatus = normalizeLowerString(paymentStatus) || "not_required";
  const normalizedParentStatus = normalizeLowerString(parentStatus) || "published";

  if (!allowedStatuses.has(normalizedStatus)) {
    return false;
  }

  if (normalizedParentStatus === "cancelled") {
    return false;
  }

  return new Set(["paid", "partially_refunded", "not_required"]).has(normalizedPaymentStatus);
}

export function getSuppressedNotificationKindsForCancelledSource(offeringKind) {
  return [
    resolveConfirmedNotificationKind(offeringKind),
    resolveRecordedPendingPaymentNotificationKind(offeringKind),
    resolveWaitlistedNotificationKind(offeringKind),
    resolveReminderNotificationKind(offeringKind),
  ];
}

export function getSuppressedNotificationKindsForCancelledOffering(offeringKind) {
  return [
    resolveConfirmedNotificationKind(offeringKind),
    resolveRecordedPendingPaymentNotificationKind(offeringKind),
    resolveWaitlistedNotificationKind(offeringKind),
    resolveReminderNotificationKind(offeringKind),
  ];
}

export function getSuppressedNotificationKindsForStatusTransition({
  offeringKind = "event",
  previousStatus = "",
  nextStatus = "",
} = {}) {
  const normalizedPreviousStatus = normalizeLowerString(previousStatus);
  const normalizedNextStatus = normalizeLowerString(nextStatus);
  const suppressedKinds = new Set();

  if (
    normalizedPreviousStatus === "waitlisted" &&
    resolveActiveSourceStatuses(offeringKind).has(normalizedNextStatus)
  ) {
    suppressedKinds.add(resolveWaitlistedNotificationKind(offeringKind));
  }

  return [...suppressedKinds];
}

export function shouldSuppressNotification({
  kind = "",
  offeringKind = "event",
  sourceStatus = "",
  parentStatus = "",
  previousStatus = "",
  nextStatus = "",
} = {}) {
  const normalizedKind = normalizeString(kind);

  if (!normalizedKind || cancellationNotificationKinds.has(normalizedKind)) {
    return false;
  }

  const sourceSuppressedKinds = new Set(getSuppressedNotificationKindsForCancelledSource(offeringKind));
  const parentSuppressedKinds = new Set(getSuppressedNotificationKindsForCancelledOffering(offeringKind));
  const transitionSuppressedKinds = new Set(
    getSuppressedNotificationKindsForStatusTransition({ offeringKind, previousStatus, nextStatus })
  );

  if (normalizeLowerString(sourceStatus) === "cancelled" && sourceSuppressedKinds.has(normalizedKind)) {
    return true;
  }

  if (normalizeLowerString(parentStatus) === "cancelled" && parentSuppressedKinds.has(normalizedKind)) {
    return true;
  }

  return transitionSuppressedKinds.has(normalizedKind);
}

export function isImmediateLifecycleNotificationKind(kind) {
  return immediateLifecycleKinds.has(normalizeString(kind));
}

export function isReminderNotificationKind(kind) {
  return reminderNotificationKinds.has(normalizeString(kind));
}

export function isWaitlistNotificationKind(kind) {
  return waitlistNotificationKinds.has(normalizeString(kind));
}

export function buildSourceTypeForBookingNotification({ offeringKind = "event", sourceKind = "booking" } = {}) {
  const normalizedOfferingKind = normalizeLowerString(offeringKind);
  const normalizedSourceKind = normalizeLowerString(sourceKind);

  if (normalizedOfferingKind === "course") {
    return normalizedSourceKind === "offering" ? "course" : "courseRegistration";
  }

  if (normalizedSourceKind === "registration") {
    return "eventRegistration";
  }

  if (normalizedSourceKind === "offering") {
    return "event";
  }

  return "eventBooking";
}

export function buildNotificationParentDescriptor({ offeringKind = "event", offering = {} } = {}) {
  const normalizedOfferingKind = normalizeLowerString(offeringKind);

  if (normalizedOfferingKind === "course") {
    return {
      parentType: "course",
      parentId: normalizeString(offering.id),
    };
  }

  return {
    parentType: "event",
    parentId: normalizeString(offering.id),
  };
}

export function describeNotificationKind(kind) {
  const normalizedKind = normalizeString(kind);

  if (!isBookingNotificationKind(normalizedKind)) {
    return "unknown";
  }

  if (cancellationNotificationKinds.has(normalizedKind)) {
    return "cancellation";
  }

  if (reminderNotificationKinds.has(normalizedKind)) {
    return "reminder";
  }

  if (waitlistNotificationKinds.has(normalizedKind)) {
    return "waitlist";
  }

  return "lifecycle";
}
