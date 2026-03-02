import {
  assertNoCanonicalDuplicates,
  assertNoReservedDomains,
  assertValidDomainFormat,
  dedupeByCanonicalDomain,
  parseDomainList,
} from "@/lib/data/hubs/domain-policy";
import {
  normalizeGlobalFooterId,
  normalizeGlobalHeaderId,
} from "@/lib/data/pages/layout-config";

function assertString(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} is required.`);
  }
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

function asPlainObject(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${field} must be an object.`);
  }
  return value;
}

function parseTokenOverrides(value) {
  if (value === undefined || value === null || value === "") {
    return {};
  }

  let parsed = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new Error("tokenOverrides must be valid JSON.");
    }
  }

  const objectValue = asPlainObject(parsed, "tokenOverrides");
  const entries = Object.entries(objectValue);
  const normalized = {};

  for (const [key, raw] of entries) {
    const nextKey = String(key || "").trim();
    if (!nextKey) continue;

    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      const scoped = {};
      for (const [nestedKey, nestedValue] of Object.entries(raw)) {
        const cssVar = String(nestedKey || "").trim();
        if (!cssVar.startsWith("--")) {
          throw new Error(`tokenOverrides.${nextKey}.${cssVar} must be a CSS variable key starting with "--".`);
        }
        scoped[cssVar] = String(nestedValue);
      }
      normalized[nextKey] = scoped;
      continue;
    }

    if (!nextKey.startsWith("--")) {
      throw new Error(`tokenOverrides.${nextKey} must be a CSS variable key starting with "--".`);
    }
    normalized[nextKey] = String(raw);
  }

  return normalized;
}

function parseCustomDomains(value) {
  const domains = parseDomainList(value);
  for (const domain of domains) {
    assertValidDomainFormat(domain);
  }

  assertNoCanonicalDuplicates(domains);
  const deduped = dedupeByCanonicalDomain(domains);
  assertNoReservedDomains(deduped);
  return deduped;
}

function parseTemplateKey(value) {
  const templateKey = String(value || "").trim();
  if (!templateKey) {
    throw new Error("templateKey is required.");
  }
  return templateKey;
}

export function validateCreateHubInput(input) {
  const payload = input || {};
  assertString(payload.name, "name");
  assertString(payload.slug, "slug");

  const slug = slugify(payload.slug);
  if (!slug) throw new Error("slug is invalid.");

  return {
    name: payload.name.trim(),
    slug,
    templateKey: parseTemplateKey(payload.templateKey || "templateA"),
    tokenOverrides: parseTokenOverrides(payload.tokenOverrides),
    globalHeaderId: normalizeGlobalHeaderId(payload.globalHeaderId),
    globalFooterId: normalizeGlobalFooterId(payload.globalFooterId),
    features: {
      cmsPages: Boolean(payload.features?.cmsPages),
      stripePayments: Boolean(payload.features?.stripePayments),
      emailNotifications: Boolean(payload.features?.emailNotifications),
    },
    customDomains: parseCustomDomains(payload.customDomains),
  };
}

export function validateUpdateHubInput(input) {
  const payload = input || {};
  const result = {};

  if (typeof payload.name === "string") result.name = payload.name.trim();
  if (typeof payload.slug === "string") {
    const slug = slugify(payload.slug);
    if (!slug) throw new Error("slug is invalid.");
    result.slug = slug;
  }
  if (payload.templateKey !== undefined) result.templateKey = parseTemplateKey(payload.templateKey);
  if (payload.tokenOverrides !== undefined) result.tokenOverrides = parseTokenOverrides(payload.tokenOverrides);
  if (payload.globalHeaderId !== undefined) result.globalHeaderId = normalizeGlobalHeaderId(payload.globalHeaderId);
  if (payload.globalFooterId !== undefined) result.globalFooterId = normalizeGlobalFooterId(payload.globalFooterId);
  if (payload.features && typeof payload.features === "object") {
    result.features = {
      cmsPages: Boolean(payload.features.cmsPages),
      stripePayments: Boolean(payload.features.stripePayments),
      emailNotifications: Boolean(payload.features.emailNotifications),
    };
  }
  if (payload.customDomains !== undefined) result.customDomains = parseCustomDomains(payload.customDomains);

  return result;
}
