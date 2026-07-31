try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { cache } from "react";
import { getHubPaymentConfigurationByHubId } from "@/lib/data/hub-payment-configurations";
import { requireHubBySlug } from "@/lib/data/hubs";
import { getMediaAssetById } from "@/lib/data/media";
import {
  hasSectionRichTextContent,
  normalizeSectionRichTextContent,
} from "@/lib/domain/section-rich-text";
import {
  normalizeBrandingSettingsForAdminForm,
  normalizeBrandingSettingsPayload,
  normalizeCoursesPageSettingsForAdminForm,
  normalizeCoursesPageSettingsPayload,
  normalizeEventsPageSettingsForAdminForm,
  normalizeEventsPageSettingsPayload,
  normalizeHomepageSettingsPayload,
  normalizeSiteSettingsPayload,
  normalizeSiteSettingsForAdminForm,
  normalizeTestimonialsPageSettingsForAdminForm,
  normalizeTestimonialsPageSettingsPayload,
} from "@/lib/domain/site-settings";
import { normalizeSiteSettingsRecord } from "@/lib/domain/public-site";

const SITE_SETTINGS_DOC = "primary";

export async function getSiteSettingsByHubSlug(hubSlug) {
  const hub = await requireHubBySlug(hubSlug);
  return getSiteSettingsByHub(hub);
}

async function readSiteSettingsByHub(hub) {
  const doc = await getFirebaseAdminDb().collection("hubs").doc(hub.id).collection("siteSettings").doc(SITE_SETTINGS_DOC).get();
  const settings = normalizeSiteSettingsRecord(hub, doc.exists ? doc.data() : {});

  const pageHeroMediaEntries = Object.entries(settings.pages || {})
    .filter(([, page]) => page?.hero?.mediaAssetId)
    .map(([key, page]) => [key, page.hero.mediaAssetId]);
  const hasPageHeroMedia = pageHeroMediaEntries.length > 0;

  if (!settings.logoAssetId && !settings.homePage?.hero?.mediaAssetId && !settings.homePage?.info?.mediaAssetId && !hasPageHeroMedia) {
    return settings;
  }

  const [logoAsset, heroMediaAsset, infoMediaAsset, ...pageHeroAssets] = await Promise.all([
    settings.logoAssetId ? getMediaAssetById(hub.id, settings.logoAssetId) : Promise.resolve(null),
    settings.homePage?.hero?.mediaAssetId ? getMediaAssetById(hub.id, settings.homePage.hero.mediaAssetId) : Promise.resolve(null),
    settings.homePage?.info?.mediaAssetId ? getMediaAssetById(hub.id, settings.homePage.info.mediaAssetId) : Promise.resolve(null),
    ...pageHeroMediaEntries.map(([, assetId]) => getMediaAssetById(hub.id, assetId)),
  ]);
  const pageHeroAssetMap = pageHeroMediaEntries.reduce((map, [key], index) => {
    map[key] = pageHeroAssets[index] || null;
    return map;
  }, {});

  return {
    ...settings,
    logoAsset,
    homePage: {
      ...settings.homePage,
      hero: {
        ...settings.homePage.hero,
        mediaAsset: heroMediaAsset,
      },
      info: {
        ...settings.homePage.info,
        mediaAsset: infoMediaAsset,
      },
    },
    pages: Object.entries(settings.pages || {}).reduce((pages, [key, page]) => {
      pages[key] = {
        ...page,
        hero: {
          ...page.hero,
          mediaAsset: pageHeroAssetMap[key] || null,
        },
      };
      return pages;
    }, {}),
  };
}

export const getCachedSiteSettingsByHub = cache(readSiteSettingsByHub);

export async function getSiteSettingsByHub(hub) {
  return readSiteSettingsByHub(hub);
}

export async function getSiteSettingsFormValuesByHub(hub) {
  const siteSettings = await getSiteSettingsByHub(hub);
  return normalizeSiteSettingsForAdminForm(siteSettings);
}

export async function getBrandingSettingsFormValuesByHub(hub) {
  const siteSettings = await getSiteSettingsByHub(hub);
  return normalizeBrandingSettingsForAdminForm(siteSettings);
}

export async function getEventsPageSettingsFormValuesByHub(hub) {
  const siteSettings = await getSiteSettingsByHub(hub);
  return normalizeEventsPageSettingsForAdminForm(siteSettings);
}

export async function getCoursesPageSettingsFormValuesByHub(hub) {
  const siteSettings = await getSiteSettingsByHub(hub);
  return normalizeCoursesPageSettingsForAdminForm(siteSettings);
}

export async function getTestimonialsPageSettingsFormValuesByHub(hub) {
  const siteSettings = await getSiteSettingsByHub(hub);
  return normalizeTestimonialsPageSettingsForAdminForm(siteSettings);
}

export async function getLegacyLegalMigrationValuesByHub(hub) {
  const siteSettings = await getSiteSettingsByHub(hub);
  return {
    termsCustomBody: hasSectionRichTextContent(siteSettings.pages?.terms?.customBody)
      ? normalizeSectionRichTextContent(siteSettings.pages.terms.customBody)
      : [],
    privacyCustomBody: hasSectionRichTextContent(siteSettings.pages?.privacy?.customBody)
      ? normalizeSectionRichTextContent(siteSettings.pages.privacy.customBody)
      : [],
  };
}

