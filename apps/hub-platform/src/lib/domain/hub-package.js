import {
  getPackageSourceLabel,
  getPackageStatusLabel,
  getPackageTierLabel,
  normalizePackageSource,
  normalizePackageStatus,
  normalizePackageTier,
} from "./package-tiers.js";
import { resolvePackageEntitlements } from "./package-entitlements.js";

function normalizeString(value) {
  return String(value || "").trim();
}

export function normalizeHubPackageAuthority(hub = {}) {
  const hasExplicitPackageTier = Boolean(normalizeString(hub.packageTier));
  const packageTier = normalizePackageTier(hub.packageTier, "starter");
  const packageStatus = normalizePackageStatus(hub.packageStatus, "active");
  const packageSource = normalizePackageSource(
    hub.packageSource,
    hasExplicitPackageTier ? "product_site" : "operator"
  );
  const packageOverrides = {
    customDomainEnabled:
      typeof hub.packageOverrides?.customDomainEnabled === "boolean"
        ? hub.packageOverrides.customDomainEnabled
        : null,
    brandingRemovalEnabled:
      typeof hub.packageOverrides?.brandingRemovalEnabled === "boolean"
        ? hub.packageOverrides.brandingRemovalEnabled
        : null,
    reportingEnabled:
      typeof hub.packageOverrides?.reportingEnabled === "boolean"
        ? hub.packageOverrides.reportingEnabled
        : null,
  };

  return {
    packageTier,
    packageTierLabel: getPackageTierLabel(packageTier),
    packageStatus,
    packageStatusLabel: getPackageStatusLabel(packageStatus),
    packageSource,
    packageSourceLabel: getPackageSourceLabel(packageSource),
    packageAssignedAt: normalizeString(hub.packageAssignedAt),
    packageUpdatedAt: normalizeString(hub.packageUpdatedAt),
    packageOverrides,
    hasExplicitPackageTier,
  };
}

export function resolveHubPackageEntitlements(hub = {}) {
  const authority = normalizeHubPackageAuthority(hub);

  return {
    ...authority,
    ...resolvePackageEntitlements({
      packageTier: authority.packageTier,
      packageStatus: authority.packageStatus,
      packageOverrides: authority.packageOverrides,
      legacyFeatures: hub.features || {},
      preferLegacyFeatures: !authority.hasExplicitPackageTier,
    }),
  };
}
