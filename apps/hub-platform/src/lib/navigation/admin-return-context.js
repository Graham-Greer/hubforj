function normalizeString(value) {
  return String(value || "").trim();
}

function stripQueryAndHash(path) {
  return normalizeString(path).split("#")[0].split("?")[0];
}

export function buildAdminSectionReturnPath(hubSlug, path, section = "") {
  const normalizedHubSlug = normalizeString(hubSlug);
  const normalizedPath = normalizeString(path);
  const normalizedSection = normalizeString(section);

  if (!normalizedHubSlug || !normalizedPath) {
    return "";
  }

  const query = normalizedSection ? `?section=${encodeURIComponent(normalizedSection)}` : "";
  return `${normalizedPath}${query}`;
}

export function normalizeAdminReturnContext({ hubSlug, returnTo = "", returnSection = "" }) {
  const normalizedHubSlug = normalizeString(hubSlug);
  const normalizedReturnTo = normalizeString(returnTo);
  const normalizedReturnSection = normalizeString(returnSection);
  const fallbackPath = normalizedHubSlug ? `/${normalizedHubSlug}/admin/what-we-do` : "";

  if (!normalizedHubSlug || !normalizedReturnTo) {
    return {
      returnTo: "",
      returnSection: "",
      href: fallbackPath,
    };
  }

  if (
    normalizedReturnTo.includes("://") ||
    normalizedReturnTo.includes("//") ||
    !normalizedReturnTo.startsWith(`/${normalizedHubSlug}/admin/`)
  ) {
    return {
      returnTo: "",
      returnSection: "",
      href: fallbackPath,
    };
  }

  const allowedPaths = new Set([
    `/${normalizedHubSlug}/admin/settings/pages/home`,
    `/${normalizedHubSlug}/admin/what-we-do`,
  ]);
  const pathOnly = stripQueryAndHash(normalizedReturnTo);

  if (!allowedPaths.has(pathOnly)) {
    return {
      returnTo: "",
      returnSection: "",
      href: fallbackPath,
    };
  }

  const safeSection = normalizedReturnSection === "what-we-do" ? normalizedReturnSection : "";

  return {
    returnTo: pathOnly,
    returnSection: safeSection,
    href: buildAdminSectionReturnPath(normalizedHubSlug, pathOnly, safeSection),
  };
}

export function buildWhatWeDoHomeReturnContext(hubSlug) {
  const normalizedHubSlug = normalizeString(hubSlug);
  const returnTo = normalizedHubSlug ? `/${normalizedHubSlug}/admin/settings/pages/home` : "";
  return normalizeAdminReturnContext({
    hubSlug: normalizedHubSlug,
    returnTo,
    returnSection: "what-we-do",
  });
}
