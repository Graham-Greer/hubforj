import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPackageAuthoritySnapshot,
  normalizeCreateHubProvisioningPayload,
  normalizeUpdateHubPackageAuthorityPayload,
} from "../../src/lib/domain/hub-package-contracts.js";

test("buildPackageAuthoritySnapshot derives legacy compatibility features from canonical package authority", () => {
  const authority = buildPackageAuthoritySnapshot({
    packageTier: "growth",
    packageStatus: "active",
    packageSource: "product_site",
  });

  assert.equal(authority.packageTier, "growth");
  assert.equal(authority.packageStatus, "active");
  assert.equal(authority.packageSource, "product_site");
  assert.equal(authority.features.courses, true);
  assert.equal(authority.features.stripePayments, true);
});

test("normalizeCreateHubProvisioningPayload keeps product-site-friendly package authority explicit", () => {
  const payload = normalizeCreateHubProvisioningPayload({
    name: "Oak Hill",
    slug: "oak-hill",
    contactEmail: "hello@oakhill.com",
    templateKey: "civic",
    locale: "en-GB",
    packageTier: "starter",
    packageStatus: "trialing",
    packageSource: "product_site",
  });

  assert.equal(payload.country, "GB");
  assert.equal(payload.timezone, "Europe/London");
  assert.equal(payload.locale, "en-GB");
  assert.equal(payload.defaultCurrency, "GBP");
  assert.equal(payload.packageTier, "starter");
  assert.equal(payload.packageStatus, "trialing");
  assert.equal(payload.packageSource, "product_site");
  assert.equal(payload.regionalSetupStatus, "required");
  assert.equal(payload.regionalSetupCompletedAt, "");
  assert.equal(payload.features.stripePayments, false);
});

test("normalizeCreateHubProvisioningPayload uses USD regional fallback when no regional inputs are supplied", () => {
  const payload = normalizeCreateHubProvisioningPayload({
    name: "Sunset Club",
    slug: "sunset-club",
    contactEmail: "hello@sunset.club",
    templateKey: "civic",
  });

  assert.equal(payload.country, "US");
  assert.equal(payload.locale, "en-US");
  assert.equal(payload.timezone, "America/New_York");
  assert.equal(payload.defaultCurrency, "USD");
  assert.equal(payload.regionalSetupStatus, "complete");
  assert.equal(payload.regionalSetupCompletedAt, "AUTO_NOW");
});

test("normalizeCreateHubProvisioningPayload rejects unsupported regional markets", () => {
  assert.throws(
    () =>
      normalizeCreateHubProvisioningPayload({
        name: "Cape Coast Club",
        slug: "cape-coast-club",
        contactEmail: "hello@capecoast.club",
        country: "ZA",
      }),
    /Country is not supported yet\./
  );
});

test("normalizeUpdateHubPackageAuthorityPayload rejects missing or invalid package authority", () => {
  assert.throws(() => normalizeUpdateHubPackageAuthorityPayload({ packageTier: "" }), /Package tier is invalid\./);
  assert.throws(
    () =>
      normalizeUpdateHubPackageAuthorityPayload({
        packageTier: "growth",
        packageStatus: "invalid",
        packageSource: "product_site",
      }),
    /Package status is invalid\./
  );
  assert.throws(
    () =>
      normalizeUpdateHubPackageAuthorityPayload({
        packageTier: "growth",
        packageStatus: "active",
        packageSource: "elsewhere",
      }),
    /Package source is invalid\./
  );
});

test("normalizeUpdateHubPackageAuthorityPayload normalizes override flags and builds compatibility features", () => {
  const payload = normalizeUpdateHubPackageAuthorityPayload({
    packageTier: "growth",
    packageStatus: "past_due",
    packageSource: "product-site",
    packageOverrides: {
      customDomainEnabled: "false",
      brandingRemovalEnabled: true,
      reportingEnabled: "",
    },
  });

  assert.deepEqual(payload.packageOverrides, {
    customDomainEnabled: false,
    brandingRemovalEnabled: true,
    reportingEnabled: null,
  });
  assert.equal(payload.packageTier, "growth");
  assert.equal(payload.packageStatus, "past_due");
  assert.equal(payload.packageSource, "product_site");
  assert.equal(payload.features.stripePayments, true);
});
