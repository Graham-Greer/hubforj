import { NextResponse } from "next/server";
import { requireHubOperatorRouteAccess } from "@/lib/auth/action-access";
import { getMediaAssetMetadataById } from "@/lib/data/media";

export async function GET(request, { params }) {
  const { hubSlug, assetId } = await params;
  const { hub, errorResponse } = await requireHubOperatorRouteAccess(request, hubSlug, {
    coreHub: true,
    unauthorizedMessage: "You are not authorized to view media for this hub.",
  });

  if (errorResponse) {
    return errorResponse;
  }

  const asset = await getMediaAssetMetadataById(hub.id, assetId);

  if (!asset) {
    return NextResponse.json({ error: "Media asset not found." }, { status: 404 });
  }

  return NextResponse.json({ asset });
}
