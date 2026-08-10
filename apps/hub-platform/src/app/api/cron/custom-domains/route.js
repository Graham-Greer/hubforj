import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/config/env";
import { internalAutomationSecretsMatch, validateInternalAutomationSecret } from "@/lib/domain/internal-automation";
import { runCustomDomainLifecycleBatch } from "@/lib/data/custom-domain-verification";
import { runCustomDomainReconciliationBatch } from "@/lib/data/custom-domain-reconciliation";

export const runtime = "nodejs";

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeInteger(value, fallback = 25, max = 100) {
  const parsed = Number.parseInt(String(value || ""), 10);
  const resolved = Number.isFinite(parsed) ? parsed : fallback;

  return Math.min(Math.max(resolved, 1), max);
}

function getCronAuthorizationState(request) {
  const { cronSecret } = getServerEnv();
  const validation = validateInternalAutomationSecret(cronSecret);

  if (!validation.valid) {
    return {
      authorized: false,
      status: 503,
      error: "Cron automation is not configured for this environment.",
    };
  }

  const authorization = normalizeString(request.headers.get("authorization"));
  const providedSecret = authorization.toLowerCase().startsWith("bearer ")
    ? authorization.slice(7).trim()
    : "";

  if (internalAutomationSecretsMatch(providedSecret, cronSecret)) {
    return {
      authorized: true,
      status: 200,
      error: "",
    };
  }

  return {
    authorized: false,
    status: 401,
    error: "Unauthorized.",
  };
}

export async function GET(request) {
  const auth = getCronAuthorizationState(request);

  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const env = getServerEnv();

  if (!env.hubPlatformCustomDomainScheduledMaintenanceEnabled) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "custom_domain_scheduled_maintenance_disabled",
    });
  }

  const { searchParams } = new URL(request.url);
  const limit = normalizeInteger(
    searchParams.get("limit"),
    env.hubPlatformCustomDomainScheduledMaintenanceLimit,
    100
  );
  const startedAt = new Date().toISOString();

  try {
    const lifecycle = await runCustomDomainLifecycleBatch({
      limit,
    });
    const reconciliation = env.hubPlatformCustomDomainReconciliationEnabled
      ? await runCustomDomainReconciliationBatch({
          actorId: "custom-domain-cron",
          limit,
        })
      : null;
    const lifecycleOk = lifecycle?.ok !== false;
    const reconciliationOk = !reconciliation || reconciliation.ok !== false;
    const ok = lifecycleOk && reconciliationOk;

    return NextResponse.json(
      {
        ok,
        skipped: false,
        startedAt,
        completedAt: new Date().toISOString(),
        limit,
        lifecycle,
        reconciliation: reconciliation
          ? {
              ok: reconciliation.ok,
              processed: reconciliation.processed,
              failed: reconciliation.failed,
            }
          : {
              skipped: true,
              reason: "custom_domain_reconciliation_disabled",
            },
      },
      { status: ok ? 200 : 207 }
    );
  } catch (error) {
    console.error("[hub-platform] custom-domain scheduled maintenance failed", error);

    return NextResponse.json(
      {
        ok: false,
        skipped: false,
        startedAt,
        completedAt: new Date().toISOString(),
        error: String(error?.message || "Unable to run custom-domain scheduled maintenance."),
      },
      { status: 500 }
    );
  }
}
