import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function readHubPlatformSource(path) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

test("custom-domain reconciliation reports claims, mappings, and provider readiness", () => {
  const source = readHubPlatformSource("src/lib/data/custom-domain-reconciliation.js");

  assert.match(source, /export async function getHubCustomDomainReconciliationReport/);
  assert.match(source, /getCustomDomainClaimByHostname/);
  assert.match(source, /isCustomDomainClaimActive/);
  assert.match(source, /getCustomDomainMappingByHostname\(expected\.hostname, \{ hydrateFromHub: false \}\)/);
  assert.match(source, /checkCustomDomainVercelReadiness\(hostname\)/);
  assert.match(source, /mapping_missing/);
  assert.match(source, /mapping_mismatch/);
  assert.match(source, /claim_missing/);
  assert.match(source, /claim_mismatch/);
  assert.match(source, /connected_domain_provider_not_ready/);
});

test("custom-domain reconciliation repair is conservative and uses existing lifecycle processors", () => {
  const source = readHubPlatformSource("src/lib/data/custom-domain-reconciliation.js");

  assert.match(source, /export async function reconcileHubCustomDomainState/);
  assert.match(source, /runCustomDomainLifecycleBatch/);
  assert.match(source, /upsertCustomDomainClaimForHub/);
  assert.match(source, /releaseCustomDomainClaimForHub/);
  assert.match(source, /writeCustomDomainMappingForHub/);
  assert.match(source, /deleteCustomDomainMappingByHostname/);
  assert.doesNotMatch(source, /removeCustomDomainFromVercel/);
  assert.doesNotMatch(source, /addVercelProjectDomain/);
});

test("projection maintenance includes custom-domain dry-run and repair behind an include flag", () => {
  const serviceSource = readHubPlatformSource("src/lib/server/projection-maintenance.js");
  const routeSource = readHubPlatformSource("src/app/api/internal/projections/reconcile/route.js");

  assert.match(routeSource, /includeCustomDomains: searchParams\.get\("includeCustomDomains"\)/);
  assert.match(serviceSource, /includeCustomDomains: normalizeBoolean\(input\.includeCustomDomains, true\)/);
  assert.match(serviceSource, /getHubCustomDomainReconciliationReport\(hub, \{ issueLimit: 25 \}\)/);
  assert.match(serviceSource, /hubResult\.reports\.customDomains = summarizeReport\(customDomainReport\)/);
  assert.match(serviceSource, /hubResult\.repairs\.customDomains = await reconcileHubCustomDomainState\(hub, actorId\)/);
});
