import "server-only";

import { headers } from "next/headers";
import {
  getFallbackRegionalMarket,
  isSupportedRegionalMarketCountry,
  resolveRegionalDefaults,
} from "@/lib/domain/regional-markets";
import { getDefaultPackageCurrencyForCountry } from "@/lib/domain/package-pricing";

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeCountryCode(value) {
  return normalizeString(value).toUpperCase();
}

function normalizeLocaleCandidate(value) {
  const normalized = normalizeString(value);

  if (!normalized) {
    return "";
  }

  const [language = "", region = ""] = normalized.replace(/_/g, "-").split("-");

  if (!language) {
    return "";
  }

  return region
    ? `${language.toLowerCase()}-${region.toUpperCase()}`
    : language.toLowerCase();
}

function readHeaderValue(requestHeaders, key) {
  if (!requestHeaders || !key) {
    return "";
  }

  if (typeof requestHeaders.get === "function") {
    return normalizeString(requestHeaders.get(key));
  }

  return normalizeString(requestHeaders[key] || requestHeaders[key.toLowerCase()]);
}

function resolveCountryFromHeaders(requestHeaders) {
  const candidates = [
    "x-vercel-ip-country",
    "cf-ipcountry",
    "cloudfront-viewer-country",
    "x-country-code",
    "x-geo-country",
  ];

  for (const key of candidates) {
    const country = normalizeCountryCode(readHeaderValue(requestHeaders, key));

    if (country && isSupportedRegionalMarketCountry(country)) {
      return country;
    }
  }

  return "";
}

function resolveLocaleFromHeaders(requestHeaders) {
  const acceptLanguage = readHeaderValue(requestHeaders, "accept-language");

  if (!acceptLanguage) {
    return "";
  }

  const [primaryLanguage = ""] = acceptLanguage.split(",");
  const [localeValue = ""] = primaryLanguage.split(";");

  return normalizeLocaleCandidate(localeValue);
}

export function resolveRegionalDefaultsFromRequestHeaders(requestHeaders) {
  const fallbackMarket = getFallbackRegionalMarket();
  const country = resolveCountryFromHeaders(requestHeaders);
  const locale = resolveLocaleFromHeaders(requestHeaders);
  const regionalDefaults = resolveRegionalDefaults({
    country,
    locale,
  });

  return {
    country: regionalDefaults.country,
    locale: regionalDefaults.locale,
    timezone: regionalDefaults.timezone,
    defaultCurrency: regionalDefaults.defaultCurrency,
    packageCurrency: getDefaultPackageCurrencyForCountry(regionalDefaults.country),
    source: country ? "server_geo" : locale ? "accept_language" : "fallback",
    usedFallback: regionalDefaults.country === fallbackMarket.country && !country && !locale,
  };
}

export async function resolveProductSiteRequestRegionalDefaults() {
  const requestHeaders = await headers();
  return resolveRegionalDefaultsFromRequestHeaders(requestHeaders);
}
