import { resolvePackagePricingSelection } from "./package-pricing.js";

export const initialHubProvisioningDefaults = {
  country: "GB",
  timezone: "Europe/London",
  locale: "en-GB",
  defaultCurrency: "GBP",
};

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeEmail(value) {
  return normalizeString(value).toLowerCase();
}

function normalizeSlug(value) {
  return normalizeString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeBaseUrl(value) {
  return normalizeString(value).replace(/\/+$/, "");
}

function assertRequired(value, label) {
  if (!normalizeString(value)) {
    throw new Error(`${label} is required.`);
  }
}

function assertValidEmail(value, label) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value))) {
    throw new Error(`${label} must be valid.`);
  }
}

export const initialProductSignupState = {
  error: "",
  values: {
    ownerFullName: "",
    ownerEmail: "",
    communityName: "",
    hubSlug: "",
    packageTier: "starter",
    password: "",
    passwordConfirm: "",
  },
};

export function deriveHubSlugFromCommunityName(value) {
  return normalizeSlug(value);
}

export function normalizeProductSignupPayload(values = {}) {
  const ownerFullName = normalizeString(values.ownerFullName);
  const ownerEmail = normalizeEmail(values.ownerEmail);
  const communityName = normalizeString(values.communityName);
  const derivedHubSlug = deriveHubSlugFromCommunityName(communityName);
  const hubSlug = normalizeSlug(values.hubSlug) || derivedHubSlug;
  const packageTier = normalizeString(values.packageTier).toLowerCase() || "starter";
  const packagePricingSelection = resolvePackagePricingSelection({
    tier: packageTier,
    currency: values.packageCurrency,
  });
  const password = String(values.password || "");
  const passwordConfirm = String(values.passwordConfirm || "");

  assertRequired(ownerFullName, "Owner name");
  assertRequired(ownerEmail, "Owner email");
  assertRequired(communityName, "Community name");
  assertRequired(hubSlug, "Hub slug");
  assertValidEmail(ownerEmail, "Owner email");

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  if (password !== passwordConfirm) {
    throw new Error("Passwords must match.");
  }

  return {
    values: {
      ownerFullName,
      ownerEmail,
      communityName,
      hubSlug,
      packageTier,
      packageCurrency: packagePricingSelection.currency,
      password: "",
      passwordConfirm: "",
    },
    payload: {
      name: communityName,
      slug: hubSlug,
      contactEmail: ownerEmail,
      customDomain: "",
      template: "civic",
      theme: "dark",
      country: initialHubProvisioningDefaults.country,
      timezone: initialHubProvisioningDefaults.timezone,
      locale: initialHubProvisioningDefaults.locale,
      defaultCurrency: initialHubProvisioningDefaults.defaultCurrency,
      packageCurrency: packagePricingSelection.currency,
      description: "",
      packageTier,
      packageStatus: "active",
      packageSource: "product_site",
    },
  };
}

export function resolveInitialProvisioningPayloadForSignup(payload = {}) {
  const selectedPackageTier = normalizeString(payload.packageTier).toLowerCase();

  if (selectedPackageTier === "starter" || selectedPackageTier === "growth") {
    return {
      ...payload,
      packageTier: "free",
      packageStatus: "active",
      packageSource: "product_site",
    };
  }

  return {
    ...payload,
    packageTier: "free",
    packageStatus: "active",
    packageSource: "product_site",
  };
}

export function buildOperationalHandoffUrls({ hubPlatformBaseUrl = "", hubSlug = "" } = {}) {
  const baseUrl = normalizeBaseUrl(hubPlatformBaseUrl);
  const normalizedHubSlug = normalizeSlug(hubSlug);

  if (!baseUrl || !normalizedHubSlug) {
    return {
      adminHref: "",
      publicHref: "",
      placeholder: true,
    };
  }

  return {
    adminHref: `${baseUrl}/${normalizedHubSlug}/admin`,
    publicHref: `${baseUrl}/${normalizedHubSlug}`,
    placeholder: false,
  };
}
