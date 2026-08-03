import { NextResponse } from "next/server";
import { requireCommercialAccountContext } from "@/lib/server/commercial-account-context";
import { provisionOwnerAdminFromProductSite } from "@/lib/server/provision-owner-admin";

export const dynamic = "force-dynamic";

function buildAccountRedirect(request, state) {
  return NextResponse.redirect(new URL(`/account?adminActivation=${encodeURIComponent(state)}`, request.url));
}

export async function GET(request) {
  const accountContext = await requireCommercialAccountContext();
  const { account, currentHub } = accountContext;

  if (!account.emailVerified) {
    return buildAccountRedirect(request, "verification-required");
  }

  if (!account.authUid) {
    return buildAccountRedirect(request, "missing-auth");
  }

  if (!currentHub.id || !currentHub.slug) {
    return buildAccountRedirect(request, "missing-hub");
  }

  try {
    const handoff = await provisionOwnerAdminFromProductSite({
      hubId: currentHub.id,
      hubSlug: currentHub.slug,
      authUid: account.authUid,
      ownerEmail: account.ownerEmail,
      ownerFullName: account.ownerFullName,
    });

    return NextResponse.redirect(handoff.adminHandoffHref || handoff.signInHref);
  } catch {
    return buildAccountRedirect(request, "error");
  }
}
