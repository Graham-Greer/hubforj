import { NextResponse } from "next/server";
import { requireHubOperatorRouteAccess } from "@/lib/auth/action-access";
import { getMediaAssetUsageById } from "@/lib/data/media";

export async function GET(request, { params }) {
  const { hubSlug, assetId } = await params;
  const { hub, errorResponse } = await requireHubOperatorRouteAccess(request, hubSlug, {
    coreHub: true,
    unauthorizedMessage: "You are not authorized to view media usage for this hub.",
  });

  if (errorResponse) {
    return errorResponse;
  }

  try {
    const usage = await getMediaAssetUsageById(hub.id, assetId);

    if (usage.usageVerificationComplete === false) {
      console.warn("Media usage lookup partially failed", {
        hubId: hub.id,
        hubSlug,
        assetId,
        failedSources: usage.failedSources,
      });
    }

    return NextResponse.json(usage);
  } catch (error) {
    console.error("Media usage lookup failed", {
      hubId: hub.id,
      hubSlug,
      assetId,
      error: String(error?.message || error),
    });

    return NextResponse.json(
      {
        error: "Media usage could not be loaded.",
        usageRefs: [],
        usageCount: 0,
        usageVerificationComplete: false,
        failedSources: [{ source: "unknown", message: "Unexpected media usage lookup failure." }],
      },
      { status: 500 }
    );
  }
}
