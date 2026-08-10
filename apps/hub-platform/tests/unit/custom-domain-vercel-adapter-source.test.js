import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../../src/lib/server/vercel-domains.js", import.meta.url), "utf8");

test("custom-domain Vercel adapter isolates project-domain mutations", () => {
  assert.match(source, /export async function addVercelProjectDomain/);
  assert.match(source, /export async function verifyVercelProjectDomain/);
  assert.match(source, /export async function removeVercelProjectDomain/);
  assert.ok(source.includes("/v10/projects/${encodeURIComponent(config.projectId)}/domains"));
  assert.ok(
    source.includes(
      "/v9/projects/${encodeURIComponent(config.projectId)}/domains/${encodeURIComponent(normalizedHostname)}/verify"
    )
  );
  assert.match(source, /method: "DELETE"/);
});

test("custom-domain Vercel adapter classifies provider failures safely", () => {
  assert.match(source, /export function classifyVercelDomainError/);
  assert.match(source, /category: "authorization"/);
  assert.match(source, /category: "conflict"/);
  assert.match(source, /"rate_limited"/);
  assert.match(source, /retryable: true/);
});
