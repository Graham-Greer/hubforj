import test from "node:test";
import assert from "node:assert/strict";
import { normalizeMemberJoinPayload } from "../../src/lib/domain/members.js";

test("normalizeMemberJoinPayload requires and normalizes full name", () => {
  assert.deepEqual(normalizeMemberJoinPayload({ name: "  Alex Morgan  " }), {
    name: "Alex Morgan",
  });
});

test("normalizeMemberJoinPayload rejects empty names", () => {
  assert.throws(
    () => normalizeMemberJoinPayload({ name: "   " }),
    /Full name is required\./
  );
});
