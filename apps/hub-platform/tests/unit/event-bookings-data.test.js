import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("event booking shared module keeps booking and attendee normalization defaults explicit", () => {
  const sharedSource = readFileSync(
    new URL("../../src/lib/data/event-booking-shared.js", import.meta.url),
    "utf8"
  );

  assert.match(sharedSource, /export function normalizeString/);
  assert.match(sharedSource, /export function normalizeEventBookingRecord/);
  assert.match(sharedSource, /status: normalizeString\(booking\.status\) \|\| "active"/);
  assert.match(sharedSource, /paymentStatus: normalizeString\(booking\.paymentStatus\) \|\| "not_required"/);
  assert.match(sharedSource, /attendeeCount: normalizeInteger\(booking\.attendeeCount, 0\)/);
  assert.match(sharedSource, /export function normalizeEventBookingAttendeeRecord/);
  assert.match(sharedSource, /status: normalizeString\(attendee\.status\) \|\| "registered"/);
  assert.match(sharedSource, /attendanceStatus: normalizeString\(attendee\.attendanceStatus\) \|\| "pending"/);
  assert.match(sharedSource, /refundStatus: normalizeString\(attendee\.refundStatus\) \|\| "not_applicable"/);
});

test("event booking barrel preserves the public query API", () => {
  const barrelSource = readFileSync(
    new URL("../../src/lib/data/event-bookings.js", import.meta.url),
    "utf8"
  );

  assert.match(barrelSource, /listEventBookings/);
  assert.match(barrelSource, /listEventBookingAttendees/);
  assert.match(barrelSource, /listEventBookingsByBooker/);
  assert.match(barrelSource, /listEventBookingPaymentItemsByHub/);
  assert.match(barrelSource, /getActiveOrWaitlistedEventBookingByBooker/);
  assert.match(barrelSource, /countActiveEventBookingAttendees/);
  assert.match(barrelSource, /listWaitlistedEventBookings/);
  assert.match(barrelSource, /createEventBookingForMember/);
  assert.match(barrelSource, /cancelEventBookingAttendee/);
  assert.match(barrelSource, /promoteWaitlistedEventBookings/);
  assert.match(barrelSource, /\.\/event-booking-queries\.js/);
  assert.match(barrelSource, /\.\/event-booking-mutations\.js/);
});

test("event booking query module makes attendee-based count ownership explicit", () => {
  const querySource = readFileSync(
    new URL("../../src/lib/data/event-booking-queries.js", import.meta.url),
    "utf8"
  );

  assert.match(querySource, /export async function countActiveEventBookingAttendees/);
  assert.match(querySource, /row\.activeAttendeeCount/);
  assert.match(querySource, /export async function countWaitlistedEventBookingAttendees/);
  assert.match(querySource, /row\.waitlistedAttendeeCount \|\| row\.attendeeCount/);
  assert.match(querySource, /export async function listWaitlistedEventBookings/);
  assert.match(querySource, /where\("status", "==", "waitlisted"\)/);
  assert.match(querySource, /orderBy\("createdAt", "asc"\)/);
  assert.match(querySource, /export async function getActiveOrWaitlistedEventBookingByBooker/);
  assert.match(querySource, /row\.status === "active" \|\| row\.status === "waitlisted"/);
  assert.match(querySource, /export async function listEventBookingPaymentItemsByHub/);
  assert.match(querySource, /title: normalizeString\(event\?\.title\) \|\| row\.eventTitleSnapshot \|\| "Event booking"/);
});
