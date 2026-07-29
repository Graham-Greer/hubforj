import test from "node:test";
import assert from "node:assert/strict";
import {
  buildAdminInviteAcceptPath,
  createAdminInviteToken,
  verifyAdminInviteToken,
} from "../../src/lib/auth/admin-invite-token.js";

test("admin invite token round-trips the canonical invite payload", () => {
  const token = createAdminInviteToken(
    {
      inviteId: "invite_123",
      hubId: "hub_123",
      email: "ADMIN@EXAMPLE.COM ",
      role: "admin",
      expiresAt: "2026-03-24T00:00:00.000Z",
      createdAt: "2026-03-10T00:00:00.000Z",
    },
    "test-secret"
  );

  assert.deepEqual(verifyAdminInviteToken(token, "test-secret"), {
    inviteId: "invite_123",
    hubId: "hub_123",
    email: "admin@example.com",
    role: "admin",
    expiresAt: "2026-03-24T00:00:00.000Z",
    createdAt: "2026-03-10T00:00:00.000Z",
  });
});

test("admin invite token accepts invite rows that use id instead of inviteId", () => {
  const token = createAdminInviteToken(
    {
      id: "invite_row_123",
      hubId: "hub_123",
      email: "admin@example.com",
      role: "admin",
      expiresAt: "2026-03-24T00:00:00.000Z",
      createdAt: "2026-03-10T00:00:00.000Z",
    },
    "test-secret"
  );

  assert.deepEqual(verifyAdminInviteToken(token, "test-secret"), {
    inviteId: "invite_row_123",
    hubId: "hub_123",
    email: "admin@example.com",
    role: "admin",
    expiresAt: "2026-03-24T00:00:00.000Z",
    createdAt: "2026-03-10T00:00:00.000Z",
  });
});

test("admin invite token verification rejects tampered payloads", () => {
  const token = createAdminInviteToken(
    {
      inviteId: "invite_123",
      hubId: "hub_123",
      email: "admin@example.com",
      expiresAt: "2026-03-24T00:00:00.000Z",
      createdAt: "2026-03-10T00:00:00.000Z",
    },
    "test-secret"
  );

  assert.equal(verifyAdminInviteToken(`${token}tampered`, "test-secret"), null);
  assert.equal(verifyAdminInviteToken(token, "wrong-secret"), null);
});

test("admin invite acceptance path stays on the canonical join route", () => {
  const path = buildAdminInviteAcceptPath("oak-hub", "signed.token");
  assert.equal(path, "/oak-hub/join?invite=signed.token");
});
