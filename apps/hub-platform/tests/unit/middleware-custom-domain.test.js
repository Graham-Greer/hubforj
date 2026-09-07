import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { SourceTextModule, SyntheticModule, createContext } from "node:vm";
import * as hosts from "../../src/lib/domain/hub-hosts.js";

async function fixture(fetchImpl, { enabled = true, secret = "test-secret" } = {}) {
  const calls = [];
  const warnings = [];
  const context = createContext({
    URL, Headers, AbortSignal,
    console: { warn: (message) => warnings.push(message) },
    fetch: async (...args) => { calls.push(args); return fetchImpl(...args); },
  });
  const dependencies = {
    "next/server": { NextResponse: {
      next: (options) => ({ kind: "next", options }),
      rewrite: (url, options) => ({ kind: "rewrite", url, options }),
      redirect: (url) => ({ kind: "redirect", url }),
    } },
    "@/lib/domain/hub-hosts": hosts,
    "@/lib/domain/custom-domain-runtime-config": {
      getInternalAutomationSecret: () => secret,
      isCustomDomainRuntimeEnabled: () => enabled,
    },
  };
  const source = await readFile(new URL("../../src/middleware.js", import.meta.url), "utf8");
  const subject = new SourceTextModule(source, { context });
  await subject.link((specifier) => {
    const exports = dependencies[specifier];
    assert.ok(exports, `Unexpected import: ${specifier}`);
    return new SyntheticModule(Object.keys(exports), function () {
      for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
    }, { context });
  });
  await subject.evaluate();
  return {
    calls, warnings,
    run: (path = "/events?view=list", host = "preview.vercel.app") => {
      const url = new URL(path, `https://${host}`);
      url.clone = () => new URL(url);
      return subject.namespace.middleware({ url: url.href, nextUrl: url, headers: new Headers({ host }) });
    },
  };
}

for (const [name, response] of [
  ["HTML login page", () => new Response("<!DOCTYPE html><html>Login</html>", { headers: { "content-type": "text/html" } })],
  ["malformed JSON", () => new Response("<!DOCTYPE html>", { headers: { "content-type": "application/json" } })],
  ["protection redirect", () => new Response(null, { status: 302, headers: { location: "https://vercel.com/login" } })],
  ["provider error", () => new Response("Unavailable", { status: 503 })],
  ["network failure", () => { throw new TypeError("fetch failed"); }],
  ["timeout", () => { throw new DOMException("timed out", "TimeoutError"); }],
  ["missing mapping", () => Response.json({ found: false })],
  ["invalid mapping", () => Response.json({ found: true, hubSlug: 123 })],
]) {
  test(`middleware tolerates ${name} without assigning a tenant`, async () => {
    const f = await fixture(response);
    const result = await f.run();
    assert.equal(result.kind, "next");
    assert.equal(result.options.request.headers.get("x-hubforj-pathname"), "/events");
    assert.equal(f.calls.length, 1);
    const [url, options] = f.calls[0];
    assert.equal(url.origin, "https://preview.vercel.app");
    assert.equal(options.redirect, "manual");
    assert.ok(options.signal instanceof AbortSignal);
    assert.equal(options.cache, "no-store");
    assert.ok(f.warnings.every((message) => !message.includes("test-secret") && !message.includes("<!DOCTYPE")));
  });
}

test("valid resolver mapping preserves rewrite path, query and route headers", async () => {
  const f = await fixture(() => Response.json({ found: true, hubSlug: "northshore" }));
  const result = await f.run("/admin?view=list", "members.example.org");
  assert.equal(result.kind, "rewrite");
  assert.equal(result.url.href, "https://members.example.org/northshore/admin?view=list");
  assert.equal(result.options.request.headers.get("x-hubforj-route-family"), "admin");
});

test("valid canonical domain mapping preserves redirect", async () => {
  const f = await fixture(() => Response.json({ found: true, hubSlug: "northshore", redirectTo: "members.example.org" }));
  const result = await f.run("/events?view=list", "www.members.example.org");
  assert.equal(result.kind, "redirect");
  assert.equal(result.url.href, "https://members.example.org/events?view=list");
});

test("disabled or unconfigured resolver never fetches", async () => {
  for (const options of [{ enabled: false }, { secret: "" }]) {
    const f = await fixture(() => { throw new Error("Unexpected fetch"); }, options);
    assert.equal((await f.run()).kind, "next");
    assert.equal(f.calls.length, 0);
  }
});

test("API paths bypass resolver and hosted subdomains still rewrite directly", async () => {
  const f = await fixture(() => { throw new Error("Unexpected fetch"); });
  assert.equal((await f.run("/api/internal/custom-domains/resolve")).kind, "next");
  const result = await f.run("/events", "northshore.hubforj.com");
  assert.equal(result.kind, "rewrite");
  assert.equal(result.url.pathname, "/northshore/events");
  assert.equal(f.calls.length, 0);
});
