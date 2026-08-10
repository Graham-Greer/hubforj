import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("../../src/app/api/internal/custom-domains/status/route.js", import.meta.url),
  "utf8"
);

test("custom-domain status route keeps Vercel live checks opt-in and protected", () => {
  assert.match(source, /getInternalAutomationAuthorizationState/);
  assert.match(source, /includeVercel/);
  assert.match(source, /checkVercelProjectDomainAccess/);
  assert.match(source, /classifyVercelDomainError/);
  assert.match(source, /getCustomDomainVercelDiagnostics/);
  assert.match(source, /vercelLive/);
});
