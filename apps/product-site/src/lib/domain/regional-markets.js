function normalizeString(value) {
  return String(value || "").trim();
}

const stripeCapabilityProfiles = Object.freeze({
  express_self_serve: Object.freeze({
    packageCheckoutSupported: true,
    connectExpressSupported: true,
    connectExpressSelfServeSupported: true,
    crossBorderPayoutRequired: false,
  }),
});

function createRegionalMarket({
  country,
  label,
  defaultLocale,
  allowedLocales,
  defaultTimezone,
  allowedTimezones,
  defaultCurrency,
  allowedCurrencies,
  stripeProfile = "express_self_serve",
}) {
  const normalizedStripeProfile = normalizeString(stripeProfile).toLowerCase() || "express_self_serve";
  const stripeCapabilities = stripeCapabilityProfiles[normalizedStripeProfile];

  if (!stripeCapabilities) {
    throw new Error(`Unsupported Stripe capability profile "${stripeProfile}" for ${country || "unknown country"}.`);
  }

  return {
    country,
    label,
    defaultLocale,
    allowedLocales,
    defaultTimezone,
    allowedTimezones,
    defaultCurrency,
    allowedCurrencies,
    stripeProfile: normalizedStripeProfile,
    stripe: { ...stripeCapabilities },
  };
}

