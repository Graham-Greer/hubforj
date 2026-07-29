import { NextResponse } from "next/server";
import { updateHubPackageAuthorityById } from "@/lib/data/hub-mutations";
import {
  getInternalAutomationAuthorizationState,
  normalizeUpdatePackageAuthorityAutomationRequestBody,
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

  try {
    const payload = normalizeUpdatePackageAuthorityAutomationRequestBody(body);
    const hub = await updateHubPackageAuthorityById(
      payload.hubId,
      {
        packageTier: payload.packageTier,
        packageStatus: payload.packageStatus,
        packageSource: payload.packageSource,
        packageAssignedAt: payload.packageAssignedAt,
        packageOverrides: payload.packageOverrides,
      },
      "internal-product-site-billing"
    );

    return NextResponse.json({
      id: hub.id,
      packageTier: hub.packageTier,
      packageStatus: hub.packageStatus,
      packageSource: hub.packageSource,
      packageAssignedAt: hub.packageAssignedAt,
      packageUpdatedAt: hub.packageUpdatedAt,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: String(error?.message || "Unable to update hub package authority."),
      },
      { status: 400 }
    );
  }
}
