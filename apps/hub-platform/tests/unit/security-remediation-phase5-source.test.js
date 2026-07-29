import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function readTarget(relativePath) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

function assertBaselineSecurityHeaders(source) {
  assert.match(source, /async headers\(\)/);
  assert.match(source, /source: "\/:path\*"/);
  assert.match(source, /key: "X-Content-Type-Options"/);
  assert.match(source, /value: "nosniff"/);
  assert.match(source, /key: "Referrer-Policy"/);
  assert.match(source, /value: "strict-origin-when-cross-origin"/);
  assert.match(source, /key: "Permissions-Policy"/);
  assert.match(source, /camera=\(\), microphone=\(\), geolocation=\(\)/);
}

test("phase 5 adds low-risk baseline security headers to both live apps", () => {
  const hubConfigSource = readTarget("../../next.config.mjs");
  const productConfigSource = readTarget("../../../product-site/next.config.mjs");

  assertBaselineSecurityHeaders(hubConfigSource);
  assertBaselineSecurityHeaders(productConfigSource);
});

test("phase 5 does not ship an enforced CSP before auth, checkout, media, and custom-domain QA", () => {
  const hubConfigSource = readTarget("../../next.config.mjs");
  const productConfigSource = readTarget("../../../product-site/next.config.mjs");

  for (const source of [hubConfigSource, productConfigSource]) {
    assert.doesNotMatch(source, /Content-Security-Policy/);
    assert.doesNotMatch(source, /Strict-Transport-Security/);
    assert.doesNotMatch(source, /X-Frame-Options/);
  }
});
