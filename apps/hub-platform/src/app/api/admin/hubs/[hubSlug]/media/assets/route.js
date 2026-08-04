import { NextResponse } from "next/server";
import { requireHubOperatorRouteAccess } from "@/lib/auth/action-access";
import { listMediaAssetPageByHubId } from "@/lib/data/media";

function normalizeString(value) {
  return String(value || "").trim();
}

export async function GET(request, { params }) {
  const { hubSlug } = await params;
  const { hub, errorResponse } = await requireHubOperatorRouteAccess(request, hubSlug, {
    coreHub: true,
    unauthorizedMessage: "You are not authorized to view media for this hub.",
  });

  if (errorResponse) {
    return errorResponse;
  }

  const { searchParams } = new URL(request.url);
  const cursor = normalizeString(searchParams.get("cursor"));
  const limit = normalizeString(searchParams.get("limit"));
  const page = await listMediaAssetPageByHubId(hub.id, { cursor, limit });

  return NextResponse.json(page);
}
