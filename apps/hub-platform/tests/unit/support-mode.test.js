import test from "node:test";
import assert from "node:assert/strict";
import {
  buildSupportModeSession,
  buildSupportModeBanner,
  createSupportModeValue,
  isSupportModeExpired,
  verifySupportModeValue,
} from "../../src/lib/auth/support-mode.js";

const secret = "unit-test-secret";

test("support mode signing round-trips deterministic payloads", () => {
  const signed = createSupportModeValue(
    {
      userId: "user_123",
      hubId: "hub_123",
      hubSlug: "oak-hill",
      hubName: "Oak Hill",
      startedAt: 1_800_000_000,
      expiresAt: 1_800_028_800,
    },
    secret
  );

  assert.deepEqual(verifySupportModeValue(signed, secret), {
    userId: "user_123",
    hubId: "hub_123",
    hubSlug: "oak-hill",
    hubName: "Oak Hill",
    startedAt: 1_800_000_000,
    expiresAt: 1_800_028_800,
  });
});

test("support mode verification rejects tampered payloads", () => {
  const signed = createSupportModeValue(
    {
      userId: "user_123",
      hubId: "hub_123",
      hubSlug: "oak-hill",
      hubName: "Oak Hill",
      startedAt: 1_800_000_000,
      expiresAt: 1_800_028_800,
    },
    secret
  );

  assert.equal(verifySupportModeValue(`${signed}tampered`, secret), null);
});

test("support mode expiry treats missing and past expiries as expired", () => {
  assert.equal(isSupportModeExpired({ expiresAt: 0 }, 1_700_000_000_000), true);
  assert.equal(isSupportModeExpired({ expiresAt: 1_600_000_000 }, 1_700_000_000_000), true);
  assert.equal(isSupportModeExpired({ expiresAt: 1_800_000_000 }, 1_700_000_000_000), false);
});

test("support mode session builder binds operator and hub context", () => {
  const session = buildSupportModeSession(
    {
      userId: "operator_1",
    },
    {
      id: "hub_123",
      slug: "oak-hill",
      name: "Oak Hill",
    }
  );

  assert.equal(session.userId, "operator_1");
  assert.equal(session.hubId, "hub_123");
  assert.equal(session.hubSlug, "oak-hill");
  assert.equal(session.hubName, "Oak Hill");
  assert.ok(session.expiresAt > session.startedAt);
});

test("support mode banner references the hub name", () => {
  assert.equal(buildSupportModeBanner({ name: "Oak Hill" }), "Support mode active for Oak Hill");
});
