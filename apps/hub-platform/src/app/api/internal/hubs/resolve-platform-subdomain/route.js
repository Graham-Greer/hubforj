import { NextResponse } from "next/server";
import { getHubByPlatformSubdomainLabel } from "@/lib/data/hubs";
import { getInternalAutomationAuthorizationState } from "@/lib/domain/internal-automation";
import { normalizePlatformSubdomainLabel } from "@/lib/domain/hub-domains";

function normalizeString(value) {
  return String(value || "").trim();
}

export async function GET(request) {
  const auth = getInternalAutomationAuthorizationState(request);

  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const subdomainLabel = normalizePlatformSubdomainLabel(request.nextUrl.searchParams.get("subdomainLabel"));

  if (!subdomainLabel) {
    return NextResponse.json({ found: false, error: "Subdomain label is required." }, { status: 400 });
  }

  try {
    const hub = await getHubByPlatformSubdomainLabel(subdomainLabel);

    if (!hub) {
      return NextResponse.json({ found: false, subdomainLabel });
    }

    return NextResponse.json({
      found: true,
      hubId: normalizeString(hub.id),
      hubSlug: normalizeString(hub.slug),
      subdomainLabel: normalizeString(hub.platformSubdomainLabel || subdomainLabel),
    });
  } catch (error) {
    return NextResponse.json(
      {
        found: false,
        error: String(error?.message || "Unable to resolve platform subdomain."),
      },
      { status: 500 }
    );
  }
}
