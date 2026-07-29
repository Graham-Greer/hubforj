import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("event registration shared module keeps normalization defaults explicit", () => {
  const sharedSource = readFileSync(
    new URL("../../src/lib/data/event-registration-shared.js", import.meta.url),
    "utf8"
  );

  assert.match(sharedSource, /export function normalizeString/);
  assert.match(sharedSource, /String\(value \|\| ""\)\.trim\(\)/);
  assert.match(sharedSource, /export function normalizeRegistrationRecord/);
  assert.match(sharedSource, /status: normalizeString\(registration\.status\) \|\| "registered"/);
  assert.match(sharedSource, /paymentStatus: normalizeString\(registration\.paymentStatus\) \|\| "not_required"/);
  assert.match(sharedSource, /attendanceStatus: normalizeString\(registration\.attendanceStatus\) \|\| "pending"/);
  assert.match(sharedSource, /attendanceMarkedAt: normalizeString\(registration\.attendanceMarkedAt\)/);
  assert.match(sharedSource, /userEmail: normalizeString\(user\?\.email\)\.toLowerCase\(\)/);
});

test("event registration barrel preserves the public query and mutation API", () => {
  const barrelSource = readFileSync(
    new URL("../../src/lib/data/registrations.js", import.meta.url),
    "utf8"
  );

  assert.match(barrelSource, /getEventRegistrationByUser/);
  assert.match(barrelSource, /listEventPaymentItemsByHub/);
  assert.match(barrelSource, /listEventRegistrations/);
  assert.match(barrelSource, /listRegistrationsByUser/);
  assert.match(barrelSource, /createEventRegistrationForMember/);
  assert.match(barrelSource, /updateEventRegistrationAttendanceStatus/);
  assert.match(barrelSource, /updateEventRegistrationPaymentStatus/);
  assert.match(barrelSource, /updateEventRegistrationStatus/);
  assert.match(barrelSource, /\.\/event-registration-queries\.js/);
  assert.match(barrelSource, /\.\/event-registration-mutations\.js/);
});

test("event payment items source includes free registrations in the admin queue", () => {
  const querySource = readFileSync(
    new URL("../../src/lib/data/event-registration-queries.js", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(querySource, /filter\(\(item\) => item\.amount \|\| item\.paymentStatus !== "not_required"\)/);
  assert.match(querySource, /paymentStatus: row\.paymentStatus/);
  assert.match(querySource, /amount: normalizeString\(event\?\.price\)/);
});
