import { normalizeTemplate, normalizeTheme } from "../theme/default-theme.js";
import {
  getCountryRegionalConfig,
  getFallbackRegionalMarket,
  resolveLaunchFormattingLocale,
  resolveRegionalDefaults,
  validateRegionalSelection,
} from "./regional-markets.js";
import { isHubRegionalSetupComplete } from "./hub-regional-setup.js";
import { resolveSiteSettingsCapabilities } from "./site-settings-capabilities.js";
import {
  hasSectionRichTextContent,
  normalizeSectionRichTextContent,
  parseSectionRichTextInput,
} from "./section-rich-text.js";

export const brandingHeaderCtaOptions = [
  { value: "none", label: "No header CTA" },
  { value: "join", label: "Become a member" },
  { value: "contact", label: "Contact us" },
];

export const defaultBrandingColors = {
  primary: "#256EF1",
  secondary: "#9C6E35",
};

export const settingsPanelStatusMeta = {
  complete: { label: "Complete", tone: "success" },
  needs_attention: { label: "Needs attention", tone: "warning" },
  partially_configured: { label: "Partially configured", tone: "accent" },
  planned: { label: "Planned", tone: "neutral" },
};

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeEmail(value) {
  return normalizeString(value).toLowerCase();
}

function assertValidEmail(value, label) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new Error(`${label} must be a valid email address.`);
  }
}

function normalizeUrl(value) {
  return normalizeString(value);
}

function normalizeHexColor(value) {
  const normalizedValue = normalizeString(value).toUpperCase();

  if (!normalizedValue) {
    return "";
  }

  if (/^#[0-9A-F]{6}$/.test(normalizedValue)) {
    return normalizedValue;
  }

  if (/^#[0-9A-F]{3}$/.test(normalizedValue)) {
    return `#${normalizedValue[1]}${normalizedValue[1]}${normalizedValue[2]}${normalizedValue[2]}${normalizedValue[3]}${normalizedValue[3]}`;
  }

  throw new Error("Brand colors must be valid hex values.");
}

function normalizeHexColorWithFallback(value, fallback) {
  try {
    return normalizeHexColor(value) || fallback;
  } catch {
    return fallback;
  }
}

function normalizeBrandingHeaderCtaKey(value) {
  const normalizedValue = normalizeString(value);
  const allowedValues = new Set(brandingHeaderCtaOptions.map((option) => option.value));

  return allowedValues.has(normalizedValue) ? normalizedValue : "none";
}

function hasValue(value) {
  return Boolean(normalizeString(value));
}

function hasAnyValue(values = []) {
  return values.some((value) => hasValue(value));
}

export function getSettingsPanelStatusMeta(status) {
  return settingsPanelStatusMeta[normalizeString(status)] || settingsPanelStatusMeta.needs_attention;
}

export function deriveBrandingSettingsPanelStatus(hub = {}, siteSettings = {}) {
  const requiredComplete =
    hasValue(siteSettings.themeKey || hub.themeKey || hub.theme) &&
    hasValue(hub.templateKey || hub.template) &&
    hasValue(siteSettings.branding?.primary) &&
    hasValue(siteSettings.branding?.secondary);
  const optionalComplete =
    hasValue(siteSettings.logoAssetId) &&
    normalizeBrandingHeaderCtaKey(siteSettings.header?.primaryCtaKey) !== "none";

  if (!requiredComplete) {
    return getSettingsPanelStatusMeta("needs_attention");
  }

  if (!optionalComplete) {
    return getSettingsPanelStatusMeta("partially_configured");
  }

  return getSettingsPanelStatusMeta("complete");
}

