import { normalizePackageStatus, normalizePackageTier } from "./package-tiers.js";

function normalizeBoolean(value) {
  return value === true;
}

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeNullableBoolean(value) {
  if (value === true) {
    return true;
  }

  if (value === false) {
    return false;
  }

  return null;
}

function buildBaseCapabilities() {
  return {
    subdomainSiteEnabled: true,
    customDomainEnabled: false,
    eventsEnabled: true,
    recurringEventsEnabled: false,
    coursesEnabled: false,
    groupBookingsEnabled: false,
    rsvpTrackingEnabled: false,
    transactionalBookingEmailsEnabled: true,
    emailRemindersEnabled: false,
    memberListEnabled: false,
    nativePaymentsEnabled: false,
    paymentsEnabled: false,
    paidEventsEnabled: false,
    paidCoursesEnabled: false,
    paidMembershipsEnabled: false,
    brandingRemovalEnabled: false,
    reportingEnabled: false,
    testimonialsEnabled: true,
    announcementsEnabled: true,
    advancedHomepageVariantsEnabled: false,
  };
}

function buildTierCapabilities(tier) {
  const capabilities = buildBaseCapabilities();

  if (tier === "starter") {
    capabilities.recurringEventsEnabled = true;
    capabilities.coursesEnabled = true;
    capabilities.rsvpTrackingEnabled = true;
    capabilities.emailRemindersEnabled = true;
    capabilities.memberListEnabled = true;
    capabilities.paidEventsEnabled = true;
    capabilities.paidCoursesEnabled = true;
    capabilities.paidMembershipsEnabled = true;
    return capabilities;
  }

  if (tier === "growth") {
    capabilities.recurringEventsEnabled = true;
    capabilities.customDomainEnabled = true;
    capabilities.coursesEnabled = true;
    capabilities.groupBookingsEnabled = true;
    capabilities.rsvpTrackingEnabled = true;
    capabilities.emailRemindersEnabled = true;
    capabilities.memberListEnabled = true;
    capabilities.nativePaymentsEnabled = true;
    capabilities.paymentsEnabled = true;
    capabilities.paidEventsEnabled = true;
    capabilities.paidCoursesEnabled = true;
    capabilities.paidMembershipsEnabled = true;
    capabilities.brandingRemovalEnabled = true;
    capabilities.reportingEnabled = true;
    return capabilities;
  }

  return capabilities;
}

function buildTierLimits(tier) {
  if (tier === "free") {
    return {
      activeUpcomingEvents: 3,
      activeMembers: 30,
    };
  }

  if (tier === "starter") {
    return {
      activeUpcomingEvents: null,
      activeMembers: 200,
    };
  }

  return {
    activeUpcomingEvents: null,
    activeMembers: null,
  };
}

export function buildLegacyFeatureFlagsFromEntitlements(entitlements) {
  const capabilities = entitlements?.capabilities || buildBaseCapabilities();

  return {
    courses: capabilities.coursesEnabled,
    stripePayments: capabilities.nativePaymentsEnabled,
    testimonials: capabilities.testimonialsEnabled,
  };
}

function resolvePaymentProcessingMode(tier) {
  if (tier === "starter") {
    return "external";
  }

  if (tier === "growth") {
    return "internal";
  }

  return "none";
}

export function resolvePackageEntitlements({
  packageTier,
  packageStatus = "active",
  packageOverrides = {},
  legacyFeatures = {},
  preferLegacyFeatures = false,
} = {}) {
  const resolvedTier = normalizePackageTier(packageTier);
  const resolvedStatus = normalizePackageStatus(packageStatus);
  const capabilities = buildTierCapabilities(resolvedTier);
  const limits = buildTierLimits(resolvedTier);
  let paymentProcessingMode = resolvePaymentProcessingMode(resolvedTier);

  const legacyCoursesEnabled = normalizeBoolean(legacyFeatures.courses);
  const legacyPaymentsEnabled = normalizeBoolean(legacyFeatures.stripePayments);
  const legacyTestimonialsEnabled =
    normalizeString(legacyFeatures.testimonials) === ""
      ? capabilities.testimonialsEnabled
      : normalizeBoolean(legacyFeatures.testimonials);

  if (preferLegacyFeatures) {
    capabilities.coursesEnabled = legacyCoursesEnabled;
    capabilities.nativePaymentsEnabled = legacyPaymentsEnabled;
    capabilities.paymentsEnabled = legacyPaymentsEnabled;
    capabilities.paidEventsEnabled = legacyPaymentsEnabled;
    capabilities.paidCoursesEnabled = legacyPaymentsEnabled && capabilities.coursesEnabled;
    capabilities.paidMembershipsEnabled = legacyPaymentsEnabled;
    paymentProcessingMode = legacyPaymentsEnabled ? "internal" : "none";
  }

  capabilities.testimonialsEnabled = legacyTestimonialsEnabled;

  const customDomainOverride = normalizeNullableBoolean(packageOverrides?.customDomainEnabled);
  const brandingRemovalOverride = normalizeNullableBoolean(packageOverrides?.brandingRemovalEnabled);
  const reportingOverride = normalizeNullableBoolean(packageOverrides?.reportingEnabled);

  if (customDomainOverride !== null) {
    capabilities.customDomainEnabled = customDomainOverride;
  }

  if (brandingRemovalOverride !== null) {
    capabilities.brandingRemovalEnabled = brandingRemovalOverride;
  }

  if (reportingOverride !== null) {
    capabilities.reportingEnabled = reportingOverride;
  }

  return {
    packageTier: resolvedTier,
    packageStatus: resolvedStatus,
    paymentProcessingMode,
    limits,
    capabilities,
  };
}
