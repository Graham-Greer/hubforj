import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveInitialPaymentStatusForEvent,
  validateAttendanceStatus,
  validatePaymentStatusForEvent,
  validateRegistrationStatusTransition,
} from "../../src/lib/validation/registrations.js";

test("validateRegistrationStatusTransition allows waitlisted to registered", () => {
  assert.equal(validateRegistrationStatusTransition("waitlisted", "registered"), "registered");
});

test("validateRegistrationStatusTransition rejects cancelled to registered", () => {
  assert.throws(() => validateRegistrationStatusTransition("cancelled", "registered"), /Invalid registration status transition/);
});

test("validatePaymentStatusForEvent enforces free event not-required", () => {
  assert.throws(() => validatePaymentStatusForEvent("free", "paid"), /only allow paymentStatus=not-required/);
});

test("validatePaymentStatusForEvent allows paid/unpaid for paid event", () => {
  assert.equal(validatePaymentStatusForEvent("paid", "unpaid"), "unpaid");
  assert.equal(validatePaymentStatusForEvent("paid", "paid"), "paid");
});

test("validateAttendanceStatus allows markers only for registered", () => {
  assert.equal(validateAttendanceStatus("registered", "attended"), "attended");
  assert.throws(() => validateAttendanceStatus("waitlisted", "attended"), /only be marked for registered/);
});

test("resolveInitialPaymentStatusForEvent maps pricing mode", () => {
  assert.equal(resolveInitialPaymentStatusForEvent("free"), "not-required");
  assert.equal(resolveInitialPaymentStatusForEvent("paid"), "unpaid");
});
