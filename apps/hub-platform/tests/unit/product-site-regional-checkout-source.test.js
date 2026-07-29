import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("product-site signup checkout keeps Stripe package billing separate from hub regional setup", () => {
  const signupActionSource = readFileSync(
    new URL("../../../product-site/src/app/(marketing)/signup/actions.js", import.meta.url),
    "utf8"
  );
  const signupDomainSource = readFileSync(
    new URL("../../../product-site/src/lib/domain/signup.js", import.meta.url),
    "utf8"
  );

  assert.match(signupActionSource, /country: normalized\.payload\.country/);
  assert.match(signupActionSource, /timezone: normalized\.payload\.timezone/);
  assert.match(signupActionSource, /locale: normalized\.payload\.locale/);
  assert.match(signupActionSource, /defaultCurrency: normalized\.payload\.defaultCurrency/);
  assert.match(signupDomainSource, /initialHubProvisioningDefaults/);
  assert.match(signupDomainSource, /country: "GB"/);
  assert.match(signupDomainSource, /timezone: "Europe\/London"/);
  assert.match(signupDomainSource, /locale: "en-GB"/);
  assert.match(signupDomainSource, /defaultCurrency: "GBP"/);
});

test("product-site request regional defaults resolve from hosting headers with graceful fallback", () => {
  const requestRegionalSource = readFileSync(
    new URL("../../../product-site/src/lib/server/request-regional-context.js", import.meta.url),
    "utf8"
  );

  assert.match(requestRegionalSource, /from "next\/headers"/);
  assert.match(requestRegionalSource, /"x-vercel-ip-country"/);
  assert.match(requestRegionalSource, /"cf-ipcountry"/);
  assert.match(requestRegionalSource, /"cloudfront-viewer-country"/);
  assert.match(requestRegionalSource, /"accept-language"/);
  assert.match(requestRegionalSource, /resolveRegionalDefaultsFromRequestHeaders/);
  assert.match(requestRegionalSource, /resolveProductSiteRequestRegionalDefaults/);
});