export function deriveSiteSettingsPanelStatus(hub = {}, siteSettings = {}) {
  if (!isHubRegionalSetupComplete(hub)) {
    return getSettingsPanelStatusMeta("needs_attention");
  }

  const requiredComplete =
    hasValue(siteSettings.hubName) &&
    hasValue(siteSettings.siteName) &&
    hasValue(siteSettings.contactEmail) &&
    hasValue(siteSettings.hub?.country) &&
    hasValue(siteSettings.hub?.locale) &&
    hasValue(siteSettings.hub?.timezone) &&
    hasValue(siteSettings.hub?.defaultCurrency) &&
    hasValue(siteSettings.address?.line1) &&
    hasValue(siteSettings.address?.city) &&
    hasValue(siteSettings.address?.postalCode) &&
    hasValue(siteSettings.address?.country) &&
    hasValue(siteSettings.seoDefaults?.title) &&
    hasValue(siteSettings.seoDefaults?.description);
  const optionalComplete =
    hasValue(siteSettings.contactPhone) &&
    hasAnyValue(Object.values(siteSettings.socialLinks || {})) &&
    hasAnyValue(Object.values(siteSettings.hours || {}));

  if (!requiredComplete) {
    return getSettingsPanelStatusMeta("needs_attention");
  }

  if (!optionalComplete) {
    return getSettingsPanelStatusMeta("partially_configured");
  }

  return getSettingsPanelStatusMeta("complete");
}

function derivePageHeroSettingsPanelStatus(page = {}) {
  const hero = page?.hero || {};
  const requiredComplete = hasValue(hero.title);
  const optionalComplete =
    hasValue(hero.eyebrow) &&
    hasValue(hero.description) &&
    hasValue(hero.mediaAssetId);

  if (!requiredComplete) {
    return getSettingsPanelStatusMeta("needs_attention");
  }

  if (!optionalComplete) {
    return getSettingsPanelStatusMeta("partially_configured");
  }

  return getSettingsPanelStatusMeta("complete");
}

export function deriveHomepageSettingsPanelStatus(siteSettings = {}) {
  const hero = siteSettings.homePage?.hero || {};
  const info = siteSettings.homePage?.info || {};
  const cta = siteSettings.homePage?.cta || {};
  const testimonials = siteSettings.homePage?.testimonials || {};
  const heroActions = Array.isArray(hero.actions) ? hero.actions : [];
  const requiredComplete = hasValue(hero.title);
  const optionalComplete =
    hasValue(hero.description) &&
    hasValue(hero.mediaAssetId) &&
    heroActions.some((action) => hasValue(action?.label) && hasValue(action?.destination)) &&
    hasValue(info.title) &&
    hasSectionRichTextContent(info.body) &&
    hasValue(cta.title) &&
    hasValue(testimonials.title);

  if (!requiredComplete) {
    return getSettingsPanelStatusMeta("needs_attention");
  }

  if (!optionalComplete) {
    return getSettingsPanelStatusMeta("partially_configured");
  }

  return getSettingsPanelStatusMeta("complete");
}

export function deriveEventsPageSettingsPanelStatus(siteSettings = {}) {
  return derivePageHeroSettingsPanelStatus(siteSettings.pages?.events);
}

export function deriveCoursesPageSettingsPanelStatus(siteSettings = {}) {
  return derivePageHeroSettingsPanelStatus(siteSettings.pages?.courses);
}

export function deriveTestimonialsPageSettingsPanelStatus(siteSettings = {}) {
  return derivePageHeroSettingsPanelStatus(siteSettings.pages?.testimonials);
}

function normalizeAddressPayload(payload = {}) {
  return {
    line1: normalizeString(payload.addressLine1),
    line2: normalizeString(payload.addressLine2),
    city: normalizeString(payload.addressCity),
    stateOrProvince: normalizeString(payload.addressStateOrProvince),
    postalCode: normalizeString(payload.addressPostalCode),
    country: normalizeString(payload.addressCountry),
  };
}

function normalizeHoursPayload(payload = {}) {
  return {
    monday: normalizeString(payload.hoursMonday),
    tuesday: normalizeString(payload.hoursTuesday),
    wednesday: normalizeString(payload.hoursWednesday),
    thursday: normalizeString(payload.hoursThursday),
    friday: normalizeString(payload.hoursFriday),
    saturday: normalizeString(payload.hoursSaturday),
    sunday: normalizeString(payload.hoursSunday),
  };
}

