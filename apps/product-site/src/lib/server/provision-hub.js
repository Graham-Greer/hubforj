import "server-only";
import { getServerEnv } from "@/lib/config/env";

export async function provisionHubFromProductSite(payload, { idempotencyKey } = {}) {
  if (idempotencyKey !== undefined && (typeof idempotencyKey !== "string" || !/^[A-Za-z0-9_-]{16,128}$/.test(idempotencyKey))) {
    throw new Error("Invalid provisioning idempotency key.");
  }
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
      ...(idempotencyKey !== undefined ? { "idempotency-key": idempotencyKey } : {}),
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

  if (idempotencyKey !== undefined && data.provisioningProtocol !== "idempotency-v1") {
    throw new Error("Provisioning recovery is not supported by this hub server. Review the operation before retrying.");
  }

  return data;
}
