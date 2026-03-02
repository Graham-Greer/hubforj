export const HEADER_SECTION_VARIANTS = ["standard", "minimal", "landing"];
export const FOOTER_SECTION_VARIANTS = ["simple", "columns", "cta"];

export const DEFAULT_GLOBAL_HEADER_ID = "standard";
export const DEFAULT_GLOBAL_FOOTER_ID = "simple";

export function listHeaderSectionOptions() {
  return HEADER_SECTION_VARIANTS.map((variant) => ({
    value: variant,
    label: `Header: ${variant}`,
  }));
}

export function listFooterSectionOptions() {
  return FOOTER_SECTION_VARIANTS.map((variant) => ({
    value: variant,
    label: `Footer: ${variant}`,
  }));
}

function normalizeVariant(value, variants, fieldName, allowEmpty = false) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) {
    if (allowEmpty) return "";
    throw new Error(`${fieldName} is required.`);
  }

  if (!variants.includes(normalized)) {
    throw new Error(`${fieldName} is invalid.`);
  }

  return normalized;
}

export function normalizeGlobalHeaderId(value) {
  const normalized = String(value || "").trim();
  if (!normalized) return DEFAULT_GLOBAL_HEADER_ID;
  return normalizeVariant(normalized, HEADER_SECTION_VARIANTS, "globalHeaderId");
}

export function normalizeGlobalFooterId(value) {
  const normalized = String(value || "").trim();
  if (!normalized) return DEFAULT_GLOBAL_FOOTER_ID;
  return normalizeVariant(normalized, FOOTER_SECTION_VARIANTS, "globalFooterId");
}

export function normalizeHeaderOverride(value) {
  return normalizeVariant(value, HEADER_SECTION_VARIANTS, "headerIdOverride", true);
}

export function normalizeFooterOverride(value) {
  return normalizeVariant(value, FOOTER_SECTION_VARIANTS, "footerIdOverride", true);
}

export function resolveHeaderFooterSelection({ hub, page }) {
  const globalHeaderId = normalizeGlobalHeaderId(hub?.globalHeaderId);
  const globalFooterId = normalizeGlobalFooterId(hub?.globalFooterId);
  const headerIdOverride = normalizeHeaderOverride(page?.headerIdOverride);
  const footerIdOverride = normalizeFooterOverride(page?.footerIdOverride);

  return {
    globalHeaderId,
    globalFooterId,
    headerIdOverride,
    footerIdOverride,
    effectiveHeaderId: headerIdOverride || globalHeaderId,
    effectiveFooterId: footerIdOverride || globalFooterId,
    usesHeaderOverride: Boolean(headerIdOverride),
    usesFooterOverride: Boolean(footerIdOverride),
  };
}
