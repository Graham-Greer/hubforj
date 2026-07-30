import { getPlatformRootDomain } from "./custom-domain-runtime-config.js";

function normalizeString(value) {
  return String(value || "").trim();
}

function getPrimaryForwardedHost(value) {
  return normalizeString(value)
    .split(",")
    .map((entry) => normalizeString(entry))
    .filter(Boolean)[0] || "";
}

function normalizeHost(value) {
  return normalizeString(value).toLowerCase().replace(/:\d+$/, "");
}

export function getRequestHostFromHeaders(headers) {
  return normalizeHost(getPrimaryForwardedHost(headers.get("x-forwarded-host") || headers.get("host")));
}

export function getRequestHostWithPortFromHeaders(headers) {
  return getPrimaryForwardedHost(headers.get("x-forwarded-host") || headers.get("host")).toLowerCase();
}

export function resolveHubHostContext(hostname) {
  const normalizedHost = normalizeHost(hostname);
  const platformRootDomain = getPlatformRootDomain();
  const isLocalPlatformRoot = normalizedHost === "localhost" || normalizedHost === "127.0.0.1" || normalizedHost === "[::1]";

  if (!normalizedHost) {
    return {
      kind: "unknown",
      host: "",
      hubSlug: "",
      subdomainLabel: "",
      platformRootDomain,
    };
  }

  if (normalizedHost === platformRootDomain || isLocalPlatformRoot) {
    return {
      kind: "platform_root",
      host: normalizedHost,
      hubSlug: "",
      subdomainLabel: "",
      platformRootDomain,
    };
  }

  if (normalizedHost.endsWith(`.${platformRootDomain}`)) {
    const subdomainLabel = normalizedHost.slice(0, -1 * `.${platformRootDomain}`.length);
    return {
      kind: "platform_root",
      host: normalizedHost,
      hubSlug: "",
      subdomainLabel,
      platformRootDomain,
    };
  }

  if (normalizedHost.endsWith(".localhost")) {
    const subdomainLabel = normalizedHost.slice(0, -1 * ".localhost".length);
    return {
      kind: subdomainLabel ? "local_subdomain" : "platform_root",
      host: normalizedHost,
      hubSlug: "",
      subdomainLabel,
      platformRootDomain,
    };
  }

  return {
    kind: "custom_domain_candidate",
    host: normalizedHost,
    hubSlug: "",
    subdomainLabel: "",
    platformRootDomain,
  };
}

export function resolveHubRuntimeRouteMode(hostname) {
  const hostContext = resolveHubHostContext(hostname);

  return hostContext.kind === "platform_subdomain" ||
    hostContext.kind === "local_subdomain" ||
    hostContext.kind === "custom_domain_candidate"
    ? "host"
    : "path";
}

export function isStaticOrApiPath(pathname) {
  const normalizedPath = normalizeString(pathname);

  return (
    normalizedPath.startsWith("/api") ||
    normalizedPath.startsWith("/_next") ||
    normalizedPath.startsWith("/assets") ||
    normalizedPath === "/favicon.ico" ||
    /\.[a-z0-9]+$/i.test(normalizedPath)
  );
}
