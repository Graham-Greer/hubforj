try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getHubPaymentConfigurationByHubId, upsertHubPaymentConfiguration } from "@/lib/data/hub-payment-configurations";
import { assertHubRegionalSetupComplete } from "@/lib/domain/hub-regional-setup";
import { getCountryRegionalConfig } from "@/lib/domain/regional-markets";
import { getStripeConnectEnvironmentState, getStripeServerClient } from "@/lib/server/stripe";

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry) => normalizeString(entry)).filter(Boolean);
}

function buildHubPublicUrl(hub) {
  const host = normalizeString(hub?.domain);

  if (!host) {
    return "";
  }

  return `https://${host}`;
}

function resolveHubStripeCountry(hub) {
  assertHubRegionalSetupComplete(hub);

  const country = normalizeString(hub?.country).toUpperCase();

  if (!country) {
    throw new Error("Hub country must be confirmed before starting Stripe setup.");
  }

  const market = getCountryRegionalConfig(country);

  if (!market || market?.stripe?.connectExpressSupported !== true) {
    throw new Error("Stripe Connect is not supported for this hub country yet.");
  }

  if (market?.stripe?.connectExpressSelfServeSupported !== true) {
    throw new Error("Stripe Connect for this country requires support-led onboarding.");
  }

  return country;
}

function assertHubCountryMatchesPaymentConfiguration(hub, configuration = {}) {
  const hubCountry = resolveHubStripeCountry(hub);
  const configurationCountry = normalizeString(configuration?.country).toUpperCase();

  if (configurationCountry && configurationCountry !== hubCountry) {
    throw new Error(
      "This hub's Stripe country no longer matches its saved business country. Contact support before continuing Stripe setup."
    );
  }

  return hubCountry;
}

export function mapStripeAccountToPaymentConfiguration(account = {}) {
  return {
    provider: "stripe",
    stripeAccountId: normalizeString(account.id),
    country: normalizeString(account.country).toUpperCase(),
    defaultCurrency: normalizeString(account.default_currency).toUpperCase(),
    businessType: normalizeString(account.business_type),
    chargesEnabled: account.charges_enabled === true,
    payoutsEnabled: account.payouts_enabled === true,
    detailsSubmitted: account.details_submitted === true,
    requirementsCurrentlyDue: normalizeStringArray(account?.requirements?.currently_due),
    requirementsEventuallyDue: normalizeStringArray(account?.requirements?.eventually_due),
    requirementsPastDue: normalizeStringArray(account?.requirements?.past_due),
    requirementsPendingVerification: normalizeStringArray(account?.requirements?.pending_verification),
    disabledReason: normalizeString(account?.requirements?.disabled_reason || account?.disabled_reason),
  };
}

function assertStripeConnectConfigured() {
  const state = getStripeConnectEnvironmentState();

  if (!state.configured) {
    throw new Error(`Stripe Connect is not configured yet. Missing: ${state.missing.join(", ")}`);
  }

  return state;
}

export async function syncHubStripeConnectedAccount(hub, actorId = "system") {
  assertStripeConnectConfigured();
  const existingConfiguration = await getHubPaymentConfigurationByHubId(hub.id);
  assertHubCountryMatchesPaymentConfiguration(hub, existingConfiguration);
  const stripeAccountId = normalizeString(existingConfiguration?.stripeAccountId);

  if (!stripeAccountId) {
    throw new Error("This hub does not have a connected Stripe account yet.");
  }

  const stripe = getStripeServerClient();
  const account = await stripe.accounts.retrieve(stripeAccountId);
  const now = new Date().toISOString();
  const mapped = mapStripeAccountToPaymentConfiguration(account);

  await upsertHubPaymentConfiguration(
    hub.id,
    {
      ...mapped,
      onboardingStartedAt: normalizeString(existingConfiguration.onboardingStartedAt) || now,
      onboardingCompletedAt:
        mapped.chargesEnabled && mapped.payoutsEnabled && mapped.detailsSubmitted
          ? normalizeString(existingConfiguration.onboardingCompletedAt) || now
          : normalizeString(existingConfiguration.onboardingCompletedAt),
    },
    actorId
  );

  return getHubPaymentConfigurationByHubId(hub.id);
}

export async function ensureHubStripeConnectedAccount(hub, { actorId = "system", contactEmail = "" } = {}) {
  assertStripeConnectConfigured();
  const hubCountry = resolveHubStripeCountry(hub);

  const existingConfiguration = await getHubPaymentConfigurationByHubId(hub.id);
  const existingStripeAccountId = normalizeString(existingConfiguration?.stripeAccountId);

  if (existingStripeAccountId) {
    assertHubCountryMatchesPaymentConfiguration(hub, existingConfiguration);
    return syncHubStripeConnectedAccount(hub, actorId);
  }

  const stripe = getStripeServerClient();
  const account = await stripe.accounts.create({
    type: "express",
    country: hubCountry,
    email: normalizeString(contactEmail) || undefined,
    business_profile: {
      name: normalizeString(hub?.name) || undefined,
      url: buildHubPublicUrl(hub) || undefined,
    },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: {
      hubId: normalizeString(hub?.id),
      hubSlug: normalizeString(hub?.slug),
      platformProduct: "hubforj",
      integrationSurface: "hub-platform-admin-payments",
    },
  });

  const now = new Date().toISOString();
  const mapped = mapStripeAccountToPaymentConfiguration(account);

  await upsertHubPaymentConfiguration(
    hub.id,
    {
      ...mapped,
      onboardingStartedAt: now,
      onboardingCompletedAt: mapped.chargesEnabled && mapped.payoutsEnabled && mapped.detailsSubmitted ? now : "",
    },
    actorId
  );

  return getHubPaymentConfigurationByHubId(hub.id);
}

export async function createHubStripeOnboardingAccountSession(hub, { actorId = "system", contactEmail = "" } = {}) {
  assertStripeConnectConfigured();

  const configuration = await ensureHubStripeConnectedAccount(hub, { actorId, contactEmail });
  const stripeAccountId = normalizeString(configuration?.stripeAccountId);

  if (!stripeAccountId) {
    throw new Error("Unable to create an onboarding session before a connected account exists.");
  }

  const stripe = getStripeServerClient();
  return stripe.accountSessions.create({
    account: stripeAccountId,
    components: {
      account_onboarding: {
        enabled: true,
      },
    },
  });
}
