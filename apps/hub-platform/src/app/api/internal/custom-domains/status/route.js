import { NextResponse } from "next/server";
import { getInternalAutomationAuthorizationState } from "@/lib/domain/internal-automation";
import { getCustomDomainRuntimeDiagnostics } from "@/lib/domain/custom-domain-runtime-config";

export async function GET(request) {
  const auth = getInternalAutomationAuthorizationState(request);

  if (!auth.authorized) {
    return NextResponse.json(
      {
        error: auth.error,
        diagnostics: getCustomDomainRuntimeDiagnostics(),
      },
      { status: auth.status }
    );
  }

  return NextResponse.json({
    ok: true,
    diagnostics: getCustomDomainRuntimeDiagnostics(),
  });
}
