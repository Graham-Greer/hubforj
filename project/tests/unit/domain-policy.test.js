import test from "node:test";
import assert from "node:assert/strict";
import {
  assertNoCanonicalDuplicates,
  assertNoCrossHubConflicts,
  assertNoReservedDomains,
  getCanonicalDomain,
  normalizeDomainInput,
} from "../../src/lib/data/hubs/domain-policy.js";

test("normalizeDomainInput strips protocol, path, query, port, and trailing dots", () => {
  const input = "  HTTPS://WWW.Example.COM:443/path?foo=bar#frag...  ";
  assert.equal(normalizeDomainInput(input), "www.example.com");
});

test("canonical domain treats root and www as same value", () => {
  assert.equal(getCanonicalDomain("www.example.com"), "example.com");
  assert.equal(getCanonicalDomain("example.com"), "example.com");
});

test("assertNoCanonicalDuplicates rejects root/www duplicates", () => {
  assert.throws(
    () => assertNoCanonicalDuplicates(["example.com", "www.example.com"]),
    /Duplicate custom domain/
  );
});

test("assertNoCrossHubConflicts rejects domains claimed by other hubs", () => {
  assert.throws(
    () =>
      assertNoCrossHubConflicts({
        domains: ["example.com"],
        existingHubs: [
          { id: "hub_a", customDomains: ["www.example.com"] },
          { id: "hub_b", customDomains: ["other.com"] },
        ],
        currentHubId: "hub_c",
      }),
    /already assigned/
  );
});

test("assertNoReservedDomains rejects reserved platform host claims", () => {
  process.env.PLATFORM_RESERVED_HOSTS = "platform.example.com";
  assert.throws(
    () => assertNoReservedDomains(["platform.example.com"]),
    /Reserved platform domain/
  );
});
