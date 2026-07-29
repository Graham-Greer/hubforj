import { resolveHubPackageEntitlements } from "./hub-package.js";

export function resolveSiteSettingsCapabilities(hub = {}) {
  const entitlements = resolveHubPackageEntitlements(hub);

  return {
    packageTier: entitlements.packageTier,
    packageStatus: entitlements.packageStatus,
    paymentProcessingMode: entitlements.paymentProcessingMode,
    limits: entitlements.limits,
    capabilities: entitlements.capabilities,
    announcementsEnabled: entitlements.capabilities.announcementsEnabled,
    eventsEnabled: entitlements.capabilities.eventsEnabled,
    recurringEventsEnabled: entitlements.capabilities.recurringEventsEnabled,
    coursesEnabled: entitlements.capabilities.coursesEnabled,
    testimonialsEnabled: entitlements.capabilities.testimonialsEnabled,
    groupBookingsEnabled: entitlements.capabilities.groupBookingsEnabled,
    nativePaymentsEnabled: entitlements.capabilities.nativePaymentsEnabled,
    paymentsEnabled: entitlements.capabilities.paymentsEnabled,
    paidEventsEnabled: entitlements.capabilities.paidEventsEnabled,
    paidCoursesEnabled: entitlements.capabilities.paidCoursesEnabled,
    paidMembershipsEnabled: entitlements.capabilities.paidMembershipsEnabled,
    customDomainAllowed: entitlements.capabilities.customDomainEnabled,
    advancedHomepageVariantsEnabled: entitlements.capabilities.advancedHomepageVariantsEnabled,
    rsvpTrackingEnabled: entitlements.capabilities.rsvpTrackingEnabled,
    transactionalBookingEmailsEnabled: entitlements.capabilities.transactionalBookingEmailsEnabled,
    emailRemindersEnabled: entitlements.capabilities.emailRemindersEnabled,
    memberListEnabled: entitlements.capabilities.memberListEnabled,
    brandingRemovalEnabled: entitlements.capabilities.brandingRemovalEnabled,
    reportingEnabled: entitlements.capabilities.reportingEnabled,
  };
}
