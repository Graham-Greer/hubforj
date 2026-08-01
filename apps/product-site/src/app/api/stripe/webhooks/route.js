import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/config/env";
import { processStripeWebhookEvent } from "@/lib/server/commercial-billing";
import { getStripeBillingEnvironmentState, getStripeServerClient } from "@/lib/server/stripe";

export async function POST(request) {
  const stripeEnvironment = getStripeBillingEnvironmentState();

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
    console.error("Product-site Stripe webhook signature verification failed", {
      error: String(error?.message || error || "Unknown webhook signature error"),
    });

    return NextResponse.json(
      {
        error: String(error?.message || "Unable to verify Stripe webhook signature."),
      },
      { status: 400 }
    );
  }

  try {
    const result = await processStripeWebhookEvent(event);
    console.info("Product-site Stripe webhook processed", {
      eventId: event?.id,
      eventType: event?.type,
      result,
    });

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error) {
    console.error("Product-site Stripe webhook processing failed", {
      eventId: event?.id,
      eventType: event?.type,
      error: String(error?.message || error || "Unknown webhook processing error"),
    });

    return NextResponse.json(
      {
        error: String(error?.message || "Unable to process Stripe webhook event."),
      },
      { status: 500 }
    );
  }
}
