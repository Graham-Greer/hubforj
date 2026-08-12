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

function isIpv4Hostname(value) {
  const parts = normalizeString(value).split(".");

  if (parts.length !== 4) {
    return false;
  }

  return parts.every((part) => {
    if (!/^\d+$/.test(part)) {
      return false;
    }

    const number = Number(part);
    return Number.isInteger(number) && number >= 0 && number <= 255;
  });
}

function isBlockedInternalHostname(value) {
  const hostname = normalizeHostname(value);
  const labels = hostname.split(".").filter(Boolean);
  const tld = labels[labels.length - 1] || "";

  return (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".lan") ||
    tld === "localhost" ||
    tld === "local" ||
    tld === "internal" ||
    tld === "lan"
  );
}

function assertValidHostnameLabels(hostname) {
  const labels = normalizeString(hostname).split(".").filter(Boolean);

  if (labels.length < 2) {
    throw new Error("Custom domain must be a valid hostname.");
  }

  if (hostname.length > 253) {
    throw new Error("Custom domain must be a valid hostname.");
  }

  labels.forEach((label) => {
    if (label.length > 63 || label.startsWith("-") || label.endsWith("-")) {
      throw new Error("Custom domain must be a valid hostname.");
    }
  });
}

const customDomainStatusLabels = {
  not_configured: "Not configured",
  pending_verification: "Pending verification",
  verified: "Verified",
  verifying: "Verifying",
  provisioning: "Provisioning",
  provisioning_failed: "Provisioning failed",
  certificate_pending: "Certificate pending",
  activation_ready: "Ready to connect",
  connected: "Connected",
  verification_failed: "Verification failed",
  disconnect_scheduled: "Disconnect scheduled",
  disconnecting: "Disconnecting",
  disconnect_failed: "Disconnect failed",
  disconnected: "Disconnected",
};

const customDomainStatusTones = {
  not_configured: "neutral",
  pending_verification: "warning",
  verified: "warning",
  verifying: "warning",
  provisioning: "warning",
  provisioning_failed: "danger",
  certificate_pending: "warning",
  activation_ready: "warning",
  connected: "success",
  verification_failed: "danger",
  disconnect_scheduled: "warning",
  disconnecting: "warning",
  disconnect_failed: "danger",
  disconnected: "warning",
};

const lifecyclePhaseByStatus = {
  not_configured: "not_configured",
  pending_verification: "ownership_pending",
  verification_failed: "ownership_failed",
  verified: "ownership_verified",
  verifying: "ownership_verified",
  provisioning: "provisioning",
  provisioning_failed: "provisioning_failed",
  certificate_pending: "certificate_pending",
  activation_ready: "activation_ready",
  connected: "connected",
  disconnect_scheduled: "disconnect_pending",
  disconnecting: "disconnect_pending",
  disconnect_failed: "disconnect_failed",
  disconnected: "disconnected",
};

function normalizeCustomDomainStatus(value, fallback = "not_configured") {
  const normalized = normalizeString(value);

  if (Object.prototype.hasOwnProperty.call(customDomainStatusLabels, normalized)) {
    return normalized;
  }

  return fallback;
}

export function resolveCustomDomainLifecyclePhase(status) {
  const normalizedStatus = normalizeCustomDomainStatus(status);
  return lifecyclePhaseByStatus[normalizedStatus] || lifecyclePhaseByStatus.not_configured;
}