export async function updateBrandingSettingsByHubSlug(hubSlug, payload, actorId = "system") {
  const hub = await requireHubBySlug(hubSlug);
  const next = normalizeBrandingSettingsPayload(payload);
  const now = new Date().toISOString();
  const db = getFirebaseAdminDb();

  await Promise.all([
    db.collection("hubs").doc(hub.id).update({
      themeKey: next.themeKey,
      templateKey: next.templateKey,
      updatedAt: now,
      updatedBy: actorId,
    }),
    db.collection("hubs").doc(hub.id).collection("siteSettings").doc(SITE_SETTINGS_DOC).set({
      hubId: hub.id,
      themeKey: next.themeKey,
      logoAssetId: next.logoAssetId,
      logoAlt: next.logoAlt,
      branding: {
        colors: {
          primary: next.brandingColors.primary,
          secondary: next.brandingColors.secondary,
        },
      },
      header: {
        primaryCtaKey: next.headerCtaKey,
      },
      updatedAt: now,
      updatedBy: actorId,
    }, { merge: true }),
  ]);

  return { ...next, hubId: hub.id, updatedAt: now };
}

export async function updateSiteSettingsByHubSlug(hubSlug, payload, actorId = "system") {
  const hub = await requireHubBySlug(hubSlug);
  const next = normalizeSiteSettingsPayload(payload);
  const now = new Date().toISOString();
  const db = getFirebaseAdminDb();
  const paymentConfiguration = await getHubPaymentConfigurationByHubId(hub.id);
  const countryLocked = Boolean(paymentConfiguration?.onboardingStartedAt || paymentConfiguration?.stripeAccountId);

  if (countryLocked && next.country !== String(hub.country || "").trim().toUpperCase()) {
    throw new Error("Country cannot be changed after Stripe setup begins. Contact support if you need to change it.");
  }

  await Promise.all([
    db.collection("hubs").doc(hub.id).update({
      name: next.hubName,
      country: next.country,
      locale: next.locale,
      timezone: next.timezone,
      defaultCurrency: next.defaultCurrency,
      regionalSetupStatus: "complete",
      regionalSetupCompletedAt: String(hub.regionalSetupCompletedAt || "").trim() || now,
      updatedAt: now,
      updatedBy: actorId,
    }),
    db.collection("hubs").doc(hub.id).collection("siteSettings").doc(SITE_SETTINGS_DOC).set({
      hubId: hub.id,
      ...next,
      tagline: "",
      updatedAt: now,
      updatedBy: actorId,
    }, { merge: true }),
  ]);

  return { ...next, hubId: hub.id, updatedAt: now };
}

export async function updateHomepageSettingsByHubSlug(hubSlug, payload, actorId = "system") {
  const hub = await requireHubBySlug(hubSlug);
  const next = normalizeHomepageSettingsPayload(payload);
  const now = new Date().toISOString();

  await getFirebaseAdminDb().collection("hubs").doc(hub.id).collection("siteSettings").doc(SITE_SETTINGS_DOC).set({
    hubId: hub.id,
    ...next,
    updatedAt: now,
    updatedBy: actorId,
  }, { merge: true });

  return { ...next, hubId: hub.id, updatedAt: now };
}

export async function updateEventsPageSettingsByHubSlug(hubSlug, payload, actorId = "system") {
  const hub = await requireHubBySlug(hubSlug);
  const next = normalizeEventsPageSettingsPayload(payload);
  const now = new Date().toISOString();

  await getFirebaseAdminDb().collection("hubs").doc(hub.id).collection("siteSettings").doc(SITE_SETTINGS_DOC).set({
    hubId: hub.id,
    ...next,
    updatedAt: now,
    updatedBy: actorId,
  }, { merge: true });

  return { ...next, hubId: hub.id, updatedAt: now };
}

export async function updateCoursesPageSettingsByHubSlug(hubSlug, payload, actorId = "system") {
  const hub = await requireHubBySlug(hubSlug);
  const next = normalizeCoursesPageSettingsPayload(payload);
  const now = new Date().toISOString();

  await getFirebaseAdminDb().collection("hubs").doc(hub.id).collection("siteSettings").doc(SITE_SETTINGS_DOC).set({
    hubId: hub.id,
    ...next,
    updatedAt: now,
    updatedBy: actorId,
  }, { merge: true });

  return { ...next, hubId: hub.id, updatedAt: now };
}

export async function updateTestimonialsPageSettingsByHubSlug(hubSlug, payload, actorId = "system") {
  const hub = await requireHubBySlug(hubSlug);
  const next = normalizeTestimonialsPageSettingsPayload(payload);
  const now = new Date().toISOString();

  await getFirebaseAdminDb().collection("hubs").doc(hub.id).collection("siteSettings").doc(SITE_SETTINGS_DOC).set({
    hubId: hub.id,
    ...next,
    updatedAt: now,
    updatedBy: actorId,
  }, { merge: true });

  return { ...next, hubId: hub.id, updatedAt: now };
}
