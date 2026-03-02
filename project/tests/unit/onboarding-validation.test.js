import test from "node:test";
import assert from "node:assert/strict";
import { validateJoinInput, validateMemberSignInInput } from "../../src/lib/validation/onboarding.js";

test("validateJoinInput normalizes and validates payload", () => {
  const result = validateJoinInput({
    name: "  Alex Member ",
    email: " Alex@example.com ",
    planId: " plan_demo_monthly ",
  });

  assert.deepEqual(result, {
    name: "Alex Member",
    email: "alex@example.com",
    planId: "plan_demo_monthly",
  });
});

test("validateJoinInput requires planId", () => {
  assert.throws(
    () => validateJoinInput({ name: "Alex", email: "alex@example.com", planId: "" }),
    /planId is required/
  );
});

test("validateMemberSignInInput requires valid email", () => {
  assert.throws(
    () => validateMemberSignInInput({ email: "bad-email" }),
    /email is invalid/
  );
});
