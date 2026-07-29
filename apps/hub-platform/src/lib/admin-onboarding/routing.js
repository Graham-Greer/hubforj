import {
  adminOnboardingJourneyOrder,
  adminOnboardingJourneys,
  resolveAdminOnboardingJourneyDefinition,
} from "./config";

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeQueryValue(value) {
  return String(value ?? "").trim();
}

export function normalizeAdminOnboardingPath(pathname = "", hubSlug = "") {
  const normalizedPath = normalizeString(pathname) || "/";
  const normalizedHubSlug = normalizeString(hubSlug);

  if (normalizedHubSlug && normalizedPath.startsWith(`/${normalizedHubSlug}/admin`)) {
    return normalizedPath.slice(normalizedHubSlug.length + 1) || "/admin";
  }

  return normalizedPath;
}

export function buildAdminHref(adminBasePath = "/admin", routeSuffix = "") {
  const normalizedBase = normalizeString(adminBasePath) || "/admin";
  const normalizedSuffix = normalizeString(routeSuffix);

  if (!normalizedSuffix) {
    return normalizedBase;
  }

  if (normalizedSuffix === "/admin") {
    return normalizedBase;
  }

  const suffixWithoutAdmin = normalizedSuffix.startsWith("/admin")
    ? normalizedSuffix.slice("/admin".length)
    : normalizedSuffix;

  return `${normalizedBase}${suffixWithoutAdmin}` || normalizedBase;
}

export function getJourneyDefinition(journeyKey, context = {}) {
  return resolveAdminOnboardingJourneyDefinition(normalizeString(journeyKey), context);
}

export function listRouteJourneyKeys(pathname = "", hubSlug = "", capabilities = {}, query = {}) {
  const normalizedPath = normalizeAdminOnboardingPath(pathname, hubSlug);

  return adminOnboardingJourneyOrder.filter((journeyKey) => {
    const journey = adminOnboardingJourneys[journeyKey];
    if (!journey) {
      return false;
    }

    if (journey.requiresCapability && !capabilities[journey.requiresCapability]) {
      return false;
    }

    if (journeyKey === "courses_list" && !capabilities.coursesEnabled) {
      return false;
    }

    if (!journey.routePatterns.includes(normalizedPath)) {
      const routePrefixes = Array.isArray(journey.routePrefixes) ? journey.routePrefixes : [];
      if (!routePrefixes.some((prefix) => normalizedPath.startsWith(prefix))) {
        return false;
      }
    }

    if (!journey.queryKey) {
      return true;
    }

    const queryValue = normalizeQueryValue(query?.[journey.queryKey]);
    const fallbackValue = normalizeQueryValue(journey.queryDefaultValue);
    return (queryValue || fallbackValue) === normalizeQueryValue(journey.queryValue);
  });
}
