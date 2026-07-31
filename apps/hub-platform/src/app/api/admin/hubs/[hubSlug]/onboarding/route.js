import { NextResponse } from "next/server";
import { requireHubOperatorRouteAccess } from "@/lib/auth/action-access";
import { getAdminOnboardingState, saveAdminOnboardingState } from "@/lib/data/admin-onboarding";

export async function GET(request, { params }) {
  const { hubSlug } = await params;
  const { hub, access, errorResponse } = await requireHubOperatorRouteAccess(request, hubSlug, { coreHub: true });
  if (errorResponse) {
    return errorResponse;
  }

  const state = await getAdminOnboardingState(hub, access.actorId, access.actorRole);
  return NextResponse.json({ state });
}

export async function PATCH(request, { params }) {
  const { hubSlug } = await params;
  const { hub, access, errorResponse } = await requireHubOperatorRouteAccess(request, hubSlug, { coreHub: true });
  if (errorResponse) {
    return errorResponse;
  }

  const payload = await request.json().catch(() => null);
  if (!payload?.state) {
    return NextResponse.json({ error: "Onboarding state is required." }, { status: 400 });
  }

  const state = await saveAdminOnboardingState(hub, access.actorId, access.actorRole, payload.state);
  return NextResponse.json({ state });
}
