import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/config/env";
import { getInternalAutomationAuthorizationState } from "@/lib/domain/internal-automation";
import { processScheduledMembershipChanges } from "@/lib/server/membership-schedule-processor";

export const runtime = "nodejs";

function normalizeInteger(value, fallback = 0) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function POST(request) {
  const { internalAutomationProcessorBatchSize } = getServerEnv();
  const auth = getInternalAutomationAuthorizationState(request);

  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const batchSize = Math.max(
    1,
    normalizeInteger(searchParams.get("batchSize"), internalAutomationProcessorBatchSize || 50)
  );

  try {
    const summary = await processScheduledMembershipChanges({
      batchSize,
      actorId: "internal-automation",
    });

    return NextResponse.json({
      ok: true,
      summary,
    });
  } catch (error) {
    console.error("[hub-platform] scheduled membership processor failed", error);

    return NextResponse.json(
      { error: String(error?.message || "Unable to process scheduled membership changes.") },
      { status: 500 }
    );
  }
}
