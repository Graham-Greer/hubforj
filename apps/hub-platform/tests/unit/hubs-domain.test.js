import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeHubSlug,
  normalizeHubDomain,
  normalizeCreateHubPayload,
} from "../../src/lib/domain/hubs.js";
import { normalizeHubCustomDomain } from "../../src/lib/domain/hub-domains.js";

test("normalizeHubSlug lowercases and constrains public slug shape", () => {
  assert.equal(normalizeHubSlug(" Oak Hill Community "), "oakhillcommunity");
  assert.equal(normalizeHubSlug("oak_hill!!"), "oakhill");
});

test("normalizeHubDomain strips protocol path port and trailing dots", () => {
  assert.equal(normalizeHubDomain("https://OakHill.example.com:3000/path?q=1."), "oakhill.example.com");
  assert.equal(normalizeHubDomain(""), "");
});

test("normalizeCreateHubPayload applies defaults and validates required fields", () => {
  const payload = normalizeCreateHubPayload({
    name: "Oak Hill",
    slug: " Oak Hill ",
    contactEmail: "HELLO@OAKHILL.COM ",
    customDomain: "https://oakhill.example.com",
    packageTier: "growth",
    template: "unknown-template",
    theme: "unknown-theme",
  });

  assert.deepEqual(payload.customDomains, ["oakhill.example.com"]);
  assert.equal(payload.slug, "oakhill");
  assert.equal(payload.contactEmail, "hello@oakhill.com");
  assert.equal(payload.templateKey, "civic");
  assert.equal(payload.theme, "light");
  assert.equal(payload.locale, "en-US");
  assert.equal(payload.country, "US");
  assert.equal(payload.timezone, "America/New_York");
  assert.equal(payload.defaultCurrency, "USD");
  assert.equal(payload.features.courses, true);
  assert.equal(payload.status, "active");
});

test("normalizeCreateHubPayload falls back to USD regional defaults when no regional inputs are present", () => {
  const payload = normalizeCreateHubPayload({
    name: "Sunset Club",
    slug: "sunsetclub",
    contactEmail: "hello@sunset.club",
  });

  assert.equal(payload.country, "US");
  assert.equal(payload.locale, "en-US");
  assert.equal(payload.timezone, "America/New_York");
  assert.equal(payload.defaultCurrency, "USD");
});

test("normalizeCreateHubPayload rejects invalid contact email", () => {
  assert.throws(
    () =>
      normalizeCreateHubPayload({
        name: "Oak Hill",
        slug: "oakhill",
        contactEmail: "bad-email",
      }),
    /Contact email must be valid\./
  );
});

test("normalizeCreateHubPayload rejects unsupported countries for self-serve hubs", () => {
  assert.throws(
    () =>
      normalizeCreateHubPayload({
        name: "Harbour Collective",
        slug: "harbourcollective",
        contactEmail: "hello@harbourcollective.com",
        country: "ZA",
      }),
    /Country is not supported yet\./
  );
});

test("normalizeHubCustomDomain keeps hosted hubs on the tenant subdomain", () => {
  const domainState = normalizeHubCustomDomain({
    slug: "oakhill",
    domain: "oakhill.hubforj.com",
    customDomains: ["oakhill.hubforj.com"],
    customDomain: {
      hostname: "oakhill.hubforj.com",
      status: "connected",
    },
  });

  assert.equal(domainState.hostname, "");
  assert.equal(domainState.status, "not_configured");
  assert.equal(domainState.currentHost, "oakhill.hubforj.com");
  assert.equal(domainState.currentHostLabel, "oakhill.hubforj.com");
  assert.equal(domainState.platformHostedHref, "oakhill.hubforj.com");
});

test("normalizeHubCustomDomain preserves connected client-owned custom domains", () => {
  const domainState = normalizeHubCustomDomain({
    slug: "oakhill",
    customDomain: {
      hostname: "members.oakhill.org",
      status: "connected",
    },
  });

  assert.equal(domainState.hostname, "members.oakhill.org");
  assert.equal(domainState.status, "connected");
  assert.equal(domainState.currentHost, "members.oakhill.org");
  assert.equal(domainState.currentHostLabel, "members.oakhill.org");
  assert.equal(domainState.platformHostedHref, "oakhill.hubforj.com");
});
