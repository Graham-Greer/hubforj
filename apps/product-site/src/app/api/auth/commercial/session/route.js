import { NextResponse } from "next/server";
import { resolveCommercialAccountFromIdToken } from "@/lib/auth/commercial-auth";
import { listCommercialAccountHubs } from "@/lib/data/commercial-accounts";
import { getProductHubSummaryById } from "@/lib/data/hubs";
import { buildCommercialPackageSnapshot } from "@/lib/domain/package-catalog";
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
    const account = await resolveCommercialAccountFromIdToken(idToken);
    const ownedHubs = await listCommercialAccountHubs(account.id);
    const primaryHub =
      ownedHubs.find((hub) => hub.hubId === account.lastHubId) ||
      ownedHubs.find((hub) => hub.hubId === account.primaryHubId) ||
      ownedHubs[0] ||
      null;
    const productHub = primaryHub ? await getProductHubSummaryById(primaryHub.hubId) : null;
    const currentHub = {
      id: productHub?.id || primaryHub?.hubId || "",
      name: productHub?.name || primaryHub?.communityName || "",
      slug: productHub?.slug || primaryHub?.hubSlug || "",
      packageTier: productHub?.packageTier || primaryHub?.packageTier || "free",
      locale: productHub?.locale || "",
    };

    await writeCommercialAccountSessionFromAccount({
      account,
      currentHub,
    });

    return NextResponse.json({
      ok: true,
      redirectTo: nextPath.startsWith("/") ? nextPath : "/account",
      snapshot: buildCommercialPackageSnapshot({
        currentTier: currentHub.packageTier,
        locale: "en-GB",
      }),
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
