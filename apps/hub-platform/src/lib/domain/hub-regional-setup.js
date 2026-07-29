function normalizeString(value) {
  return String(value || "").trim();
}

export function getHubRegionalSetupStatus(hub = null) {
  const explicitStatus = normalizeString(hub?.regionalSetupStatus).toLowerCase();

  if (explicitStatus === "complete" || explicitStatus === "required") {
    return explicitStatus;
  }

  const hasRegionalDefaults =
    Boolean(normalizeString(hub?.country)) &&
    Boolean(normalizeString(hub?.timezone)) &&
    Boolean(normalizeString(hub?.locale)) &&
    Boolean(normalizeString(hub?.defaultCurrency));

  return hasRegionalDefaults ? "complete" : "required";
}

export function isHubRegionalSetupComplete(hub = null) {
  return getHubRegionalSetupStatus(hub) === "complete";
}

export function getHubRegionalOnboardingHref(hub = null) {
  return `/${normalizeString(hub?.slug)}/admin/onboarding`;
}

export function assertHubRegionalSetupComplete(hub = null) {
  if (isHubRegionalSetupComplete(hub)) {
    return;
  }

  throw new Error("Complete regional setup before using this part of the admin portal.");
}