export function sanitizeStoredCustomDomainRecord(record = {}) {
  const hostname = normalizeHostname(record.hostname);
  const fallbackStatus = hostname ? "connected" : "not_configured";

  return {
    hostname,
    status: normalizeCustomDomainStatus(record.status, fallbackStatus),
    lifecyclePhase: resolveCustomDomainLifecyclePhase(record.status || fallbackStatus),
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
    dnsRoutingStatus: normalizeString(record.dnsRoutingStatus),
    dnsRoutingLastCheckedAt: normalizeString(record.dnsRoutingLastCheckedAt),
    dnsRoutingFailureReason: normalizeString(record.dnsRoutingFailureReason),
    dnsRoutingRecordType: normalizeString(record.dnsRoutingRecordType),
    dnsRoutingRecordName: normalizeString(record.dnsRoutingRecordName),
    dnsRoutingRecordValue: normalizeString(record.dnsRoutingRecordValue),
    dnsRoutingRecordValues: Array.isArray(record.dnsRoutingRecordValues)
      ? record.dnsRoutingRecordValues.map((value) => normalizeString(value)).filter(Boolean)
      : [],
    dnsRoutingRecordTtl: normalizeString(record.dnsRoutingRecordTtl),
    vercelProjectId: normalizeString(record.vercelProjectId),
    vercelDomainId: normalizeString(record.vercelDomainId),
    vercelDomainAddedAt: normalizeString(record.vercelDomainAddedAt),
    vercelVerificationStatus: normalizeString(record.vercelVerificationStatus),
    vercelVerificationLastCheckedAt: normalizeString(record.vercelVerificationLastCheckedAt),
    certificateStatus: normalizeString(record.certificateStatus),
    certificateLastCheckedAt: normalizeString(record.certificateLastCheckedAt),
    lastLifecycleRunAt: normalizeString(record.lastLifecycleRunAt),
    lastLifecycleError: normalizeString(record.lastLifecycleError),
    schemaVersion: Number.isFinite(Number(record.schemaVersion)) ? Number(record.schemaVersion) : 1,
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

  if (normalizedHostname.startsWith("*.")) {
    throw new Error("Wildcard custom domains are not supported.");
  }

  if (!/^[a-z0-9.-]+$/.test(normalizedHostname) || !normalizedHostname.includes(".")) {
    throw new Error("Custom domain must be a valid hostname.");
  }

  if (normalizedHostname.startsWith(".") || normalizedHostname.endsWith(".") || normalizedHostname.includes("..")) {
    throw new Error("Custom domain must be a valid hostname.");
  }

  assertValidHostnameLabels(normalizedHostname);

  if (isIpv4Hostname(normalizedHostname) || isBlockedInternalHostname(normalizedHostname)) {
    throw new Error("Custom domain must be a public client-owned hostname.");
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
    lifecyclePhase: resolveCustomDomainLifecyclePhase(status),
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
    dnsRoutingStatus: normalizeString(storedDomain.dnsRoutingStatus),
    dnsRoutingLastCheckedAt: normalizeString(storedDomain.dnsRoutingLastCheckedAt),
    dnsRoutingFailureReason: normalizeString(storedDomain.dnsRoutingFailureReason),
    dnsRoutingRecordType: normalizeString(storedDomain.dnsRoutingRecordType),
    dnsRoutingRecordName: normalizeString(storedDomain.dnsRoutingRecordName),
    dnsRoutingRecordValue: normalizeString(storedDomain.dnsRoutingRecordValue),
    dnsRoutingRecordValues: Array.isArray(storedDomain.dnsRoutingRecordValues)
      ? storedDomain.dnsRoutingRecordValues.map((value) => normalizeString(value)).filter(Boolean)
      : [],
    dnsRoutingRecordTtl: normalizeString(storedDomain.dnsRoutingRecordTtl),
    vercelProjectId: normalizeString(storedDomain.vercelProjectId),
    vercelDomainId: normalizeString(storedDomain.vercelDomainId),
    vercelDomainAddedAt: normalizeString(storedDomain.vercelDomainAddedAt),
    vercelVerificationStatus: normalizeString(storedDomain.vercelVerificationStatus),
    vercelVerificationLastCheckedAt: normalizeString(storedDomain.vercelVerificationLastCheckedAt),
    certificateStatus: normalizeString(storedDomain.certificateStatus),
    certificateLastCheckedAt: normalizeString(storedDomain.certificateLastCheckedAt),
    lastLifecycleRunAt: normalizeString(storedDomain.lastLifecycleRunAt),
    lastLifecycleError: normalizeString(storedDomain.lastLifecycleError),
    schemaVersion: storedDomain.schemaVersion,
    connectedByUserId: normalizeString(storedDomain.connectedByUserId),
    updatedByUserId: normalizeString(storedDomain.updatedByUserId),
    isConfigured: Boolean(hostname),
    isConnected: status === "connected" && Boolean(hostname),
    isPending: status === "pending_verification" || status === "verifying",
    isVerificationFailed: status === "verification_failed",
    isReadyForActivation:
      (status === "verifying" || status === "activation_ready") && Boolean(normalizeString(storedDomain.verifiedAt)),
    isDisconnectScheduled: status === "disconnect_scheduled",
    platformSubdomain,
    platformHostedHref,
    platformSubdomainLabel,
    currentHost,
    currentHostLabel,
    customDomains,
  };
}
