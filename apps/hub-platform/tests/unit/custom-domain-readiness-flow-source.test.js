import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const verificationSource = readFileSync(
  new URL("../../src/lib/data/custom-domain-verification.js", import.meta.url),
  "utf8"
);
const serviceSource = readFileSync(new URL("../../src/lib/domain/custom-domain-vercel.js", import.meta.url), "utf8");
const actionSource = readFileSync(
  new URL("../../src/app/(admin)/[hubSlug]/admin/settings/actions.js", import.meta.url),
  "utf8"
);

test("custom-domain verification runs full Vercel readiness before activation", () => {
  assert.match(verificationSource, /checkCustomDomainVercelReadiness/);
  assert.match(verificationSource, /vercelConfig\.autoActivateEnabled === true/);
  assert.match(verificationSource, /readiness\.externalReady/);
  assert.match(verificationSource, /hasStoredExternalReadiness/);
  assert.match(verificationSource, /status !== "verifying" && status !== "activation_ready"/);
  assert.match(verificationSource, /external_readiness_incomplete/);
  assert.match(verificationSource, /dnsRoutingStatus: normalizeString\(readiness\.dnsRoutingStatus\)/);
  assert.match(verificationSource, /certificateStatus: normalizeString\(readiness\.certificateStatus\)/);
});

test("custom-domain Vercel readiness captures routing, verification, and certificate state", () => {
  assert.match(serviceSource, /export async function checkCustomDomainVercelReadiness/);
  assert.match(serviceSource, /getVercelProjectDomain/);
  assert.match(serviceSource, /getVercelDomainConfig/);
  assert.match(serviceSource, /dnsRoutingStatus === "ready"/);
  assert.match(serviceSource, /certificateStatus === "ready"/);
});

test("custom-domain check action reports activation-ready state clearly", () => {
  assert.match(actionSource, /result\.status === "activation_ready"/);
  assert.match(actionSource, /Custom domain checks are complete/);
});
