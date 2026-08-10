try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit/source tests.
}

import { getCustomDomainVercelConfig } from "@/lib/domain/custom-domain-vercel-config";
import {
  addVercelProjectDomain,
  classifyVercelDomainError,
  getVercelDomainConfig,
  getVercelProjectDomain,
} from "@/lib/server/vercel-domains";

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeBoolean(value) {
  return value === true;
}

function resolveDnsRoutingStatus(domainConfig) {
  if (!domainConfig) {
    return "not_checked";
  }

  if (normalizeBoolean(domainConfig.misconfigured)) {
    return "misconfigured";
  }

  if (normalizeString(domainConfig.configuredBy) || normalizeBoolean(domainConfig.verified)) {
    return "ready";
  }

  return "pending";
}

function resolveVercelVerificationStatus(domainStatus) {
  if (!domainStatus) {
    return "not_checked";
  }

  return domainStatus.verified ? "verified" : "pending";
}

function buildProvisioningBase(config, now) {
  return {
    vercelEnabled: config.enabled,
    vercelProjectId: config.projectId,
    vercelDomainId: "",
    vercelDomainAddedAt: "",
    vercelVerificationStatus: "not_checked",
    vercelVerificationLastCheckedAt: "",
    dnsRoutingStatus: "not_checked",
    dnsRoutingLastCheckedAt: "",
    dnsRoutingFailureReason: "",
    certificateStatus: "",
    certificateLastCheckedAt: "",
    lastLifecycleRunAt: now,
    lastLifecycleError: "",
  };
}

function buildReadinessBase(config, now) {
  return {
    vercelEnabled: config.enabled,
    vercelProjectId: config.projectId,
    vercelDomainId: "",
    vercelVerificationStatus: "not_checked",
    vercelVerificationLastCheckedAt: now,
    dnsRoutingStatus: "not_checked",
    dnsRoutingLastCheckedAt: now,
    dnsRoutingFailureReason: "",
    certificateStatus: "",
    certificateLastCheckedAt: now,
    lastLifecycleRunAt: now,
    lastLifecycleError: "",
  };
}

async function addOrConfirmProjectDomain(hostname) {
  try {
    return await addVercelProjectDomain(hostname);
  } catch (error) {
    const classification = classifyVercelDomainError(error);

    if (classification.category !== "conflict") {
      throw error;
    }

    try {
      return await getVercelProjectDomain(hostname);
    } catch {
      throw error;
    }
  }
}

export async function checkCustomDomainVercelReadiness(hostname, { now = new Date().toISOString() } = {}) {
  const normalizedHostname = normalizeString(hostname).toLowerCase();
  const config = getCustomDomainVercelConfig();
  const base = buildReadinessBase(config, now);

  if (!config.enabled) {
    return {
      ok: true,
      skipped: true,
      externalReady: false,
      ...base,
      lastLifecycleError: config.projectId
        ? "Vercel custom-domain automation is configured but not enabled."
        : "Vercel custom-domain automation is not configured.",
    };
  }

  try {
    const domainStatus = await getVercelProjectDomain(normalizedHostname);
    const domainConfig = await getVercelDomainConfig(normalizedHostname);
    const dnsRoutingStatus = resolveDnsRoutingStatus(domainConfig);
    const vercelVerificationStatus = resolveVercelVerificationStatus(domainStatus);
    const certificateStatus = domainStatus.verified && dnsRoutingStatus === "ready" ? "ready" : "pending";

    return {
      ok: true,
      skipped: false,
      externalReady:
        vercelVerificationStatus === "verified" &&
        dnsRoutingStatus === "ready" &&
        certificateStatus === "ready",
      ...base,
      vercelDomainId: normalizeString(domainStatus.id || domainStatus.name),
      vercelVerificationStatus,
      dnsRoutingStatus,
      dnsRoutingFailureReason: normalizeBoolean(domainConfig?.misconfigured)
        ? "DNS records are not pointing to Vercel yet."
        : "",
      certificateStatus,
    };
  } catch (error) {
    const classification = classifyVercelDomainError(error);

    return {
      ok: false,
      skipped: false,
      externalReady: false,
      ...base,
      vercelVerificationStatus: "failed",
      dnsRoutingStatus: "not_checked",
      certificateStatus: "pending",
      failureReason: classification.message,
      lastLifecycleError: classification.message,
      providerErrorCategory: classification.category,
      providerErrorRetryable: classification.retryable,
    };
  }
}

export async function provisionCustomDomainWithVercel(hostname, { now = new Date().toISOString() } = {}) {
  const normalizedHostname = normalizeString(hostname).toLowerCase();
  const config = getCustomDomainVercelConfig();
  const base = buildProvisioningBase(config, now);

  if (!config.enabled) {
    return {
      ok: true,
      skipped: true,
      status: "pending_verification",
      ...base,
      vercelProjectId: config.projectId,
      lastLifecycleError: config.projectId
        ? "Vercel custom-domain automation is configured but not enabled."
        : "Vercel custom-domain automation is not configured.",
    };
  }

  try {
    const domainStatus = await addOrConfirmProjectDomain(normalizedHostname);
    const domainConfig = await getVercelDomainConfig(normalizedHostname);

    return {
      ok: true,
      skipped: false,
      status: "pending_verification",
      ...base,
      vercelDomainId: normalizeString(domainStatus.id || domainStatus.name),
      vercelDomainAddedAt: domainStatus.createdAt || now,
      vercelVerificationStatus: resolveVercelVerificationStatus(domainStatus),
      vercelVerificationLastCheckedAt: now,
      dnsRoutingStatus: resolveDnsRoutingStatus(domainConfig),
      dnsRoutingLastCheckedAt: now,
      dnsRoutingFailureReason: normalizeBoolean(domainConfig?.misconfigured)
        ? "DNS records are not pointing to Vercel yet."
        : "",
      certificateStatus: domainStatus.verified ? "ready" : "pending",
      certificateLastCheckedAt: now,
    };
  } catch (error) {
    const classification = classifyVercelDomainError(error);

    return {
      ok: false,
      skipped: false,
      status: "provisioning_failed",
      ...base,
      vercelVerificationStatus: "failed",
      vercelVerificationLastCheckedAt: now,
      dnsRoutingStatus: "not_checked",
      failureReason: classification.message,
      lastLifecycleError: classification.message,
      providerErrorCategory: classification.category,
      providerErrorRetryable: classification.retryable,
    };
  }
}
