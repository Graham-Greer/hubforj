import { normalizeOptionalBadge, evaluateBadgeReadiness } from "./badge-fragment.js";
import { evaluateIconRefReadiness, normalizeIconRef } from "./icon-ref-fragment.js";
import { isPlainObject, normalizeText, clampText } from "./shared.js";

const SUBTEXT_MAX_LENGTH = 120;

function fallbackStatItemId() {
  return `stat_${Math.random().toString(36).slice(2, 10)}`;
}

export function createStatItemId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `stat_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  }
  return fallbackStatItemId();
}

export function createDefaultStatItem() {
  return {
    id: createStatItemId(),
    label: "",
    value: "",
    subtext: "",
    badge: null,
    icon: null,
  };
}

export function normalizeStatItem(input = {}, index = 0) {
  const source = isPlainObject(input) ? input : {};
  return {
    id: normalizeText(source.id) || `stat_${index + 1}`,
    label: normalizeText(source.label),
    value: normalizeText(source.value),
    subtext: clampText(source.subtext, SUBTEXT_MAX_LENGTH),
    badge: normalizeOptionalBadge(source.badge),
    icon: normalizeIconRef(source.icon),
  };
}

export function normalizeStatItems(items = []) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item, index) => normalizeStatItem(item, index))
    .filter((item) => item.id);
}

export function evaluateStatItemReadiness(item = {}, index = 0) {
  const normalized = normalizeStatItem(item, index);
  const missing = [];

  if (!normalized.label) {
    missing.push(`Item ${index + 1}: label is required.`);
  }
  if (!normalized.value) {
    missing.push(`Item ${index + 1}: value is required.`);
  }

  missing.push(...evaluateIconRefReadiness(normalized.icon, `Item ${index + 1} icon`));
  missing.push(...evaluateBadgeReadiness(normalized.badge, `Item ${index + 1} badge`));

  return missing;
}

export const STATS_ITEM_SUBTEXT_MAX_LENGTH = SUBTEXT_MAX_LENGTH;
