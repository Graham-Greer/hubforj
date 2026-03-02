import test from "node:test";
import assert from "node:assert/strict";
import {
  addDurationToIso,
  deriveMembershipStatus,
  validateMembershipPlanInput,
  validateMembershipStatusTransition,
} from "../../src/lib/validation/memberships.js";

test("validateMembershipPlanInput normalizes valid payload", () => {
  const plan = validateMembershipPlanInput({
    title: "Annual",
    description: "Best plan",
    durationUnit: "years",
    durationValue: "1",
    price: "120",
    active: true,
  });

  assert.equal(plan.title, "Annual");
  assert.equal(plan.durationUnit, "years");
  assert.equal(plan.durationValue, 1);
  assert.equal(plan.price, 120);
  assert.equal(plan.active, true);
});

test("validateMembershipStatusTransition blocks manual expired set", () => {
  assert.throws(
    () => validateMembershipStatusTransition("active", "expired", { isSystem: false }),
    /system-derived/
  );
});

test("validateMembershipStatusTransition allows inactive to active", () => {
  assert.equal(validateMembershipStatusTransition("inactive", "active"), "active");
});

test("deriveMembershipStatus marks active memberships expired after grace", () => {
  const now = Date.parse("2026-06-20T00:00:00.000Z");
  const status = deriveMembershipStatus(
    {
      status: "active",
      renewalDate: "2026-06-10T00:00:00.000Z",
      gracePeriodDaysOverride: 5,
    },
    0,
    now
  );

  assert.equal(status, "expired");
});

test("addDurationToIso applies month duration", () => {
  const next = addDurationToIso("2026-01-01T00:00:00.000Z", "months", 1);
  assert.equal(new Date(next).getUTCMonth(), 1);
});
