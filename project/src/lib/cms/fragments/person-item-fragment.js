import { normalizeOptionalBadge, evaluateBadgeReadiness } from "./badge-fragment.js";
import { isPlainObject, normalizeText, clampText } from "./shared.js";

const BIO_MAX_LENGTH = 240;
const ALLOWED_SOCIAL_PLATFORMS = new Set(["x", "linkedin", "facebook"]);
const FORBIDDEN_SCHEME_PATTERN = /^(javascript|data|vbscript):/i;

function fallbackPersonItemId() {
  return `person_${Math.random().toString(36).slice(2, 10)}`;
}

function fallbackSocialLinkId() {
  return `social_${Math.random().toString(36).slice(2, 10)}`;
}

export function createPersonItemId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `person_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  }
  return fallbackPersonItemId();
}

export function createPersonSocialLinkId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `social_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  }
  return fallbackSocialLinkId();
}

export function createDefaultPersonItem() {
  return {
    id: createPersonItemId(),
    name: "",
    role: "",
    bio: "",
    avatar: {
      imageMediaId: "",
      alt: "",
    },
    badge: null,
    socialLinks: [],
  };
}

export function createDefaultPersonSocialLink() {
  return {
    id: createPersonSocialLinkId(),
    platform: "x",
    href: "",
  };
}

function normalizePersonAvatar(input = {}) {
  const source = isPlainObject(input) ? input : {};
  return {
    imageMediaId: normalizeText(source.imageMediaId),
    alt: normalizeText(source.alt),
  };
}

function isValidSocialHref(href) {
  const normalized = normalizeText(href);
  if (!normalized) return false;
  if (FORBIDDEN_SCHEME_PATTERN.test(normalized)) return false;
  return /^https:\/\//i.test(normalized);
}

export function normalizePersonSocialLink(input = {}, index = 0) {
  const source = isPlainObject(input) ? input : {};
  const platform = normalizeText(source.platform);

  return {
    id: normalizeText(source.id) || `social_${index + 1}`,
    platform: ALLOWED_SOCIAL_PLATFORMS.has(platform) ? platform : "x",
    href: normalizeText(source.href),
  };
}

function normalizePersonSocialLinks(links = []) {
  if (!Array.isArray(links)) return [];
  return links
    .map((link, index) => normalizePersonSocialLink(link, index))
    .filter((link) => link.id)
    .slice(0, 3);
}

export function normalizePersonItem(input = {}, index = 0) {
  const source = isPlainObject(input) ? input : {};

  return {
    id: normalizeText(source.id) || `person_${index + 1}`,
    name: normalizeText(source.name),
    role: normalizeText(source.role),
    bio: clampText(source.bio, BIO_MAX_LENGTH),
    avatar: normalizePersonAvatar(source.avatar),
    badge: normalizeOptionalBadge(source.badge),
    socialLinks: normalizePersonSocialLinks(source.socialLinks),
  };
}

export function normalizePersonItems(items = []) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item, index) => normalizePersonItem(item, index))
    .filter((item) => item.id);
}

export function evaluatePersonItemReadiness(item = {}, index = 0) {
  const normalized = normalizePersonItem(item, index);
  const missing = [];

  if (!normalized.name) {
    missing.push(`Item ${index + 1}: name is required.`);
  }
  if (normalized.avatar.imageMediaId && !normalized.avatar.alt) {
    missing.push(`Item ${index + 1}: avatar alt text is required when avatar is selected.`);
  }

  normalized.socialLinks.forEach((link, linkIndex) => {
    if (!ALLOWED_SOCIAL_PLATFORMS.has(link.platform)) {
      missing.push(`Item ${index + 1}: social link ${linkIndex + 1} platform is invalid.`);
    }
    if (!link.href) {
      missing.push(`Item ${index + 1}: social link ${linkIndex + 1} URL is required.`);
      return;
    }
    if (!isValidSocialHref(link.href)) {
      missing.push(`Item ${index + 1}: social link ${linkIndex + 1} URL must start with https://.`);
    }
  });

  return [...missing, ...evaluateBadgeReadiness(normalized.badge, `Item ${index + 1} badge`)];
}

export function extractPersonItemMediaRefs(item = {}) {
  const normalized = normalizePersonItem(item);
  const refs = [];
  if (normalized.avatar.imageMediaId) refs.push(normalized.avatar.imageMediaId);
  return refs;
}

export const PERSON_ITEM_BIO_MAX_LENGTH = BIO_MAX_LENGTH;
export const PERSON_SOCIAL_LINK_PLATFORMS = Array.from(ALLOWED_SOCIAL_PLATFORMS);
