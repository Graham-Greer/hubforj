import { NextResponse } from "next/server";
import { requireHubOperatorRouteAccess } from "@/lib/auth/action-access";
import { assertHubCapability } from "@/lib/domain/package-guards";
import { syncHubStripeConnectedAccount } from "@/lib/server/hub-payment-connect";

export async function POST(request, { params }) {
  const { hubSlug } = await params;
  const { hub, access, errorResponse } = await requireHubOperatorRouteAccess(request, hubSlug, {
    unauthorizedMessage: "You are not authorized to manage payments for this hub.",
  });
  if (errorResponse) {
    return errorResponse;
  }

  try {
    assertHubCapability(hub, "paymentsEnabled", "Built-in payments are only available on the Growth package.");
    const configuration = await syncHubStripeConnectedAccount(hub, access.actorId);

    return NextResponse.json({
      status: configuration.status,
      statusLabel: configuration.statusLabel,
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error?.message || "Unable to refresh Stripe status.") },
      { status: 400 }
    );
  }
}
