import { assertValidCustomDomainHostname, normalizeHubCustomDomain } from "./hub-domains.js";
import { buildLegacyFeatureFlagsFromEntitlements, resolvePackageEntitlements } from "./package-entitlements.js";
import { resolveRegionalDefaults } from "./regional-markets.js";
import {
  normalizePackageSource,
  normalizePackageStatus,
  normalizePackageTier,
} from "./package-tiers.js";

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeNullableBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  return null;
}

function normalizeBooleanLike(value) {
  if (typeof value === "boolean") {
    return value;
  }

  const normalized = normalizeString(value).toLowerCase();

  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  return null;
}

function assertAllowedValue(value, allowedValues, label) {
  if (!allowedValues.includes(value)) {
    throw new Error(`${label} is invalid.`);
  }
}

function normalizePackageOverrides(overrides = {}) {
  return {
    customDomainEnabled: normalizeNullableBoolean(overrides?.customDomainEnabled),
    brandingRemovalEnabled: normalizeNullableBoolean(overrides?.brandingRemovalEnabled),
    reportingEnabled: normalizeNullableBoolean(overrides?.reportingEnabled),
  };
}

function normalizePackageOverridesInput(overrides = {}) {
  return {
    customDomainEnabled: normalizeBooleanLike(overrides?.customDomainEnabled),
    brandingRemovalEnabled: normalizeBooleanLike(overrides?.brandingRemovalEnabled),
    reportingEnabled: normalizeBooleanLike(overrides?.reportingEnabled),
  };
}

export function buildPackageAuthoritySnapshot({
  packageTier,
  packageStatus = "active",
  packageSource = "operator",
  packageOverrides = {},
}) {
  const resolvedTier = normalizePackageTier(packageTier, "");
  const resolvedStatus = normalizePackageStatus(packageStatus, "");
  const resolvedSource = normalizePackageSource(packageSource, "");

  assertAllowedValue(resolvedTier, ["free", "starter", "growth"], "Package tier");
  assertAllowedValue(resolvedStatus, ["active", "trialing", "past_due", "cancelled"], "Package status");
  assertAllowedValue(resolvedSource, ["product_site", "operator", "seed"], "Package source");

  const normalizedOverrides = normalizePackageOverrides(packageOverrides);
  const entitlements = resolvePackageEntitlements({
    packageTier: resolvedTier,
    packageStatus: resolvedStatus,
    packageOverrides: normalizedOverrides,
    legacyFeatures: {},
    preferLegacyFeatures: false,
  });

  return {
    packageTier: entitlements.packageTier,
    packageStatus: entitlements.packageStatus,
    packageSource: resolvedSource,
    packageOverrides: normalizedOverrides,
    features: buildLegacyFeatureFlagsFromEntitlements(entitlements),
    entitlements,
  };
}

export function normalizeCreateHubProvisioningPayload({
  name,
  slug,
  contactEmail,
  customDomain = "",
  templateKey,
  theme = "light",
  description = "",
  country = "",
  timezone = "",
  locale = "",
  defaultCurrency = "",
  tokenOverrides = {},
  status = "active",
  supportState = "onboarding",
  packageTier = "free",
  packageStatus = "active",
  packageSource = "operator",
  regionalSetupStatus = "",
  regionalSetupCompletedAt = "",
} = {}) {
  const authority = buildPackageAuthoritySnapshot({
    packageTier,
    packageStatus,
    packageSource,
    packageOverrides: {},
  });

  if (customDomain && !authority.entitlements.capabilities.customDomainEnabled) {
    throw new Error("Custom domains are only available on the Growth package.");
  }

  if (customDomain) {
    assertValidCustomDomainHostname(customDomain);
  }

  const regionalDefaults = resolveRegionalDefaults({
    country,
    timezone,
    locale,
    defaultCurrency,
  });

  const normalizedCustomDomain = normalizeHubCustomDomain({
    slug,
    customDomain: customDomain
      ? {
          hostname: customDomain,
          status: "connected",
          isPrimary: true,
          verificationMethod: "operator_seed",
        }
      : null,
    customDomains: customDomain ? [customDomain] : [],
  });

  return {
    name,
    slug,
    contactEmail,
    customDomain: customDomain
      ? {
          hostname: normalizedCustomDomain.hostname,
          status: normalizedCustomDomain.status,
          isPrimary: true,
          verificationMethod: normalizedCustomDomain.verificationMethod,
          verificationTarget: "",
          requestedAt: "",
          verifiedAt: "",
          connectedAt: "",
          lastCheckedAt: "",
          disconnectAt: "",
          disconnectedAt: "",
          failureReason: "",
          connectedByUserId: "",
          updatedByUserId: "",
        }
      : null,
    customDomains: normalizedCustomDomain.customDomains,
    templateKey,
    theme,
    description,
    country: regionalDefaults.country,
    timezone: regionalDefaults.timezone,
    locale: regionalDefaults.locale,
    defaultCurrency: regionalDefaults.defaultCurrency,
    tokenOverrides,
    packageTier: authority.packageTier,
    packageStatus: authority.packageStatus,
    packageSource: authority.packageSource,
    packageOverrides: authority.packageOverrides,
    features: authority.features,
    regionalSetupStatus:
      normalizeString(regionalSetupStatus)
      || (authority.packageSource === "product_site" ? "required" : "complete"),
    regionalSetupCompletedAt:
      normalizeString(regionalSetupCompletedAt)
      || (authority.packageSource === "product_site" ? "" : "AUTO_NOW"),
    status,
    supportState,
  };
}

export function normalizeUpdateHubPackageAuthorityPayload(payload = {}) {
  const packageTier = normalizePackageTier(payload.packageTier, "");
  const packageStatus = normalizePackageStatus(payload.packageStatus, "");
  const packageSource = normalizePackageSource(payload.packageSource, "");

  assertAllowedValue(packageTier, ["free", "starter", "growth"], "Package tier");
  assertAllowedValue(packageStatus, ["active", "trialing", "past_due", "cancelled"], "Package status");
  assertAllowedValue(packageSource, ["product_site", "operator", "seed"], "Package source");

  const packageOverrides = normalizePackageOverridesInput(payload.packageOverrides);
  const authority = buildPackageAuthoritySnapshot({
    packageTier,
    packageStatus,
    packageSource,
    packageOverrides,
  });

  return {
    packageTier: authority.packageTier,
    packageStatus: authority.packageStatus,
    packageSource: authority.packageSource,
    packageOverrides: authority.packageOverrides,
    packageAssignedAt: normalizeString(payload.packageAssignedAt),
    packageUpdatedAt: normalizeString(payload.packageUpdatedAt),
    features: authority.features,
  };
}
