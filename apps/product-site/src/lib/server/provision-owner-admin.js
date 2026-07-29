import "server-only";

import { getServerEnv } from "@/lib/config/env";

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeBaseUrl(value) {
  return normalizeString(value).replace(/\/+$/, "");
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
    throw new Error(String(data?.error || "Unable to activate hub admin access."));
  }

  const signInPath = normalizeString(data?.signInPath);

  if (!signInPath.startsWith("/")) {
    throw new Error("Hub admin activation did not return a valid sign-in path.");
  }

  return {
    ...data,
    signInHref: `${baseUrl}${signInPath}`,
  };
}
