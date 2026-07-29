import "server-only";
import { getServerEnv } from "@/lib/config/env";

export async function provisionHubFromProductSite(payload) {
  const { hubPlatformBaseUrl, internalAutomationSecret } = getServerEnv();

  if (!hubPlatformBaseUrl) {
    throw new Error("HUB_PLATFORM_BASE_URL is required for provisioning.");
  }

  if (!internalAutomationSecret) {
    throw new Error("INTERNAL_AUTOMATION_SECRET is required for provisioning.");
  }

  const response = await fetch(`${hubPlatformBaseUrl}/api/internal/provision-hub`, {
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
    throw new Error(String(data?.error || "Unable to provision the community."));
  }

  return data;
}
