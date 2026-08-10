import { NextResponse } from "next/server";
import { getInternalAutomationAuthorizationState } from "@/lib/domain/internal-automation";
import {
  normalizeProjectionMaintenanceRequest,
  runProjectionMaintenance,
} from "@/lib/server/projection-maintenance";

export const runtime = "nodejs";

function searchParamsToRequestInput(request) {
  const { searchParams } = new URL(request.url);

  return {
    hubSlug: searchParams.get("hubSlug"),
    cursor: searchParams.get("cursor"),
    limit: searchParams.get("limit"),
    dryRun: searchParams.get("dryRun"),
    includePayments: searchParams.get("includePayments"),
    includeMembers: searchParams.get("includeMembers"),
    includeDashboard: searchParams.get("includeDashboard"),
    includeMedia: searchParams.get("includeMedia"),
    includeEventAttendance: searchParams.get("includeEventAttendance"),
    includeAdminOnboarding: searchParams.get("includeAdminOnboarding"),
    includeCustomDomains: searchParams.get("includeCustomDomains"),
  };
}

async function readRequestInput(request) {
  if (request.method === "GET") {
    return searchParamsToRequestInput(request);
  }

  try {
    return await request.json();
  } catch {
    return {};
  }
}

async function handleProjectionMaintenance(request) {
  const auth = getInternalAutomationAuthorizationState(request);

  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const input = normalizeProjectionMaintenanceRequest(await readRequestInput(request));
    const result = await runProjectionMaintenance(input);

    return NextResponse.json(result, { status: result.ok ? 200 : 207 });
  } catch (error) {
    console.error("[hub-platform] projection maintenance failed", error);

    return NextResponse.json(
      { error: String(error?.message || "Unable to run projection maintenance.") },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  return handleProjectionMaintenance(request);
}

export async function POST(request) {
  return handleProjectionMaintenance(request);
}
