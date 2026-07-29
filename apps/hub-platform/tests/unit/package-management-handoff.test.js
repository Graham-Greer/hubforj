import test from "node:test";
import assert from "node:assert/strict";

process.env.PRODUCT_SITE_BASE_URL = "https://product.example.com";

const { resolvePackageManagementHandoff } = await import("../../src/lib/domain/package-management-handoff.js");

test("package management handoff builds product-site destinations from the configured base url", () => {
  const result = resolvePackageManagementHandoff({
    hubId: "hub_123",
    hubSlug: "oak-hill",
    returnPath: "/oak-hill/admin/settings/account",
  });

  assert.equal(
    result.managePackageHref,
    "https://product.example.com/account/package?hubId=hub_123&hubSlug=oak-hill&returnTo=%2Foak-hill%2Fadmin%2Fsettings%2Faccount"
  );
  assert.equal(
    result.upgradeToGrowthHref,
    "https://product.example.com/account/upgrade?hubId=hub_123&hubSlug=oak-hill&returnTo=%2Foak-hill%2Fadmin%2Fsettings%2Faccount&intent=upgrade_growth"
  );
  assert.equal(result.managePackageAvailable, true);
  assert.equal(result.upgradeToGrowthAvailable, true);
  assert.equal(result.placeholder, false);
});
