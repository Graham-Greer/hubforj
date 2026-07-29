import test from "node:test";
import assert from "node:assert/strict";
import {
  assertCourseAttendanceStatusTransition,
  assertCourseCanAcceptRegistration,
  assertCoursePaymentStatusTransition,
  assertCourseRegistrationStatusTransition,
  canUpdateCourseAttendance,
  courseAttendanceTransitionRequiresConfirmation,
  getAllowedCourseAttendanceTransitions,
  getCoursePaymentStatusLabel,
  getCoursePaymentStatusTone,
  resolveInitialCoursePaymentStatus,
  resolveInitialCourseRegistrationStatus,
  summarizeCourseRegistrations,
} from "../../src/lib/domain/course-registrations.js";

test("course registration payment status aligns to pricing mode", () => {
  assert.equal(resolveInitialCoursePaymentStatus({ pricingMode: "free" }), "not_required");
  assert.equal(resolveInitialCoursePaymentStatus({ pricingMode: "paid" }), "unpaid");
  assert.equal(getCoursePaymentStatusLabel("overdue"), "Overdue");
  assert.equal(getCoursePaymentStatusTone("failed"), "danger");
  assert.equal(getCoursePaymentStatusTone("refunded"), "info");
});

test("course registration status respects capacity constraints", () => {
  assert.equal(resolveInitialCourseRegistrationStatus({ capacity: 0 }, 99), "enrolled");
  assert.equal(resolveInitialCourseRegistrationStatus({ capacity: 10 }, 3), "enrolled");
  assert.equal(resolveInitialCourseRegistrationStatus({ capacity: 10 }, 10), "waitlisted");
});

test("course must be published before it can accept enrolments", () => {
  assert.doesNotThrow(() => assertCourseCanAcceptRegistration({ status: "published" }));
  assert.throws(
    () => assertCourseCanAcceptRegistration({ status: "draft" }),
    /Only published courses can accept enrolments\./
  );
});

test("course transition rules stay explicit", () => {
  assert.equal(assertCourseRegistrationStatusTransition("enrolled", "waitlisted"), "waitlisted");
  assert.equal(assertCourseRegistrationStatusTransition("waitlisted", "enrolled"), "enrolled");
  assert.throws(
    () => assertCourseRegistrationStatusTransition("cancelled", "completed"),
    /Unsupported course registration status\./
  );
  assert.equal(assertCourseAttendanceStatusTransition("pending", "in_progress"), "in_progress");
  assert.equal(assertCourseAttendanceStatusTransition("in_progress", "completed"), "completed");
  assert.throws(
    () => assertCourseAttendanceStatusTransition("completed", "pending"),
    /That course attendance transition is not allowed\./
  );
  assert.deepEqual(getAllowedCourseAttendanceTransitions("pending"), ["in_progress", "completed", "withdrawn"]);
  assert.deepEqual(getAllowedCourseAttendanceTransitions("completed"), []);
  assert.equal(courseAttendanceTransitionRequiresConfirmation("pending", "withdrawn"), true);
  assert.equal(courseAttendanceTransitionRequiresConfirmation("in_progress", "completed"), false);
  assert.equal(courseAttendanceTransitionRequiresConfirmation("completed", "pending"), false);
  assert.equal(canUpdateCourseAttendance("enrolled"), true);
  assert.equal(canUpdateCourseAttendance("waitlisted"), false);
});

test("course registration summary counts enrolment and completion state while ignoring cancelled payment attention", () => {
  const summary = summarizeCourseRegistrations([
    { status: "enrolled", paymentStatus: "unpaid", attendanceStatus: "pending" },
    { status: "waitlisted", paymentStatus: "not_required", attendanceStatus: "pending" },
    { status: "enrolled", paymentStatus: "paid", attendanceStatus: "completed" },
    { status: "cancelled", paymentStatus: "failed", attendanceStatus: "withdrawn" },
  ]);

  assert.deepEqual(summary, {
    total: 4,
    enrolled: 2,
    waitlisted: 1,
    paymentAttention: 1,
    completed: 1,
    withdrawn: 1,
  });
});

test("course payment transitions keep free items locked and allow operational debt states", () => {
  assert.equal(assertCoursePaymentStatusTransition("unpaid", "overdue"), "overdue");
  assert.equal(assertCoursePaymentStatusTransition("overdue", "failed"), "failed");
  assert.throws(
    () => assertCoursePaymentStatusTransition("not_required", "paid"),
    /Free course registrations do not require payment follow-up\./
  );
  assert.throws(
    () => assertCoursePaymentStatusTransition("paid", "not_required"),
    /Only free course registrations can be marked as not required\./
  );
});
