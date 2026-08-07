try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { cache } from "react";
import { createPublicContentCache, getPublicContentCacheTags } from "@/lib/cache/public-content";
import { getHubPaymentConfigurationByHubId } from "@/lib/data/hub-payment-configurations";
import { requireHubBySlug, requireHubCoreById } from "@/lib/data/hubs";
import { getMediaAssetById, getPublicMediaAssetById } from "@/lib/data/media";
import { maintainHubAdminOnboardingSummaryForSourceChange } from "@/lib/data/admin-onboarding-summary";
import { syncSiteSettingsMediaUsageProjection } from "@/lib/data/media-usage-projection";
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

const getCachedSiteSettingsRecordDataByHubId = cache(async (hubId) => {
  const doc = await getFirebaseAdminDb().collection("hubs").doc(hubId).collection("siteSettings").doc(SITE_SETTINGS_DOC).get();
  return doc.exists ? doc.data() : {};
});

function getSiteSettingsRef(hubId) {
  return getFirebaseAdminDb().collection("hubs").doc(hubId).collection("siteSettings").doc(SITE_SETTINGS_DOC);
}

async function syncSiteSettingsMediaUsageAfterWrite(hubId, previousDoc, options = {}) {
  const nextDoc = await getSiteSettingsRef(hubId).get();

  await syncSiteSettingsMediaUsageProjection(
    hubId,
    previousDoc?.exists ? previousDoc.data() : {},
    nextDoc.exists ? nextDoc.data() : {},
    options
  );
}

async function maintainAdminOnboardingSummaryForSiteSettingsChange(hubId, actorId, reason = "site-settings-change") {
  return maintainHubAdminOnboardingSummaryForSourceChange(hubId, actorId, { reason });
}

export async function getSiteSettingsByHubSlug(hubSlug) {
  const hub = await requireHubBySlug(hubSlug);
  return getSiteSettingsByHub(hub);
}

