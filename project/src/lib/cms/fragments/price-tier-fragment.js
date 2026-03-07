import { normalizeOptionalBadge, evaluateBadgeReadiness } from "./badge-fragment.js";
import { normalizeMoneyFragment, evaluateMoneyReadiness } from "./money-fragment.js";
import {
  isValidCtaHref,
  normalizeCtaGroup,
  evaluateCtaGroupReadiness,
} from "./cta-group-fragment.js";
import { isPlainObject, normalizeText, clampText } from "./shared.js";

const TIER_DESCRIPTION_MAX_LENGTH = 200;
const FEATURE_MAX_COUNT = 12;
const ALLOWED_INTERVALS = new Set(["once", "month", "year"]);
const FORBIDDEN_SCHEME_PATTERN = /^(javascript|data|vbscript):/i;

function fallbackTierId() {
  return `tier_${Math.random().toString(36).slice(2, 10)}`;
}

function fallbackFeatureId() {
  return `feature_${Math.random().toString(36).slice(2, 10)}`;
}

export function createPriceTierId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `tier_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  }
  return fallbackTierId();
}

export function createPriceTierFeatureId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `feature_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  }
  return fallbackFeatureId();
}

export function createDefaultPriceTierFeature() {
  return {
    id: createPriceTierFeatureId(),
    text: "",
  };
}

export function createDefaultPriceTier() {
  return {
    id: createPriceTierId(),
    name: "",
    description: "",
    isFree: false,
    price: {
      amountMinor: 0,
      currency: "GBP",
    },
    interval: "month",
    features: [createDefaultPriceTierFeature()],
    highlight: false,
    badge: null,
    cta: null,
  };
}

function normalizePriceTierFeature(input = {}, index = 0) {
  const source = isPlainObject(input) ? input : {};
  return {
    id: normalizeText(source.id) || `feature_${index + 1}`,
    text: normalizeText(source.text),
  };
}

function normalizePriceTierFeatures(features = []) {
  if (!Array.isArray(features)) return [];
  return features
    .map((item, index) => normalizePriceTierFeature(item, index))
    .filter((item) => item.id)
    .slice(0, FEATURE_MAX_COUNT);
}

function normalizeTierCta(input = null) {
  if (!isPlainObject(input)) return null;
  const normalized = normalizeCtaGroup([input]).at(0);
  if (!normalized) return null;
  return {
    id: normalizeText(normalized.id),
    label: normalizeText(normalized.label),
    href: normalizeText(normalized.href),
    variant: normalizeText(normalized.variant),
  };
}

export function normalizePriceTier(input = {}, index = 0) {
  const source = isPlainObject(input) ? input : {};
  const isFree = Boolean(source.isFree);
  const rawInterval = normalizeText(source.interval);

  const price = isFree ? null : normalizeMoneyFragment(source.price);

  return {
    id: normalizeText(source.id) || `tier_${index + 1}`,
    name: normalizeText(source.name),
    description: clampText(source.description, TIER_DESCRIPTION_MAX_LENGTH),
    isFree,
    price,
    interval: ALLOWED_INTERVALS.has(rawInterval) ? rawInterval : "month",
    features: normalizePriceTierFeatures(source.features),
    highlight: Boolean(source.highlight),
    badge: normalizeOptionalBadge(source.badge),
    cta: normalizeTierCta(source.cta),
  };
}

export function normalizePriceTiers(items = []) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item, index) => normalizePriceTier(item, index))
    .filter((item) => item.id)
    .slice(0, 4);
}

export function evaluatePriceTierReadiness(item = {}, index = 0) {
  const tier = normalizePriceTier(item, index);
  const missing = [];

  if (!tier.name) {
    missing.push(`Tier ${index + 1}: name is required.`);
  }

  if (!tier.isFree) {
    missing.push(...evaluateMoneyReadiness(tier.price, `Tier ${index + 1} price`));
  }

  tier.features.forEach((feature, featureIndex) => {
    if (!feature.text) {
      missing.push(`Tier ${index + 1}: feature ${featureIndex + 1} text is required.`);
    }
  });

  missing.push(...evaluateBadgeReadiness(tier.badge, `Tier ${index + 1} badge`));

  if (tier.cta) {
    const ctaIssues = evaluateCtaGroupReadiness([tier.cta]).map(
      (issue) => `Tier ${index + 1}: ${issue}`
    );
    missing.push(...ctaIssues);
    if (tier.cta.href && FORBIDDEN_SCHEME_PATTERN.test(tier.cta.href)) {
      missing.push(`Tier ${index + 1}: CTA link uses a forbidden URL scheme.`);
    }
    if (tier.cta.href && !isValidCtaHref(tier.cta.href)) {
      missing.push(`Tier ${index + 1}: CTA link must be internal (/path) or external (http/https).`);
    }
  }

  return missing;
}

export const PRICE_TIER_DESCRIPTION_MAX_LENGTH = TIER_DESCRIPTION_MAX_LENGTH;
export const PRICE_TIER_INTERVALS = Array.from(ALLOWED_INTERVALS);
