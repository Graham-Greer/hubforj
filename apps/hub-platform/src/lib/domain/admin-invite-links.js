import { buildHubRuntimeHref } from "./hub-runtime-paths.js";
import { buildPlatformSubdomainHost } from "./hub-domains.js";

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeHostname(value) {
  return normalizeString(value)
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/[/?#].*$/, "")
    .replace(/:\d+$/, "")
    .replace(/\.+$/, "");
}

function normalizePort(value) {
  const normalized = normalizeString(value).replace(/^:/, "");
  return normalized ? `:${normalized}` : "";
}

function resolveConfiguredBaseUrl(options = {}) {
  return normalizeString(options.hubPlatformBaseUrl || options.productSiteBaseUrl || "");
}

function isLocalHostname(hostname) {
  const normalized = normalizeHostname(hostname);
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "[::1]" ||
    normalized.endsWith(".localhost")
  );
}

function resolveInviteRuntimeMode(hub = {}, options = {}) {
  const connectedCustomDomain =
    normalizeString(hub?.customDomain?.status) === "connected"
      ? normalizeHostname(hub?.customDomain?.hostname)
      : "";

  if (connectedCustomDomain) {
    return "host";
  }

  const configuredBaseUrl = resolveConfiguredBaseUrl(options);
  if (configuredBaseUrl) {
    const baseUrl = new URL(configuredBaseUrl);
    if (isLocalHostname(baseUrl.hostname)) {
      return "path";
    }
  }

  if (process.env.NODE_ENV !== "production") {
    return "path";
  }

  return "host";
}

function resolveInviteHost(hub = {}, options = {}) {
  const connectedCustomDomain =
    normalizeString(hub?.customDomain?.status) === "connected"
      ? normalizeHostname(hub?.customDomain?.hostname)
      : "";

  if (connectedCustomDomain) {
    return connectedCustomDomain;
  }

  const configuredBaseUrl = resolveConfiguredBaseUrl(options);
  if (configuredBaseUrl) {
    const baseUrl = new URL(configuredBaseUrl);
    if (isLocalHostname(baseUrl.hostname)) {
      return normalizeHostname(baseUrl.hostname) || "localhost";
    }

    return buildPlatformSubdomainHost(hub);
  }

  if (process.env.NODE_ENV !== "production") {
    return "localhost";
  }

  return buildPlatformSubdomainHost(hub);
}

export function resolveHubAdminInviteOrigin(hub, options = {}) {
  const host = resolveInviteHost(hub, options);
  const configuredBaseUrl = resolveConfiguredBaseUrl(options);
  const runtimeMode = resolveInviteRuntimeMode(hub, options);

  if (!host) {
    return "";
  }

  if (configuredBaseUrl) {
    const baseUrl = new URL(configuredBaseUrl);
    return runtimeMode === "path"
      ? `${baseUrl.protocol}//${host}${normalizePort(baseUrl.port)}`
      : `${baseUrl.protocol}//${host}`;
  }

  if (runtimeMode === "path") {
    return `http://${host}:3000`;
  }

  return process.env.NODE_ENV !== "production" ? `http://${host}` : `https://${host}`;
}

export function buildHubAdminInviteAcceptUrl(hub, token, options = {}) {
  const origin = resolveHubAdminInviteOrigin(hub, options);
  const normalizedToken = normalizeString(token);
  const runtimeMode = resolveInviteRuntimeMode(hub, options);

  if (!origin || !normalizeString(hub?.slug) || !normalizedToken) {
    return "";
  }

  const invitePath = buildHubRuntimeHref(hub.slug, `/join?invite=${encodeURIComponent(normalizedToken)}`, runtimeMode);
  return new URL(invitePath, origin).toString();
}
