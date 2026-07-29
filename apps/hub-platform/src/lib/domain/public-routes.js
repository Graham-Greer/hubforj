import { resolveSiteSettingsCapabilities } from "./site-settings-capabilities.js";
import { buildHubRuntimeHref } from "./hub-runtime-paths.js";

function normalizeString(value) {
  return String(value || "").trim();
}

function createRoute(hubSlug, key, label, path, enabled = true, nav = true, routeMode = "path") {
  return {
    key,
    label,
    href: buildHubRuntimeHref(hubSlug, path || "/", routeMode),
    enabled,
    nav,
  };
}

export function resolvePublicRoutes(hub, capabilities = resolveSiteSettingsCapabilities(hub), routeMode = "path") {
  const hubSlug = normalizeString(hub?.slug);

  return [
    createRoute(hubSlug, "home", "Home", "", true, true, routeMode),
    createRoute(hubSlug, "events", "Events", "/events", capabilities.eventsEnabled, true, routeMode),
    createRoute(hubSlug, "courses", "Courses", "/courses", capabilities.coursesEnabled, true, routeMode),
    createRoute(hubSlug, "testimonials", "Testimonials", "/testimonials", capabilities.testimonialsEnabled, true, routeMode),
    createRoute(hubSlug, "join", "Join", "/join", true, false, routeMode),
    createRoute(hubSlug, "signIn", "Member sign in", "/sign-in", true, false, routeMode),
  ].filter((route) => route.enabled);
}

export function resolvePublicHeaderNav(hub, capabilities = resolveSiteSettingsCapabilities(hub), routeMode = "path") {
  return resolvePublicRoutes(hub, capabilities, routeMode)
    .filter((route) => route.nav)
    .map(({ label, href }) => ({ label, href }));
}
