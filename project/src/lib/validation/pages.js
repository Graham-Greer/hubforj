import {
  evaluateBlockReadiness,
  isSupportedBlockType,
  normalizeBlockProps,
  normalizeVariant,
} from "../data/pages/block-registry.js";
import {
  normalizeFooterOverride,
  normalizeHeaderOverride,
} from "../data/pages/layout-config.js";

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

function assertPlainObject(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${field} must be an object.`);
  }
  return value;
}

function normalizeSeo(seo) {
  if (seo === undefined || seo === null || seo === "") {
    return {
      title: "",
      description: "",
      imageMediaId: "",
    };
  }

  const value = assertPlainObject(seo, "seo");

  return {
    title: String(value.title || "").trim(),
    description: String(value.description || "").trim(),
    imageMediaId: String(value.imageMediaId || "").trim(),
  };
}

function normalizeBlock(input, index) {
  const value = assertPlainObject(input, `composition[${index}]`);
  const type = String(value.type || "").trim();
  if (!type || !isSupportedBlockType(type)) {
    throw new Error(`composition[${index}] has an unsupported block type.`);
  }

  const id = String(value.id || "").trim();
  if (!id) {
    throw new Error(`composition[${index}] is missing a stable block id.`);
  }
  const label = String(value.label || "").trim();
  const props = normalizeBlockProps(type, value.props, value.variant);

  return {
    id,
    type,
    label,
    variant: normalizeVariant(type, value.variant),
    props,
  };
}

export function validatePageSlug(value) {
  const slug = slugify(value);
  if (!slug) {
    throw new Error("slug is required.");
  }

  if (["home", "events"].includes(slug)) {
    throw new Error("slug is reserved and cannot be used for custom pages.");
  }

  return slug;
}

export function validatePageSettingsInput(input) {
  const payload = input || {};
  const title = String(payload.title || "").trim();
  if (!title) {
    throw new Error("title is required.");
  }

  const status = String(payload.status || "draft").trim();
  if (!["draft", "published"].includes(status)) {
    throw new Error("status is invalid.");
  }

  return {
    title,
    slug: validatePageSlug(payload.slug),
    status,
    parentPageId: String(payload.parentPageId || "").trim(),
    seo: normalizeSeo(payload.seo),
    headerIdOverride: normalizeHeaderOverride(payload.headerIdOverride),
    footerIdOverride: normalizeFooterOverride(payload.footerIdOverride),
  };
}

export function validateCompositionInput(composition) {
  const value = composition || [];
  if (!Array.isArray(value)) {
    throw new Error("composition must be an array.");
  }

  return value.map((block, index) => normalizeBlock(block, index));
}

export function assertCompositionPublishReady(composition) {
  const normalized = validateCompositionInput(composition);
  const blocking = normalized
    .map((block) => ({
      block,
      readiness: evaluateBlockReadiness(block),
    }))
    .find(({ readiness }) => !readiness.readyForPublish);

  if (!blocking) return normalized;

  const label = blocking.block.label || blocking.block.type;
  const reason = blocking.readiness.missingRequiredFields?.[0] || "Fields required.";
  throw new Error(`Cannot publish page: ${label} is incomplete. ${reason}`);
}

export function validateCreatePageInput(input) {
  const settings = validatePageSettingsInput(input);
  return {
    ...settings,
    draftComposition: validateCompositionInput(input?.draftComposition || []),
    publishedComposition: validateCompositionInput(input?.publishedComposition || []),
  };
}

export function validateUpdatePageDraftInput(input) {
  const payload = input || {};
  const settings = validatePageSettingsInput(payload);
  const draftComposition = payload.draftComposition !== undefined
    ? validateCompositionInput(payload.draftComposition)
    : undefined;

  return {
    ...settings,
    ...(draftComposition ? { draftComposition } : {}),
  };
}