export const supportedRegionalMarkets = [
  createRegionalMarket({
    country: "US",
    label: "United States",
    defaultLocale: "en-US",
    allowedLocales: ["en-US"],
    defaultTimezone: "America/New_York",
    allowedTimezones: [
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Los_Angeles",
      "America/Phoenix",
      "America/Anchorage",
      "Pacific/Honolulu",
    ],
    defaultCurrency: "USD",
    allowedCurrencies: ["USD"],
  }),
  createRegionalMarket({
    country: "GB",
    label: "United Kingdom",
    defaultLocale: "en-GB",
    allowedLocales: ["en-GB"],
    defaultTimezone: "Europe/London",
    allowedTimezones: ["Europe/London"],
    defaultCurrency: "GBP",
    allowedCurrencies: ["GBP"],
  }),
  createRegionalMarket({
    country: "AU",
    label: "Australia",
    defaultLocale: "en-AU",
    allowedLocales: ["en-AU"],
    defaultTimezone: "Australia/Sydney",
    allowedTimezones: [
      "Australia/Sydney",
      "Australia/Melbourne",
      "Australia/Brisbane",
      "Australia/Perth",
      "Australia/Adelaide",
      "Australia/Darwin",
      "Australia/Hobart",
    ],
    defaultCurrency: "AUD",
    allowedCurrencies: ["AUD"],
  }),
  createRegionalMarket({
    country: "AT",
    label: "Austria",
    defaultLocale: "de-AT",
    allowedLocales: ["de-AT", "en-AT"],
    defaultTimezone: "Europe/Vienna",
    allowedTimezones: ["Europe/Vienna"],
    defaultCurrency: "EUR",
    allowedCurrencies: ["EUR"],
  }),
  createRegionalMarket({
    country: "BE",
    label: "Belgium",
    defaultLocale: "nl-BE",
    allowedLocales: ["nl-BE", "fr-BE", "de-BE", "en-BE"],
    defaultTimezone: "Europe/Brussels",
    allowedTimezones: ["Europe/Brussels"],
    defaultCurrency: "EUR",
    allowedCurrencies: ["EUR"],
  }),
  createRegionalMarket({
    country: "BR",
    label: "Brazil",
    defaultLocale: "pt-BR",
    allowedLocales: ["pt-BR", "en-BR"],
    defaultTimezone: "America/Sao_Paulo",
    allowedTimezones: [
      "America/Sao_Paulo",
      "America/Recife",
      "America/Manaus",
      "America/Cuiaba",
      "America/Belem",
    ],
    defaultCurrency: "BRL",
    allowedCurrencies: ["BRL"],
  }),
  createRegionalMarket({
    country: "BG",
    label: "Bulgaria",
    defaultLocale: "bg-BG",
    allowedLocales: ["bg-BG", "en-BG"],
    defaultTimezone: "Europe/Sofia",
    allowedTimezones: ["Europe/Sofia"],
    defaultCurrency: "BGN",
    allowedCurrencies: ["BGN"],
  }),
  createRegionalMarket({
    country: "CA",
    label: "Canada",
    defaultLocale: "en-CA",
    allowedLocales: ["en-CA", "fr-CA"],
    defaultTimezone: "America/Toronto",
    allowedTimezones: [
      "America/Toronto",
      "America/Vancouver",
      "America/Edmonton",
      "America/Winnipeg",
      "America/Halifax",
      "America/St_Johns",
    ],
    defaultCurrency: "CAD",
    allowedCurrencies: ["CAD"],
  }),
  createRegionalMarket({
    country: "HR",
    label: "Croatia",
    defaultLocale: "hr-HR",
    allowedLocales: ["hr-HR", "en-HR"],
    defaultTimezone: "Europe/Zagreb",
    allowedTimezones: ["Europe/Zagreb"],
    defaultCurrency: "EUR",
    allowedCurrencies: ["EUR"],
  }),
  createRegionalMarket({
    country: "CY",
    label: "Cyprus",
    defaultLocale: "el-CY",
    allowedLocales: ["el-CY", "en-CY"],
    defaultTimezone: "Asia/Nicosia",
    allowedTimezones: ["Asia/Nicosia"],
    defaultCurrency: "EUR",
    allowedCurrencies: ["EUR"],
  }),
  createRegionalMarket({
    country: "CZ",
    label: "Czech Republic",
    defaultLocale: "cs-CZ",
    allowedLocales: ["cs-CZ", "en-CZ"],
    defaultTimezone: "Europe/Prague",
    allowedTimezones: ["Europe/Prague"],
    defaultCurrency: "CZK",
    allowedCurrencies: ["CZK"],
  }),
  createRegionalMarket({
    country: "DK",
    label: "Denmark",
    defaultLocale: "da-DK",
    allowedLocales: ["da-DK", "en-DK"],
    defaultTimezone: "Europe/Copenhagen",
    allowedTimezones: ["Europe/Copenhagen"],
    defaultCurrency: "DKK",
    allowedCurrencies: ["DKK"],
  }),
  createRegionalMarket({
    country: "EE",
    label: "Estonia",
    defaultLocale: "et-EE",
    allowedLocales: ["et-EE", "en-EE"],
    defaultTimezone: "Europe/Tallinn",
    allowedTimezones: ["Europe/Tallinn"],
    defaultCurrency: "EUR",
    allowedCurrencies: ["EUR"],
  }),
  createRegionalMarket({
    country: "FI",
    label: "Finland",
    defaultLocale: "fi-FI",
    allowedLocales: ["fi-FI", "sv-FI", "en-FI"],
    defaultTimezone: "Europe/Helsinki",
    allowedTimezones: ["Europe/Helsinki"],
    defaultCurrency: "EUR",
    allowedCurrencies: ["EUR"],
  }),
  createRegionalMarket({
    country: "FR",
    label: "France",
    defaultLocale: "fr-FR",
    allowedLocales: ["fr-FR", "en-FR"],
    defaultTimezone: "Europe/Paris",
    allowedTimezones: ["Europe/Paris"],
    defaultCurrency: "EUR",
    allowedCurrencies: ["EUR"],
  }),
  createRegionalMarket({
    country: "DE",
    label: "Germany",
    defaultLocale: "de-DE",
    allowedLocales: ["de-DE", "en-DE"],
    defaultTimezone: "Europe/Berlin",
    allowedTimezones: ["Europe/Berlin"],
    defaultCurrency: "EUR",
    allowedCurrencies: ["EUR"],
  }),
  createRegionalMarket({
    country: "GR",
    label: "Greece",
    defaultLocale: "el-GR",
    allowedLocales: ["el-GR", "en-GR"],
    defaultTimezone: "Europe/Athens",
    allowedTimezones: ["Europe/Athens"],
    defaultCurrency: "EUR",
    allowedCurrencies: ["EUR"],
  }),
  createRegionalMarket({
    country: "HK",
    label: "Hong Kong",
    defaultLocale: "zh-HK",
    allowedLocales: ["zh-HK", "en-HK"],
    defaultTimezone: "Asia/Hong_Kong",
    allowedTimezones: ["Asia/Hong_Kong"],
    defaultCurrency: "HKD",
    allowedCurrencies: ["HKD"],
  }),
  createRegionalMarket({
    country: "HU",
    label: "Hungary",
    defaultLocale: "hu-HU",
    allowedLocales: ["hu-HU", "en-HU"],
    defaultTimezone: "Europe/Budapest",
    allowedTimezones: ["Europe/Budapest"],
    defaultCurrency: "HUF",
    allowedCurrencies: ["HUF"],
  }),
  createRegionalMarket({
    country: "IE",
    label: "Ireland",
    defaultLocale: "en-IE",
    allowedLocales: ["en-IE", "ga-IE"],
    defaultTimezone: "Europe/Dublin",
    allowedTimezones: ["Europe/Dublin"],
    defaultCurrency: "EUR",
    allowedCurrencies: ["EUR"],
  }),
  createRegionalMarket({
    country: "IT",
    label: "Italy",
    defaultLocale: "it-IT",
    allowedLocales: ["it-IT", "en-IT"],
    defaultTimezone: "Europe/Rome",
    allowedTimezones: ["Europe/Rome"],
    defaultCurrency: "EUR",
    allowedCurrencies: ["EUR"],
  }),
  createRegionalMarket({
    country: "JP",
    label: "Japan",
    defaultLocale: "ja-JP",
    allowedLocales: ["ja-JP", "en-JP"],
    defaultTimezone: "Asia/Tokyo",
    allowedTimezones: ["Asia/Tokyo"],
    defaultCurrency: "JPY",
    allowedCurrencies: ["JPY"],
  }),
  createRegionalMarket({
    country: "LV",
    label: "Latvia",
    defaultLocale: "lv-LV",
    allowedLocales: ["lv-LV", "en-LV"],
    defaultTimezone: "Europe/Riga",
    allowedTimezones: ["Europe/Riga"],
    defaultCurrency: "EUR",
    allowedCurrencies: ["EUR"],
  }),
  createRegionalMarket({
    country: "LT",
    label: "Lithuania",
    defaultLocale: "lt-LT",
    allowedLocales: ["lt-LT", "en-LT"],
    defaultTimezone: "Europe/Vilnius",
    allowedTimezones: ["Europe/Vilnius"],
    defaultCurrency: "EUR",
    allowedCurrencies: ["EUR"],
  }),
  createRegionalMarket({
    country: "LU",
    label: "Luxembourg",
    defaultLocale: "fr-LU",
    allowedLocales: ["fr-LU", "de-LU", "en-LU"],
    defaultTimezone: "Europe/Luxembourg",
    allowedTimezones: ["Europe/Luxembourg"],
    defaultCurrency: "EUR",
    allowedCurrencies: ["EUR"],
  }),
  createRegionalMarket({
    country: "MT",
    label: "Malta",
    defaultLocale: "en-MT",
    allowedLocales: ["en-MT", "mt-MT"],
    defaultTimezone: "Europe/Malta",
    allowedTimezones: ["Europe/Malta"],
    defaultCurrency: "EUR",
    allowedCurrencies: ["EUR"],
  }),
  createRegionalMarket({
    country: "MX",
    label: "Mexico",
    defaultLocale: "es-MX",
    allowedLocales: ["es-MX", "en-MX"],
    defaultTimezone: "America/Mexico_City",
    allowedTimezones: [
      "America/Mexico_City",
      "America/Cancun",
      "America/Monterrey",
      "America/Chihuahua",
      "America/Tijuana",
    ],
    defaultCurrency: "MXN",
    allowedCurrencies: ["MXN"],
  }),
  createRegionalMarket({
    country: "NL",
    label: "Netherlands",
    defaultLocale: "nl-NL",
    allowedLocales: ["nl-NL", "en-NL"],
    defaultTimezone: "Europe/Amsterdam",
    allowedTimezones: ["Europe/Amsterdam"],
    defaultCurrency: "EUR",
    allowedCurrencies: ["EUR"],
  }),
  createRegionalMarket({
    country: "NZ",
    label: "New Zealand",
    defaultLocale: "en-NZ",
    allowedLocales: ["en-NZ", "mi-NZ"],
    defaultTimezone: "Pacific/Auckland",
    allowedTimezones: ["Pacific/Auckland", "Pacific/Chatham"],
    defaultCurrency: "NZD",
    allowedCurrencies: ["NZD"],
  }),
  createRegionalMarket({
    country: "NO",
    label: "Norway",
    defaultLocale: "nb-NO",
    allowedLocales: ["nb-NO", "nn-NO", "en-NO"],
    defaultTimezone: "Europe/Oslo",
    allowedTimezones: ["Europe/Oslo"],
    defaultCurrency: "NOK",
    allowedCurrencies: ["NOK"],
  }),
  createRegionalMarket({
    country: "PL",
    label: "Poland",
    defaultLocale: "pl-PL",
    allowedLocales: ["pl-PL", "en-PL"],
    defaultTimezone: "Europe/Warsaw",
    allowedTimezones: ["Europe/Warsaw"],
    defaultCurrency: "PLN",
    allowedCurrencies: ["PLN"],
  }),
  createRegionalMarket({
    country: "PT",
    label: "Portugal",
    defaultLocale: "pt-PT",
    allowedLocales: ["pt-PT", "en-PT"],
    defaultTimezone: "Europe/Lisbon",
    allowedTimezones: ["Europe/Lisbon", "Atlantic/Madeira", "Atlantic/Azores"],
    defaultCurrency: "EUR",
    allowedCurrencies: ["EUR"],
  }),
  createRegionalMarket({
    country: "RO",
    label: "Romania",
    defaultLocale: "ro-RO",
    allowedLocales: ["ro-RO", "en-RO"],
    defaultTimezone: "Europe/Bucharest",
    allowedTimezones: ["Europe/Bucharest"],
    defaultCurrency: "RON",
    allowedCurrencies: ["RON"],
  }),
  createRegionalMarket({
    country: "SG",
    label: "Singapore",
    defaultLocale: "en-SG",
    allowedLocales: ["en-SG", "zh-SG", "ms-SG"],
    defaultTimezone: "Asia/Singapore",
    allowedTimezones: ["Asia/Singapore"],
    defaultCurrency: "SGD",
    allowedCurrencies: ["SGD"],
  }),
  createRegionalMarket({
    country: "SK",
    label: "Slovakia",
    defaultLocale: "sk-SK",
    allowedLocales: ["sk-SK", "en-SK"],
    defaultTimezone: "Europe/Bratislava",
    allowedTimezones: ["Europe/Bratislava"],
    defaultCurrency: "EUR",
    allowedCurrencies: ["EUR"],
  }),
  createRegionalMarket({
    country: "SI",
    label: "Slovenia",
    defaultLocale: "sl-SI",
    allowedLocales: ["sl-SI", "en-SI"],
    defaultTimezone: "Europe/Ljubljana",
    allowedTimezones: ["Europe/Ljubljana"],
    defaultCurrency: "EUR",
    allowedCurrencies: ["EUR"],
  }),
  createRegionalMarket({
    country: "ES",
    label: "Spain",
    defaultLocale: "es-ES",
    allowedLocales: ["es-ES", "ca-ES", "eu-ES", "gl-ES", "en-ES"],
    defaultTimezone: "Europe/Madrid",
    allowedTimezones: ["Europe/Madrid", "Atlantic/Canary"],
    defaultCurrency: "EUR",
    allowedCurrencies: ["EUR"],
  }),
  createRegionalMarket({
    country: "SE",
    label: "Sweden",
    defaultLocale: "sv-SE",
    allowedLocales: ["sv-SE", "en-SE"],
    defaultTimezone: "Europe/Stockholm",
    allowedTimezones: ["Europe/Stockholm"],
    defaultCurrency: "SEK",
    allowedCurrencies: ["SEK"],
  }),
  createRegionalMarket({
    country: "CH",
    label: "Switzerland",
    defaultLocale: "de-CH",
    allowedLocales: ["de-CH", "fr-CH", "it-CH", "en-CH"],
    defaultTimezone: "Europe/Zurich",
    allowedTimezones: ["Europe/Zurich"],
    defaultCurrency: "CHF",
    allowedCurrencies: ["CHF"],
  }),
];

