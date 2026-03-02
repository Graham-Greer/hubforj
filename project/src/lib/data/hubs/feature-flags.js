const FEATURE_DEFINITIONS = [
  {
    key: "cmsPages",
    label: "CMS Pages",
    description: "Create custom pages with draft and publish workflows.",
    enabledHref: (hubSlug) => `/${hubSlug}/admin/cms`,
    lockedBenefits: [
      "Create and manage custom pages",
      "Draft and publish page content",
      "Control page-level layout content",
    ],
  },
  {
    key: "stripePayments",
    label: "Stripe Payments",
    description: "Enable payment collection and reconciliation for events and memberships.",
    enabledHref: (hubSlug) => `/${hubSlug}/admin/events`,
    lockedBenefits: [
      "Collect online event registration payments",
      "Reduce manual payment reconciliation",
      "Track paid and unpaid states in one workflow",
    ],
  },
  {
    key: "emailNotifications",
    label: "Email Notifications",
    description: "Send lifecycle notifications for memberships and registrations.",
    enabledHref: null,
    lockedBenefits: [
      "Automate member lifecycle email updates",
      "Notify registrants of event status changes",
      "Reduce manual admin communication overhead",
    ],
  },
];

export function listHubFeatures(features = {}) {
  return FEATURE_DEFINITIONS.map((definition) => ({
    ...definition,
    enabled: Boolean(features?.[definition.key]),
  }));
}

export function getFeatureDefinition(featureKey) {
  const key = String(featureKey || "").trim();
  return FEATURE_DEFINITIONS.find((definition) => definition.key === key) || null;
}

export function getHubFeatureByKey(features = {}, featureKey) {
  const definition = getFeatureDefinition(featureKey);
  if (!definition) return null;

  return {
    ...definition,
    enabled: Boolean(features?.[definition.key]),
  };
}
