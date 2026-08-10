import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function readHubPlatformSource(path) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

test("custom-domain cron route is GET-only, protected by CRON_SECRET, and feature flagged", () => {
  const source = readHubPlatformSource("src/app/api/cron/custom-domains/route.js");

  assert.match(source, /export async function GET\(request\)/);
  assert.match(source, /validateInternalAutomationSecret\(cronSecret\)/);
  assert.match(source, /Authorization/iu);
  assert.match(source, /internalAutomationSecretsMatch\(providedSecret, cronSecret\)/);
  assert.match(source, /hubPlatformCustomDomainScheduledMaintenanceEnabled/);
  assert.match(source, /custom_domain_scheduled_maintenance_disabled/);
});

test("custom-domain cron route runs lifecycle before optional reconciliation", () => {
  const source = readHubPlatformSource("src/app/api/cron/custom-domains/route.js");
  const lifecycleIndex = source.indexOf("runCustomDomainLifecycleBatch");
  const reconciliationIndex = source.indexOf("runCustomDomainReconciliationBatch");

  assert.ok(lifecycleIndex > 0, "cron route should run lifecycle maintenance");
  assert.ok(reconciliationIndex > lifecycleIndex, "cron route should import reconciliation after lifecycle dependency");
  assert.match(source, /hubPlatformCustomDomainReconciliationEnabled/);
  assert.match(source, /actorId: "custom-domain-cron"/);
});

test("custom-domain lifecycle batches query lifecycle statuses instead of scanning arbitrary hubs", () => {
  const source = readHubPlatformSource("src/lib/data/custom-domain-verification.js");

  assert.match(source, /function listCustomDomainLifecycleCandidates/);
  assert.match(source, /\.where\("customDomain\.status", "in", statusList\)/);
  assert.match(source, /statuses: \[\s*"pending_verification",\s*"verifying",\s*"verification_failed",\s*"activation_ready",\s*\]/);
  assert.match(source, /statuses: \["verifying", "activation_ready"\]/);
  assert.match(source, /statuses: \["disconnect_scheduled"\]/);
});

test("custom-domain scheduled reconciliation batch targets custom-domain hubs only", () => {
  const source = readHubPlatformSource("src/lib/data/custom-domain-reconciliation.js");

  assert.match(source, /export async function runCustomDomainReconciliationBatch/);
  assert.match(source, /\.where\("customDomain\.status", "in", \[/);
  assert.match(source, /"connected"/);
  assert.match(source, /"disconnect_scheduled"/);
  assert.match(source, /reconcileHubCustomDomainState\(hub, actorId\)/);
});

test("hub-platform Vercel cron schedule points at custom-domain maintenance route", () => {
  const source = readHubPlatformSource("vercel.json");

  assert.match(source, /"path": "\/api\/cron\/custom-domains"/);
  assert.match(source, /"schedule": "\*\/5 \* \* \* \*"/);
});
