try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { assertCustomDomainVercelConfigured } from "@/lib/domain/custom-domain-vercel-config";

const VERCEL_API_BASE_URL = "https://api.vercel.com";

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

function buildAbortSignal(timeoutMs) {
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(timeoutMs);
  }

  return undefined;
}

function buildProjectUrl(pathname, config) {
  const url = new URL(pathname, VERCEL_API_BASE_URL);

  if (config.teamId) {
    url.searchParams.set("teamId", config.teamId);
  }

  return url;
}

function normalizeVercelErrorPayload(payload, fallbackStatusText = "") {
  const error = payload?.error || payload;
  const message = normalizeString(error?.message || payload?.message || fallbackStatusText || "Vercel request failed.");
  const code = normalizeString(error?.code || payload?.code);

  return {
    message,
    code,
  };
}

function normalizeVercelErrorCode(value) {
  return normalizeString(value).toLowerCase();
}

export function classifyVercelDomainError(error) {
  const status = Number.isFinite(Number(error?.status)) ? Number(error.status) : 500;
  const code = normalizeVercelErrorCode(error?.code);
  const message = normalizeString(error?.message);
  const lowerMessage = message.toLowerCase();

  if (status === 401 || status === 403) {
    return {
      status,
      code,
      retryable: false,
      category: "authorization",
      message: "Vercel rejected the custom-domain automation credentials.",
    };
  }

  if (status === 404) {
    return {
      status,
      code,
      retryable: false,
      category: "not_found",
      message: "Vercel could not find the configured project or domain.",
    };
  }

  if (status === 409 || code.includes("conflict") || lowerMessage.includes("already exists")) {
    return {
      status,
      code,
      retryable: false,
      category: "conflict",
      message: "This domain is already attached to a Vercel project.",
    };
  }

  if (status === 400 || lowerMessage.includes("invalid")) {
    return {
      status,
      code,
      retryable: false,
      category: "invalid_request",
      message: "Vercel could not accept this domain request.",
    };
  }

  if (status === 408 || status === 429 || status >= 500 || code.includes("timeout")) {
    return {
      status,
      code,
      retryable: true,
      category: status === 429 ? "rate_limited" : "provider_unavailable",
      message: "Vercel is not ready to complete this custom-domain operation just now.",
    };
  }

  return {
    status,
    code,
    retryable: false,
    category: "unknown",
    message: message || "Vercel could not complete this custom-domain operation.",
  };
}

function parseVercelResponsePayload(text) {
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      message: text,
    };
  }
}

export function normalizeVercelDomainStatus(payload = {}) {
  const domain = payload.domain || payload.name || payload;

  return {
    name: normalizeHostname(domain?.name || payload?.name || payload?.domain),
    verified: domain?.verified === true || payload?.verified === true,
    verification: Array.isArray(domain?.verification)
      ? domain.verification
      : Array.isArray(payload?.verification)
        ? payload.verification
        : [],
    configuredBy: normalizeString(domain?.configuredBy || payload?.configuredBy),
    misconfigured: domain?.misconfigured === true || payload?.misconfigured === true,
    redirect: normalizeString(domain?.redirect || payload?.redirect),
    gitBranch: normalizeString(domain?.gitBranch || payload?.gitBranch),
    updatedAt: normalizeString(domain?.updatedAt || payload?.updatedAt),
    createdAt: normalizeString(domain?.createdAt || payload?.createdAt),
  };
}

async function requestVercel(pathname, { method = "GET", body = null } = {}) {
  const config = assertCustomDomainVercelConfigured();
  const url = buildProjectUrl(pathname, config);
  const response = await fetch(url, {
    method,
    headers: {
      authorization: `Bearer ${config.apiToken}`,
      "content-type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: buildAbortSignal(config.timeoutMs),
    cache: "no-store",
  });
  const text = await response.text();
  const payload = parseVercelResponsePayload(text);

  if (!response.ok) {
    const errorPayload = normalizeVercelErrorPayload(payload, response.statusText);
    const error = new Error(errorPayload.message);
    error.status = response.status;
    error.code = errorPayload.code;
    throw error;
  }

  return payload;
}

export async function addVercelProjectDomain(hostname) {
  const config = assertCustomDomainVercelConfigured();
  const normalizedHostname = normalizeHostname(hostname);

  if (!normalizedHostname) {
    throw new Error("Hostname is required.");
  }

  const payload = await requestVercel(`/v10/projects/${encodeURIComponent(config.projectId)}/domains`, {
    method: "POST",
    body: {
      name: normalizedHostname,
    },
  });

  return normalizeVercelDomainStatus(payload);
}

export async function getVercelProjectDomains({ limit = 20 } = {}) {
  const config = assertCustomDomainVercelConfigured();
  const boundedLimit = Math.min(Math.max(Number.parseInt(String(limit || ""), 10) || 20, 1), 100);
  return requestVercel(`/v9/projects/${encodeURIComponent(config.projectId)}/domains?limit=${boundedLimit}`);
}

export async function getVercelProjectDomain(hostname) {
  const config = assertCustomDomainVercelConfigured();
  const normalizedHostname = normalizeHostname(hostname);

  if (!normalizedHostname) {
    throw new Error("Hostname is required.");
  }

  const payload = await requestVercel(
    `/v9/projects/${encodeURIComponent(config.projectId)}/domains/${encodeURIComponent(normalizedHostname)}`
  );

  return normalizeVercelDomainStatus(payload);
}

export async function verifyVercelProjectDomain(hostname) {
  const config = assertCustomDomainVercelConfigured();
  const normalizedHostname = normalizeHostname(hostname);

  if (!normalizedHostname) {
    throw new Error("Hostname is required.");
  }

  const payload = await requestVercel(
    `/v9/projects/${encodeURIComponent(config.projectId)}/domains/${encodeURIComponent(normalizedHostname)}/verify`,
    {
      method: "POST",
    }
  );

  return normalizeVercelDomainStatus(payload);
}

export async function removeVercelProjectDomain(hostname) {
  const config = assertCustomDomainVercelConfigured();
  const normalizedHostname = normalizeHostname(hostname);

  if (!normalizedHostname) {
    throw new Error("Hostname is required.");
  }

  await requestVercel(
    `/v9/projects/${encodeURIComponent(config.projectId)}/domains/${encodeURIComponent(normalizedHostname)}`,
    {
      method: "DELETE",
    }
  );

  return {
    ok: true,
    name: normalizedHostname,
  };
}

export async function getVercelDomainConfig(hostname) {
  const normalizedHostname = normalizeHostname(hostname);

  if (!normalizedHostname) {
    throw new Error("Hostname is required.");
  }

  return requestVercel(`/v6/domains/${encodeURIComponent(normalizedHostname)}/config`);
}

export async function checkVercelProjectDomainAccess() {
  const payload = await getVercelProjectDomains({ limit: 1 });
  const domains = Array.isArray(payload?.domains) ? payload.domains : [];

  return {
    ok: true,
    domainCountVisible: domains.length,
    pagination: {
      next: normalizeString(payload?.pagination?.next),
      count: Number.isFinite(Number(payload?.pagination?.count)) ? Number(payload.pagination.count) : domains.length,
    },
  };
}
