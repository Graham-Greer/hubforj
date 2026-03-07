import { isPlainObject, normalizeText } from "./shared.js";

const ALLOWED_ICON_TONES = new Set([
  "neutral",
  "brand",
  "success",
  "warning",
  "danger",
]);

const MATERIAL_ICON_NAME_PATTERN = /^[a-z0-9_]+$/;

export function normalizeIconRef(input = null) {
  if (!isPlainObject(input)) return null;

  const name = normalizeText(input.name);
  const tone = normalizeText(input.tone);

  return {
    name,
    tone: ALLOWED_ICON_TONES.has(tone) ? tone : "neutral",
  };
}

export function evaluateIconRefReadiness(input = null, fieldLabel = "Icon") {
  if (!isPlainObject(input)) return [];

  const icon = normalizeIconRef(input);
  if (!icon?.name) {
    return [`${fieldLabel}: icon name is required when icon is added.`];
  }

  if (!MATERIAL_ICON_NAME_PATTERN.test(icon.name)) {
    return [`${fieldLabel}: icon name must use lowercase Material Symbols format (e.g. group).`];
  }

  return [];
}
