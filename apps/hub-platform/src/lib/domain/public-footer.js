import { getTemplateContentWidth, getTemplateFooterConfig } from "../templates/template-registry.js";

function normalizeString(value) {
  return String(value || "").trim();
}

export function resolvePublicFooterModel({ hub }) {
  const templateKey = normalizeString(hub?.templateKey || hub?.template);
  const footer = getTemplateFooterConfig(templateKey);
  const contentWidth = getTemplateContentWidth(templateKey);

  return {
    contentWidth,
    variants: {
      variant: footer.variant || "standard",
    },
    template: {
      key: templateKey,
    },
  };
}
