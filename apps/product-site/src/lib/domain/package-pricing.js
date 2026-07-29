import { getCountryRegionalConfig, getFallbackRegionalMarket } from "./regional-markets.js";

const packageCurrencyMeta = {
  GBP: { displayPrefix: "£" },
};

const packagePriceMajors = {
  free: {
    GBP: 0,
  },
  starter: {
    GBP: 19,
  },
  growth: {
    GBP: 49,
  },
};

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeTier(value) {
  return normalizeString(value).toLowerCase();
}

function formatMajorAmount(value) {
  return new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatCurrencyDisplay(currency, majorAmount) {
  const meta = packageCurrencyMeta[currency] || { displayPrefix: `${currency} ` };
  return `${meta.displayPrefix}${formatMajorAmount(majorAmount)}`;
}

function convertMajorToMinorUnit(currency, majorAmount) {
  const numericAmount = Number(majorAmount || 0);

  return numericAmount * 100;
}

function buildTierCatalog(tier) {
  const tierPrices = packagePriceMajors[normalizeTier(tier)] || packagePriceMajors.free;

  return Object.fromEntries(
    Object.entries(tierPrices).map(([currency, majorAmount]) => [
      currency,
      {
        currency,
        unitAmount: convertMajorToMinorUnit(currency, majorAmount),
        display: formatCurrencyDisplay(currency, majorAmount),
        interval: "month",
      },
    ]),
  );
}

const packagePricingCatalog = {
  free: buildTierCatalog("free"),
  starter: buildTierCatalog("starter"),
  growth: buildTierCatalog("growth"),
};

function getPackageTierCatalog(tier) {
  return packagePricingCatalog[normalizeTier(tier)] || packagePricingCatalog.free;
}

export function getPackagePricingCatalog() {
  return packagePricingCatalog;
}

export function getDefaultPackageCurrencyForCountry(country) {
  void country;
  return "GBP";
}

export function describePackageBillingMarket({ tier = "starter", country = "", currency = "" } = {}) {
  const normalizedTier = normalizeTier(tier) || "starter";
  const market = getCountryRegionalConfig(country) || getFallbackRegionalMarket();
  const resolvedSelection = resolvePackagePricingSelection({
    tier: normalizedTier,
    country,
    currency,
  });

  return {
    country: market.country,
    countryLabel: market.label,
    marketCurrency: "GBP",
    selectedCurrency: resolvedSelection.currency,
    usesFallbackCurrency: false,
  };
}

export function resolvePackagePricingSelection({ tier = "", country = "", currency = "" } = {}) {
  const normalizedTier = normalizeTier(tier) || "free";
  const tierCatalog = getPackageTierCatalog(normalizedTier);
  void country;
  void currency;
  const resolvedCurrency = "GBP";

  return {
    tier: normalizedTier,
    currency: resolvedCurrency,
    pricing: tierCatalog[resolvedCurrency] || Object.values(tierCatalog)[0],
  };
}

export function getPackagePricingForTierAndCurrency(tier, currency, options = {}) {
  return resolvePackagePricingSelection({
    tier,
    currency,
    country: options.country,
  }).pricing;
}
