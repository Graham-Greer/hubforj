import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("users barrel preserves the public query and mutation API", () => {
  const barrelSource = readFileSync(
    new URL("../../src/lib/data/users.js", import.meta.url),
    "utf8"
  );

  assert.match(barrelSource, /getSuperadminByAuthUid/);
  assert.match(barrelSource, /getSuperadminById/);
  assert.match(barrelSource, /getUserByAuthUid/);
  assert.match(barrelSource, /getUserById/);
  assert.match(barrelSource, /listUsersByHub/);
  assert.match(barrelSource, /updateHubAdminStatusById/);
  assert.match(barrelSource, /transferHubOwnershipById/);
  assert.match(barrelSource, /updateHubUserStatusById/);
  assert.match(barrelSource, /updateMemberProfileById/);
  assert.match(barrelSource, /\.\/user-queries\.js/);
  assert.match(barrelSource, /\.\/user-mutations\.js/);
});

test("user shared module keeps normalization and sorting explicit", () => {
  const sharedSource = readFileSync(
    new URL("../../src/lib/data/user-shared.js", import.meta.url),
    "utf8"
  );

  assert.match(sharedSource, /export function normalizeUserRecord/);
  assert.match(sharedSource, /role: normalizeString\(user\.role\) \|\| "member"/);
  assert.match(sharedSource, /status: normalizeString\(user\.status\) \|\| "active"/);
  assert.match(sharedSource, /email: normalizeString\(user\.email\)\.toLowerCase\(\)/);
  assert.match(sharedSource, /lastSignedInAt: normalizeString\(user\.lastSignedInAt\)/);
  assert.match(sharedSource, /export function sortUsers/);
  assert.match(sharedSource, /leftName\.localeCompare\(rightName\)/);
});

test("user mutations keep member-only and superadmin protections explicit", () => {
  const mutationSource = readFileSync(
    new URL("../../src/lib/data/user-mutations.js", import.meta.url),
    "utf8"
  );

  assert.match(mutationSource, /Only member profiles can be updated through this flow\./);
  assert.match(mutationSource, /Superadmin status cannot be changed here\./);
  assert.match(mutationSource, /Only the owner can manage admin access\./);
  assert.match(mutationSource, /Only invited admins can be updated through this flow\./);
  assert.match(mutationSource, /Only the owner can transfer ownership\./);
  assert.match(mutationSource, /Exactly one active owner must exist before transfer\./);
  assert.match(mutationSource, /normalizeMemberProfilePayload\(payload\)/);
  assert.match(mutationSource, /normalizeHubUserStatusPayload\(payload\)/);
});
