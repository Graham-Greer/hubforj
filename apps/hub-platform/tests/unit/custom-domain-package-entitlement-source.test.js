import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const mutationSource = readFileSync(new URL("../../src/lib/data/hub-mutations.js", import.meta.url), "utf8");
const routeSource = readFileSync(
  new URL("../../src/app/api/internal/update-package-authority/route.js", import.meta.url),
  "utf8"
);

test("package authority downgrade enforces custom-domain entitlement loss", () => {
  assert.match(mutationSource, /enforceCustomDomainPackageEntitlement/);
  assert.match(mutationSource, /previousEntitlements = resolveHubPackageEntitlements\(currentHub\)/);
  assert.match(mutationSource, /nextEntitlements = resolveHubPackageEntitlements\(nextHub\)/);
  assert.match(mutationSource, /resolveEffectiveCustomDomainEntitlement/);
  assert.match(mutationSource, /packageStatus\) !== "cancelled"/);
  assert.match(mutationSource, /previousEnabled/);
  assert.match(mutationSource, /nextEnabled/);
  assert.match(mutationSource, /reason: "package_downgrade"/);
  assert.match(mutationSource, /processHubCustomDomainDisconnectRecord/);
  assert.match(mutationSource, /custom_domain_disconnected_package_downgrade/);
});

test("package authority update reports custom-domain enforcement metadata", () => {
  assert.match(mutationSource, /customDomainEntitlementChanged/);
  assert.match(mutationSource, /customDomainDisconnectTriggered/);
  assert.match(mutationSource, /customDomainDisconnectStatus/);
  assert.match(mutationSource, /customDomainDisconnectError/);
  assert.match(routeSource, /customDomainEntitlementChanged: hub\.customDomainEntitlementChanged === true/);
  assert.match(routeSource, /customDomainDisconnectTriggered: hub\.customDomainDisconnectTriggered === true/);
});
