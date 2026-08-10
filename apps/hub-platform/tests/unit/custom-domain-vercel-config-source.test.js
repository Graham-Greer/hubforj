import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../../src/lib/domain/custom-domain-vercel-config.js", import.meta.url), "utf8");

test("custom-domain Vercel config keeps diagnostics safe and deterministic", () => {
  assert.match(source, /export function getCustomDomainVercelConfig\(overrides = null\)/);
  assert.match(source, /export function getCustomDomainVercelDiagnostics\(overrides = null\)/);
  assert.match(source, /tokenConfigured: Boolean\(config\.apiToken\)/);
  assert.doesNotMatch(source, /apiToken:\s*config\.apiToken/);
  assert.match(source, /accountScope: config\.teamId \? "team" : "personal"/);
  assert.match(source, /Math\.min\(Math\.max\(Number\(env\.hubPlatformCustomDomainVercelTimeoutMs\), 1000\), 30000\)/);
});
