import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeBrandingSettingsPayload,
  normalizeHomepageSettingsPayload,
  normalizeSiteSettingsForAdminForm,
  normalizeSiteSettingsPayload,
} from "../../src/lib/domain/site-settings.js";

test("branding settings normalize names email and theme choices", () => {
  const payload = normalizeBrandingSettingsPayload({
    logoAssetId: "asset_1",
    logoAlt: "Oak Hill logo",
    themeKey: "dark",
    templateKey: "editorial",
    headerCtaKey: "contact",
    brandPrimaryColor: "#123456",
    brandSecondaryColor: "#ABC",
  });

  assert.equal(payload.logoAssetId, "asset_1");
  assert.equal(payload.logoAlt, "Oak Hill logo");
  assert.equal(payload.themeKey, "dark");
  assert.equal(payload.templateKey, "editorial");
  assert.equal(payload.headerCtaKey, "contact");
  assert.deepEqual(payload.brandingColors, {
    primary: "#123456",
    secondary: "#AABBCC",
  });
});

test("branding settings fall back for unsupported theme and template values but reject invalid brand colors", () => {
  const payload = normalizeBrandingSettingsPayload({
    themeKey: "unknown",
    templateKey: "unknown",
  });

  assert.equal(payload.themeKey, "light");
  assert.equal(payload.templateKey, "civic");
  assert.equal(payload.brandingColors.primary, "#256EF1");
  assert.equal(payload.brandingColors.secondary, "#9C6E35");

  assert.throws(
    () =>
      normalizeBrandingSettingsPayload({
        brandPrimaryColor: "bad",
      }),
    /Brand colors must be valid hex values\./
  );
});

test("homepage settings normalizes hero and cta actions", () => {
  const payload = normalizeHomepageSettingsPayload({
    heroMediaAssetId: "asset_hero",
    heroTitle: "Welcome to Oak Hill",
    heroPrimaryActionLabel: "Join",
    heroPrimaryActionDestination: "join",
    ctaTitle: "Become a member",
    ctaPrimaryActionLabel: "Sign in",
    ctaPrimaryActionDestination: "sign_in",
  });

  assert.equal(payload.homePage.hero.actions.length, 1);
  assert.deepEqual(payload.homePage.hero.actions[0], {
    label: "Join",
    type: "internal",
    destination: "join",
    variant: "primary",
  });
  assert.equal(payload.homePage.cta.actions.length, 1);
  assert.equal(payload.homePage.cta.actions[0].destination, "sign_in");
});

test("homepage settings rejects incomplete actions", () => {
  assert.throws(
    () => normalizeHomepageSettingsPayload({ heroTitle: "Welcome" }),
    /Homepage hero media is required\./
  );
  assert.throws(
    () => normalizeHomepageSettingsPayload({ heroMediaAssetId: "asset_hero", heroTitle: "Welcome", heroPrimaryActionLabel: "Join", heroPrimaryActionDestination: "" }),
    /Hero primary action requires a community page\./
  );
  assert.throws(
    () => normalizeHomepageSettingsPayload({ heroMediaAssetId: "asset_hero", ctaTitle: "Become a member", ctaPrimaryActionLabel: "Sign in", ctaPrimaryActionDestination: "" }),
    /CTA primary action requires a community page\./
  );
});

test("site settings normalize contact and seo fields", () => {
  const payload = normalizeSiteSettingsPayload({
    hubName: "Oak Hill",
    siteName: "Oak Hill Community",
    tagline: "Not used anymore",
    contactEmail: "TEAM@OAKHILL.COM",
    country: "GB",
    locale: "en-GB",
    timezone: "Europe/London",
    defaultCurrency: "GBP",
    addressLine1: "1 High Street",
    addressCity: "Oak Hill",
    addressPostalCode: "OH1 1AA",
    addressCountry: "United Kingdom",
    facebook: "https://facebook.com/oakhill",
    seoTitle: "Oak Hill Community",
    seoDescription: "Community space for Oak Hill",
  });

  assert.equal(payload.contactEmail, "team@oakhill.com");
  assert.equal(payload.country, "GB");
  assert.equal(payload.locale, "en-GB");
  assert.equal(payload.timezone, "Europe/London");
  assert.equal(payload.defaultCurrency, "GBP");
  assert.equal("tagline" in payload, false);
  assert.equal(payload.socialLinks.facebook, "https://facebook.com/oakhill");
  assert.equal(payload.seoDefaults.title, "Oak Hill Community");
  assert.equal(payload.seoDefaults.description, "Community space for Oak Hill");
});

test("site settings fall back to valid English launch regional defaults when locale or other regional fields are blank", () => {
  const payload = normalizeSiteSettingsPayload({
    hubName: "Madrid Community",
    siteName: "Madrid Community",
    contactEmail: "team@madrid.example",
    country: "ES",
    locale: "",
    timezone: "",
    defaultCurrency: "",
    addressLine1: "1 Plaza Mayor",
    addressCity: "Madrid",
    addressPostalCode: "28001",
    addressCountry: "Spain",
    seoTitle: "Madrid Community",
    seoDescription: "English-led community space",
  });

  assert.equal(payload.country, "ES");
  assert.equal(payload.locale, "en-GB");
  assert.equal(payload.timezone, "Europe/Madrid");
  assert.equal(payload.defaultCurrency, "EUR");
});

test("site settings reject missing core business fields", () => {
  assert.throws(
    () =>
      normalizeSiteSettingsPayload({
        hubName: "Oak Hill",
        siteName: "Oak Hill Community",
        contactEmail: "bad",
      }),
    /Contact email must be a valid email address\./
  );

  assert.throws(
    () =>
      normalizeSiteSettingsPayload({
        hubName: "Oak Hill",
        siteName: "Oak Hill Community",
        contactEmail: "team@oakhill.com",
        country: "GB",
        locale: "en-GB",
        timezone: "Europe\/London",
        defaultCurrency: "GBP",
        addressLine1: "1 High Street",
        addressCity: "Oak Hill",
        addressPostalCode: "OH1 1AA",
        addressCountry: "United Kingdom",
        seoTitle: "Oak Hill Community",
      }),
    /SEO default description is required\./
  );
});

test("site settings require a valid supported regional selection", () => {
  assert.throws(
    () =>
      normalizeSiteSettingsPayload({
        hubName: "Oak Hill",
        siteName: "Oak Hill Community",
        contactEmail: "team@oakhill.com",
        country: "DE",
        locale: "es-ES",
        timezone: "Europe/Berlin",
        defaultCurrency: "EUR",
        addressLine1: "1 High Street",
        addressCity: "Oak Hill",
        addressPostalCode: "OH1 1AA",
        addressCountry: "Germany",
        seoTitle: "Oak Hill Community",
        seoDescription: "Community space for Oak Hill",
      }),
    /Selected locale is not supported for Germany\./
  );
});

test("site settings admin form prefills address country from the hub regional country when blank", () => {
  const values = normalizeSiteSettingsForAdminForm({
    hub: {
      name: "Oak Hill",
      country: "AU",
      locale: "en-AU",
      timezone: "Australia/Sydney",
      defaultCurrency: "AUD",
    },
    address: {
      line1: "1 High Street",
      city: "Oak Hill",
      postalCode: "2000",
      country: "",
    },
  });

  assert.equal(values.country, "AU");
  assert.equal(values.addressCountry, "Australia");
});
