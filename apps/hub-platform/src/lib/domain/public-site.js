import { normalizeTemplate, normalizeTheme } from "../theme/default-theme.js";
import { resolveSiteSettingsCapabilities } from "./site-settings-capabilities.js";
import { resolvePublicInternalActionHref } from "./public-action-links.js";
import { normalizeSectionRichTextContent } from "./section-rich-text.js";
export { resolvePublicHeaderNav } from "./public-routes.js";

import {
  getFallbackRegionalMarket,
  resolveLaunchFormattingLocale,
} from "@/lib/domain/regional-markets";

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeAddress(address) {
  if (typeof address === "string") {
    return {
      line1: normalizeString(address),
      line2: "",
      city: "",
      stateOrProvince: "",
      postalCode: "",
      country: "",
    };
  }

  return {
    line1: normalizeString(address?.line1),
    line2: normalizeString(address?.line2),
    city: normalizeString(address?.city),
    stateOrProvince: normalizeString(address?.stateOrProvince),
    postalCode: normalizeString(address?.postalCode),
    country: normalizeString(address?.country),
  };
}

function normalizeHours(hours) {
  return {
    monday: normalizeString(hours?.monday),
    tuesday: normalizeString(hours?.tuesday),
    wednesday: normalizeString(hours?.wednesday),
    thursday: normalizeString(hours?.thursday),
    friday: normalizeString(hours?.friday),
    saturday: normalizeString(hours?.saturday),
    sunday: normalizeString(hours?.sunday),
  };
}

function normalizePageHero(page) {
  return {
    hero: {
      mediaAssetId: normalizeString(page?.hero?.mediaAssetId),
      mediaAlt: normalizeString(page?.hero?.mediaAlt),
      mediaAsset: page?.hero?.mediaAsset || null,
      eyebrow: normalizeString(page?.hero?.eyebrow),
      title: normalizeString(page?.hero?.title),
      description: normalizeString(page?.hero?.description),
    },
  };
}

function normalizePageCta(hub, cta, routeMode = "path") {
  const actions = Array.isArray(cta?.actions)
    ? cta.actions
        .map((action) => normalizePublicAction(hub, action, routeMode))
        .filter(Boolean)
        .slice(0, 2)
    : [];

  return {
    eyebrow: normalizeString(cta?.eyebrow),
    title: normalizeString(cta?.title),
    description: normalizeString(cta?.description),
    actions,
  };
}

function normalizeLegalPage(page) {
  return {
    customBody: normalizeSectionRichTextContent(page?.customBody),
  };
}

function normalizeHeaderPrimaryCtaKey(value) {
  const normalizedValue = normalizeString(value);
  return normalizedValue === "join" || normalizedValue === "contact" ? normalizedValue : "none";
}

function normalizeHexColor(value, fallback) {
  const normalizedValue = normalizeString(value).toUpperCase();

  if (/^#[0-9A-F]{6}$/.test(normalizedValue)) {
    return normalizedValue;
  }

  return fallback;
}

function normalizePublicAction(hub, action, routeMode = "path") {
  const label = normalizeString(action?.label);
  const destination = normalizeString(action?.destination);
  const variant = normalizeString(action?.variant);

  if (!label || !destination) {
    return null;
  }

  return {
    label,
    type: "internal",
    destination,
    href: resolvePublicInternalActionHref(hub?.slug, destination, routeMode),
    variant: variant === "primary" || variant === "secondary" ? variant : "",
  };
}

