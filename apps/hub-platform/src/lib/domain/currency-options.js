import {
  getAllowedCurrenciesForCountry,
  getFallbackRegionalMarket,
} from "./regional-markets.js";

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeCurrency(value) {
  return normalizeString(value).toUpperCase();
}

export function resolveHubCurrencyValue(hub = null, currentCurrency = "") {
  return (
    normalizeCurrency(currentCurrency)
    || normalizeCurrency(hub?.defaultCurrency)
    || getFallbackRegionalMarket().defaultCurrency
  );
}

export function getHubCurrencySelectOptions(hub = null, currentCurrency = "") {
  const optionValues = [];
  const normalizedCurrent = normalizeCurrency(currentCurrency);
  const normalizedFallback = resolveHubCurrencyValue(hub);
  const allowedCurrencies = getAllowedCurrenciesForCountry(hub?.country);

  if (normalizedCurrent) {
    optionValues.push(normalizedCurrent);
  }

  allowedCurrencies.forEach((currency) => {
    if (!optionValues.includes(currency)) {
      optionValues.push(currency);
    }
  });

  if (!optionValues.includes(normalizedFallback)) {
    optionValues.push(normalizedFallback);
  }

  return optionValues.map((currency) => ({
    value: currency,
    label: currency,
  }));
}
