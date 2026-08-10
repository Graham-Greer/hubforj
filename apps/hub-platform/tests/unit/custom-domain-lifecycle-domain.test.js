import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCustomDomainMappingRecordsForHub,
  listCustomDomainMappingHostnamesForRemoval,
} from "../../src/lib/data/custom-domain-mappings.js";
import {
  buildCustomDomainClaimId,
  isCustomDomainClaimActive,
  normalizeCustomDomainClaimRecord,
} from "../../src/lib/data/custom-domain-claims.js";
import {
  assertValidCustomDomainHostname,
  normalizeHubCustomDomain,
  resolveCustomDomainLifecyclePhase,
} from "../../src/lib/domain/hub-domains.js";

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

test("custom-domain lifecycle phases preserve old and new statuses", () => {
  assert.equal(resolveCustomDomainLifecyclePhase("pending_verification"), "ownership_pending");
  assert.equal(resolveCustomDomainLifecyclePhase("verification_failed"), "ownership_failed");
  assert.equal(resolveCustomDomainLifecyclePhase("verifying"), "ownership_verified");
  assert.equal(resolveCustomDomainLifecyclePhase("verified"), "ownership_verified");
  assert.equal(resolveCustomDomainLifecyclePhase("provisioning"), "provisioning");
  assert.equal(resolveCustomDomainLifecyclePhase("certificate_pending"), "certificate_pending");
  assert.equal(resolveCustomDomainLifecyclePhase("activation_ready"), "activation_ready");
  assert.equal(resolveCustomDomainLifecyclePhase("connected"), "connected");
  assert.equal(resolveCustomDomainLifecyclePhase("disconnect_scheduled"), "disconnect_pending");
  assert.equal(resolveCustomDomainLifecyclePhase("disconnecting"), "disconnect_pending");
  assert.equal(resolveCustomDomainLifecyclePhase("disconnect_failed"), "disconnect_failed");
  assert.equal(resolveCustomDomainLifecyclePhase("disconnected"), "disconnected");
  assert.equal(resolveCustomDomainLifecyclePhase("unexpected"), "not_configured");
});

test("custom-domain normalization exposes lifecycle and future readiness fields", () => {
  const domain = normalizeHubCustomDomain({
    slug: "oak-hill",
    customDomain: {
      hostname: "Community.Example.Org",
      status: "certificate_pending",
      dnsRoutingStatus: "ready",
      vercelProjectId: "prj_123",
      certificateStatus: "pending",
      schemaVersion: 2,
    },
  });

  assert.equal(domain.hostname, "community.example.org");
  assert.equal(domain.lifecyclePhase, "certificate_pending");
  assert.equal(domain.statusLabel, "Certificate pending");
  assert.equal(domain.dnsRoutingStatus, "ready");
  assert.equal(domain.vercelProjectId, "prj_123");
  assert.equal(domain.certificateStatus, "pending");
  assert.equal(domain.schemaVersion, 2);
  assert.equal(domain.currentHost, "oakhill.hubforj.com");
});

test("custom-domain hostname validation rejects unsafe self-service inputs", () => {
  assert.equal(assertValidCustomDomainHostname("https://community.example.org/path"), "community.example.org");

  assert.throws(() => assertValidCustomDomainHostname("*.example.org"), /Wildcard custom domains are not supported/);
  assert.throws(() => assertValidCustomDomainHostname("127.0.0.1"), /public client-owned hostname/);
  assert.throws(() => assertValidCustomDomainHostname("example.local"), /public client-owned hostname/);
  assert.throws(() => assertValidCustomDomainHostname("example.internal"), /public client-owned hostname/);
  assert.throws(() => assertValidCustomDomainHostname("-bad.example.org"), /valid hostname/);
  assert.throws(() => assertValidCustomDomainHostname("bad-.example.org"), /valid hostname/);
  assert.throws(() => assertValidCustomDomainHostname("community.hubforj.com"), /client-owned domain/);
});

test("custom-domain claims normalize deterministic ownership state", () => {
  assert.equal(buildCustomDomainClaimId("https://Community.Example.Org/path"), "community.example.org");

  const claim = normalizeCustomDomainClaimRecord({
    hostname: "Community.Example.Org",
    hubId: "hub_1",
    hubSlug: "oak-hill",
    status: "pending",
    expiresAt: "2026-08-10T12:00:00.000Z",
  });

  assert.equal(claim.hostname, "community.example.org");
  assert.equal(claim.hubId, "hub_1");
  assert.equal(claim.hubSlug, "oak-hill");
  assert.equal(isCustomDomainClaimActive(claim, "2026-08-10T11:00:00.000Z"), true);
  assert.equal(isCustomDomainClaimActive(claim, "2026-08-10T13:00:00.000Z"), false);
  assert.equal(isCustomDomainClaimActive({ ...claim, status: "connected" }, "2026-08-10T13:00:00.000Z"), true);
  assert.equal(isCustomDomainClaimActive({ ...claim, status: "released" }, "2026-08-10T11:00:00.000Z"), false);
});
