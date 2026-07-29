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
    const hub = await createHub(payload, "internal-product-site");

    return NextResponse.json({
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
      { status: 500 }
    );
  }
}
