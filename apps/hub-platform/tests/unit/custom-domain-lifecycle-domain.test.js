import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCustomDomainMappingRecordsForHub,
  listCustomDomainMappingHostnamesForRemoval,
} from "../../src/lib/data/custom-domain-mappings.js";

function normalizeString(value) {
  return String(value || "").trim();
}

function canResolveMappingAtRuntime(mapping) {
  return Boolean(mapping?.hostname) && normalizeString(mapping?.status) === "connected";
}

test("mapping records are only created for connected custom domains", () => {
  const baseHub = {
    id: "hub_1",
    slug: "oak-hill",
    customDomain: {
      hostname: "community.example.org",
      connectedAt: "2026-04-01T10:00:00.000Z",
    },
  };

  assert.equal(
    buildCustomDomainMappingRecordsForHub({
      ...baseHub,
      customDomain: { ...baseHub.customDomain, status: "pending_verification" },
    }),
    null
  );

  assert.equal(
    buildCustomDomainMappingRecordsForHub({
      ...baseHub,
      customDomain: { ...baseHub.customDomain, status: "verification_failed" },
    }),
    null
  );

  assert.equal(
    buildCustomDomainMappingRecordsForHub({
      ...baseHub,
      customDomain: { ...baseHub.customDomain, status: "verifying" },
    }),
    null
  );

  assert.equal(
    buildCustomDomainMappingRecordsForHub({
      ...baseHub,
      customDomain: { ...baseHub.customDomain, status: "disconnect_scheduled" },
    }),
    null
  );

  assert.equal(
    buildCustomDomainMappingRecordsForHub({
      ...baseHub,
      customDomain: { ...baseHub.customDomain, status: "disconnected" },
    }),
    null
  );

  const records = buildCustomDomainMappingRecordsForHub({
    ...baseHub,
    customDomain: { ...baseHub.customDomain, status: "connected" },
  });

  assert.equal(records.length, 2);
  assert.equal(records[0].hostname, "community.example.org");
  assert.equal(records[0].matchType, "canonical");
  assert.equal(records[0].fallbackHost, "oakhill.hubforj.com");
  assert.equal(records[1].hostname, "www.community.example.org");
  assert.equal(records[1].redirectTo, "community.example.org");
});

test("runtime resolution assumptions only allow connected mappings", () => {
  assert.equal(
    canResolveMappingAtRuntime({
      hostname: "community.example.org",
      status: "connected",
    }),
    true
  );

  assert.equal(
    canResolveMappingAtRuntime({
      hostname: "community.example.org",
      status: "verification_failed",
    }),
    false
  );

  assert.equal(
    canResolveMappingAtRuntime({
      hostname: "community.example.org",
      status: "verifying",
    }),
    false
  );

  assert.equal(
    canResolveMappingAtRuntime({
      hostname: "community.example.org",
      status: "disconnect_scheduled",
    }),
    false
  );

  assert.equal(
    canResolveMappingAtRuntime({
      hostname: "community.example.org",
      status: "disconnected",
    }),
    false
  );

  assert.equal(
    canResolveMappingAtRuntime({
      hostname: "",
      status: "connected",
    }),
    false
  );
});

test("companion-host redirects preserve one canonical custom host", () => {
  const records = buildCustomDomainMappingRecordsForHub({
    id: "hub_1",
    slug: "oak-hill",
    customDomain: {
      hostname: "www.community.example.org",
      status: "connected",
      connectedAt: "2026-04-01T10:00:00.000Z",
    },
  });

  assert.equal(records.length, 2);
  assert.deepEqual(
    records.map((record) => ({
      hostname: record.hostname,
      matchType: record.matchType,
      redirectTo: record.redirectTo,
    })),
    [
      {
        hostname: "www.community.example.org",
        matchType: "canonical",
        redirectTo: "",
      },
      {
        hostname: "community.example.org",
        matchType: "companion",
        redirectTo: "www.community.example.org",
      },
    ]
  );
});

test("disconnect removal targets canonical and companion hostnames", () => {
  assert.deepEqual(
    listCustomDomainMappingHostnamesForRemoval("community.example.org"),
    ["community.example.org", "www.community.example.org"]
  );

  assert.deepEqual(
    listCustomDomainMappingHostnamesForRemoval("www.community.example.org"),
    ["www.community.example.org", "community.example.org"]
  );

  assert.deepEqual(listCustomDomainMappingHostnamesForRemoval(""), []);
});
