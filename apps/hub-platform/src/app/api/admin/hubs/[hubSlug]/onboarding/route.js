import { NextResponse } from "next/server";
import { requireHubOperatorRouteAccess } from "@/lib/auth/action-access";
import { getAdminOnboardingState, saveAdminOnboardingState } from "@/lib/data/admin-onboarding";
import { createPerformanceTimer } from "@/lib/observability/performance-timing";

export async function GET(request, { params }) {
  const { hubSlug } = await params;
  const scope = request.nextUrl?.searchParams?.get("scope") || "";
  const includeChecklist = scope !== "route";
  const timer = createPerformanceTimer("admin-onboarding-route", {
    method: "GET",
    hubSlug,
    requestScope: scope || "checklist",
    includeChecklist,
  });
  timer.log("start");

  const accessStartedAt = Date.now();
  const { hub, access, errorResponse } = await requireHubOperatorRouteAccess(request, hubSlug, { coreHub: true });
  timer.log("access-resolved", {
    durationMs: Date.now() - accessStartedAt,
    hubId: hub?.id || "",
    actorId: access?.actorId || "",
    actorRole: access?.actorRole || "",
    authorized: !errorResponse,
  });

  if (errorResponse) {
    timer.end({ status: "access-denied" });
    return errorResponse;
  }

  const state = await getAdminOnboardingState(hub, access.actorId, access.actorRole, {
    includeChecklist,
  });
  timer.log("state-loaded", {
    checklistHydrated: state?.checklistHydrated === true,
    checklistItemCount: Array.isArray(state?.checklist?.items) ? state.checklist.items.length : 0,
  });
  const response = NextResponse.json({ state });
  timer.end({ status: "ok" });
  return response;
}

export async function PATCH(request, { params }) {
  const { hubSlug } = await params;
  const timer = createPerformanceTimer("admin-onboarding-route", {
    method: "PATCH",
    hubSlug,
  });
  timer.log("start");

  const accessStartedAt = Date.now();
  const { hub, access, errorResponse } = await requireHubOperatorRouteAccess(request, hubSlug, { coreHub: true });
  timer.log("access-resolved", {
    durationMs: Date.now() - accessStartedAt,
    hubId: hub?.id || "",
    actorId: access?.actorId || "",
    actorRole: access?.actorRole || "",
    authorized: !errorResponse,
  });

  if (errorResponse) {
    timer.end({ status: "access-denied" });
    return errorResponse;
  }

  const payload = await request.json().catch(() => null);
  timer.log("payload-read", { hasState: Boolean(payload?.state) });

  if (!payload?.state) {
    timer.end({ status: "invalid-payload" });
    return NextResponse.json({ error: "Onboarding state is required." }, { status: 400 });
  }

  const state = await saveAdminOnboardingState(hub, access.actorId, access.actorRole, payload.state);
  timer.log("state-saved", {
    checklistHydrated: state?.checklistHydrated === true,
    checklistItemCount: Array.isArray(state?.checklist?.items) ? state.checklist.items.length : 0,
  });
  const response = NextResponse.json({ state });
  timer.end({ status: "ok" });
  return response;
}
