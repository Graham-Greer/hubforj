import { normalizeTemplate, normalizeTheme } from "../theme/default-theme.js";
import { normalizeCreateHubProvisioningPayload } from "./hub-package-contracts.js";
import { resolveRegionalDefaults } from "./regional-markets.js";

function normalizeString(value) {
  return String(value || "").trim();
}

export function normalizeHubSlug(value) {
  return normalizeString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeHubDomain(value) {
  return normalizeString(value)
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/[/?#].*$/, "")
    .replace(/:\d+$/, "")
    .replace(/\.+$/, "");
}

export function normalizeEmail(value) {
  return normalizeString(value).toLowerCase();
}

export function assertRequiredString(value, label) {
  if (!normalizeString(value)) {
    throw new Error(`${label} is required.`);
  }
}

export function assertValidEmail(email, label = "Email") {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email))) {
    throw new Error(`${label} must be valid.`);
  }
}

export function normalizeCreateHubPayload(payload) {
  const name = normalizeString(payload.name);
  const slug = normalizeHubSlug(payload.slug);
  const contactEmail = normalizeEmail(payload.contactEmail);
  const customDomain = normalizeHubDomain(payload.customDomain);
  const template = normalizeTemplate(payload.template);
  const theme = normalizeTheme(payload.theme);
  const description = normalizeString(payload.description);
  const regionalDefaults = resolveRegionalDefaults({
    country: payload.country,
    timezone: payload.timezone,
    locale: payload.locale,
    defaultCurrency: payload.defaultCurrency,
  });

  assertRequiredString(name, "Hub name");
  assertRequiredString(slug, "Hub slug");
  assertRequiredString(contactEmail, "Contact email");
  assertValidEmail(contactEmail, "Contact email");

  return normalizeCreateHubProvisioningPayload({
    name,
    slug,
    contactEmail,
    customDomain,
    templateKey: template,
    theme,
    description,
    country: regionalDefaults.country,
    timezone: regionalDefaults.timezone,
    locale: regionalDefaults.locale,
    defaultCurrency: regionalDefaults.defaultCurrency,
    tokenOverrides: {},
    packageTier: payload.packageTier,
    packageStatus: payload.packageStatus,
    packageSource: payload.packageSource,
    status: "active",
    supportState: "onboarding",
  });
}
