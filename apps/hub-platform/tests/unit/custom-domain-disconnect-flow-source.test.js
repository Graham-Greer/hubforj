import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const actionSource = readFileSync(
  new URL("../../src/app/(admin)/[hubSlug]/admin/settings/actions.js", import.meta.url),
  "utf8"
);
const verificationSource = readFileSync(
  new URL("../../src/lib/data/custom-domain-verification.js", import.meta.url),
  "utf8"
);
const serviceSource = readFileSync(new URL("../../src/lib/domain/custom-domain-vercel.js", import.meta.url), "utf8");

test("manual custom-domain disconnect processes immediately and redirects to hosted admin", () => {
  assert.match(actionSource, /scheduleHubCustomDomainDisconnectRecord/);
  assert.match(actionSource, /processHubCustomDomainDisconnectRecord/);
  assert.match(actionSource, /buildPlatformSubdomainHost/);
  assert.match(actionSource, /customDomain=disconnected/);
  assert.match(actionSource, /redirect\(redirectTarget\)/);
});

test("custom-domain disconnect releases internal routing before provider cleanup", () => {
  assert.match(verificationSource, /releaseCustomDomainClaimForHub/);
  assert.match(verificationSource, /customDomains: \[\]/);
  assert.match(verificationSource, /deleteCustomDomainMappingByHostname\(hostname\)/);
  assert.match(verificationSource, /removeCustomDomainFromVercel/);
  assert.match(verificationSource, /vercelVerificationStatus: cleanup\.removed/);
  assert.match(verificationSource, /"removed"/);
});

test("custom-domain Vercel cleanup is idempotent for already-removed domains", () => {
  assert.match(serviceSource, /export async function removeCustomDomainFromVercel/);
  assert.match(serviceSource, /removeVercelProjectDomain/);
  assert.match(serviceSource, /classification\.category === "not_found"/);
  assert.match(serviceSource, /removed: true/);
});
