import { clampText, normalizeText } from "./shared.js";

export function createSectionHeaderFragment({
  titleRequired = false,
  descriptionMaxLength = 280,
  titleLabel = "Title",
} = {}) {
  function normalizeHeaderFields(input = {}) {
    return {
      eyebrow: normalizeText(input.eyebrow),
      title: normalizeText(input.title),
      description: clampText(normalizeText(input.description), descriptionMaxLength),
    };
  }

  function evaluateHeaderReadiness(header = {}) {
    const missing = [];
    if (titleRequired && !normalizeText(header.title)) {
      missing.push(`${titleLabel} is required.`);
    }
    return missing;
  }

  return {
    normalizeHeaderFields,
    evaluateHeaderReadiness,
    editorFields: [
      { key: "eyebrow", label: "Eyebrow", type: "text" },
      { key: "title", label: titleLabel, type: "text", required: titleRequired },
      {
        key: "description",
        label: "Description",
        type: "textarea",
        maxLength: descriptionMaxLength,
      },
    ],
    defaults: {
      eyebrow: "",
      title: "",
      description: "",
    },
  };
}