export function normalizeSiteSettingsRecord(hub, record = {}, options = {}) {
  const routeMode = options.routeMode || "path";
  const capabilities = resolveSiteSettingsCapabilities(hub);
  const heroActions = Array.isArray(record.homePage?.hero?.actions)
    ? record.homePage.hero.actions
        .map((action) => normalizePublicAction(hub, action, routeMode))
        .filter(Boolean)
        .slice(0, 2)
    : [];
  const ctaActions = Array.isArray(record.homePage?.cta?.actions)
    ? record.homePage.cta.actions
        .map((action) => normalizePublicAction(hub, action, routeMode))
        .filter(Boolean)
        .slice(0, 2)
    : [];
  const infoAction = normalizePublicAction(hub, record.homePage?.info?.action, routeMode);

  return {
    hub,
    hubId: normalizeString(hub?.id),
    hubName: normalizeString(record.hubName) || normalizeString(hub?.name),
    siteName: normalizeString(record.siteName) || normalizeString(hub?.name),
    contactEmail: normalizeString(record.contactEmail),
    contactPhone: normalizeString(record.contactPhone),
    address: normalizeAddress(record.address),
    hours: normalizeHours(record.hours),
    tagline: normalizeString(record.tagline),
    themeKey: normalizeTheme(record.themeKey || hub?.themeKey || hub?.theme),
    socialLinks: {
      facebook: normalizeString(record.socialLinks?.facebook),
      instagram: normalizeString(record.socialLinks?.instagram),
      x: normalizeString(record.socialLinks?.x),
      linkedin: normalizeString(record.socialLinks?.linkedin),
      youtube: normalizeString(record.socialLinks?.youtube),
    },
    seoDefaults: {
      title: normalizeString(record.seoDefaults?.title),
      description: normalizeString(record.seoDefaults?.description),
    },
    logoAssetId: normalizeString(record.logoAssetId),
    logoAlt: normalizeString(record.logoAlt),
    logoAsset: record.logoAsset || null,
    header: {
      primaryCtaKey: normalizeHeaderPrimaryCtaKey(record.header?.primaryCtaKey),
    },
    branding: {
      primary: normalizeHexColor(record.branding?.colors?.primary, "#256EF1"),
      secondary: normalizeHexColor(record.branding?.colors?.secondary, "#9C6E35"),
    },
    capabilities,
    homePage: {
      hero: {
        mediaAssetId: normalizeString(record.homePage?.hero?.mediaAssetId),
        mediaAlt: normalizeString(record.homePage?.hero?.mediaAlt),
        mediaAsset: record.homePage?.hero?.mediaAsset || null,
        eyebrow: normalizeString(record.homePage?.hero?.eyebrow),
        title: normalizeString(record.homePage?.hero?.title),
        description: normalizeString(record.homePage?.hero?.description),
        actions: heroActions,
      },
      cta: {
        eyebrow: normalizeString(record.homePage?.cta?.eyebrow),
        title: normalizeString(record.homePage?.cta?.title),
        description: normalizeString(record.homePage?.cta?.description),
        actions: ctaActions,
      },
      info: {
        mediaAssetId: normalizeString(record.homePage?.info?.mediaAssetId),
        mediaAlt: normalizeString(record.homePage?.info?.mediaAlt),
        mediaAsset: record.homePage?.info?.mediaAsset || null,
        eyebrow: normalizeString(record.homePage?.info?.eyebrow),
        title: normalizeString(record.homePage?.info?.title),
        description: normalizeString(record.homePage?.info?.description),
        body: normalizeSectionRichTextContent(record.homePage?.info?.body),
        action: infoAction,
      },
      whatWeDo: {
        eyebrow: normalizeString(record.homePage?.whatWeDo?.eyebrow),
        title: normalizeString(record.homePage?.whatWeDo?.title),
        description: normalizeString(record.homePage?.whatWeDo?.description),
      },
      testimonials: {
        eyebrow: normalizeString(record.homePage?.testimonials?.eyebrow),
        title: normalizeString(record.homePage?.testimonials?.title),
        description: normalizeString(record.homePage?.testimonials?.description),
      },
    },
    pages: {
      about: normalizePageHero(record.pages?.about),
      events: normalizePageHero(record.pages?.events),
      courses: normalizePageHero(record.pages?.courses),
      testimonials: {
        ...normalizePageHero(record.pages?.testimonials),
        cta: normalizePageCta(hub, record.pages?.testimonials?.cta, routeMode),
      },
      terms: normalizeLegalPage(record.pages?.terms),
      privacy: normalizeLegalPage(record.pages?.privacy),
      cookies: normalizeLegalPage(record.pages?.cookies),
    },
    updatedAt: normalizeString(record.updatedAt),
  };
}

export function formatPublicAddress(address = {}) {
  const lines = [];
  const line1 = normalizeString(address.line1);
  const line2 = normalizeString(address.line2);
  const city = normalizeString(address.city);
  const stateOrProvince = normalizeString(address.stateOrProvince);
  const postalCode = normalizeString(address.postalCode);
  const country = normalizeString(address.country);
  const localityLine = [city, stateOrProvince, postalCode].filter(Boolean).join(", ");

  if (line1) {
    lines.push(line1);
  }

  if (line2) {
    lines.push(line2);
  }

  if (localityLine) {
    lines.push(localityLine);
  }

  if (country) {
    lines.push(country);
  }

  return lines;
}

export function formatPublicHours(hours = {}) {
  const rows = [
    { label: "Monday", value: normalizeString(hours.monday) },
    { label: "Tuesday", value: normalizeString(hours.tuesday) },
    { label: "Wednesday", value: normalizeString(hours.wednesday) },
    { label: "Thursday", value: normalizeString(hours.thursday) },
    { label: "Friday", value: normalizeString(hours.friday) },
    { label: "Saturday", value: normalizeString(hours.saturday) },
    { label: "Sunday", value: normalizeString(hours.sunday) },
  ];

  return rows.filter((row) => row.value);
}

export function normalizeHubPublicPresentation(hub = {}) {
  return {
    id: normalizeString(hub.id),
    slug: normalizeString(hub.slug),
    name: normalizeString(hub.name),
    theme: normalizeTheme(hub.themeKey || hub.theme),
    template: normalizeTemplate(hub.templateKey || hub.template),
    locale: resolveLaunchFormattingLocale(hub.locale, hub.country) || getFallbackRegionalMarket().defaultLocale,
  };
}
