import test from "node:test";
import assert from "node:assert/strict";
import { normalizeHost, resolveHubForRequestWithReaders } from "../../src/lib/data/hubs/domain-resolution-core.js";

test("normalizeHost strips port and lowercases", () => {
  assert.equal(normalizeHost("WWW.Example.com:443"), "www.example.com");
});

test("resolveHubForRequestWithReaders prefers host-based resolution", async () => {
  const result = await resolveHubForRequestWithReaders({
    host: "demo.example.com",
    hubSlug: "demo-hub",
    getByDomain: async () => ({ id: "hub_domain", slug: "domain-hub" }),
    getBySlug: async () => ({ id: "hub_slug", slug: "demo-hub" }),
  });

  assert.equal(result.source, "domain");
  assert.equal(result.hub.id, "hub_domain");
});

test("resolveHubForRequestWithReaders falls back to slug when host has no mapping", async () => {
  const result = await resolveHubForRequestWithReaders({
    host: "platform.local",
    hubSlug: "demo-hub",
    getByDomain: async () => null,
    getBySlug: async (slug) => ({ id: "hub_slug", slug }),
  });

  assert.equal(result.source, "slug");
  assert.equal(result.hub.slug, "demo-hub");
});

