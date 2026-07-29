import test from "node:test";
import assert from "node:assert/strict";
import {
  getMemberStatusAction,
  getTotalMemberBookings,
} from "../../src/components/patterns/admin-member-detail-workspace/admin-member-detail-helpers.js";

test("member status action flips suspended members back to active", () => {
  assert.deepEqual(getMemberStatusAction("suspended"), {
    nextStatus: "active",
    actionLabel: "Reactivate member",
    description:
      "This member is currently suspended and should not continue through normal access flows until reactivated.",
  });
});

test("member status action suspends active members", () => {
  assert.deepEqual(getMemberStatusAction("active"), {
    nextStatus: "suspended",
    actionLabel: "Suspend member",
    description:
      "This member is active and can continue through normal hub access, booking, and member workflows.",
  });
});

test("total member bookings combine event and course participation", () => {
  assert.equal(
    getTotalMemberBookings({
      registrations: [{ id: "event_1" }, { id: "event_2" }],
      courseRegistrations: [{ id: "course_1" }],
    }),
    3
  );
  assert.equal(getTotalMemberBookings({ registrations: null, courseRegistrations: undefined }), 0);
});
