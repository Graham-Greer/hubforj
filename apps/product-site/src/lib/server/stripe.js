import "server-only";

import Stripe from "stripe";
import { getServerEnv } from "@/lib/config/env";
import { resolvePackagePricingSelection } from "@/lib/domain/package-pricing";

let stripeClient = null;

function normalizeString(value) {
  return String(value || "").trim();
}

export function getStripeBillingEnvironmentState() {
  const env = getServerEnv();
  const checkoutRequirements = {
    STRIPE_SECRET_KEY: env.stripeSecretKey,
    PRODUCT_SITE_BASE_URL: env.productSiteBaseUrl,
  };
  const webhookRequirements = {
    STRIPE_SECRET_KEY: env.stripeSecretKey,
    STRIPE_WEBHOOK_SECRET: env.stripeWebhookSecret,
  };

  const missingCheckoutBase = Object.entries(checkoutRequirements)
    .filter(([, value]) => !normalizeString(value))
    .map(([key]) => key);
  const missingWebhook = Object.entries(webhookRequirements)
    .filter(([, value]) => !normalizeString(value))
    .map(([key]) => key);

  const priceByTierCurrency = {
    starter: {
      GBP: normalizeString(env.stripeStarterGbpPriceId),
    },
    growth: {
      GBP: normalizeString(env.stripeGrowthGbpPriceId),
    },
  };
  const hasAnyConfiguredPrice = Object.values(priceByTierCurrency)
    .flatMap((entry) => Object.values(entry))
    .some(Boolean);
  const missingCheckout = hasAnyConfiguredPrice
    ? missingCheckoutBase
    : [...missingCheckoutBase, "STRIPE_PACKAGE_PRICE_IDS"];

  return {
    configuredForCheckout: missingCheckout.length === 0,
    configuredForWebhooks: missingWebhook.length === 0,
    missingCheckout,
    missingWebhook,
    priceByTierCurrency,
    billingPortalConfigurationId: normalizeString(env.stripeBillingPortalConfigurationId),
    productSiteBaseUrl: normalizeString(env.productSiteBaseUrl).replace(/\/+$/, ""),
  };
}

export function getStripePriceIdForTierAndCurrency(tier, currency) {
  const normalizedTier = normalizeString(tier).toLowerCase();
  const normalizedCurrency = normalizeString(currency).toUpperCase();
  const state = getStripeBillingEnvironmentState();

  return state.priceByTierCurrency[normalizedTier]?.[normalizedCurrency] || "";
}

export function getConfiguredStripePackageCurrenciesForTier(tier) {
  const normalizedTier = normalizeString(tier).toLowerCase();
  const state = getStripeBillingEnvironmentState();

  return Object.entries(state.priceByTierCurrency[normalizedTier] || {})
    .filter(([, priceId]) => Boolean(priceId))
    .map(([currency]) => currency);
}

export function getConfiguredStripePackageBillingCurrencies() {
  return ["GBP"].filter((currency) =>
    ["starter", "growth"].every((tier) => Boolean(getStripePriceIdForTierAndCurrency(tier, currency)))
  );
}

export function resolveStripePriceSelection({ tier = "", country = "", currency = "" } = {}) {
  const resolvedSelection = resolvePackagePricingSelection({
    tier,
    country,
    currency,
  });
  const priceId = getStripePriceIdForTierAndCurrency(resolvedSelection.tier, resolvedSelection.currency);

  return {
    tier: resolvedSelection.tier,
    currency: resolvedSelection.currency,
    priceId,
  };
}

export function getPackageTierAndCurrencyForStripePriceId(priceId) {
  const normalizedPriceId = normalizeString(priceId);
  const state = getStripeBillingEnvironmentState();

  for (const [tier, currencies] of Object.entries(state.priceByTierCurrency)) {
    for (const [currency, value] of Object.entries(currencies || {})) {
      if (value === normalizedPriceId) {
        return {
          tier,
          currency,
        };
      }
    }
  }

  return {
    tier: "",
    currency: "",
  };
}

export function getPackageTierForStripePriceId(priceId) {
  return getPackageTierAndCurrencyForStripePriceId(priceId).tier || "";
}

export function getPackageCurrencyForStripePriceId(priceId) {
  return getPackageTierAndCurrencyForStripePriceId(priceId).currency || "";
}

export function getStripeServerClient() {
  const { stripeSecretKey } = getServerEnv();

  if (!normalizeString(stripeSecretKey)) {
    throw new Error("STRIPE_SECRET_KEY is required for Stripe server operations.");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(stripeSecretKey);
  }

  return stripeClient;
}

export async function assertStripePriceMatchesSelection({ tier = "", currency = "", priceId = "" } = {}) {
  const normalizedPriceId = normalizeString(priceId);
  const normalizedCurrency = normalizeString(currency).toLowerCase();

  if (!normalizedPriceId) {
    throw new Error(`No Stripe price is configured for ${normalizeString(tier).toLowerCase() || "the selected"} package in ${normalizeString(currency).toUpperCase() || "the expected"} currency.`);
  }

  const stripe = getStripeServerClient();
  const price = await stripe.prices.retrieve(normalizedPriceId);
  const stripeCurrency = normalizeString(price?.currency).toLowerCase();
  const recurringInterval = normalizeString(price?.recurring?.interval).toLowerCase();

  if (stripeCurrency && normalizedCurrency && stripeCurrency !== normalizedCurrency) {
    throw new Error(
      `Stripe price ${normalizedPriceId} is configured for ${stripeCurrency.toUpperCase()}, but Hubforj package billing expects ${normalizedCurrency.toUpperCase()}. Update STRIPE_PRICE_${normalizeString(tier).toUpperCase()}_${normalizeString(currency).toUpperCase()}_MONTHLY to a matching GBP-only recurring price.`
    );
  }

  if (recurringInterval && recurringInterval !== "month") {
    throw new Error(`Stripe price ${normalizedPriceId} must be a monthly recurring price for Hubforj package billing.`);
  }

  return price;
}
