try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import Stripe from "stripe";
import { getPublicEnv, getServerEnv } from "@/lib/config/env";

let stripeClient = null;

function normalizeString(value) {
  return String(value || "").trim();
}

export function getStripeConnectEnvironmentState() {
  const publicEnv = getPublicEnv();
  const serverEnv = getServerEnv();
  const checkoutRequirements = {
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: publicEnv.stripePublishableKey,
    STRIPE_SECRET_KEY: serverEnv.stripeSecretKey,
  };
  const webhookRequirements = {
    STRIPE_SECRET_KEY: serverEnv.stripeSecretKey,
    STRIPE_WEBHOOK_SECRET: serverEnv.stripeWebhookSecret,
  };

  const missing = Object.entries(checkoutRequirements)
    .filter(([, value]) => !normalizeString(value))
    .map(([key]) => key);
  const missingWebhook = Object.entries(webhookRequirements)
    .filter(([, value]) => !normalizeString(value))
    .map(([key]) => key);

  return {
    configured: missing.length === 0,
    configuredForWebhooks: missingWebhook.length === 0,
    missing,
    missingWebhook,
    publishableKey: normalizeString(publicEnv.stripePublishableKey),
  };
}

export function getStripeServerClient() {
  const { stripeSecretKey } = getServerEnv();

  if (!normalizeString(stripeSecretKey)) {
    throw new Error("STRIPE_SECRET_KEY is required for Stripe Connect operations.");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(stripeSecretKey);
  }

  return stripeClient;
}
