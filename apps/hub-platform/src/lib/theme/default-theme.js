import {
  DEFAULT_TEMPLATE_KEY,
  normalizeTemplateKey,
  supportedTemplateKeys,
} from "@/lib/templates/template-registry";

export const defaultTheme = "light";
export const defaultTemplate = DEFAULT_TEMPLATE_KEY;
export const adminTheme = "dark";
export const adminTemplate = "studio";

export const supportedThemes = ["light", "dark"];
export const supportedTemplates = supportedTemplateKeys;

export function normalizeTheme(value) {
  return supportedThemes.includes(value) ? value : defaultTheme;
}

export function normalizeTemplate(value) {
  return normalizeTemplateKey(value);
}
