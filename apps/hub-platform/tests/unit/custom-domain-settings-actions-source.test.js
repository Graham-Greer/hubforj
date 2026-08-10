import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("../../src/app/(admin)/[hubSlug]/admin/settings/actions.js", import.meta.url),
  "utf8"
);

test("custom-domain settings actions use owner-only access boundaries", () => {
  assert.match(source, /requireHubOwnerActionAccess/);
  assert.match(source, /Only the owner can manage custom domains/);

  const requestAction = source.slice(
    source.indexOf("export async function requestCustomDomainAction"),
    source.indexOf("export async function checkCustomDomainVerificationAction")
  );
  const checkAction = source.slice(
    source.indexOf("export async function checkCustomDomainVerificationAction"),
    source.indexOf("export async function disconnectCustomDomainAction")
  );
  const disconnectAction = source.slice(source.indexOf("export async function disconnectCustomDomainAction"));

  assert.match(requestAction, /requireHubOwnerActionAccess/);
  assert.doesNotMatch(requestAction, /requireHubOperatorActionAccess/);
  assert.match(checkAction, /requireHubOwnerActionAccess/);
  assert.doesNotMatch(checkAction, /requireHubOperatorActionAccess/);
  assert.match(disconnectAction, /requireHubOwnerActionAccess/);
  assert.doesNotMatch(disconnectAction, /requireHubOperatorActionAccess/);
});
