import { NextResponse } from "next/server";
import { getInternalAutomationAuthorizationState } from "@/lib/domain/internal-automation";
import { getCustomDomainRuntimeDiagnostics } from "@/lib/domain/custom-domain-runtime-config";
import { getCustomDomainVercelDiagnostics } from "@/lib/domain/custom-domain-vercel-config";
import {
  checkVercelProjectDomainAccess,
  classifyVercelDomainError,
  getVercelDomainConfig,
  getVercelProjectDomain,
} from "@/lib/server/vercel-domains";

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeBooleanParam(value) {
  return normalizeString(value).toLowerCase() === "true" || normalizeString(value) === "1";
}

async function buildVercelLiveDiagnostics(request) {
  if (!normalizeBooleanParam(request.nextUrl.searchParams.get("includeVercel"))) {
    return null;
  }

  const hostname = normalizeString(request.nextUrl.searchParams.get("host"));

  try {
    const access = await checkVercelProjectDomainAccess();
    const domain = hostname ? await getVercelProjectDomain(hostname) : null;
    const domainConfig = hostname ? await getVercelDomainConfig(hostname) : null;

    return {
      ok: true,
      access,
      domain,
      domainConfig,
    };
  } catch (error) {
    const classification = classifyVercelDomainError(error);

    return {
      ok: false,
      error: classification.message,
      status: classification.status,
      code: classification.code,
      category: classification.category,
      retryable: classification.retryable,
    };
  }
}

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

  const vercelLive = await buildVercelLiveDiagnostics(request);

  return NextResponse.json({
    ok: true,
    diagnostics: {
      runtime: getCustomDomainRuntimeDiagnostics(),
      vercel: getCustomDomainVercelDiagnostics(),
      vercelLive,
    },
  });
}
