import test from "node:test";
import assert from "node:assert/strict";
import {
  canResendInvite,
  canRevokeInvite,
  deriveInviteStatus,
  getInviteStatusTone,
  normalizeAcceptAdminInvitePayload,
  normalizeCreateAdminInvitePayload,
} from "../../src/lib/domain/invites.js";

test("normalizeCreateAdminInvitePayload normalizes email and default role", () => {
  const payload = normalizeCreateAdminInvitePayload({
    email: "ADMIN@EXAMPLE.COM ",
  });

  assert.deepEqual(payload, {
    email: "admin@example.com",
    role: "admin",
  });
});

test("normalizeCreateAdminInvitePayload rejects invalid email", () => {
  assert.throws(
    () => normalizeCreateAdminInvitePayload({ email: "not-an-email" }),
    /Email must be valid\./
  );
});

test("normalizeCreateAdminInvitePayload rejects unsupported roles", () => {
  assert.throws(
    () => normalizeCreateAdminInvitePayload({ email: "admin@example.com", role: "member" }),
    /Only admin invites are supported\./
  );
});

test("normalizeAcceptAdminInvitePayload requires a full name", () => {
  assert.deepEqual(normalizeAcceptAdminInvitePayload({ name: " Alex Morgan " }), {
    name: "Alex Morgan",
  });

  assert.throws(
    () => normalizeAcceptAdminInvitePayload({ name: " " }),
    /Full name is required\./
  );
});

test("deriveInviteStatus marks past pending invites as expired", () => {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  assert.equal(deriveInviteStatus("pending", yesterday), "expired");
});

test("accepted and revoked invites keep explicit status", () => {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  assert.equal(deriveInviteStatus("accepted", yesterday), "accepted");
  assert.equal(deriveInviteStatus("revoked", yesterday), "revoked");
});

test("invite lifecycle helpers only allow revoke and resend for pending or expired invites", () => {
  const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  assert.equal(canRevokeInvite("pending", future), true);
  assert.equal(canRevokeInvite("pending", past), true);
  assert.equal(canRevokeInvite("accepted", future), false);

  assert.equal(canResendInvite("pending", future), true);
  assert.equal(canResendInvite("pending", past), true);
  assert.equal(canResendInvite("revoked", future), false);
});

test("invite status tone maps derived lifecycle correctly", () => {
  assert.equal(getInviteStatusTone("pending"), "warning");
  assert.equal(getInviteStatusTone("accepted"), "success");
  assert.equal(getInviteStatusTone("revoked"), "neutral");
});