const fallbackRegionalMarket = supportedRegionalMarkets.find((market) => market.country === "US");

function normalizeCountryCode(value) {
  return normalizeString(value).toUpperCase();
}

function normalizeLocale(value) {
  return normalizeString(value);
}

function normalizeTimezone(value) {
  return normalizeString(value);
}

function normalizeCurrencyCode(value) {
  return normalizeString(value).toUpperCase();
}

function sortMarketsByLabel(markets) {
  return markets.slice().sort((left, right) => left.label.localeCompare(right.label));
}

export function getFallbackRegionalMarket() {
  return fallbackRegionalMarket;
}

export function getCountryRegionalConfig(country) {
  const normalizedCountry = normalizeCountryCode(country);

  return supportedRegionalMarkets.find((market) => market.country === normalizedCountry) || null;
}

export function isSupportedRegionalMarketCountry(country) {
  return Boolean(getCountryRegionalConfig(country));
}

export function getSupportedCountryOptions() {
  return sortMarketsByLabel(supportedRegionalMarkets).map((market) => ({
    value: market.country,
    label: market.label,
  }));
}

export function getAllowedLocalesForCountry(country) {
  return getCountryRegionalConfig(country)?.allowedLocales || [];
}

export function getAllowedTimezonesForCountry(country) {
  return getCountryRegionalConfig(country)?.allowedTimezones || [];
}

