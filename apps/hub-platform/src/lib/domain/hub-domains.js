import { getPlatformRootDomain } from "./custom-domain-runtime-config.js";

function normalizeString(value) {
  return String(value || "").trim();
}

function resolvePlatformSubdomainSource(value) {
  if (value && typeof value === "object") {
    return normalizeString(value.platformSubdomainLabel || value.slug || value.name);
  }

  return normalizeString(value);
}

function normalizeHostname(value) {
  return normalizeString(value)
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/[/?#].*$/, "")
    .replace(/:\d+$/, "")
    .replace(/\.+$/, "");
}

const customDomainStatusLabels = {
  not_configured: "Not configured",
  pending_verification: "Pending verification",
  verifying: "Verifying",
  connected: "Connected",
  verification_failed: "Verification failed",
  disconnect_scheduled: "Disconnect scheduled",
  disconnected: "Disconnected",
};

const customDomainStatusTones = {
  not_configured: "neutral",
  pending_verification: "warning",
  verifying: "warning",
  connected: "success",
  verification_failed: "danger",
  disconnect_scheduled: "warning",
  disconnected: "warning",
};

function normalizeCustomDomainStatus(value, fallback = "not_configured") {
  const normalized = normalizeString(value);

  if (Object.prototype.hasOwnProperty.call(customDomainStatusLabels, normalized)) {
    return normalized;
  }

  return fallback;
}

export function sanitizeStoredCustomDomainRecord(record = {}) {
  const hostname = normalizeHostname(record.hostname);
  const fallbackStatus = hostname ? "connected" : "not_configured";

  return {
    hostname,
    status: normalizeCustomDomainStatus(record.status, fallbackStatus),
    isPrimary: record.isPrimary !== false && Boolean(hostname),
    verificationMethod: normalizeString(record.verificationMethod),
    verificationHost: normalizeString(record.verificationHost),
    verificationTarget: normalizeString(record.verificationTarget),
    requestedAt: normalizeString(record.requestedAt),
    verifiedAt: normalizeString(record.verifiedAt),
    activationReadyAt: normalizeString(record.activationReadyAt),
    connectedAt: normalizeString(record.connectedAt),
    lastCheckedAt: normalizeString(record.lastCheckedAt),
    disconnectAt: normalizeString(record.disconnectAt),
    disconnectReason: normalizeString(record.disconnectReason),
    disconnectedAt: normalizeString(record.disconnectedAt),
    failureReason: normalizeString(record.failureReason),
    activationBlockedReason: normalizeString(record.activationBlockedReason),
    connectedByUserId: normalizeString(record.connectedByUserId),
    updatedByUserId: normalizeString(record.updatedByUserId),
  };
}

export function isPlatformManagedHostname(hostname) {
  const normalizedHostname = normalizeHostname(hostname);
  const rootDomain = getPlatformRootDomain();

  return Boolean(normalizedHostname) && (normalizedHostname === rootDomain || normalizedHostname.endsWith(`.${rootDomain}`));
}

function normalizeClientOwnedHostname(value) {
  const hostname = normalizeHostname(value);
  return hostname && !isPlatformManagedHostname(hostname) ? hostname : "";
}

export function assertValidCustomDomainHostname(hostname) {
  const normalizedHostname = normalizeHostname(hostname);

  if (!normalizedHostname) {
    throw new Error("Custom domain is required.");
  }

  if (!/^[a-z0-9.-]+$/.test(normalizedHostname) || !normalizedHostname.includes(".")) {
    throw new Error("Custom domain must be a valid hostname.");
  }

  if (normalizedHostname.startsWith(".") || normalizedHostname.endsWith(".") || normalizedHostname.includes("..")) {
    throw new Error("Custom domain must be a valid hostname.");
  }

  if (isPlatformManagedHostname(normalizedHostname)) {
    throw new Error("Custom domain must be a client-owned domain, not a platform-managed hostname.");
  }

  return normalizedHostname;
}

export function normalizePlatformSubdomainLabel(value) {
  return resolvePlatformSubdomainSource(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function buildPlatformSubdomainHost(hub) {
  const label = normalizePlatformSubdomainLabel(hub);
  const rootDomain = getPlatformRootDomain();

  if (!label) {
    return rootDomain;
  }

  return `${label}.${rootDomain}`;
}

export function buildPlatformHostedHubHref(hub) {
  return buildPlatformSubdomainHost(hub);
}

export function normalizeHubCustomDomain(hub = {}) {
  const legacyDomains = Array.isArray(hub.customDomains)
    ? hub.customDomains.map((value) => normalizeClientOwnedHostname(value)).filter(Boolean)
    : [];
  const storedDomain = sanitizeStoredCustomDomainRecord({
    ...(hub.customDomain || {}),
    hostname:
      normalizeClientOwnedHostname(hub?.customDomain?.hostname) ||
      normalizeClientOwnedHostname(hub.domain) ||
      legacyDomains[0],
  });
  const hostname =
    normalizeClientOwnedHostname(storedDomain.hostname) ||
    normalizeClientOwnedHostname(hub.domain) ||
    legacyDomains[0];
  const status = normalizeCustomDomainStatus(storedDomain.status, hostname ? "connected" : "not_configured");
  const platformSubdomainLabel = normalizePlatformSubdomainLabel(hub);
  const platformSubdomain = buildPlatformSubdomainHost(hub);
  const platformHostedHref = buildPlatformHostedHubHref(hub);
  const currentHost = status === "connected" && hostname ? hostname : platformSubdomain;
  const currentHostLabel = status === "connected" && hostname ? hostname : platformHostedHref;
  const customDomains = hostname
    ? Array.from(new Set([hostname, ...legacyDomains]))
    : legacyDomains;

  return {
    hostname,
    status,
    statusLabel: customDomainStatusLabels[status] || customDomainStatusLabels.not_configured,
    statusTone: customDomainStatusTones[status] || customDomainStatusTones.not_configured,
    isPrimary: storedDomain.isPrimary !== false && Boolean(hostname),
    verificationMethod: normalizeString(storedDomain.verificationMethod),
    verificationHost: normalizeString(storedDomain.verificationHost),
    verificationTarget: normalizeString(storedDomain.verificationTarget),
    requestedAt: normalizeString(storedDomain.requestedAt),
    verifiedAt: normalizeString(storedDomain.verifiedAt),
    activationReadyAt: normalizeString(storedDomain.activationReadyAt),
    connectedAt: normalizeString(storedDomain.connectedAt),
    lastCheckedAt: normalizeString(storedDomain.lastCheckedAt),
    disconnectAt: normalizeString(storedDomain.disconnectAt),
    disconnectReason: normalizeString(storedDomain.disconnectReason),
    disconnectedAt: normalizeString(storedDomain.disconnectedAt),
    failureReason: normalizeString(storedDomain.failureReason),
    activationBlockedReason: normalizeString(storedDomain.activationBlockedReason),
    connectedByUserId: normalizeString(storedDomain.connectedByUserId),
    updatedByUserId: normalizeString(storedDomain.updatedByUserId),
    isConfigured: Boolean(hostname),
    isConnected: status === "connected" && Boolean(hostname),
    isPending: status === "pending_verification" || status === "verifying",
    isVerificationFailed: status === "verification_failed",
    isReadyForActivation: status === "verifying" && Boolean(normalizeString(storedDomain.verifiedAt)),
    isDisconnectScheduled: status === "disconnect_scheduled",
    platformSubdomain,
    platformHostedHref,
    platformSubdomainLabel,
    currentHost,
    currentHostLabel,
    customDomains,
  };
}
