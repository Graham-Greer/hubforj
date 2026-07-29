import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("event booking helper source keeps booking payment normalization explicit", () => {
  const helperSource = readFileSync(
    new URL("../../src/components/patterns/event-registration-workspace/event-registration-helpers.js", import.meta.url),
    "utf8"
  );

  assert.match(helperSource, /export function normalizeEventBookingPaymentState/);
  assert.match(helperSource, /if \(pricingMode !== "paid"\)/);
  assert.match(helperSource, /return "free"/);
  assert.match(helperSource, /new Set\(\["pending", "paid", "failed", "partially_refunded", "refunded"\]\)/);
  assert.match(helperSource, /return allowed\.has\(paymentStatus\) \? paymentStatus : "pending"/);
  assert.match(helperSource, /if \(normalized === "partially_refunded"\)/);
  assert.match(helperSource, /return "Partially refunded"/);
  assert.match(helperSource, /if \(normalized === "failed"\)/);
  assert.match(helperSource, /return "Failed"/);
  assert.match(helperSource, /if \(normalized === "pending"\)/);
  assert.match(helperSource, /return "Pending"/);
  assert.match(helperSource, /if \(normalized === "refunded"\)/);
  assert.match(helperSource, /return "Refunded"/);
  assert.match(helperSource, /return "Free"/);
});

test("event booking helper source stays focused on payment normalization only", () => {
  const helperSource = readFileSync(
    new URL("../../src/components/patterns/event-registration-workspace/event-registration-helpers.js", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(helperSource, /export function filterEventRegistrations/);
  assert.doesNotMatch(helperSource, /export function getRegistrationFilterLabel/);
  assert.doesNotMatch(helperSource, /export function getPaymentFilterLabel/);
  assert.doesNotMatch(helperSource, /registration\.userName/);
});

test("event booking action source starts booking checkout for Growth paid events", () => {
  const source = readFileSync(
    new URL("../../src/app/(hub)/[hubSlug]/events/[eventSlug]/actions.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /startEventBookingCheckout/);
  assert.match(source, /createEventBookingForMember/);
  assert.match(source, /parseRequestedGuestAttendees/);
  assert.match(source, /bookPublicEventWithAttendeesAction/);
  assert.match(source, /attendeeFullName_/);
  assert.match(source, /packagePaymentProcessingMode === "internal"/);
  assert.match(source, /getRequestHostWithPortFromHeaders/);
  assert.match(source, /resolveHubRuntimeRouteMode/);
});

test("event registration mutations keep cancelled bookings separate from new bookings", () => {
  const source = readFileSync(
    new URL("../../src/lib/data/event-registration-mutations.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /You already have a registration for this event\./);
  assert.doesNotMatch(source, /buildFreshRegistrationState/);
  assert.doesNotMatch(source, /cancelledAt: ""/);
});
