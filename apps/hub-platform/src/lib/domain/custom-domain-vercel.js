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
  removeVercelProjectDomain,
} from "@/lib/server/vercel-domains";

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeBoolean(value) {
  return value === true;
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => normalizeList(item))
      .map((item) => normalizeString(item))
      .filter(Boolean);
  }

  if (value && typeof value === "object" && Object.prototype.hasOwnProperty.call(value, "value")) {
    return normalizeList(value.value);
  }

  return normalizeString(value) ? [normalizeString(value)] : [];
}

const knownTwoPartPublicSuffixes = new Set([
  "co.uk",
  "org.uk",
  "ac.uk",
  "gov.uk",
  "com.au",
  "net.au",
  "org.au",
  "co.nz",
  "com.br",
  "com.mx",
  "co.za",
]);

function getRegisteredDomainLabelCount(hostname) {
  const labels = normalizeString(hostname).toLowerCase().split(".").filter(Boolean);
  const lastTwo = labels.slice(-2).join(".");

  return knownTwoPartPublicSuffixes.has(lastTwo) ? 3 : 2;
}

function isLikelyApexHostname(hostname) {
  const labels = normalizeString(hostname).toLowerCase().split(".").filter(Boolean);

  return labels.length <= getRegisteredDomainLabelCount(hostname);
}

function getDnsRecordName(hostname) {
  const labels = normalizeString(hostname).toLowerCase().split(".").filter(Boolean);
  const registeredLabelCount = getRegisteredDomainLabelCount(hostname);

  if (labels.length <= registeredLabelCount) {
    return "@";
  }

  return labels.slice(0, labels.length - registeredLabelCount).join(".");
}

function getFirstRecommendedValues(entries) {
  const candidates = Array.isArray(entries) ? entries : [];

  for (const item of candidates) {
    const values = normalizeList(item?.value || item);

    if (values.length) {
      return values;
    }
  }

  return [];
}

function resolveRoutingInstruction(hostname, domainConfig) {
  const configuredBy = normalizeString(domainConfig?.configuredBy).toUpperCase();
  const aValues = normalizeList(domainConfig?.aValues);
  const cnameValues = normalizeList(domainConfig?.cnames);
  const recommendedAValues = getFirstRecommendedValues(domainConfig?.recommendedIPv4);
  const recommendedCnameValues = getFirstRecommendedValues(domainConfig?.recommendedCNAME);
  const recordName = getDnsRecordName(hostname);
  const useARecord =
    configuredBy === "A" ||
    (!configuredBy && isLikelyApexHostname(hostname)) ||
    (!configuredBy && !recommendedCnameValues.length && Boolean(recommendedAValues.length || aValues.length));
  const type = useARecord ? "A" : "CNAME";
  const values = useARecord
    ? aValues.length
      ? aValues
      : recommendedAValues
    : cnameValues.length
      ? cnameValues
      : recommendedCnameValues;

  return {
    dnsRoutingRecordType: type,
    dnsRoutingRecordName: recordName,
    dnsRoutingRecordValue: values[0] || "",
    dnsRoutingRecordValues: values,
    dnsRoutingRecordTtl: "Auto/default",
  };
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
    const routingInstruction = resolveRoutingInstruction(normalizedHostname, domainConfig);

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
      ...routingInstruction,
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

export async function removeCustomDomainFromVercel(hostname, { now = new Date().toISOString() } = {}) {
  const normalizedHostname = normalizeString(hostname).toLowerCase();
  const config = getCustomDomainVercelConfig();

  if (!config.enabled) {
    return {
      ok: true,
      skipped: true,
      removed: false,
      vercelProjectId: config.projectId,
      removedAt: "",
      lastLifecycleRunAt: now,
      lastLifecycleError: config.projectId
        ? "Vercel custom-domain automation is configured but not enabled."
        : "Vercel custom-domain automation is not configured.",
    };
  }

  try {
    await removeVercelProjectDomain(normalizedHostname);

    return {
      ok: true,
      skipped: false,
      removed: true,
      vercelProjectId: config.projectId,
      removedAt: now,
      lastLifecycleRunAt: now,
      lastLifecycleError: "",
    };
  } catch (error) {
    const classification = classifyVercelDomainError(error);

    if (classification.category === "not_found") {
      return {
        ok: true,
        skipped: false,
        removed: true,
        vercelProjectId: config.projectId,
        removedAt: now,
        lastLifecycleRunAt: now,
        lastLifecycleError: "",
      };
    }

    return {
      ok: false,
      skipped: false,
      removed: false,
      vercelProjectId: config.projectId,
      removedAt: "",
      lastLifecycleRunAt: now,
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
    const routingInstruction = resolveRoutingInstruction(normalizedHostname, domainConfig);

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
      ...routingInstruction,
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
