import { getServerEnv } from "@/lib/config/env";
import { assertPublicAbuseAllowed } from "@/lib/server/public-abuse-controls";
import { resumeCommercialSignup } from "@/lib/server/commercial-signup-recovery";
import { NextResponse } from "next/server";
import { resolveCommercialAccountFromIdToken } from "@/lib/auth/commercial-auth";
import { listCommercialAccountHubs } from "@/lib/data/commercial-accounts";
import { clearCommercialAccountSession, writeCommercialAccountSessionFromAccount } from "@/lib/server/account-session";

function normalizeString(value) {
  return String(value || "").trim();
}

export async function POST(request) {
  let body;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const idToken = normalizeString(body?.idToken);
  const nextPath = normalizeString(body?.nextPath) || "/account";

  try {
    const recovery = body?.recoverSignup === true;
    if (recovery && !getServerEnv().productSiteSignupProvisioningEnabled) {
      return NextResponse.json({ error: "Workspace setup recovery is temporarily unavailable. You can still sign in to your account." }, { status: 503 });
    }
    const account = await resolveCommercialAccountFromIdToken(idToken, { requireRecentAuthentication: recovery });
    if (recovery) {
      await assertPublicAbuseAllowed("productSignupRecovery", { email: account.ownerEmail });
      const hub = await resumeCommercialSignup(account);
      await writeCommercialAccountSessionFromAccount({ account, currentHub: hub });
      return NextResponse.json({ ok: true, redirectTo: "/account" });
    }
    const ownedHubs = await listCommercialAccountHubs(account.id);
    const primaryHub =
      ownedHubs.find((hub) => hub.hubId === account.lastHubId) ||
      ownedHubs.find((hub) => hub.hubId === account.primaryHubId) ||
      ownedHubs[0] ||
      null;
    const currentHub = {
      id: primaryHub?.hubId || "",
      name: primaryHub?.communityName || "",
      slug: primaryHub?.hubSlug || "",
      packageTier: primaryHub?.packageTier || "free",
    };

    await writeCommercialAccountSessionFromAccount({
      account,
      currentHub,
    });

    return NextResponse.json({
      ok: true,
      redirectTo: /^\/(?!\/)/.test(nextPath) && !/[\\\x00-\x1f\x7f]/.test(nextPath) ? nextPath : "/account",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: String(error?.message || "Unable to establish commercial account session."),
      },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  await clearCommercialAccountSession();
  return NextResponse.json({ ok: true });
}
