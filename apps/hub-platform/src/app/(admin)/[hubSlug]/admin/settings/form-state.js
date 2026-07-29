import { DEFAULT_TEMPLATE_KEY } from "@/lib/templates/template-registry";

export const initialBrandingSettingsState = {
  error: "",
  success: "",
  values: {
    logoAssetId: "",
    logoAlt: "",
    themeKey: "light",
    templateKey: DEFAULT_TEMPLATE_KEY,
    headerCtaKey: "none",
    brandPrimaryColor: "#256EF1",
    brandSecondaryColor: "#9C6E35",
  },
};

export const initialSiteSettingsState = {
  error: "",
  success: "",
  values: {
    hubName: "",
    siteName: "",
    contactEmail: "",
    contactPhone: "",
    country: "",
    locale: "",
    timezone: "",
    defaultCurrency: "",
    addressLine1: "",
    addressLine2: "",
    addressCity: "",
    addressStateOrProvince: "",
    addressPostalCode: "",
    addressCountry: "",
    hoursMonday: "",
    hoursTuesday: "",
    hoursWednesday: "",
    hoursThursday: "",
    hoursFriday: "",
    hoursSaturday: "",
    hoursSunday: "",
    facebook: "",
    instagram: "",
    x: "",
    linkedin: "",
    youtube: "",
    seoTitle: "",
    seoDescription: "",
  },
};

export const initialRegionalSetupState = {
  error: "",
  success: "",
  values: {
    country: "",
    locale: "",
    timezone: "",
    defaultCurrency: "",
  },
};

export const initialHomepageSettingsState = {
  error: "",
  success: "",
  values: {
    heroMediaAssetId: "",
    heroMediaAlt: "",
    heroEyebrow: "",
    heroTitle: "",
    heroDescription: "",
    heroPrimaryActionLabel: "",
    heroPrimaryActionDestination: "",
    heroSecondaryActionLabel: "",
    heroSecondaryActionDestination: "",
    ctaEyebrow: "",
    ctaTitle: "",
    ctaDescription: "",
    ctaPrimaryActionLabel: "",
    ctaPrimaryActionDestination: "",
    ctaSecondaryActionLabel: "",
    ctaSecondaryActionDestination: "",
    infoMediaAssetId: "",
    infoMediaAlt: "",
    infoEyebrow: "",
    infoTitle: "",
    infoDescription: "",
    infoBody: "",
    infoActionLabel: "",
    infoActionDestination: "",
    whatWeDoEyebrow: "",
    whatWeDoTitle: "",
    whatWeDoDescription: "",
    testimonialsEyebrow: "",
    testimonialsTitle: "",
    testimonialsDescription: "",
  },
};

export const initialEventsPageSettingsState = {
  error: "",
  success: "",
  values: {
    heroMediaAssetId: "",
    heroMediaAlt: "",
    heroEyebrow: "",
    heroTitle: "",
    heroDescription: "",
  },
};

export const initialCoursesPageSettingsState = {
  error: "",
  success: "",
  values: {
    heroMediaAssetId: "",
    heroMediaAlt: "",
    heroEyebrow: "",
    heroTitle: "",
    heroDescription: "",
  },
};

export const initialTestimonialsPageSettingsState = {
  error: "",
  success: "",
  values: {
    heroMediaAssetId: "",
    heroMediaAlt: "",
    heroEyebrow: "",
    heroTitle: "",
    heroDescription: "",
    ctaEyebrow: "",
    ctaTitle: "",
    ctaDescription: "",
    ctaPrimaryActionLabel: "",
    ctaPrimaryActionDestination: "",
    ctaSecondaryActionLabel: "",
    ctaSecondaryActionDestination: "",
  },
};
