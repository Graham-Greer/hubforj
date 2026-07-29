import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("course registration shared module keeps normalization defaults explicit", () => {
  const sharedSource = readFileSync(
    new URL("../../src/lib/data/course-registration-shared.js", import.meta.url),
    "utf8"
  );

  assert.match(sharedSource, /export function normalizeString/);
  assert.match(sharedSource, /String\(value \|\| ""\)\.trim\(\)/);
  assert.match(sharedSource, /export function normalizeCourseRegistrationRecord/);
  assert.match(sharedSource, /status: normalizeString\(registration\.status\) \|\| "enrolled"/);
  assert.match(sharedSource, /paymentStatus: normalizeString\(registration\.paymentStatus\) \|\| "not_required"/);
  assert.match(sharedSource, /attendanceStatus: normalizeString\(registration\.attendanceStatus\) \|\| "pending"/);
  assert.match(sharedSource, /attendanceMarkedAt: normalizeString\(registration\.attendanceMarkedAt\)/);
  assert.match(sharedSource, /userEmail: normalizeString\(user\?\.email\)\.toLowerCase\(\)/);
});

test("course registration barrel preserves the public query and mutation API", () => {
  const barrelSource = readFileSync(
    new URL("../../src/lib/data/course-registrations.js", import.meta.url),
    "utf8"
  );

  assert.match(barrelSource, /getCourseRegistrationByUser/);
  assert.match(barrelSource, /getLatestCourseRegistrationByUser/);
  assert.match(barrelSource, /listCoursePaymentItemsByHub/);
  assert.match(barrelSource, /listCourseRegistrations/);
  assert.match(barrelSource, /listCourseRegistrationsByUser/);
  assert.match(barrelSource, /createCourseRegistrationForMember/);
  assert.match(barrelSource, /updateCourseRegistrationAttendanceStatus/);
  assert.match(barrelSource, /updateCourseRegistrationPaymentStatus/);
  assert.match(barrelSource, /updateCourseRegistrationStatus/);
  assert.match(barrelSource, /\.\/course-registration-queries\.js/);
  assert.match(barrelSource, /\.\/course-registration-mutations\.js/);
});

test("course payment items source includes free enrolments in the admin queue", () => {
  const querySource = readFileSync(
    new URL("../../src/lib/data/course-registration-queries.js", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(querySource, /filter\(\(item\) => item\.amount \|\| item\.paymentStatus !== "not_required"\)/);
  assert.match(querySource, /paymentStatus: row\.paymentStatus/);
  assert.match(querySource, /amount: normalizeString\(course\?\.price\)/);
});
