import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("event booking mutations keep create-booking transaction ownership explicit", () => {
  const source = readFileSync(
    new URL("../../src/lib/data/event-booking-mutations.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /export async function createEventBookingForMember/);
  assert.match(source, /getEventBookingBookerSentinelRef/);
  assert.match(source, /runTransaction/);
  assert.match(source, /assertEventCanAcceptBooking/);
  assert.match(source, /resolveInitialEventBookingStatus/);
  assert.match(source, /resolveInitialEventBookingPaymentStatus/);
  assert.match(source, /You already have a booking for this event\./);
  assert.match(source, /This event does not have enough remaining places for that booking\./);
  assert.match(source, /registeredAttendeeCount:/);
  assert.match(source, /waitlistedAttendeeCount:/);
  assert.match(source, /activeBookingCount:/);
});

test("event booking mutations keep attendee-cancellation aggregate recomputation explicit", () => {
  const source = readFileSync(
    new URL("../../src/lib/data/event-booking-mutations.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /export async function cancelEventBookingAttendee/);
  assert.match(source, /resolveEventBookingRefundState/);
  assert.match(source, /summarizeEventBookingAttendees/);
  assert.match(source, /resolveBookingStatusFromAttendees/);
  assert.match(source, /registeredAttendeeCount:/);
  assert.match(source, /waitlistedAttendeeCount:/);
  assert.match(source, /cancelledAttendeeCount:/);
  assert.match(source, /activeBookingCount:/);
  assert.match(source, /getEventBookingBookerSentinelRef/);
});

test("event booking mutations keep whole-party waitlist promotion explicit", () => {
  const source = readFileSync(
    new URL("../../src/lib/data/event-booking-mutations.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /export async function promoteWaitlistedEventBookings/);
  assert.match(source, /promoteOneWaitlistedEventBooking/);
  assert.match(source, /\.filter\(\(entry\) => entry\.booking\.status === "waitlisted"\)/);
  assert.match(source, /\.sort\(\(left, right\) =>/);
  assert.match(source, /canPromoteWaitlistedBooking/);
  assert.match(source, /blockedByCapacity/);
});

test("event booking payment updates sync deterministic payment records", () => {
  const source = readFileSync(
    new URL("../../src/lib/data/event-booking-mutations.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /export async function updateEventBookingPaymentState/);
  assert.match(source, /syncEventBookingPaymentRecord/);
  assert.match(source, /getPaymentRecordBySource/);
  assert.match(source, /upsertPaymentRecordBySource/);
  assert.match(source, /sourceType: "eventBooking"/);
  assert.match(source, /reportingEligibility/);
  assert.match(source, /paymentCompletedAt:/);
});
