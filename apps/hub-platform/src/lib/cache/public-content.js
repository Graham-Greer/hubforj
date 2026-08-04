try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { revalidateTag, unstable_cache } from "next/cache";

function normalizeString(value) {
  return String(value || "").trim();
}

function isPublicContentCacheEnabled() {
  return normalizeString(process.env.HUB_PLATFORM_PUBLIC_CACHE_DISABLED).toLowerCase() !== "true";
}

export function getPublicContentCacheTags(hubId) {
  const normalizedHubId = normalizeString(hubId);

  return {
    hub: `hub:${normalizedHubId}`,
    media: `hub:${normalizedHubId}:media`,
    navigation: `hub:${normalizedHubId}:navigation`,
    publicShell: `hub:${normalizedHubId}:public-shell`,
    siteSettings: `hub:${normalizedHubId}:site-settings`,
    home: `hub:${normalizedHubId}:home`,
    events: `hub:${normalizedHubId}:events`,
    courses: `hub:${normalizedHubId}:courses`,
    testimonials: `hub:${normalizedHubId}:testimonials`,
    whatWeDo: `hub:${normalizedHubId}:what-we-do`,
  };
}

export function getPublicHubSlugCacheTag(hubSlug) {
  const normalizedHubSlug = normalizeString(hubSlug);
  return normalizedHubSlug ? `hub-slug:${normalizedHubSlug}:public-core` : "";
}

export function createPublicContentCache(readFn, keyParts, options = {}) {
  if (!isPublicContentCacheEnabled()) {
    return readFn;
  }

  return unstable_cache(readFn, keyParts, {
    tags: options.tags || [],
    revalidate: options.revalidate ?? false,
  });
}

export function revalidatePublicContentTags(hubId, tagKeys = []) {
  const tags = getPublicContentCacheTags(hubId);

  tagKeys.forEach((tagKey) => {
    const tag = tags[tagKey];

    if (tag) {
      revalidateTag(tag);
    }
  });
}

export function revalidatePublicHubCoreCache(hub) {
  const hubId = normalizeString(hub?.id);
  const hubSlug = normalizeString(hub?.slug);

  if (hubId) {
    revalidatePublicContentTags(hubId, ["hub", "publicShell"]);
  }

  const slugTag = getPublicHubSlugCacheTag(hubSlug);

  if (slugTag) {
    revalidateTag(slugTag);
  }
}

export function revalidatePublicShellCache(hubId) {
  revalidatePublicContentTags(hubId, ["hub", "siteSettings", "navigation", "publicShell", "home"]);
}

export function revalidatePublicMediaCache(hubId) {
  revalidatePublicContentTags(hubId, ["media", "siteSettings", "publicShell", "home", "events", "courses", "testimonials"]);
}

export function revalidatePublicEventsCache(hubId) {
  revalidatePublicContentTags(hubId, ["events"]);
}

export function revalidatePublicCoursesCache(hubId) {
  revalidatePublicContentTags(hubId, ["courses"]);
}

export function revalidatePublicTestimonialsCache(hubId) {
  revalidatePublicContentTags(hubId, ["testimonials", "home"]);
}

export function revalidatePublicWhatWeDoCache(hubId) {
  revalidatePublicContentTags(hubId, ["whatWeDo", "home"]);
}