export function getDefaultCurrencyForCountry(country) {
  return getCountryRegionalConfig(country)?.defaultCurrency || fallbackRegionalMarket.defaultCurrency;
}

function inferCountryFromLocale(locale) {
  const normalizedLocale = normalizeLocale(locale).toLowerCase();

  if (!normalizedLocale) {
    return "";
  }

  return (
    supportedRegionalMarkets.find((market) =>
      market.allowedLocales.some((entry) => entry.toLowerCase() === normalizedLocale)
    )?.country || ""
  );
}

function inferCountryFromTimezone(timezone) {
  const normalizedTimezone = normalizeTimezone(timezone);

  if (!normalizedTimezone) {
    return "";
  }

  return (
    supportedRegionalMarkets.find((market) => market.allowedTimezones.includes(normalizedTimezone))?.country || ""
  );
}

export function validateRegionalSelection({
  country = "",
  locale = "",
  timezone = "",
  defaultCurrency = "",
} = {}) {
  const normalizedCountry = normalizeCountryCode(country);

  if (!normalizedCountry) {
    return;
  }

  const market = getCountryRegionalConfig(normalizedCountry);

  if (!market) {
    throw new Error("Country is not supported yet.");
  }

  const normalizedLocale = normalizeLocale(locale);
  if (normalizedLocale && !market.allowedLocales.includes(normalizedLocale)) {
    throw new Error(`Selected locale is not supported for ${market.label}.`);
  }

  const normalizedTimezone = normalizeTimezone(timezone);
  if (normalizedTimezone && !market.allowedTimezones.includes(normalizedTimezone)) {
    throw new Error(`Selected timezone is not supported for ${market.label}.`);
  }

  const normalizedCurrency = normalizeCurrencyCode(defaultCurrency);
  if (normalizedCurrency && !market.allowedCurrencies.includes(normalizedCurrency)) {
    throw new Error(`Selected currency is not supported for ${market.label}.`);
  }
}

export function resolveRegionalDefaults({
  country = "",
  locale = "",
  timezone = "",
  defaultCurrency = "",
} = {}) {
  validateRegionalSelection({ country, locale, timezone, defaultCurrency });

  const explicitCountry = normalizeCountryCode(country);
  const inferredCountry =
    explicitCountry
    || inferCountryFromLocale(locale)
    || inferCountryFromTimezone(timezone)
    || fallbackRegionalMarket.country;
  const market = getCountryRegionalConfig(inferredCountry) || fallbackRegionalMarket;

  const normalizedLocale = normalizeLocale(locale);
  const normalizedTimezone = normalizeTimezone(timezone);
  const normalizedCurrency = normalizeCurrencyCode(defaultCurrency);

  return {
    country: market.country,
    locale: market.allowedLocales.includes(normalizedLocale) ? normalizedLocale : market.defaultLocale,
    timezone: market.allowedTimezones.includes(normalizedTimezone) ? normalizedTimezone : market.defaultTimezone,
    defaultCurrency: market.allowedCurrencies.includes(normalizedCurrency)
      ? normalizedCurrency
      : market.defaultCurrency,
  };
}
