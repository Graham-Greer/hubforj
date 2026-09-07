import { NextResponse } from "next/server";
import { createHub } from "@/lib/data/hub-mutations";
import {
  getInternalAutomationAuthorizationState,
  normalizeProvisionHubAutomationRequestBody,
} from "@/lib/domain/internal-automation";

export async function POST(request) {
  const auth = getInternalAutomationAuthorizationState(request);

  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const payload = normalizeProvisionHubAutomationRequestBody(body);

  try {
    const idempotencyKey = request.headers.get("idempotency-key") ?? undefined;
    const hub = await createHub(payload, "internal-product-site", { idempotencyKey });

    return NextResponse.json({
      ...(idempotencyKey !== undefined ? { provisioningProtocol: "idempotency-v1" } : {}),
      id: hub.id,
      slug: hub.slug,
      packageTier: hub.packageTier,
      packageStatus: hub.packageStatus,
      packageSource: hub.packageSource,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: String(error?.message || "Unable to provision hub."),
      },
      { status: [400, 409, 410, 503].includes(error?.provisioningStatus) ? error.provisioningStatus : 500 }
    );
  }
}
