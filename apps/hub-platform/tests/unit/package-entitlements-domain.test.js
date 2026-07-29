import test from "node:test";
import assert from "node:assert/strict";
import {
  buildLegacyFeatureFlagsFromEntitlements,
  resolvePackageEntitlements,
} from "../../src/lib/domain/package-entitlements.js";
import { resolveHubPackageEntitlements } from "../../src/lib/domain/hub-package.js";
import { resolveSiteSettingsCapabilities } from "../../src/lib/domain/site-settings-capabilities.js";

test("free package disables courses and all paid offerings", () => {
  const entitlements = resolvePackageEntitlements({ packageTier: "free" });

  assert.equal(entitlements.paymentProcessingMode, "none");
  assert.equal(entitlements.capabilities.transactionalBookingEmailsEnabled, true);
  assert.equal(entitlements.capabilities.recurringEventsEnabled, false);
  assert.equal(entitlements.capabilities.coursesEnabled, false);
  assert.equal(entitlements.capabilities.paidMembershipsEnabled, false);
  assert.equal(entitlements.capabilities.paidEventsEnabled, false);
  assert.equal(entitlements.capabilities.paidCoursesEnabled, false);
  assert.equal(entitlements.capabilities.nativePaymentsEnabled, false);
  assert.equal(entitlements.capabilities.paymentsEnabled, false);
  assert.equal(entitlements.capabilities.groupBookingsEnabled, false);
});

test("starter package enables courses and paid offerings with external payments", () => {
  const entitlements = resolvePackageEntitlements({ packageTier: "starter" });

  assert.equal(entitlements.paymentProcessingMode, "external");
  assert.equal(entitlements.capabilities.transactionalBookingEmailsEnabled, true);
  assert.equal(entitlements.capabilities.emailRemindersEnabled, true);
  assert.equal(entitlements.capabilities.recurringEventsEnabled, true);
  assert.equal(entitlements.capabilities.coursesEnabled, true);
  assert.equal(entitlements.capabilities.paidMembershipsEnabled, true);
  assert.equal(entitlements.capabilities.paidEventsEnabled, true);
  assert.equal(entitlements.capabilities.paidCoursesEnabled, true);
  assert.equal(entitlements.capabilities.nativePaymentsEnabled, false);
  assert.equal(entitlements.capabilities.paymentsEnabled, false);
  assert.equal(entitlements.capabilities.groupBookingsEnabled, false);
});

test("growth package enables native payments alongside paid offerings", () => {
  const entitlements = resolvePackageEntitlements({ packageTier: "growth" });

  assert.equal(entitlements.paymentProcessingMode, "internal");
  assert.equal(entitlements.capabilities.transactionalBookingEmailsEnabled, true);
  assert.equal(entitlements.capabilities.emailRemindersEnabled, true);
  assert.equal(entitlements.capabilities.recurringEventsEnabled, true);
  assert.equal(entitlements.capabilities.coursesEnabled, true);
  assert.equal(entitlements.capabilities.paidMembershipsEnabled, true);
  assert.equal(entitlements.capabilities.paidEventsEnabled, true);
  assert.equal(entitlements.capabilities.paidCoursesEnabled, true);
  assert.equal(entitlements.capabilities.nativePaymentsEnabled, true);
  assert.equal(entitlements.capabilities.paymentsEnabled, true);
  assert.equal(entitlements.capabilities.groupBookingsEnabled, true);
});

test("legacy fallback preserves legacy monetisation behavior for hubs without explicit package authority", () => {
  const entitlements = resolveHubPackageEntitlements({
    features: {
      courses: false,
      stripePayments: false,
    },
  });

  assert.equal(entitlements.packageTier, "starter");
  assert.equal(entitlements.paymentProcessingMode, "none");
  assert.equal(entitlements.capabilities.coursesEnabled, false);
  assert.equal(entitlements.capabilities.paidMembershipsEnabled, false);
  assert.equal(entitlements.capabilities.paidEventsEnabled, false);
  assert.equal(entitlements.capabilities.paidCoursesEnabled, false);
  assert.equal(entitlements.capabilities.nativePaymentsEnabled, false);
});

test("legacy feature flags only carry native payment capability forward", () => {
  const legacyFlags = buildLegacyFeatureFlagsFromEntitlements(
    resolvePackageEntitlements({ packageTier: "starter" })
  );

  assert.deepEqual(legacyFlags, {
    courses: true,
    stripePayments: false,
    testimonials: true,
  });
});

test("site settings capability adapter exposes the new monetisation contract", () => {
  const capabilities = resolveSiteSettingsCapabilities({
    packageTier: "starter",
  });

  assert.equal(capabilities.paymentProcessingMode, "external");
  assert.equal(capabilities.transactionalBookingEmailsEnabled, true);
  assert.equal(capabilities.emailRemindersEnabled, true);
  assert.equal(capabilities.coursesEnabled, true);
  assert.equal(capabilities.paidMembershipsEnabled, true);
  assert.equal(capabilities.paidEventsEnabled, true);
  assert.equal(capabilities.paidCoursesEnabled, true);
  assert.equal(capabilities.nativePaymentsEnabled, false);
  assert.equal(capabilities.paymentsEnabled, false);
  assert.equal(capabilities.groupBookingsEnabled, false);
});