function normalizeHoursForAdminForm(hours) {
  return {
    hoursMonday: normalizeString(hours?.monday),
    hoursTuesday: normalizeString(hours?.tuesday),
    hoursWednesday: normalizeString(hours?.wednesday),
    hoursThursday: normalizeString(hours?.thursday),
    hoursFriday: normalizeString(hours?.friday),
    hoursSaturday: normalizeString(hours?.saturday),
    hoursSunday: normalizeString(hours?.sunday),
  };
}

function normalizeAddressForAdminForm(address) {
  if (typeof address === "string") {
    return {
      addressLine1: normalizeString(address),
      addressLine2: "",
      addressCity: "",
      addressStateOrProvince: "",
      addressPostalCode: "",
      addressCountry: "",
    };
  }

  return {
    addressLine1: normalizeString(address?.line1),
    addressLine2: normalizeString(address?.line2),
    addressCity: normalizeString(address?.city),
    addressStateOrProvince: normalizeString(address?.stateOrProvince),
    addressPostalCode: normalizeString(address?.postalCode),
    addressCountry: normalizeString(address?.country),
  };
}

function normalizeHomepageAction(payload, prefix, actionLabelName, variant = "") {
  const actionLabel = normalizeString(payload[`${prefix}Label`]);
  const destination = normalizeString(payload[`${prefix}Destination`]);

  if (!actionLabel && !destination) {
    return null;
  }

  if (!actionLabel) {
    throw new Error(`${actionLabelName} requires a label.`);
  }

  if (!destination) {
    throw new Error(`${actionLabelName} requires a community page.`);
  }

  return {
    label: actionLabel,
    type: "internal",
    destination,
    variant: normalizeString(variant),
  };
}

function normalizePageHero(page = {}) {
  return {
    hero: {
      mediaAssetId: normalizeString(page?.hero?.mediaAssetId),
      mediaAlt: normalizeString(page?.hero?.mediaAlt),
      eyebrow: normalizeString(page?.hero?.eyebrow),
      title: normalizeString(page?.hero?.title),
      description: normalizeString(page?.hero?.description),
    },
  };
}

export function normalizeBrandingSettingsPayload(payload) {
  const themeKey = normalizeTheme(payload.themeKey);
  const templateKey = normalizeTemplate(payload.templateKey);
  const logoAssetId = normalizeString(payload.logoAssetId);
  const logoAlt = normalizeString(payload.logoAlt);
  const headerCtaKey = normalizeBrandingHeaderCtaKey(payload.headerCtaKey);
  const brandingColors = {
    primary: normalizeHexColor(payload.brandPrimaryColor) || defaultBrandingColors.primary,
    secondary: normalizeHexColor(payload.brandSecondaryColor) || defaultBrandingColors.secondary,
  };

  return {
    themeKey,
    templateKey,
    logoAssetId,
    logoAlt,
    headerCtaKey,
    brandingColors,
  };
}

export function normalizeBrandingSettingsForAdminForm(siteSettings = {}) {
  const hub = siteSettings.hub || {};
  const branding = siteSettings.branding || {};

  return {
    logoAssetId: normalizeString(siteSettings.logoAssetId),
    logoAlt: normalizeString(siteSettings.logoAlt),
    themeKey: normalizeTheme(siteSettings.themeKey || hub.themeKey || hub.theme),
    templateKey: normalizeTemplate(hub.templateKey || hub.template),
    headerCtaKey: normalizeBrandingHeaderCtaKey(siteSettings.header?.primaryCtaKey),
    brandPrimaryColor: normalizeHexColorWithFallback(branding.primary, defaultBrandingColors.primary),
    brandSecondaryColor: normalizeHexColorWithFallback(branding.secondary, defaultBrandingColors.secondary),
  };
}

