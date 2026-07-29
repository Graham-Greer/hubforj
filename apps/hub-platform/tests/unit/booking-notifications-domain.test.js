import test from "node:test";
import assert from "node:assert/strict";
import {
  bookingNotificationKinds,
  buildBookingNotificationDedupeKey,
  getSuppressedNotificationKindsForStatusTransition,
  isReminderEligible,
  resolveInitialBookingNotificationKind,
  resolveRecurringReminderTarget,
  resolveReminderScheduledFor,
  resolveEventBookingNotificationRecipients,
} from "../../src/lib/domain/booking-notifications.js";

test("booking notification kind helpers resolve truthful launch lifecycle states", () => {
  assert.equal(
    resolveInitialBookingNotificationKind({
      offeringKind: "event",
      status: "active",
      pricingMode: "free",
      paymentProcessingMode: "none",
      paymentStatus: "not_required",
    }),
    bookingNotificationKinds.eventBookingConfirmed
  );

  assert.equal(
    resolveInitialBookingNotificationKind({
      offeringKind: "event",
      status: "waitlisted",
      pricingMode: "paid",
      paymentProcessingMode: "external",
      paymentStatus: "unpaid",
    }),
    bookingNotificationKinds.eventBookingWaitlisted
  );

  assert.equal(
    resolveInitialBookingNotificationKind({
      offeringKind: "course",
      status: "enrolled",
      pricingMode: "paid",
      paymentProcessingMode: "internal",
      paymentStatus: "unpaid",
    }),
    bookingNotificationKinds.courseEnrolmentRecordedPendingPayment
  );
});

test("booking notification dedupe keys stay stable and include reminder schedule scope", () => {
  const immediateKey = buildBookingNotificationDedupeKey({
    kind: bookingNotificationKinds.eventBookingConfirmed,
    hubId: "hub_123",
    sourceType: "eventBooking",
    sourceId: "booking_123",
    parentType: "event",
    parentId: "event_123",
    recipientUserId: "user_123",
    recipientEmail: "member@example.com",
  });
  const reminderKey = buildBookingNotificationDedupeKey({
    kind: bookingNotificationKinds.eventBookingReminder,
    hubId: "hub_123",
    sourceType: "eventBooking",
    sourceId: "booking_123",
    parentType: "eventOccurrence",
    parentId: "event_123",
    recipientUserId: "user_123",
    recipientEmail: "member@example.com",
    scheduledFor: "2026-06-06T09:00:00.000Z",
  });

  assert.equal(
    immediateKey,
    "event_booking_confirmed:hub_123:event:event_123:eventBooking:booking_123:user_123"
  );
  assert.equal(
    reminderKey,
    "event_booking_reminder:hub_123:eventOccurrence:event_123:eventBooking:booking_123:user_123:2026-06-06T09:00:00.000Z"
  );
});

test("booking notification recipient helpers keep the primary booker and optional guests explicit", () => {
  const recipients = resolveEventBookingNotificationRecipients({
    booking: {
      bookerUserId: "user_123",
      bookerNameSnapshot: "Ada Lovelace",
      bookerEmailSnapshot: "ada@example.com",
    },
    attendees: [
      {
        id: "attendee_1",
        isPrimaryBooker: true,
        displayName: "Ada Lovelace",
        email: "ada@example.com",
      },
      {
        id: "attendee_2",
        isPrimaryBooker: false,
        displayName: "Grace Hopper",
        email: "grace@example.com",
      },
    ],
    includeGuestRecipients: true,
  });

  assert.deepEqual(recipients, [
    {
      role: "primary_booker",
      userId: "user_123",
      attendeeId: "attendee_1",
      email: "ada@example.com",
      name: "Ada Lovelace",
    },
    {
      role: "guest_attendee",
      userId: "",
      attendeeId: "attendee_2",
      email: "grace@example.com",
      name: "Grace Hopper",
    },
  ]);
});

test("booking reminder eligibility stays restricted to confirmed operational attendance states", () => {
  assert.equal(
    isReminderEligible({
      offeringKind: "event",
      status: "active",
      paymentStatus: "paid",
      parentStatus: "published",
    }),
    true
  );
  assert.equal(
    isReminderEligible({
      offeringKind: "course",
      status: "waitlisted",
      paymentStatus: "paid",
      parentStatus: "published",
    }),
    false
  );
  assert.equal(
    isReminderEligible({
      offeringKind: "course",
      status: "enrolled",
      paymentStatus: "unpaid",
      parentStatus: "published",
    }),
    false
  );
  assert.equal(
    isReminderEligible({
      offeringKind: "event",
      status: "active",
      paymentStatus: "not_required",
      parentStatus: "cancelled",
    }),
    false
  );
});

test("recurring reminder targeting uses occurrences instead of the parent series", () => {
  assert.deepEqual(
    resolveRecurringReminderTarget("event", {
      id: "event_occurrence_123",
      eventKind: "series_occurrence",
      seriesId: "series_123",
      occurrenceDate: "2026-06-20",
      occurrenceOrdinal: 4,
    }),
    {
      parentType: "eventOccurrence",
      parentId: "event_occurrence_123",
      seriesId: "series_123",
      occurrenceDate: "2026-06-20",
      occurrenceOrdinal: 4,
      usesOccurrenceTarget: true,
    }
  );

  assert.deepEqual(resolveRecurringReminderTarget("course", { id: "course_123" }), {
    parentType: "course",
    parentId: "course_123",
    seriesId: "",
    occurrenceDate: "",
    occurrenceOrdinal: 0,
    usesOccurrenceTarget: false,
  });
});

test("notification suppression rules clear obsolete waitlist lifecycle items on promotion", () => {
  assert.deepEqual(
    getSuppressedNotificationKindsForStatusTransition({
      offeringKind: "event",
      previousStatus: "waitlisted",
      nextStatus: "active",
    }),
    [bookingNotificationKinds.eventBookingWaitlisted]
  );

  assert.deepEqual(
    getSuppressedNotificationKindsForStatusTransition({
      offeringKind: "course",
      previousStatus: "waitlisted",
      nextStatus: "enrolled",
    }),
    [bookingNotificationKinds.courseEnrolmentWaitlisted]
  );
});

test("reminder scheduling subtracts the launch lead window from the occurrence start", () => {
  assert.equal(
    resolveReminderScheduledFor("2026-06-20T09:00:00.000Z", 24),
    "2026-06-19T09:00:00.000Z"
  );
});
