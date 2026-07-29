import { buildHubRuntimeHref, normalizeHubRouteMode } from "@/lib/domain/hub-runtime-paths";

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeHostModeReturnPath(hubSlug, nextPath) {
  const normalizedHubSlug = normalizeString(hubSlug);
  const normalizedNextPath = normalizeString(nextPath);

  if (!normalizedNextPath.startsWith("/")) {
    return "";
  }

  const hubRoot = `/${normalizedHubSlug}`;

  if (normalizedHubSlug && (normalizedNextPath === hubRoot || normalizedNextPath.startsWith(`${hubRoot}/`))) {
    return normalizedNextPath === hubRoot ? "/" : normalizedNextPath.slice(hubRoot.length) || "/";
  }

  return normalizedNextPath;
}

export function sanitizeHubReturnPath(hubSlug, nextPath = "", routeMode = "path") {
  const normalizedHubSlug = normalizeString(hubSlug);
  const normalizedRouteMode = normalizeHubRouteMode(routeMode);
  const normalizedNextPath =
    normalizedRouteMode === "host"
      ? normalizeHostModeReturnPath(normalizedHubSlug, nextPath)
      : normalizeString(nextPath);

  if (!normalizedHubSlug || !normalizedNextPath.startsWith("/")) {
    return "";
  }

  if (normalizedRouteMode !== "host") {
    const hubRoot = `/${normalizedHubSlug}`;

    if (normalizedNextPath !== hubRoot && !normalizedNextPath.startsWith(`${hubRoot}/`)) {
      return "";
    }
  }

  const joinPath = buildHubRuntimeHref(normalizedHubSlug, "/join", normalizedRouteMode);
  const signInPath = buildHubRuntimeHref(normalizedHubSlug, "/sign-in", normalizedRouteMode);

  if (
    normalizedNextPath === joinPath ||
    normalizedNextPath.startsWith(`${joinPath}?`) ||
    normalizedNextPath === signInPath ||
    normalizedNextPath.startsWith(`${signInPath}?`) ||
    normalizedNextPath.startsWith("/platform")
  ) {
    return "";
  }

  return normalizedNextPath;
}

function getRoleDefaultPath(hubSlug, role, routeMode = "path") {
  const normalizedHubSlug = normalizeString(hubSlug);
  return role === "admin" || role === "owner"
    ? buildHubRuntimeHref(normalizedHubSlug, "/admin", routeMode)
    : buildHubRuntimeHref(normalizedHubSlug, "/account", routeMode);
}

function isMemberOnlyPath(hubSlug, nextPath, routeMode = "path") {
  const normalizedHubSlug = normalizeString(hubSlug);
  const normalizedNextPath = normalizeString(nextPath);

  if (!normalizedHubSlug || !normalizedNextPath) {
    return false;
  }

  const memberRoot = buildHubRuntimeHref(normalizedHubSlug, "/account", routeMode);
  const eventPrefix = buildHubRuntimeHref(normalizedHubSlug, "/events", routeMode);
  const coursePrefix = buildHubRuntimeHref(normalizedHubSlug, "/courses", routeMode);
  const eventNextStepsPattern = new RegExp(`^${eventPrefix}/[^/]+/booking/next-steps(?:\\?.*)?$`);
  const courseNextStepsPattern = new RegExp(`^${coursePrefix}/[^/]+/enrolment/next-steps(?:\\?.*)?$`);

  return (
    normalizedNextPath.startsWith(memberRoot) ||
    eventNextStepsPattern.test(normalizedNextPath) ||
    courseNextStepsPattern.test(normalizedNextPath)
  );
}

export function buildHubAuthHref(hubSlug, route, nextPath = "", routeMode = "path") {
  const normalizedHubSlug = normalizeString(hubSlug);
  const normalizedRoute = normalizeString(route);
  const normalizedRouteMode = normalizeHubRouteMode(routeMode);
  const sanitizedNextPath = sanitizeHubReturnPath(normalizedHubSlug, nextPath, normalizedRouteMode);

  if (!normalizedHubSlug || !normalizedRoute) {
    return "/";
  }

  const href = buildHubRuntimeHref(normalizedHubSlug, `/${normalizedRoute}`, normalizedRouteMode);

  if (!sanitizedNextPath) {
    return href;
  }

  return `${href}?next=${encodeURIComponent(sanitizedNextPath)}`;
}

export function resolveHubAuthRedirect(hubSlug, role, nextPath = "", routeMode = "path") {
  const normalizedHubSlug = normalizeString(hubSlug);
  const normalizedRole = normalizeString(role);
  const normalizedRouteMode = normalizeHubRouteMode(routeMode);
  const normalizedNextPath = sanitizeHubReturnPath(normalizedHubSlug, nextPath, normalizedRouteMode);
  const defaultPath = getRoleDefaultPath(normalizedHubSlug, normalizedRole, normalizedRouteMode);

  if (!normalizedHubSlug || !normalizedNextPath) {
    return defaultPath;
  }

  const adminRoot = buildHubRuntimeHref(normalizedHubSlug, "/admin", normalizedRouteMode);

  if ((normalizedRole === "admin" || normalizedRole === "owner") && isMemberOnlyPath(normalizedHubSlug, normalizedNextPath, normalizedRouteMode)) {
    return defaultPath;
  }

  if (normalizedRole === "member" && normalizedNextPath.startsWith(adminRoot)) {
    return defaultPath;
  }

  return normalizedNextPath;
}
