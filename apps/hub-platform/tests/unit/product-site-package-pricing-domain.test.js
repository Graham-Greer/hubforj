import test from "node:test";
import assert from "node:assert/strict";

const packagePricingModule = await import("../../../product-site/src/lib/domain/package-pricing.js");
const packageCatalogModule = await import("../../../product-site/src/lib/domain/package-catalog.js");

test("product-site package pricing stays GBP-only regardless of selected business country", () => {
  assert.equal(packagePricingModule.getDefaultPackageCurrencyForCountry("US"), "GBP");
  assert.equal(packagePricingModule.getDefaultPackageCurrencyForCountry("GB"), "GBP");
  assert.equal(packagePricingModule.getDefaultPackageCurrencyForCountry("DE"), "GBP");
  assert.equal(packagePricingModule.getDefaultPackageCurrencyForCountry("AU"), "GBP");
  assert.equal(packagePricingModule.getDefaultPackageCurrencyForCountry("BR"), "GBP");
  assert.equal(packagePricingModule.getDefaultPackageCurrencyForCountry("CA"), "GBP");
  assert.equal(packagePricingModule.getDefaultPackageCurrencyForCountry("SE"), "GBP");
  assert.equal(packagePricingModule.getDefaultPackageCurrencyForCountry("ZZ"), "GBP");
});

test("product-site package pricing describes GBP billing consistently across markets", () => {
  assert.deepEqual(
    packagePricingModule.describePackageBillingMarket({ tier: "starter", country: "BR" }),
    {
      country: "BR",
      countryLabel: "Brazil",
      marketCurrency: "GBP",
      selectedCurrency: "GBP",
      usesFallbackCurrency: false,
    },
  );
  assert.deepEqual(
    packagePricingModule.describePackageBillingMarket({ tier: "starter", country: "GB" }),
    {
      country: "GB",
      countryLabel: "United Kingdom",
      marketCurrency: "GBP",
      selectedCurrency: "GBP",
      usesFallbackCurrency: false,
    },
  );
  assert.deepEqual(
    packagePricingModule.describePackageBillingMarket({ tier: "starter", country: "ZZ" }),
    {
      country: "US",
      countryLabel: "United States",
      marketCurrency: "GBP",
      selectedCurrency: "GBP",
      usesFallbackCurrency: false,
    },
  );
});

test("product-site package pricing returns GBP commercial amounts for every selected currency input", () => {
  assert.deepEqual(
    packagePricingModule.getPackagePricingForTierAndCurrency("starter", "EUR"),
    { currency: "GBP", unitAmount: 1900, display: "£19", interval: "month" },
  );
  assert.deepEqual(
    packagePricingModule.getPackagePricingForTierAndCurrency("growth", "AUD"),
    { currency: "GBP", unitAmount: 4900, display: "£49", interval: "month" },
  );
  assert.deepEqual(
    packagePricingModule.getPackagePricingForTierAndCurrency("starter", "JPY"),
    { currency: "GBP", unitAmount: 1900, display: "£19", interval: "month" },
  );
});

test("product-site package catalog always shows GBP SaaS pricing", () => {
  const fallbackCatalog = packageCatalogModule.getPackageCatalog();
  const gbCatalog = packageCatalogModule.getPackageCatalog({ country: "GB" });
  const brCatalog = packageCatalogModule.getPackageCatalog({ country: "BR" });
  const seCatalog = packageCatalogModule.getPackageCatalog({ country: "SE" });

  assert.equal(fallbackCatalog.find((item) => item.tier === "starter")?.priceLabel, "£19");
  assert.equal(fallbackCatalog.find((item) => item.tier === "growth")?.priceLabel, "£49");
  assert.equal(gbCatalog.find((item) => item.tier === "starter")?.priceLabel, "£19");
  assert.equal(gbCatalog.find((item) => item.tier === "growth")?.priceLabel, "£49");
  assert.equal(brCatalog.find((item) => item.tier === "starter")?.priceLabel, "£19");
  assert.equal(brCatalog.find((item) => item.tier === "growth")?.priceLabel, "£49");
  assert.equal(seCatalog.find((item) => item.tier === "starter")?.priceLabel, "£19");
  assert.equal(seCatalog.find((item) => item.tier === "growth")?.priceLabel, "£49");
});
