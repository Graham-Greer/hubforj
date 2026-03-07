import { normalizeOptionalBadge, evaluateBadgeReadiness } from "./badge-fragment.js";
import { isPlainObject, normalizeText, clampText } from "./shared.js";

const DESCRIPTION_MAX_LENGTH = 200;

function fallbackCardItemId() {
  return `card_${Math.random().toString(36).slice(2, 10)}`;
}

export function createCardItemId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `card_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  }
  return fallbackCardItemId();
}

export function createDefaultCardItem() {
  return {
    id: createCardItemId(),
    title: "",
    description: "",
    media: {
      imageMediaId: "",
      alt: "",
    },
    badge: null,
  };
}

function normalizeCardMedia(input = {}) {
  const source = isPlainObject(input) ? input : {};
  return {
    imageMediaId: normalizeText(source.imageMediaId),
    alt: normalizeText(source.alt),
  };
}

export function normalizeCardItem(input = {}, index = 0) {
  const source = isPlainObject(input) ? input : {};
  return {
    id: normalizeText(source.id) || `card_${index + 1}`,
    title: normalizeText(source.title),
    description: clampText(source.description, DESCRIPTION_MAX_LENGTH),
    media: normalizeCardMedia(source.media),
    badge: normalizeOptionalBadge(source.badge),
  };
}

export function normalizeCardItems(items = []) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item, index) => normalizeCardItem(item, index))
    .filter((item) => item.id);
}

export function evaluateCardItemReadiness(item = {}, index = 0) {
  const normalized = normalizeCardItem(item, index);
  const missing = [];

  if (!normalized.title) {
    missing.push(`Item ${index + 1}: title is required.`);
  }
  if (normalized.media.imageMediaId && !normalized.media.alt) {
    missing.push(`Item ${index + 1}: alt text is required when an image is selected.`);
  }

  return [...missing, ...evaluateBadgeReadiness(normalized.badge, `Item ${index + 1} badge`)];
}

export function extractCardItemMediaRefs(item = {}) {
  const normalized = normalizeCardItem(item);
  const refs = [];
  if (normalized.media.imageMediaId) refs.push(normalized.media.imageMediaId);
  return refs;
}

export const CARD_ITEM_DESCRIPTION_MAX_LENGTH = DESCRIPTION_MAX_LENGTH;

