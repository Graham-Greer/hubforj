import test from "node:test";
import assert from "node:assert/strict";
import {
  getAllowedCurrenciesForCountry,
  getAllowedLocalesForCountry,
  getAllowedTimezonesForCountry,
  getCountryRegionalConfig,
  resolveLaunchFormattingLocale,
  getSupportedCountryOptions,
  resolveRegionalDefaults,
  validateRegionalSelection,
} from "../../src/lib/domain/regional-markets.js";

test("supported regional markets expose detailed country options", () => {
  const options = getSupportedCountryOptions();

  assert.ok(options.some((option) => option.value === "AU" && option.label === "Australia"));
  assert.ok(options.some((option) => option.value === "CA" && option.label === "Canada"));
  assert.ok(options.some((option) => option.value === "DE" && option.label === "Germany"));
  assert.ok(options.some((option) => option.value === "JP" && option.label === "Japan"));
  assert.ok(options.some((option) => option.value === "CH" && option.label === "Switzerland"));
});

test("resolveRegionalDefaults derives canonical values from explicit country", () => {
  const regionalDefaults = resolveRegionalDefaults({
    country: "de",
  });

  assert.deepEqual(regionalDefaults, {
    country: "DE",
    locale: "en-GB",
    timezone: "Europe/Berlin",
    defaultCurrency: "EUR",
  });
});

test("resolveRegionalDefaults can infer market from locale and timezone with USD fallback", () => {
  assert.deepEqual(resolveRegionalDefaults({ locale: "en-GB" }), {
    country: "GB",
    locale: "en-GB",
    timezone: "Europe/London",
    defaultCurrency: "GBP",
  });

  assert.deepEqual(resolveRegionalDefaults({ timezone: "Asia/Tokyo" }), {
    country: "JP",
    locale: "en-GB",
    timezone: "Asia/Tokyo",
    defaultCurrency: "JPY",
  });

  assert.deepEqual(resolveRegionalDefaults({}), {
    country: "US",
    locale: "en-US",
    timezone: "America/New_York",
    defaultCurrency: "USD",
  });
});

test("regional market helpers expose country-scoped configuration", () => {
  assert.equal(getCountryRegionalConfig("AU")?.defaultCurrency, "AUD");
  assert.equal(getCountryRegionalConfig("AU")?.stripeProfile, "express_self_serve");
  assert.equal(getCountryRegionalConfig("AU")?.stripe?.connectExpressSelfServeSupported, true);
  assert.deepEqual(getAllowedCurrenciesForCountry("ES"), ["EUR"]);
  assert.ok(getAllowedLocalesForCountry("BE").includes("en-GB"));
  assert.ok(!getAllowedLocalesForCountry("BE").includes("fr-BE"));
  assert.ok(getAllowedTimezonesForCountry("US").includes("America/Los_Angeles"));
});

test("launch formatting locale stays English-only even for non-English markets", () => {
  assert.equal(resolveLaunchFormattingLocale("es-ES", "ES"), "en-GB");
  assert.equal(resolveLaunchFormattingLocale("de-DE", "DE"), "en-GB");
  assert.equal(resolveLaunchFormattingLocale("en-US", "DE"), "en-US");
  assert.equal(resolveLaunchFormattingLocale("", "AU"), "en-AU");
});

test("validateRegionalSelection rejects unsupported countries and invalid combinations", () => {
  assert.throws(() => validateRegionalSelection({ country: "ZA" }), /Country is not supported yet\./);
  assert.throws(
    () => validateRegionalSelection({ country: "DE", locale: "es-ES" }),
    /Selected locale is not supported for Germany\./
  );
  assert.throws(
    () => validateRegionalSelection({ country: "CA", timezone: "Europe/London" }),
    /Selected timezone is not supported for Canada\./
  );
});
