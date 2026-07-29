import test from "node:test";
import assert from "node:assert/strict";
import { normalizeUpdatePackageAuthorityAutomationRequestBody } from "../../src/lib/domain/internal-automation.js";

test("package-authority automation payload normalizes valid upstream billing state", () => {
  assert.deepEqual(
    normalizeUpdatePackageAuthorityAutomationRequestBody({
      hubId: "hub_123",
      packageTier: "Growth",
      packageStatus: "past_due",
      packageSource: "product_site",
      packageAssignedAt: "2026-04-22T09:00:00.000Z",
      packageOverrides: {
        customDomainEnabled: "true",
        reportingEnabled: "false",
      },
    }),
    {
      hubId: "hub_123",
      packageTier: "growth",
      packageStatus: "past_due",
      packageSource: "product_site",
      packageAssignedAt: "2026-04-22T09:00:00.000Z",
      packageUpdatedAt: "",
      packageOverrides: {
        customDomainEnabled: true,
        brandingRemovalEnabled: null,
        reportingEnabled: false,
      },
      features: {
        courses: true,
        stripePayments: true,
        testimonials: true,
      },
    }
  );
});

test("package-authority automation payload requires a hub id", () => {
  assert.throws(
    () =>
      normalizeUpdatePackageAuthorityAutomationRequestBody({
        hubId: "",
        packageTier: "starter",
        packageStatus: "active",
        packageSource: "product_site",
      }),
    /Hub id is required/
  );
});
