import { isPlainObject, normalizeText } from "./shared.js";

const ALLOWED_MEDIA_KINDS = new Set(["image", "video"]);
const ALLOWED_MEDIA_ASPECTS = new Set(["auto", "16:9", "4:3", "1:1"]);

export function normalizeMediaFragment(input = {}, { fallbackMediaId = "" } = {}) {
  const source = isPlainObject(input) ? input : {};
  const mediaId = normalizeText(source.mediaId) || normalizeText(fallbackMediaId);
  const kind = normalizeText(source.kind);
  const aspect = normalizeText(source.aspect);

  return {
    mediaId,
    kind: ALLOWED_MEDIA_KINDS.has(kind) ? kind : mediaId ? "image" : "image",
    alt: normalizeText(source.alt),
    posterMediaId: normalizeText(source.posterMediaId),
    aspect: ALLOWED_MEDIA_ASPECTS.has(aspect) ? aspect : "auto",
  };
}

export function evaluateMediaFragmentReadiness(media = {}, options = {}) {
  const {
    requireMedia = false,
    requireAltWhenMediaSelected = true,
    missingMediaMessage = "Media is required.",
    missingAltMessage = "Alt text is required for media.",
  } = options;
  const missing = [];
  const normalized = normalizeMediaFragment(media);

  if (requireMedia && !normalized.mediaId) {
    missing.push(missingMediaMessage);
  }

  if (
    requireAltWhenMediaSelected &&
    normalized.mediaId &&
    !normalized.alt
  ) {
    missing.push(missingAltMessage);
  }

  return missing;
}

export function extractMediaFragmentRefs(media = {}) {
  const normalized = normalizeMediaFragment(media);
  const refs = [];
  if (normalized.mediaId) refs.push(normalized.mediaId);
  if (normalized.posterMediaId) refs.push(normalized.posterMediaId);
  return refs;
}
