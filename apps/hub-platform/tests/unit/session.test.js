import test from "node:test";
import assert from "node:assert/strict";
import {
  createSignedSessionValue,
  isSessionExpired,
  verifySignedSessionValue,
} from "../../src/lib/auth/session.js";

const secret = "unit-test-secret";

test("session signing round-trips deterministic payloads", () => {
  const signed = createSignedSessionValue(
    {
      userId: "user_123",
      hubId: "hub_123",
      role: "member",
      email: "member@example.com",
      name: "Member Name",
      expiresAt: 1_900_000_000,
    },
    secret
  );

  assert.deepEqual(verifySignedSessionValue(signed, secret), {
    userId: "user_123",
    hubId: "hub_123",
    role: "member",
    email: "member@example.com",
    name: "Member Name",
    expiresAt: 1_900_000_000,
  });
});

test("session verification rejects tampered payloads", () => {
  const signed = createSignedSessionValue(
    {
      userId: "user_123",
      hubId: "hub_123",
      role: "member",
      expiresAt: 1_900_000_000,
    },
    secret
  );

  assert.equal(verifySignedSessionValue(`${signed}tampered`, secret), null);
});

test("session expiry treats missing and past expiries as expired", () => {
  assert.equal(isSessionExpired({ expiresAt: 0 }, 1_700_000_000_000), true);
  assert.equal(isSessionExpired({ expiresAt: 1_600_000_000 }, 1_700_000_000_000), true);
  assert.equal(isSessionExpired({ expiresAt: 1_800_000_000 }, 1_700_000_000_000), false);
});
