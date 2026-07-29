import test from "node:test";
import assert from "node:assert/strict";
import {
  canAccessHubAdmin,
  canManageHubAdmins,
  getUserRoleLabel,
  getUserRoleTone,
  getUserStatusLabel,
  getUserStatusTone,
  isHubOperatorRole,
  normalizeHubUserStatusPayload,
  normalizeMemberProfilePayload,
} from "../../src/lib/domain/users.js";

test("user role helpers map supported roles", () => {
  assert.equal(getUserRoleLabel("member"), "Member");
  assert.equal(getUserRoleLabel("owner"), "Owner");
  assert.equal(getUserRoleTone("admin"), "accent");
});

test("hub operator permission helpers distinguish owner and admin authority", () => {
  assert.equal(isHubOperatorRole("owner"), true);
  assert.equal(isHubOperatorRole("admin"), true);
  assert.equal(isHubOperatorRole("member"), false);
  assert.equal(canAccessHubAdmin("owner"), true);
  assert.equal(canAccessHubAdmin("admin"), true);
  assert.equal(canManageHubAdmins("owner"), true);
  assert.equal(canManageHubAdmins("admin"), false);
});

test("user status helpers map supported states", () => {
  assert.equal(getUserStatusLabel("active"), "Active");
  assert.equal(getUserStatusTone("suspended"), "danger");
});

test("hub user status payload only allows supported operational states", () => {
  assert.deepEqual(normalizeHubUserStatusPayload({ status: " suspended " }), {
    status: "suspended",
  });
  assert.throws(() => normalizeHubUserStatusPayload({ status: "invited" }), /valid user status/i);
});

test("member profile payload requires and normalizes full name", () => {
  assert.deepEqual(normalizeMemberProfilePayload({ name: "  Alex Morgan  " }), {
    name: "Alex Morgan",
  });
  assert.throws(() => normalizeMemberProfilePayload({ name: "   " }), /Full name is required/);
});
