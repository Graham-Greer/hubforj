import { NextResponse } from "next/server";
import { runReadyCustomDomainActivationBatch } from "@/lib/data/custom-domain-verification";
import { getInternalAutomationAuthorizationState, normalizeAutomationRequestBody } from "@/lib/domain/internal-automation";

export async function POST(request) {
  const auth = getInternalAutomationAuthorizationState(request);

  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const { hubSlug, limit } = normalizeAutomationRequestBody(body);

  try {
    const result = await runReadyCustomDomainActivationBatch({
      actorId: "internal-domain-activator",
      hubSlug,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: String(error?.message || "Unable to process custom-domain activation."),
      },
      { status: 500 }
    );
  }
}
