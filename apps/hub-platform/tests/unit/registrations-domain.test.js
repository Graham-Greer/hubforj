import test from "node:test";
import assert from "node:assert/strict";
import {
  assertAttendanceStatusTransition,
  assertRegistrationPaymentStatusTransition,
  assertRegistrationStatusTransition,
  canUpdateAttendance,
  getAttendanceStatusLabel,
  getAttendanceStatusTone,
  getPaymentStatusLabel,
  getPaymentStatusTone,
  getRegistrationStatusLabel,
  getRegistrationStatusTone,
  summarizeRegistrations,
} from "../../src/lib/domain/registrations.js";

test("registration and payment helpers map supported statuses", () => {
  assert.equal(getRegistrationStatusLabel("waitlisted"), "Waitlisted");
  assert.equal(getRegistrationStatusTone("cancelled"), "danger");
  assert.equal(getPaymentStatusLabel("overdue"), "Overdue");
  assert.equal(getPaymentStatusTone("failed"), "danger");
  assert.equal(getPaymentStatusLabel("not_required"), "Not required");
  assert.equal(getPaymentStatusTone("refunded"), "info");
  assert.equal(getAttendanceStatusLabel("present"), "Present");
  assert.equal(getAttendanceStatusTone("absent"), "danger");
});

test("summarizeRegistrations counts operational totals", () => {
  const summary = summarizeRegistrations([
    { status: "registered", paymentStatus: "paid", attendanceStatus: "present" },
    { status: "registered", paymentStatus: "unpaid", attendanceStatus: "pending" },
    { status: "waitlisted", paymentStatus: "not_required", attendanceStatus: "absent" },
  ]);

  assert.deepEqual(summary, {
    total: 3,
    registered: 2,
    waitlisted: 1,
    cancelled: 0,
    paymentAttention: 1,
    present: 1,
    absent: 1,
  });
});

test("summarizeRegistrations ignores cancelled unpaid bookings for payment attention", () => {
  const summary = summarizeRegistrations([
    { status: "cancelled", paymentStatus: "unpaid", attendanceStatus: "pending" },
    { status: "registered", paymentStatus: "failed", attendanceStatus: "pending" },
  ]);

  assert.equal(summary.cancelled, 1);
  assert.equal(summary.paymentAttention, 1);
});

test("registration transition rules enforce allowed changes", () => {
  assert.equal(assertRegistrationStatusTransition("registered", "waitlisted"), "waitlisted");
  assert.equal(assertRegistrationStatusTransition("cancelled", "waitlisted"), "waitlisted");
  assert.throws(
    () => assertRegistrationStatusTransition("cancelled", "registered"),
    /Cannot move registration from cancelled to registered\./
  );
});

test("attendance transition rules require registered status", () => {
  assert.equal(canUpdateAttendance("registered"), true);
  assert.equal(canUpdateAttendance("waitlisted"), false);
  assert.equal(assertAttendanceStatusTransition("registered", "pending", "present"), "present");
  assert.throws(
    () => assertAttendanceStatusTransition("waitlisted", "pending", "present"),
    /Only registered attendees can be marked for attendance\./
  );
});

test("registration payment transitions keep free items locked and allow operational debt states", () => {
  assert.equal(assertRegistrationPaymentStatusTransition("unpaid", "overdue"), "overdue");
  assert.equal(assertRegistrationPaymentStatusTransition("overdue", "failed"), "failed");
  assert.throws(
    () => assertRegistrationPaymentStatusTransition("not_required", "paid"),
    /Free registrations do not require payment follow-up\./
  );
  assert.throws(
    () => assertRegistrationPaymentStatusTransition("paid", "not_required"),
    /Only free registrations can be marked as not required\./
  );
});