export function normalizeSiteSettingsPayload(payload) {
  const hubName = normalizeString(payload.hubName);
  const contactEmail = normalizeEmail(payload.contactEmail);
  const siteName = normalizeString(payload.siteName);
  const address = normalizeAddressPayload(payload);
  const seoTitle = normalizeString(payload.seoTitle);
  const seoDescription = normalizeString(payload.seoDescription);
  const country = normalizeString(payload.country).toUpperCase();
  const regionalDefaults = resolveRegionalDefaults({
    country,
    locale: normalizeString(payload.locale),
    timezone: normalizeString(payload.timezone),
    defaultCurrency: normalizeString(payload.defaultCurrency).toUpperCase(),
  });

  if (!hubName) {
    throw new Error("Hub name is required.");
  }

  if (!siteName) {
    throw new Error("Site name is required.");
  }

  if (!contactEmail) {
    throw new Error("Contact email is required.");
  }

  assertValidEmail(contactEmail, "Contact email");

  if (!country) {
    throw new Error("Country is required.");
  }

  if (!address.line1) {
    throw new Error("Address line 1 is required.");
  }

  if (!address.city) {
    throw new Error("Town / city is required.");
  }

  if (!address.postalCode) {
    throw new Error("ZIP / postal code is required.");
  }

  if (!address.country) {
    throw new Error("Country is required.");
  }

  if (!seoTitle) {
    throw new Error("SEO default title is required.");
  }

  if (!seoDescription) {
    throw new Error("SEO default description is required.");
  }

  return {
    hubName,
    siteName,
    contactEmail,
    contactPhone: normalizeString(payload.contactPhone),
    country,
    locale: regionalDefaults.locale,
    timezone: regionalDefaults.timezone,
    defaultCurrency: regionalDefaults.defaultCurrency,
    address,
    hours: normalizeHoursPayload(payload),
    socialLinks: {
      facebook: normalizeUrl(payload.facebook),
      instagram: normalizeUrl(payload.instagram),
      x: normalizeUrl(payload.x),
      linkedin: normalizeUrl(payload.linkedin),
      youtube: normalizeUrl(payload.youtube),
    },
    seoDefaults: {
      title: seoTitle,
      description: seoDescription,
    },
  };
}

export function normalizeRegionalSetupPayload(payload = {}) {
  const country = normalizeString(payload.country).toUpperCase();
  const locale = normalizeString(payload.locale);
  const timezone = normalizeString(payload.timezone);
  const defaultCurrency = normalizeString(payload.defaultCurrency).toUpperCase();

  if (!country) {
    throw new Error("Country is required.");
  }

  if (!locale) {
    throw new Error("Locale is required.");
  }

  if (!timezone) {
    throw new Error("Timezone is required.");
  }

  if (!defaultCurrency) {
    throw new Error("Default currency is required.");
  }

  validateRegionalSelection({ country, locale, timezone, defaultCurrency });

  return {
    country,
    locale,
    timezone,
    defaultCurrency,
  };
}

