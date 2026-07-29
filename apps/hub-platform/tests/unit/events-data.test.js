import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("events barrel preserves the public query and mutation API", () => {
  const barrelSource = readFileSync(
    new URL("../../src/lib/data/events.js", import.meta.url),
    "utf8"
  );

  assert.match(barrelSource, /getEventById/);
  assert.match(barrelSource, /getEventBySlug/);
  assert.match(barrelSource, /getPublicEventBySlug/);
  assert.match(barrelSource, /listEventsByHubSlug/);
  assert.match(barrelSource, /listPublicEventsByHubSlug/);
  assert.match(barrelSource, /createEventByHubSlug/);
  assert.match(barrelSource, /updateEventById/);
  assert.match(barrelSource, /\.\/event-queries\.js/);
  assert.match(barrelSource, /\.\/event-mutations\.js/);
});

test("event shared module keeps normalization and media attachment explicit", () => {
  const sharedSource = readFileSync(
    new URL("../../src/lib/data/event-shared.js", import.meta.url),
    "utf8"
  );

  assert.match(sharedSource, /export function normalizeEventRecord/);
  assert.match(sharedSource, /status: normalizeString\(event\.status\) \|\| "draft"/);
  assert.match(sharedSource, /pricingMode: normalizeString\(event\.pricingMode\) \|\| "free"/);
  assert.match(sharedSource, /externalPaymentUrl: normalizeString\(event\.externalPaymentUrl\)/);
  assert.match(sharedSource, /paymentInstructions: normalizeString\(event\.paymentInstructions\)/);
  assert.match(sharedSource, /refundWindowMode: normalizeEventRefundWindowMode\(event\.refundWindowMode\)/);
  assert.match(sharedSource, /refundWindowHours: normalizeEventRefundWindowHours\(event\.refundWindowHours\)/);
  assert.match(sharedSource, /refundPolicy: normalizeEventRefundPolicy\(event\.refundPolicy\)/);
  assert.match(sharedSource, /registrationEligibility: bookingConfiguration\.registrationEligibility/);
  assert.match(sharedSource, /bookingMode: bookingConfiguration\.bookingMode/);
  assert.match(sharedSource, /maxAttendeesPerBooking: bookingConfiguration\.maxAttendeesPerBooking/);
  assert.match(sharedSource, /guestDetailsMode: bookingConfiguration\.guestDetailsMode/);
  assert.match(sharedSource, /registeredAttendeeCount: normalizeEventInteger\(event\.registeredAttendeeCount, 0\)/);
  assert.match(sharedSource, /waitlistedAttendeeCount: normalizeEventInteger\(event\.waitlistedAttendeeCount, 0\)/);
  assert.match(sharedSource, /cancelledAttendeeCount: normalizeEventInteger\(event\.cancelledAttendeeCount, 0\)/);
  assert.match(sharedSource, /activeBookingCount: normalizeEventInteger\(event\.activeBookingCount, 0\)/);
  assert.match(sharedSource, /visibility: normalizeString\(event\.visibility\) \|\| "public"/);
  assert.match(sharedSource, /category: normalizeString\(event\.category\) \|\| "Workshop"/);
  assert.match(sharedSource, /export function attachEventMedia/);
  assert.match(sharedSource, /imageAsset: event\.imageAssetId \? byId\.get\(event\.imageAssetId\) \|\| null : null/);
});

test("event mutations keep uniqueness and paid-pricing invariants explicit", () => {
  const mutationSource = readFileSync(
    new URL("../../src/lib/data/event-mutations.js", import.meta.url),
    "utf8"
  );

  assert.match(mutationSource, /assertUniqueEventSlug/);
  assert.match(mutationSource, /An event with this slug already exists for this hub\./);
  assert.match(mutationSource, /price: next\.pricingMode === "paid" \? next\.price : ""/);
  assert.match(mutationSource, /resolveEventPaymentConfiguration/);
  assert.match(mutationSource, /externalPaymentUrl: paymentConfiguration\.externalPaymentUrl/);
  assert.match(mutationSource, /refundWindowMode: next\.refundWindowMode/);
  assert.match(mutationSource, /refundWindowHours: next\.refundWindowHours/);
  assert.match(mutationSource, /refundPolicy: next\.refundPolicy/);
  assert.match(mutationSource, /assertHubCanUseEventBookingMode/);
  assert.match(mutationSource, /Group bookings are only available on the Growth package tier\./);
  assert.match(mutationSource, /bookingMode: next\.bookingMode/);
  assert.match(mutationSource, /maxAttendeesPerBooking: next\.maxAttendeesPerBooking/);
  assert.match(mutationSource, /guestDetailsMode: next\.guestDetailsMode/);
  assert.match(mutationSource, /registeredAttendeeCount: 0/);
  assert.match(mutationSource, /waitlistedAttendeeCount: 0/);
  assert.match(mutationSource, /cancelledAttendeeCount: 0/);
  assert.match(mutationSource, /activeBookingCount: 0/);
});
