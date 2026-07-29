import { NextResponse } from "next/server";
import { getCanonicalCustomDomainMappingByHubSlug, getCustomDomainMappingByHostname } from "@/lib/data/custom-domain-mappings";
import { getInternalAutomationAuthorizationState } from "@/lib/domain/internal-automation";
import { getCustomDomainRuntimeDiagnostics } from "@/lib/domain/custom-domain-runtime-config";

function normalizeString(value) {
  return String(value || "").trim();
}

export async function GET(request) {
  const auth = getInternalAutomationAuthorizationState(request);

  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const runtime = getCustomDomainRuntimeDiagnostics();

  if (!runtime.runtimeEnabled) {
    return NextResponse.json({ found: false, runtimeEnabled: false, diagnostics: runtime });
  }

  const hostname = normalizeString(request.nextUrl.searchParams.get("host"));
  const hubSlug = normalizeString(request.nextUrl.searchParams.get("hubSlug"));

  if (!hostname && !hubSlug) {
    return NextResponse.json({ found: false, error: "Hostname or hub slug is required." }, { status: 400 });
  }

  try {
    const mapping = hostname
      ? await getCustomDomainMappingByHostname(hostname)
      : await getCanonicalCustomDomainMappingByHubSlug(hubSlug);

    if (!mapping) {
      return NextResponse.json({ found: false, hostname, hubSlug });
    }

    return NextResponse.json({
      found: true,
      hostname: mapping.hostname,
      hubId: mapping.hubId,
      hubSlug: mapping.hubSlug,
      canonicalHost: mapping.canonicalHost,
      companionHost: mapping.companionHost,
      redirectTo: mapping.redirectTo,
      matchType: mapping.matchType,
      fallbackHost: mapping.fallbackHost,
      status: mapping.status,
      runtimeEnabled: runtime.runtimeEnabled,
    });
  } catch (error) {
    return NextResponse.json(
      {
        found: false,
        error: String(error?.message || "Unable to resolve custom-domain mapping."),
      },
      { status: 500 }
    );
  }
}