export function normalizeSiteSettingsForAdminForm(siteSettings = {}) {
  const heroActions = Array.isArray(siteSettings.homePage?.hero?.actions) ? siteSettings.homePage.hero.actions : [];
  const primaryAction = heroActions.find((action) => action?.variant === "primary") || heroActions[0] || {};
  const secondaryAction = heroActions.find((action) => action?.variant === "secondary") || heroActions[1] || {};
  const ctaActions = Array.isArray(siteSettings.homePage?.cta?.actions) ? siteSettings.homePage.cta.actions : [];
  const primaryCtaAction = ctaActions.find((action) => action?.variant === "primary") || ctaActions[0] || {};
  const secondaryCtaAction = ctaActions.find((action) => action?.variant === "secondary") || ctaActions[1] || {};
  const infoAction = siteSettings.homePage?.info?.action || {};
  const whatWeDo = siteSettings.homePage?.whatWeDo || {};
  const testimonials = siteSettings.homePage?.testimonials || {};
  const address = normalizeAddressForAdminForm(siteSettings.address);
  const hours = normalizeHoursForAdminForm(siteSettings.hours);
  const regionalDefaults = resolveRegionalDefaults({
    country: siteSettings.hub?.country,
    locale: resolveLaunchFormattingLocale(siteSettings.hub?.locale, siteSettings.hub?.country),
    timezone: siteSettings.hub?.timezone,
    defaultCurrency: siteSettings.hub?.defaultCurrency,
  });
  const regionalMarket = getCountryRegionalConfig(regionalDefaults.country);

  return {
    hubName: siteSettings.hubName || siteSettings.hub?.name || "",
    siteName: siteSettings.siteName || "",
    contactEmail: siteSettings.contactEmail || "",
    contactPhone: siteSettings.contactPhone || "",
    country: regionalDefaults.country,
    locale: regionalDefaults.locale || getFallbackRegionalMarket().defaultLocale,
    timezone: regionalDefaults.timezone || getFallbackRegionalMarket().defaultTimezone,
    defaultCurrency: regionalDefaults.defaultCurrency || getFallbackRegionalMarket().defaultCurrency,
    ...address,
    addressCountry: address.addressCountry || regionalMarket?.label || "",
    ...hours,
    facebook: siteSettings.socialLinks?.facebook || "",
    instagram: siteSettings.socialLinks?.instagram || "",
    x: siteSettings.socialLinks?.x || "",
    linkedin: siteSettings.socialLinks?.linkedin || "",
    youtube: siteSettings.socialLinks?.youtube || "",
    seoTitle: siteSettings.seoDefaults?.title || "",
    seoDescription: siteSettings.seoDefaults?.description || "",
    heroMediaAssetId: siteSettings.homePage?.hero?.mediaAssetId || "",
    heroMediaAlt: siteSettings.homePage?.hero?.mediaAlt || "",
    heroEyebrow: siteSettings.homePage?.hero?.eyebrow || "",
    heroTitle: siteSettings.homePage?.hero?.title || "",
    heroDescription: siteSettings.homePage?.hero?.description || "",
    heroPrimaryActionLabel: primaryAction.label || "",
    heroPrimaryActionDestination: primaryAction.destination || "",
    heroSecondaryActionLabel: secondaryAction.label || "",
    heroSecondaryActionDestination: secondaryAction.destination || "",
    ctaEyebrow: siteSettings.homePage?.cta?.eyebrow || "",
    ctaTitle: siteSettings.homePage?.cta?.title || "",
    ctaDescription: siteSettings.homePage?.cta?.description || "",
    ctaPrimaryActionLabel: primaryCtaAction.label || "",
    ctaPrimaryActionDestination: primaryCtaAction.destination || "",
    ctaSecondaryActionLabel: secondaryCtaAction.label || "",
    ctaSecondaryActionDestination: secondaryCtaAction.destination || "",
    infoMediaAssetId: siteSettings.homePage?.info?.mediaAssetId || "",
    infoMediaAlt: siteSettings.homePage?.info?.mediaAlt || "",
    infoEyebrow: siteSettings.homePage?.info?.eyebrow || "",
    infoTitle: siteSettings.homePage?.info?.title || "",
    infoDescription: siteSettings.homePage?.info?.description || "",
    infoBody: hasSectionRichTextContent(siteSettings.homePage?.info?.body) ? siteSettings.homePage.info.body : [],
    infoActionLabel: infoAction.label || "",
    infoActionDestination: infoAction.destination || "",
    whatWeDoEyebrow: whatWeDo.eyebrow || "",
    whatWeDoTitle: whatWeDo.title || "",
    whatWeDoDescription: whatWeDo.description || "",
    testimonialsEyebrow: testimonials.eyebrow || "",
    testimonialsTitle: testimonials.title || "",
    testimonialsDescription: testimonials.description || "",
    packageTier: resolveSiteSettingsCapabilities(siteSettings.hub || {}).packageTier,
    headerCtaKey: normalizeBrandingHeaderCtaKey(siteSettings.header?.primaryCtaKey),
  };
}

export function normalizeEventsPageSettingsForAdminForm(siteSettings = {}) {
  const hero = siteSettings.pages?.events?.hero || {};

  return {
    heroMediaAssetId: normalizeString(hero.mediaAssetId),
    heroMediaAlt: normalizeString(hero.mediaAlt),
    heroEyebrow: normalizeString(hero.eyebrow),
    heroTitle: normalizeString(hero.title),
    heroDescription: normalizeString(hero.description),
  };
}

export function normalizeCoursesPageSettingsForAdminForm(siteSettings = {}) {
  const hero = siteSettings.pages?.courses?.hero || {};

  return {
    heroMediaAssetId: normalizeString(hero.mediaAssetId),
    heroMediaAlt: normalizeString(hero.mediaAlt),
    heroEyebrow: normalizeString(hero.eyebrow),
    heroTitle: normalizeString(hero.title),
    heroDescription: normalizeString(hero.description),
  };
}

