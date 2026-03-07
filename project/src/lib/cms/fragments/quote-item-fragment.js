import { normalizeOptionalBadge, evaluateBadgeReadiness } from "./badge-fragment.js";
import { isPlainObject, normalizeText, clampText } from "./shared.js";

const QUOTE_MAX_LENGTH = 360;

function fallbackQuoteItemId() {
  return `quote_${Math.random().toString(36).slice(2, 10)}`;
}

export function createQuoteItemId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `quote_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  }
  return fallbackQuoteItemId();
}

export function createDefaultQuoteItem() {
  return {
    id: createQuoteItemId(),
    quote: "",
    authorName: "",
    authorRole: "",
    authorOrg: "",
    avatar: {
      imageMediaId: "",
      alt: "",
    },
    badge: null,
  };
}

function normalizeQuoteAvatar(input = {}) {
  const source = isPlainObject(input) ? input : {};
  return {
    imageMediaId: normalizeText(source.imageMediaId),
    alt: normalizeText(source.alt),
  };
}

export function normalizeQuoteItem(input = {}, index = 0) {
  const source = isPlainObject(input) ? input : {};

  return {
    id: normalizeText(source.id) || `quote_${index + 1}`,
    quote: clampText(source.quote, QUOTE_MAX_LENGTH),
    authorName: normalizeText(source.authorName),
    authorRole: normalizeText(source.authorRole),
    authorOrg: normalizeText(source.authorOrg),
    avatar: normalizeQuoteAvatar(source.avatar),
    badge: normalizeOptionalBadge(source.badge),
  };
}

export function normalizeQuoteItems(items = []) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item, index) => normalizeQuoteItem(item, index))
    .filter((item) => item.id);
}

export function evaluateQuoteItemReadiness(item = {}, index = 0) {
  const normalized = normalizeQuoteItem(item, index);
  const missing = [];

  if (!normalized.quote) {
    missing.push(`Item ${index + 1}: quote is required.`);
  }
  if (normalized.avatar.imageMediaId && !normalized.avatar.alt) {
    missing.push(`Item ${index + 1}: avatar alt text is required when avatar is selected.`);
  }

  return [...missing, ...evaluateBadgeReadiness(normalized.badge, `Item ${index + 1} badge`)];
}

export function extractQuoteItemMediaRefs(item = {}) {
  const normalized = normalizeQuoteItem(item);
  const refs = [];
  if (normalized.avatar.imageMediaId) refs.push(normalized.avatar.imageMediaId);
  return refs;
}

export const QUOTE_ITEM_MAX_LENGTH = QUOTE_MAX_LENGTH;
