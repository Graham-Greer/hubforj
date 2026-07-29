import test from "node:test";
import assert from "node:assert/strict";
import {
  assertEventCanAcceptBooking,
  canHubUseGroupBookings,
  getEventBookingPaymentStatusLabel,
  getEventBookingPaymentStatusTone,
  normalizeEventBookingMode,
  normalizeEventGuestDetailsMode,
  normalizeEventRegistrationEligibility,
  resolveInitialEventBookingStatus,
  resolveEventBookingConfiguration,
} from "../../src/lib/domain/event-bookings.js";

test("members-only event booking configuration always collapses to a single attendee", () => {
  const configuration = resolveEventBookingConfiguration({
    registrationEligibility: "members-only",
    bookingMode: "group_booking",
    maxAttendeesPerBooking: 5,
    guestDetailsMode: "name_and_email",
  });

  assert.equal(configuration.registrationEligibility, "members-only");
  assert.equal(configuration.bookingMode, "single_attendee");
  assert.equal(configuration.maxAttendeesPerBooking, 1);
  assert.equal(configuration.guestDetailsMode, "name_only");
});

test("guest-eligible configuration preserves explicit group-booking settings", () => {
  const configuration = resolveEventBookingConfiguration({
    registrationEligibility: "guests-allowed",
    bookingMode: "group_booking",
    maxAttendeesPerBooking: "6",
    guestDetailsMode: "name_only",
  });

  assert.equal(configuration.registrationEligibility, "guests-allowed");
  assert.equal(configuration.bookingMode, "group_booking");
  assert.equal(configuration.maxAttendeesPerBooking, 6);
  assert.equal(configuration.guestDetailsMode, "name_only");
});

test("booking normalization helpers use safe fallbacks", () => {
  assert.equal(normalizeEventRegistrationEligibility(""), "members-only");
  assert.equal(normalizeEventBookingMode(""), "single_attendee");
  assert.equal(normalizeEventGuestDetailsMode(""), "name_only");
  assert.equal(normalizeEventGuestDetailsMode("name_and_email"), "name_only");
  assert.equal(getEventBookingPaymentStatusLabel("partially_refunded"), "Partially refunded");
  assert.equal(getEventBookingPaymentStatusTone("partially_refunded"), "info");
});

test("group-booking capability is Growth-only", () => {
  assert.equal(canHubUseGroupBookings({ packageTier: "free" }), false);
  assert.equal(canHubUseGroupBookings({ packageTier: "starter" }), false);
  assert.equal(canHubUseGroupBookings({ packageTier: "growth" }), true);
});

test("initial booking status respects party-size capacity and waitlist rules", () => {
  assert.equal(resolveInitialEventBookingStatus({ capacity: 0 }, 25, 4), "active");
  assert.equal(resolveInitialEventBookingStatus({ capacity: 10, allowWaitlist: true }, 8, 2), "active");
  assert.equal(resolveInitialEventBookingStatus({ capacity: 10, allowWaitlist: true }, 9, 2), "waitlisted");
  assert.equal(resolveInitialEventBookingStatus({ capacity: 10, allowWaitlist: false }, 9, 2), "blocked");
});

test("event booking acceptance rejects blocked capacity and unpublished events", () => {
  assert.throws(
    () => assertEventCanAcceptBooking({ status: "draft" }, 0, 1),
    /This event is not open for booking\./
  );

  assert.throws(
    () => assertEventCanAcceptBooking({ status: "published", capacity: 5, allowWaitlist: false }, 5, 1),
    /This event does not have enough remaining places for that booking\./
  );
});