export function normalizeTestimonialsPageSettingsForAdminForm(siteSettings = {}) {
  const hero = siteSettings.pages?.testimonials?.hero || {};
  const ctaActions = Array.isArray(siteSettings.pages?.testimonials?.cta?.actions)
    ? siteSettings.pages.testimonials.cta.actions
    : [];
  const primaryCtaAction =
    ctaActions.find((action) => action?.variant === "primary") || ctaActions[0] || {};
  const secondaryCtaAction =
    ctaActions.find((action) => action?.variant === "secondary") || ctaActions[1] || {};

  return {
    heroMediaAssetId: normalizeString(hero.mediaAssetId),
    heroMediaAlt: normalizeString(hero.mediaAlt),
    heroEyebrow: normalizeString(hero.eyebrow),
    heroTitle: normalizeString(hero.title),
    heroDescription: normalizeString(hero.description),
    ctaEyebrow: normalizeString(siteSettings.pages?.testimonials?.cta?.eyebrow),
    ctaTitle: normalizeString(siteSettings.pages?.testimonials?.cta?.title),
    ctaDescription: normalizeString(siteSettings.pages?.testimonials?.cta?.description),
    ctaPrimaryActionLabel: normalizeString(primaryCtaAction.label),
    ctaPrimaryActionDestination: normalizeString(primaryCtaAction.destination),
    ctaSecondaryActionLabel: normalizeString(secondaryCtaAction.label),
    ctaSecondaryActionDestination: normalizeString(secondaryCtaAction.destination),
  };
}

export function normalizeHomepageSettingsPayload(payload) {
  const heroPrimaryAction = normalizeHomepageAction(payload, "heroPrimaryAction", "Hero primary action", "primary");
  const heroSecondaryAction = normalizeHomepageAction(payload, "heroSecondaryAction", "Hero secondary action", "secondary");
  const ctaPrimaryAction = normalizeHomepageAction(payload, "ctaPrimaryAction", "CTA primary action", "primary");
  const ctaSecondaryAction = normalizeHomepageAction(payload, "ctaSecondaryAction", "CTA secondary action", "secondary");
  const infoAction = normalizeHomepageAction(payload, "infoAction", "About section action");
  const infoBody = parseSectionRichTextInput(payload.infoBody);
  const hasCtaContent =
    normalizeString(payload.ctaEyebrow) ||
    normalizeString(payload.ctaTitle) ||
    normalizeString(payload.ctaDescription) ||
    Boolean(ctaPrimaryAction) ||
    Boolean(ctaSecondaryAction);
  const hasInfoContent =
    normalizeString(payload.infoMediaAssetId) ||
    normalizeString(payload.infoEyebrow) ||
    normalizeString(payload.infoTitle) ||
    normalizeString(payload.infoDescription) ||
    hasSectionRichTextContent(infoBody) ||
    Boolean(infoAction);
  const hasTestimonialsContent =
    normalizeString(payload.testimonialsEyebrow) ||
    normalizeString(payload.testimonialsTitle) ||
    normalizeString(payload.testimonialsDescription);
  const hasWhatWeDoContent =
    normalizeString(payload.whatWeDoEyebrow) ||
    normalizeString(payload.whatWeDoTitle) ||
    normalizeString(payload.whatWeDoDescription);

  if (!normalizeString(payload.heroMediaAssetId)) {
    throw new Error("Homepage hero media is required.");
  }

  if (hasInfoContent) {
    if (!normalizeString(payload.infoMediaAssetId)) {
      throw new Error("About section requires media.");
    }

    if (!normalizeString(payload.infoTitle)) {
      throw new Error("About section requires a title.");
    }

    if (!hasSectionRichTextContent(infoBody)) {
      throw new Error("About section requires body content.");
    }
  }

  if (hasCtaContent && !normalizeString(payload.ctaTitle)) {
    throw new Error("Call to action section requires a title.");
  }

  if (hasTestimonialsContent && !normalizeString(payload.testimonialsTitle)) {
    throw new Error("Testimonials section requires a title.");
  }

  if (hasWhatWeDoContent && !normalizeString(payload.whatWeDoTitle)) {
    throw new Error("What we do section requires a title.");
  }

  return {
    homePage: {
      hero: {
        mediaAssetId: normalizeString(payload.heroMediaAssetId),
        mediaAlt: normalizeString(payload.heroMediaAlt),
        eyebrow: normalizeString(payload.heroEyebrow),
        title: normalizeString(payload.heroTitle),
        description: normalizeString(payload.heroDescription),
        actions: [heroPrimaryAction, heroSecondaryAction].filter(Boolean),
      },
      cta: {
        eyebrow: normalizeString(payload.ctaEyebrow),
        title: normalizeString(payload.ctaTitle),
        description: normalizeString(payload.ctaDescription),
        actions: [ctaPrimaryAction, ctaSecondaryAction].filter(Boolean),
      },
      info: {
        mediaAssetId: normalizeString(payload.infoMediaAssetId),
        mediaAlt: normalizeString(payload.infoMediaAlt),
        eyebrow: normalizeString(payload.infoEyebrow),
        title: normalizeString(payload.infoTitle),
        description: normalizeString(payload.infoDescription),
        body: infoBody,
        action: infoAction,
      },
      whatWeDo: {
        eyebrow: normalizeString(payload.whatWeDoEyebrow),
        title: normalizeString(payload.whatWeDoTitle),
        description: normalizeString(payload.whatWeDoDescription),
      },
      testimonials: {
        eyebrow: normalizeString(payload.testimonialsEyebrow),
        title: normalizeString(payload.testimonialsTitle),
        description: normalizeString(payload.testimonialsDescription),
      },
    },
  };
}

