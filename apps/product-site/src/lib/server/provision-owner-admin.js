import "server-only";

import { getServerEnv } from "@/lib/config/env";

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeBaseUrl(value) {
  return normalizeString(value).replace(/\/+$/, "");
}

function normalizeHostname(value) {
  return normalizeString(value)
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/[/?#].*$/, "")
    .replace(/:\d+$/, "")
    .replace(/\.+$/, "");
}

function normalizeSlug(value) {
  return normalizeString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
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

function resolveRootDomainFromHubPlatformBaseUrl(baseUrl) {
  const parsed = new URL(baseUrl);
  const hostname = normalizeHostname(parsed.hostname);

  if (isLocalHostname(hostname)) {
    return "";
  }

  const labels = hostname.split(".").filter(Boolean);
  return labels.length > 2 ? labels.slice(-2).join(".") : hostname;
}

function normalizeHostRuntimePath(signInPath, hubSlug) {
  const normalizedPath = normalizeString(signInPath);
  const normalizedHubSlug = normalizeSlug(hubSlug);
  const rawHubSlug = normalizeString(hubSlug).replace(/^\/+|\/+$/g, "");

  if (!normalizedPath.startsWith("/")) {
    return "";
  }

  if (!normalizedHubSlug) {
    return normalizedPath;
  }

  const hubRoots = Array.from(new Set([normalizedHubSlug, rawHubSlug].filter(Boolean).map((slug) => `/${slug}`)));

  for (const hubRoot of hubRoots) {
    if (normalizedPath === hubRoot) {
      return "/";
    }

    if (normalizedPath.startsWith(`${hubRoot}/`)) {
      return normalizedPath.slice(hubRoot.length) || "/";
    }
  }

  return normalizedPath;
}

function buildHostedHubHref(baseUrl, hubSlug, signInPath) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const normalizedHubSlug = normalizeSlug(hubSlug);

  if (!normalizedBaseUrl || !normalizedHubSlug) {
    return "";
  }

  const parsed = new URL(normalizedBaseUrl);
  const hostname = normalizeHostname(parsed.hostname);

  if (isLocalHostname(hostname)) {
    return `${normalizedBaseUrl}${signInPath}`;
  }

  const rootDomain = resolveRootDomainFromHubPlatformBaseUrl(normalizedBaseUrl);
  const origin = `${parsed.protocol}//${normalizedHubSlug}.${rootDomain}`;
  return new URL(normalizeHostRuntimePath(signInPath, hubSlug), origin).toString();
}

export async function provisionOwnerAdminFromProductSite(payload) {
  const { hubPlatformBaseUrl, internalAutomationSecret } = getServerEnv();
  const baseUrl = normalizeBaseUrl(hubPlatformBaseUrl);

  if (!baseUrl) {
    throw new Error("HUB_PLATFORM_BASE_URL is required for owner admin activation.");
  }

  if (!internalAutomationSecret) {
    throw new Error("INTERNAL_AUTOMATION_SECRET is required for owner admin activation.");
  }

  const response = await fetch(`${baseUrl}/api/internal/provision-owner-admin`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${internalAutomationSecret}`,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    console.error("Product-site owner admin activation failed", {
      status: response.status,
      hubId: normalizeString(payload?.hubId),
      hubSlug: normalizeString(payload?.hubSlug),
      ownerEmail: normalizeString(payload?.ownerEmail),
      error: String(data?.error || "Unable to activate hub admin access."),
    });

    throw new Error(String(data?.error || "Unable to activate hub admin access."));
  }

  const signInPath = normalizeString(data?.signInPath);
  const handoffPath = normalizeString(data?.handoffPath);

  if (!handoffPath.startsWith("/") && !signInPath.startsWith("/")) {
    throw new Error("Hub admin activation did not return a valid redirect path.");
  }

  return {
    ...data,
    adminHandoffHref: handoffPath
      ? buildHostedHubHref(baseUrl, data?.hubSlug, handoffPath) || `${baseUrl}${handoffPath}`
      : "",
    signInHref: signInPath
      ? buildHostedHubHref(baseUrl, data?.hubSlug, signInPath) || `${baseUrl}${signInPath}`
      : "",
  };
}