test("product-site package checkout uses fixed GBP billing settings", () => {
  const billingSource = readFileSync(
    new URL("../../../product-site/src/lib/server/commercial-billing.js", import.meta.url),
    "utf8"
  );
  const stripeSource = readFileSync(
    new URL("../../../product-site/src/lib/server/stripe.js", import.meta.url),
    "utf8"
  );

  assert.match(billingSource, /resolveCheckoutRegionalContext/);
  assert.match(billingSource, /resolvePackageCheckoutCurrency/);
  assert.match(billingSource, /resolveStripePriceSelection/);
  assert.match(billingSource, /assertStripePriceMatchesSelection/);
  assert.match(billingSource, /const productSiteBillingCountry = "GB"/);
  assert.match(billingSource, /const productSiteBillingLocale = "en-GB"/);
  assert.match(billingSource, /const productSiteBillingCurrency = "GBP"/);
  assert.match(billingSource, /currency: priceSelection\.currency\.toLowerCase\(\)/);
  assert.match(billingSource, /locale: checkoutRegion\.locale/);
  assert.match(billingSource, /country: checkoutRegion\.country/);
  assert.match(billingSource, /packageCurrency: priceSelection\.currency/);
  assert.match(stripeSource, /export function getStripePriceIdForTierAndCurrency/);
  assert.match(stripeSource, /export function getConfiguredStripePackageBillingCurrencies/);
  assert.match(stripeSource, /export function resolveStripePriceSelection/);
  assert.match(stripeSource, /export function getPackageTierAndCurrencyForStripePriceId/);
  assert.match(stripeSource, /export async function assertStripePriceMatchesSelection/);
  assert.match(stripeSource, /starter:\s*\{\s*GBP:/);
  assert.match(stripeSource, /growth:\s*\{\s*GBP:/);
});

test("product-site commercial display models stay on en-GB instead of inheriting hub locale", () => {
  const billingDomainSource = readFileSync(
    new URL("../../../product-site/src/lib/domain/commercial-billing.js", import.meta.url),
    "utf8"
  );
  const packageCatalogSource = readFileSync(
    new URL("../../../product-site/src/lib/domain/package-catalog.js", import.meta.url),
    "utf8"
  );
  const sessionRouteSource = readFileSync(
    new URL("../../../product-site/src/app/api/auth/commercial/session/route.js", import.meta.url),
    "utf8"
  );
  const accountOverviewSource = readFileSync(
    new URL("../../../product-site/src/app/(account)/account/page.jsx", import.meta.url),
    "utf8"
  );
  const accountBillingSource = readFileSync(
    new URL("../../../product-site/src/app/(account)/account/billing/page.jsx", import.meta.url),
    "utf8"
  );
  const accountUpgradeSource = readFileSync(
    new URL("../../../product-site/src/app/(account)/account/upgrade/page.jsx", import.meta.url),
    "utf8"
  );
  const accountPackageSource = readFileSync(
    new URL("../../../product-site/src/app/(account)/account/package/page.jsx", import.meta.url),
    "utf8"
  );

  assert.match(billingDomainSource, /const productSiteBillingLocale = "en-GB"/);
  assert.match(billingDomainSource, /formatDateLabel\(scheduledEndDate, locale\)/);
  assert.match(packageCatalogSource, /const productSiteBillingLocale = "en-GB"/);
  assert.match(packageCatalogSource, /formatDateLabel\(scheduledCancellationDate, locale\)/);
  assert.match(sessionRouteSource, /locale: "en-GB"/);
  assert.match(accountOverviewSource, /const productSiteBillingLocale = "en-GB"/);
  assert.match(accountBillingSource, /const productSiteBillingLocale = "en-GB"/);
  assert.match(accountUpgradeSource, /const productSiteBillingLocale = "en-GB"/);
  assert.match(accountPackageSource, /const productSiteBillingLocale = "en-GB"/);
});

test("product-site signup uses the dedicated marketing select pattern for package only", () => {
  const signupFormSource = readFileSync(
    new URL("../../../product-site/src/app/(marketing)/signup/SignupProvisionForm.jsx", import.meta.url),
    "utf8"
  );

  assert.match(signupFormSource, /import MarketingSelect from/);
  assert.match(signupFormSource, /<MarketingSelect\s+label="Package"/);
  assert.doesNotMatch(signupFormSource, /<MarketingSelect\s+label="Country"/);
  assert.doesNotMatch(signupFormSource, /<MarketingSelect\s+label="Locale"/);
  assert.doesNotMatch(signupFormSource, /<MarketingSelect\s+label="Timezone"/);
  assert.doesNotMatch(signupFormSource, /<select/);
});

test("product-site package catalog pricing is derived from the package pricing registry instead of hardcoded labels", () => {
  const packageCatalogSource = readFileSync(
    new URL("../../../product-site/src/lib/domain/package-catalog.js", import.meta.url),
    "utf8"
  );
  const pricingRegistrySource = readFileSync(
    new URL("../../../product-site/src/lib/domain/package-pricing.js", import.meta.url),
    "utf8"
  );
  const accountUpgradeSource = readFileSync(
    new URL("../../../product-site/src/app/(account)/account/upgrade/page.jsx", import.meta.url),
    "utf8"
  );
  const accountBillingSource = readFileSync(
    new URL("../../../product-site/src/app/(account)/account/billing/page.jsx", import.meta.url),
    "utf8"
  );

  assert.match(packageCatalogSource, /import \{ getPackagePricingForTierAndCurrency, resolvePackagePricingSelection \} from "\.\/package-pricing\.js"/);
  assert.match(packageCatalogSource, /priceLabel: pricing\.display/);
  assert.doesNotMatch(packageCatalogSource, /£19|£49/);
  assert.match(pricingRegistrySource, /const packagePriceMajors = \{/);
  assert.match(pricingRegistrySource, /starter:\s*\{/);
  assert.match(pricingRegistrySource, /GBP:\s*19,/);
  assert.match(pricingRegistrySource, /growth:\s*\{/);
  assert.match(pricingRegistrySource, /GBP:\s*49,/);
  assert.match(pricingRegistrySource, /const packagePricingCatalog = \{/);
  assert.match(pricingRegistrySource, /free: buildTierCatalog\("free"\)/);
  assert.match(pricingRegistrySource, /starter: buildTierCatalog\("starter"\)/);
  assert.match(pricingRegistrySource, /growth: buildTierCatalog\("growth"\)/);
  assert.match(pricingRegistrySource, /return "GBP"/);
  assert.doesNotMatch(pricingRegistrySource, /supportedCurrencies/);
  assert.doesNotMatch(accountUpgradeSource, /"£0"/);
  assert.doesNotMatch(accountBillingSource, /"£0"/);
});

test("product-site pricing route stays simple and sends signed-in users to package management", () => {
  const pricingPageSource = readFileSync(
    new URL("../../../product-site/src/app/(marketing)/pricing/page.jsx", import.meta.url),
    "utf8"
  );
  const pricingExplorerSource = readFileSync(
    new URL("../../../product-site/src/components/patterns/package-catalog/PricingPackageExplorer.jsx", import.meta.url),
    "utf8"
  );
  const packageCatalogSource = readFileSync(
    new URL("../../../product-site/src/components/patterns/package-catalog/PackageCatalog.jsx", import.meta.url),
    "utf8"
  );

  assert.match(pricingPageSource, /PricingPackageExplorer/);
  assert.match(pricingPageSource, /readCommercialAccountSession/);
  assert.match(pricingPageSource, /const hasAccountSession = Boolean\(session\)/);
  assert.match(pricingPageSource, /const primarySignupHref = hasAccountSession \? "\/account\/package" : "\/signup\?tier=starter"/);
  assert.match(pricingPageSource, /const primarySignupLabel = hasAccountSession \? "Manage your package" : "Start your community"/);
  assert.match(pricingPageSource, /hasAccountSession=\{hasAccountSession\}/);
  assert.doesNotMatch(pricingPageSource, /resolveProductSiteRequestRegionalDefaults/);
  assert.match(pricingExplorerSource, /const packages = getPackageCatalog\(\)/);
  assert.match(pricingExplorerSource, /hasAccountSession = false/);
  assert.match(pricingExplorerSource, /mode=\{hasAccountSession \? "signed-in-marketing" : "marketing"\}/);
  assert.doesNotMatch(pricingExplorerSource, /MarketingSelect/);
  assert.doesNotMatch(pricingExplorerSource, /Hub setup/i);
  assert.match(packageCatalogSource, /buildMarketingSignupHref/);
  assert.match(packageCatalogSource, /mode === "signed-in-marketing"/);
  assert.match(packageCatalogSource, /"\/account\/package"/);
  assert.match(packageCatalogSource, /"Manage package"/);
  assert.match(packageCatalogSource, /params\.set\("tier", tier\)/);
  assert.doesNotMatch(packageCatalogSource, /params\.set\("country", country\)/);
  assert.doesNotMatch(packageCatalogSource, /params\.set\("currency", currency\)/);
  assert.doesNotMatch(pricingPageSource, /resolveProductSiteRequestRegionalDefaults/);
});

test("product-site signup hydrates selected package pricing without hub regional fields", () => {
  const signupPageSource = readFileSync(
    new URL("../../../product-site/src/app/(marketing)/signup/page.jsx", import.meta.url),
    "utf8"
  );
  const signupFormSource = readFileSync(
    new URL("../../../product-site/src/app/(marketing)/signup/SignupProvisionForm.jsx", import.meta.url),
    "utf8"
  );
  const signupDomainSource = readFileSync(
    new URL("../../../product-site/src/lib/domain/signup.js", import.meta.url),
    "utf8"
  );
  const signupActionSource = readFileSync(
    new URL("../../../product-site/src/app/(marketing)/signup/actions.js", import.meta.url),
    "utf8"
  );

  assert.match(signupPageSource, /packageTier:\s*normalizeString\(params\?\.tier\)\.toLowerCase\(\)/);
  assert.match(signupPageSource, /resolvePackagePricingSelection/);
  assert.doesNotMatch(signupPageSource, /resolveProductSiteRequestRegionalDefaults/);
  assert.doesNotMatch(signupPageSource, /resolveRegionalDefaults/);
  assert.match(signupPageSource, /packageCurrency:\s*packagePricingSelection\.currency/);
  assert.match(signupPageSource, /<SignupProvisionForm\s+initialValues=\{initialValues\}\s*\/>/);
  assert.match(signupDomainSource, /initialHubProvisioningDefaults/);
  assert.match(signupDomainSource, /resolvePackagePricingSelection/);
  assert.doesNotMatch(signupDomainSource, /country:\s*""/);
  assert.doesNotMatch(signupDomainSource, /timezone:\s*""/);
  assert.doesNotMatch(signupDomainSource, /locale:\s*""/);
  assert.doesNotMatch(signupDomainSource, /defaultCurrency:\s*""/);
  assert.match(signupFormSource, /formatPackageOptionLabel/);
  assert.match(signupFormSource, /name="packageCurrency"/);
  assert.doesNotMatch(signupFormSource, /label="Country"/);
  assert.doesNotMatch(signupFormSource, /label="Locale"/);
  assert.doesNotMatch(signupFormSource, /label="Timezone"/);
  assert.doesNotMatch(signupFormSource, /name="defaultCurrency"/);
  assert.match(signupFormSource, /billed in GBP/i);
  assert.match(signupFormSource, /useActionState\(createProductSiteSignupAction, null\)/);
  assert.doesNotMatch(signupFormSource, /Billing summary/);
  assert.match(signupActionSource, /packageCurrency: String\(formData\.get\("packageCurrency"\) \|\| ""\)/);
  assert.match(signupActionSource, /resolveStripePriceSelection/);
  assert.match(signupActionSource, /assertStripePriceMatchesSelection/);
  assert.match(signupActionSource, /Complete the Stripe GBP package price setup first/);
});