export function normalizeEventsPageSettingsPayload(payload) {
  const heroTitle = normalizeString(payload.heroTitle);

  if (!heroTitle) {
    throw new Error("Events hero title is required.");
  }

  return {
    pages: {
      events: {
        hero: {
          mediaAssetId: normalizeString(payload.heroMediaAssetId),
          mediaAlt: normalizeString(payload.heroMediaAlt),
          eyebrow: normalizeString(payload.heroEyebrow),
          title: heroTitle,
          description: normalizeString(payload.heroDescription),
        },
      },
    },
  };
}

export function normalizeCoursesPageSettingsPayload(payload) {
  const heroTitle = normalizeString(payload.heroTitle);

  if (!heroTitle) {
    throw new Error("Courses hero title is required.");
  }

  return {
    pages: {
      courses: {
        hero: {
          mediaAssetId: normalizeString(payload.heroMediaAssetId),
          mediaAlt: normalizeString(payload.heroMediaAlt),
          eyebrow: normalizeString(payload.heroEyebrow),
          title: heroTitle,
          description: normalizeString(payload.heroDescription),
        },
      },
    },
  };
}

export function normalizeTestimonialsPageSettingsPayload(payload) {
  const heroTitle = normalizeString(payload.heroTitle);
  const ctaTitle = normalizeString(payload.ctaTitle);
  const ctaPrimaryAction = normalizeHomepageAction(
    payload,
    "ctaPrimaryAction",
    "CTA primary action",
    "primary"
  );
  const ctaSecondaryAction = normalizeHomepageAction(
    payload,
    "ctaSecondaryAction",
    "CTA secondary action",
    "secondary"
  );
  if (!heroTitle) {
    throw new Error("Testimonials hero title is required.");
  }

  if (!ctaTitle) {
    throw new Error("Testimonials CTA section requires a title.");
  }

  return {
    pages: {
      testimonials: {
        hero: {
          mediaAssetId: normalizeString(payload.heroMediaAssetId),
          mediaAlt: normalizeString(payload.heroMediaAlt),
          eyebrow: normalizeString(payload.heroEyebrow),
          title: heroTitle,
          description: normalizeString(payload.heroDescription),
        },
        cta: {
          eyebrow: normalizeString(payload.ctaEyebrow),
          title: ctaTitle,
          description: normalizeString(payload.ctaDescription),
          actions: [ctaPrimaryAction, ctaSecondaryAction].filter(Boolean),
        },
      },
    },
  };
}
