import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function readTarget(relativePath) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

test("product-site automation callers use the canonical internal automation secret", () => {
  const envSource = readTarget("../../../product-site/src/lib/config/env.js");
  const provisionHub = readTarget("../../../product-site/src/lib/server/provision-hub.js");
  const provisionOwnerAdmin = readTarget("../../../product-site/src/lib/server/provision-owner-admin.js");
  const packageAuthority = readTarget("../../../product-site/src/lib/server/hub-package-authority.js");

  assert.match(envSource, /internalAutomationSecret/);
  assert.match(envSource, /INTERNAL_AUTOMATION_SECRET/);
  assert.match(envSource, /NODE_ENV === "production" \? "" : process\.env\.INTERNAL_AUTOMATION_TOKEN/);

  for (const source of [provisionHub, provisionOwnerAdmin, packageAuthority]) {
    assert.match(source, /internalAutomationSecret/);
    assert.match(source, /INTERNAL_AUTOMATION_SECRET/);
    assert.doesNotMatch(source, /internalAutomationToken/);
    assert.doesNotMatch(source, /INTERNAL_AUTOMATION_TOKEN/);
  }
});

test("hub-platform internal automation code uses canonical secret helpers", () => {
  const domainSource = readTarget("../../src/lib/domain/internal-automation.js");
  const runtimeSource = readTarget("../../src/lib/domain/custom-domain-runtime-config.js");
  const middlewareSource = readTarget("../../src/middleware.js");
  const bookingProcessorRoute = readTarget("../../src/app/api/internal/booking-notifications/process/route.js");

  assert.match(domainSource, /getInternalAutomationSecret/);
  assert.match(domainSource, /timingSafeEqual/);
  assert.match(domainSource, /validateInternalAutomationSecret/);
  assert.match(domainSource, /resolveInternalAutomationSecretFromRequest/);
  assert.doesNotMatch(domainSource, /getInternalAutomationToken/);

  assert.match(runtimeSource, /getServerEnv\(\)\.internalAutomationSecret/);
  assert.doesNotMatch(runtimeSource, /INTERNAL_AUTOMATION_TOKEN/);

  assert.match(middlewareSource, /getInternalAutomationSecret/);
  assert.doesNotMatch(middlewareSource, /getInternalAutomationToken/);

  assert.match(bookingProcessorRoute, /getInternalAutomationAuthorizationState/);
  assert.doesNotMatch(bookingProcessorRoute, /providedSecret !== internalAutomationSecret/);
});

test("env examples document INTERNAL_AUTOMATION_SECRET as the shared cross-app secret", () => {
  const hubExample = readTarget("../../.env.example");
  const productExample = readTarget("../../../product-site/.env.example");

  assert.match(hubExample, /INTERNAL_AUTOMATION_SECRET=replace-me/);
  assert.match(productExample, /INTERNAL_AUTOMATION_SECRET=replace-me/);
  assert.doesNotMatch(productExample, /INTERNAL_AUTOMATION_TOKEN/);
});
