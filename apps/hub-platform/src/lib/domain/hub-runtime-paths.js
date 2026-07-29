function normalizeString(value) {
  return String(value || "").trim();
}

function normalizePathname(value) {
  const normalizedValue = normalizeString(value);

  if (!normalizedValue || normalizedValue === "/") {
    return "/";
  }

  return normalizedValue.startsWith("/") ? normalizedValue : `/${normalizedValue}`;
}

export function normalizeHubRouteMode(value) {
  return normalizeString(value) === "host" ? "host" : "path";
}

export function buildHubRuntimeHref(hubSlug, pathname = "/", routeMode = "path") {
  const normalizedHubSlug = normalizeString(hubSlug);
  const normalizedPathname = normalizePathname(pathname);
  const normalizedRouteMode = normalizeHubRouteMode(routeMode);

  if (!normalizedHubSlug) {
    return normalizedRouteMode === "host" ? normalizedPathname : "/";
  }

  if (normalizedRouteMode === "host") {
    return normalizedPathname;
  }

  return normalizedPathname === "/"
    ? `/${normalizedHubSlug}`
    : `/${normalizedHubSlug}${normalizedPathname}`;
}
