import { NextResponse } from "next/server";
import { requireCommercialAccountContext } from "@/lib/server/commercial-account-context";
import { provisionOwnerAdminFromProductSite } from "@/lib/server/provision-owner-admin";

export const dynamic = "force-dynamic";

function buildErrorResponse(state, status = 400) {
  return NextResponse.json(
    {
      ok: false,
      state,
      redirectTo: `/account?adminActivation=${encodeURIComponent(state)}`,
    },
    { status }
  );
}

export async function POST() {
  const accountContext = await requireCommercialAccountContext();
  const { account, currentHub } = accountContext;

  if (!account.emailVerified) {
    return buildErrorResponse("verification-required");
  }

  if (!account.authUid) {
    return buildErrorResponse("missing-auth");
  }

  if (!currentHub.id || !currentHub.slug) {
    return buildErrorResponse("missing-hub");
  }

  try {
    const handoff = await provisionOwnerAdminFromProductSite({
      hubId: currentHub.id,
      hubSlug: currentHub.slug,
      authUid: account.authUid,
      ownerEmail: account.ownerEmail,
      ownerFullName: account.ownerFullName,
    });

    return NextResponse.json(
      {
        ok: true,
        redirectTo: handoff.adminHandoffHref || handoff.signInHref,
      },
      {
        headers: {
          "cache-control": "no-store",
        },
      }
    );
  } catch {
    return buildErrorResponse("error", 500);
  }
}
