import { buildHubRuntimeHref } from "./hub-runtime-paths.js";

function normalizeString(value) {
  return String(value || "").trim();
}

export const publicInternalActionOptions = [
  { value: "join", label: "Join" },
  { value: "sign_in", label: "Sign in" },
  { value: "events", label: "Events" },
  { value: "courses", label: "Courses" },
];

const destinationPathMap = {
  join: "join",
  sign_in: "sign-in",
  events: "events",
  courses: "courses",
  announcements: "announcements",
  about: "about",
  account: "account",
};

export function resolvePublicInternalActionHref(hubSlug, destination, routeMode = "path") {
  const normalizedHubSlug = normalizeString(hubSlug);
  const normalizedDestination = normalizeString(destination);
  const path = destinationPathMap[normalizedDestination];

  if (!normalizedHubSlug || !path) {
    return "";
  }

  return buildHubRuntimeHref(normalizedHubSlug, `/${path}`, routeMode);
}

export function inferPublicInternalDestination(hubSlug, href) {
  const normalizedHubSlug = normalizeString(hubSlug);
  const normalizedHref = normalizeString(href);

  if (!normalizedHref) {
    return "";
  }

  const candidatePaths = [
    normalizedHref,
    normalizedHref.startsWith(`/${normalizedHubSlug}/`) ? normalizedHref.slice(normalizedHubSlug.length + 1) : "",
  ].filter(Boolean);

  for (const [destination, path] of Object.entries(destinationPathMap)) {
    if (candidatePaths.includes(`/${path}`) || candidatePaths.includes(path)) {
      return destination;
    }
  }

  return "";
}