async function readSiteSettingsByHub(hub, options = {}) {
  const record = await getCachedSiteSettingsRecordDataByHubId(hub.id);
  const settings = normalizeSiteSettingsRecord(hub, record, { routeMode: options.routeMode });
  const mediaReader = options.publicMedia === true ? getPublicMediaAssetById : getMediaAssetById;
  const pageHeroKeySet = Array.isArray(options.pageHeroKeys)
    ? new Set(options.pageHeroKeys.map((key) => String(key || "").trim()).filter(Boolean))
    : null;
  const shouldHydrateHomeMedia = options.homeMedia !== false;

  const pageHeroMediaEntries = Object.entries(settings.pages || {})
    .filter(([key]) => !pageHeroKeySet || pageHeroKeySet.has(key))
    .filter(([, page]) => page?.hero?.mediaAssetId)
    .map(([key, page]) => [key, page.hero.mediaAssetId]);
  const hasPageHeroMedia = pageHeroMediaEntries.length > 0;
  const homeHeroMediaAssetId = shouldHydrateHomeMedia ? settings.homePage?.hero?.mediaAssetId : "";
  const homeInfoMediaAssetId = shouldHydrateHomeMedia ? settings.homePage?.info?.mediaAssetId : "";

  if (!settings.logoAssetId && !homeHeroMediaAssetId && !homeInfoMediaAssetId && !hasPageHeroMedia) {
    return settings;
  }

  const [logoAsset, heroMediaAsset, infoMediaAsset, ...pageHeroAssets] = await Promise.all([
    settings.logoAssetId ? mediaReader(hub.id, settings.logoAssetId) : Promise.resolve(null),
    homeHeroMediaAssetId ? mediaReader(hub.id, homeHeroMediaAssetId) : Promise.resolve(null),
    homeInfoMediaAssetId ? mediaReader(hub.id, homeInfoMediaAssetId) : Promise.resolve(null),
    ...pageHeroMediaEntries.map(([, assetId]) => mediaReader(hub.id, assetId)),
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

function normalizeMediaScope(options = {}) {
  const pageHeroKeys = Array.isArray(options.pageHeroKeys)
    ? options.pageHeroKeys.map((key) => String(key || "").trim()).filter(Boolean).sort().join(",")
    : "*";
  return [
    options.routeMode || "path",
    options.publicMedia === true ? "public" : "admin",
    options.homeMedia === false ? "no-home" : "home",
    pageHeroKeys,
  ].join("|");
}

const getCachedSiteSettingsByHubForScope = cache(async (hub, scopeKey, routeMode, publicMedia, homeMedia, pageHeroKeysCsv) =>
  readSiteSettingsByHub(hub, {
    routeMode,
    publicMedia,
    homeMedia,
    pageHeroKeys: pageHeroKeysCsv === "*" ? undefined : pageHeroKeysCsv.split(",").filter(Boolean),
  })
);

export async function getCachedSiteSettingsByHub(hub, options = {}) {
  const normalizedOptions = {
    ...options,
    routeMode: options.routeMode || "path",
    publicMedia: options.publicMedia === true,
  };
  const scopeKey = normalizeMediaScope(normalizedOptions);
  const [, , homeMediaKey, pageHeroKeysCsv] = scopeKey.split("|");
  return getCachedSiteSettingsByHubForScope(
    hub,
    scopeKey,
    normalizedOptions.routeMode,
    normalizedOptions.publicMedia,
    homeMediaKey !== "no-home",
    pageHeroKeysCsv ?? "*"
  );
}

export async function getCachedPublicSiteSettingsByHub(hub, options = {}) {
  const normalizedOptions = {
    ...options,
    routeMode: options.routeMode || "path",
    publicMedia: true,
  };
  const scopeKey = normalizeMediaScope(normalizedOptions);
  const [, , homeMediaKey, pageHeroKeysCsv] = scopeKey.split("|");
  const tags = getPublicContentCacheTags(hub.id);
  const readCachedPublicSiteSettings = createPublicContentCache(
    async (hubId, routeMode, shouldHydrateHomeMedia, normalizedPageHeroKeysCsv) => {
      const publicHub = await requireHubCoreById(hubId);

      return readSiteSettingsByHub(publicHub, {
        routeMode,
        publicMedia: true,
        homeMedia: shouldHydrateHomeMedia,
        pageHeroKeys: normalizedPageHeroKeysCsv === "*" ? undefined : normalizedPageHeroKeysCsv.split(",").filter(Boolean),
      });
    },
    ["public-site-settings", hub.id, scopeKey],
    {
      tags: [tags.hub, tags.siteSettings, tags.publicShell, tags.home, tags.media],
    }
  );

  return readCachedPublicSiteSettings(
    hub.id,
    normalizedOptions.routeMode,
    homeMediaKey !== "no-home",
    pageHeroKeysCsv ?? "*"
  );
}

export async function getSiteSettingsByHub(hub) {
  return readSiteSettingsByHub(hub);
}

async function getSiteSettingsRecordForAdminForm(hub) {
  const record = await getCachedSiteSettingsRecordDataByHubId(hub.id);
  return normalizeSiteSettingsRecord(hub, record, { routeMode: "path" });
}

export async function getSiteSettingsFormValuesByHub(hub) {
  const siteSettings = await getSiteSettingsRecordForAdminForm(hub);
  return normalizeSiteSettingsForAdminForm(siteSettings);
}

export async function getBrandingSettingsFormValuesByHub(hub) {
  const siteSettings = await getSiteSettingsRecordForAdminForm(hub);
  return normalizeBrandingSettingsForAdminForm(siteSettings);
}

export async function getEventsPageSettingsFormValuesByHub(hub) {
  const siteSettings = await getSiteSettingsRecordForAdminForm(hub);
  return normalizeEventsPageSettingsForAdminForm(siteSettings);
}

export async function getCoursesPageSettingsFormValuesByHub(hub) {
  const siteSettings = await getSiteSettingsRecordForAdminForm(hub);
  return normalizeCoursesPageSettingsForAdminForm(siteSettings);
}

export async function getTestimonialsPageSettingsFormValuesByHub(hub) {
  const siteSettings = await getSiteSettingsRecordForAdminForm(hub);
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
  const siteSettingsRef = getSiteSettingsRef(hub.id);
  const previousSiteSettingsDoc = await siteSettingsRef.get();

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
  await syncSiteSettingsMediaUsageAfterWrite(hub.id, previousSiteSettingsDoc, { updatedAt: now });
  await maintainAdminOnboardingSummaryForSiteSettingsChange(hub.id, actorId, "branding-settings-update");

  return { ...next, hubId: hub.id, updatedAt: now };
}

export async function updateSiteSettingsByHubSlug(hubSlug, payload, actorId = "system") {
  const hub = await requireHubBySlug(hubSlug);
  const next = normalizeSiteSettingsPayload(payload);
  const now = new Date().toISOString();
  const db = getFirebaseAdminDb();
  const paymentConfiguration = await getHubPaymentConfigurationByHubId(hub.id);
  const countryLocked = Boolean(paymentConfiguration?.onboardingStartedAt || paymentConfiguration?.stripeAccountId);
  const siteSettingsRef = getSiteSettingsRef(hub.id);
  const previousSiteSettingsDoc = await siteSettingsRef.get();

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
  await syncSiteSettingsMediaUsageAfterWrite(hub.id, previousSiteSettingsDoc, { updatedAt: now });
  await maintainAdminOnboardingSummaryForSiteSettingsChange(hub.id, actorId, "site-settings-update");

  return { ...next, hubId: hub.id, updatedAt: now };
}

export async function updateHomepageSettingsByHubSlug(hubSlug, payload, actorId = "system") {
  const hub = await requireHubBySlug(hubSlug);
  const next = normalizeHomepageSettingsPayload(payload);
  const now = new Date().toISOString();
  const siteSettingsRef = getSiteSettingsRef(hub.id);
  const previousSiteSettingsDoc = await siteSettingsRef.get();

  await siteSettingsRef.set({
    hubId: hub.id,
    ...next,
    updatedAt: now,
    updatedBy: actorId,
  }, { merge: true });
  await syncSiteSettingsMediaUsageAfterWrite(hub.id, previousSiteSettingsDoc, { updatedAt: now });
  await maintainAdminOnboardingSummaryForSiteSettingsChange(hub.id, actorId, "homepage-settings-update");

  return { ...next, hubId: hub.id, updatedAt: now };
}

export async function updateEventsPageSettingsByHubSlug(hubSlug, payload, actorId = "system") {
  const hub = await requireHubBySlug(hubSlug);
  const next = normalizeEventsPageSettingsPayload(payload);
  const now = new Date().toISOString();
  const siteSettingsRef = getSiteSettingsRef(hub.id);
  const previousSiteSettingsDoc = await siteSettingsRef.get();

  await siteSettingsRef.set({
    hubId: hub.id,
    ...next,
    updatedAt: now,
    updatedBy: actorId,
  }, { merge: true });
  await syncSiteSettingsMediaUsageAfterWrite(hub.id, previousSiteSettingsDoc, { updatedAt: now });

  return { ...next, hubId: hub.id, updatedAt: now };
}

export async function updateCoursesPageSettingsByHubSlug(hubSlug, payload, actorId = "system") {
  const hub = await requireHubBySlug(hubSlug);
  const next = normalizeCoursesPageSettingsPayload(payload);
  const now = new Date().toISOString();
  const siteSettingsRef = getSiteSettingsRef(hub.id);
  const previousSiteSettingsDoc = await siteSettingsRef.get();

  await siteSettingsRef.set({
    hubId: hub.id,
    ...next,
    updatedAt: now,
    updatedBy: actorId,
  }, { merge: true });
  await syncSiteSettingsMediaUsageAfterWrite(hub.id, previousSiteSettingsDoc, { updatedAt: now });

  return { ...next, hubId: hub.id, updatedAt: now };
}

export async function updateTestimonialsPageSettingsByHubSlug(hubSlug, payload, actorId = "system") {
  const hub = await requireHubBySlug(hubSlug);
  const next = normalizeTestimonialsPageSettingsPayload(payload);
  const now = new Date().toISOString();
  const siteSettingsRef = getSiteSettingsRef(hub.id);
  const previousSiteSettingsDoc = await siteSettingsRef.get();

  await siteSettingsRef.set({
    hubId: hub.id,
    ...next,
    updatedAt: now,
    updatedBy: actorId,
  }, { merge: true });
  await syncSiteSettingsMediaUsageAfterWrite(hub.id, previousSiteSettingsDoc, { updatedAt: now });

  return { ...next, hubId: hub.id, updatedAt: now };
}
