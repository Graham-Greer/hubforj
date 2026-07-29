import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerEnv } from "@/lib/config/env";
import { getHubById } from "@/lib/data/hubs";
import { processHubStripeWebhookEvent } from "@/lib/server/hub-payment-webhooks";
import { getStripeConnectEnvironmentState, getStripeServerClient } from "@/lib/server/stripe";

export const runtime = "nodejs";

async function revalidateHubFinancePaths(hubId) {
  const hub = await getHubById(hubId);

  if (!hub?.slug) {
    return;
  }

  revalidatePath(`/${hub.slug}/admin`);
  revalidatePath(`/${hub.slug}/admin/payments`);
}

export async function POST(request) {
  const stripeEnvironment = getStripeConnectEnvironmentState();

  if (!stripeEnvironment.configuredForWebhooks) {
    return NextResponse.json(
      {
        error: `Stripe webhooks are not configured. Missing: ${stripeEnvironment.missingWebhook.join(", ")}`,
      },
      { status: 503 }
    );
  }

  const stripe = getStripeServerClient();
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();
  const { stripeWebhookSecret } = getServerEnv();

  if (!signature) {
    return NextResponse.json({ error: "Stripe signature is required." }, { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed", {
      error,
    });

    return NextResponse.json(
      {
        error: String(error?.message || "Unable to verify Stripe webhook signature."),
      },
      { status: 400 }
    );
  }

  try {
    const result = await processHubStripeWebhookEvent(event);

    if (result?.hubId) {
      await revalidateHubFinancePaths(result.hubId);
    }

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error) {
    console.error("Stripe webhook processing failed", {
      eventId: event?.id,
      eventType: event?.type,
      stripeAccountId: event?.account,
      error,
    });

    return NextResponse.json(
      {
        error: String(error?.message || "Unable to process Stripe webhook event."),
      },
      { status: 500 }
    );
  }
}
