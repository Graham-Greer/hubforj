import { clampText, normalizeText, pickFirstText } from "./shared.js";

export function createSectionHeaderFragment({
  titleRequired = false,
  descriptionMaxLength = 280,
  titleLabel = "Title",
} = {}) {
  function normalizeHeaderFields(input = {}) {
    return {
      eyebrow: normalizeText(input.eyebrow),
      title: pickFirstText([input.title, input.heading]),
      description: clampText(
        pickFirstText([input.description, input.subheading]),
        descriptionMaxLength
      ),
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
