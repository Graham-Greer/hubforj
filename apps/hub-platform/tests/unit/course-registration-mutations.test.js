import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("course registration payment updates sync deterministic payment records", () => {
  const source = readFileSync(
    new URL("../../src/lib/data/course-registration-mutations.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /export async function updateCourseRegistrationPaymentStatus/);
  assert.match(source, /syncCourseRegistrationPaymentRecord/);
  assert.match(source, /getPaymentRecordBySource/);
  assert.match(source, /upsertPaymentRecordBySource/);
  assert.match(source, /sourceType: "courseRegistration"/);
  assert.match(source, /reportingEligibility/);
  assert.match(source, /paymentCompletedAt:/);
});
