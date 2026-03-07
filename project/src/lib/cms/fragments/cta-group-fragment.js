import { isPlainObject, normalizeText } from "./shared.js";

const FORBIDDEN_SCHEME_PATTERN = /^(javascript|data|vbscript):/i;

export function isValidCtaHref(href) {
  const normalized = normalizeText(href);
  if (!normalized) return false;
  if (FORBIDDEN_SCHEME_PATTERN.test(normalized)) return false;
  if (normalized.startsWith("/")) return true;
  if (/^https?:\/\//i.test(normalized)) return true;
  return false;
}

function normalizeCtaItem(input = {}) {
  return {
    id: normalizeText(input.id),
    label: normalizeText(input.label),
    href: normalizeText(input.href),
    variant: normalizeText(input.variant),
  };
}

export function normalizeCtaGroup(input) {
  const source = Array.isArray(input) ? input : [];
  return source
    .map((item) => (isPlainObject(item) ? item : {}))
    .map((item) => normalizeCtaItem(item));
}

export function assertValidCtaGroup(ctas = [], fieldPrefix = "ctas") {
  if (!Array.isArray(ctas)) {
    throw new Error(`${fieldPrefix} must be an array.`);
  }
  if (ctas.length > 2) {
    throw new Error(`${fieldPrefix} supports up to two items.`);
  }

  ctas.forEach((cta, index) => {
    if (!isPlainObject(cta)) {
      throw new Error(`${fieldPrefix}[${index}] must be an object.`);
    }
    const label = normalizeText(cta.label);
    const href = normalizeText(cta.href);

    if (!label) {
      throw new Error(`${fieldPrefix}[${index}].label is required when CTA is added.`);
    }
    if (!href) {
      throw new Error(`${fieldPrefix}[${index}].href is required when CTA is added.`);
    }
    if (!isValidCtaHref(href)) {
      throw new Error(
        `${fieldPrefix}[${index}].href must be internal (/path) or external (http/https).`
      );
    }
  });
}

export function evaluateCtaGroupReadiness(ctas = []) {
  const missing = [];
  const normalized = normalizeCtaGroup(ctas);

  normalized.forEach((cta, index) => {
    if (!cta.label) missing.push(`CTA ${index + 1}: label is required.`);
    if (!cta.href) missing.push(`CTA ${index + 1}: link is required.`);
    if (cta.href && !isValidCtaHref(cta.href)) {
      missing.push(
        `CTA ${index + 1}: link must be internal (/path) or external (http/https).`
      );
    }
  });

  return missing;
}
