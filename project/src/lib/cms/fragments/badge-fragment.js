import { isPlainObject, normalizeText } from "./shared.js";

const ALLOWED_BADGE_TONES = new Set([
  "neutral",
  "brand",
  "success",
  "warning",
  "danger",
]);

export function normalizeBadgeFragment(input = {}) {
  const source = isPlainObject(input) ? input : {};
  const text = normalizeText(source.text);
  const tone = normalizeText(source.tone);

  return {
    text,
    tone: ALLOWED_BADGE_TONES.has(tone) ? tone : "neutral",
  };
}

export function normalizeOptionalBadge(input = null) {
  if (!isPlainObject(input)) return null;
  const badge = normalizeBadgeFragment(input);
  return badge.text ? badge : null;
}

export function evaluateBadgeReadiness(input = null, fieldLabel = "Badge") {
  if (!isPlainObject(input)) return [];
  const badge = normalizeBadgeFragment(input);
  if (!badge.text) return [`${fieldLabel}: text is required when badge is added.`];
  return [];
}

