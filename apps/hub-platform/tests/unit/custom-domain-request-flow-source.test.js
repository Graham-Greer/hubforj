import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const mutationSource = readFileSync(new URL("../../src/lib/data/hub-mutations.js", import.meta.url), "utf8");
const serviceSource = readFileSync(new URL("../../src/lib/domain/custom-domain-vercel.js", import.meta.url), "utf8");

test("custom-domain request flow provisions through Vercel behind a safe lifecycle boundary", () => {
  assert.match(mutationSource, /provisionCustomDomainWithVercel/);
  assert.match(mutationSource, /buildCustomDomainOperationLock/);
  assert.match(mutationSource, /isActiveCustomDomainOperationLock/);
  assert.match(mutationSource, /expiresAt: addHours\(now, 24\)/);
  assert.match(mutationSource, /status: "provisioning"/);
  assert.match(mutationSource, /status: provisioning\.status/);
  assert.match(mutationSource, /writeCustomDomainLifecycleEvent/);
});

test("custom-domain Vercel service keeps provisioning idempotent and flag guarded", () => {
  assert.match(serviceSource, /getCustomDomainVercelConfig/);
  assert.match(serviceSource, /if \(!config\.enabled\)/);
  assert.match(serviceSource, /addOrConfirmProjectDomain/);
  assert.match(serviceSource, /classification\.category !== "conflict"/);
  assert.match(serviceSource, /getVercelProjectDomain\(hostname\)/);
  assert.match(serviceSource, /getVercelDomainConfig/);
  assert.match(serviceSource, /status: "provisioning_failed"/);
});
