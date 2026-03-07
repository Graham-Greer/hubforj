import { normalizeText } from "./shared.js";

const CENTERED_TEXT_ALIGN = new Set(["left", "center"]);
const CENTERED_BACKGROUND_TONE = new Set(["surface", "muted", "brand", "inverse"]);
const SPLIT_MEDIA_POSITION = new Set(["left", "right"]);
const SPLIT_RATIO = new Set(["50-50", "60-40", "40-60"]);
const SPLIT_CONTENT_ALIGN = new Set(["left", "center"]);

export function normalizeSectionLayoutFields(
  input = {},
  variant = "centered",
  options = {}
) {
  const centeredDefaults = options.centeredDefaults || {};
  const splitDefaults = options.splitDefaults || {};
  const value = input || {};

  if (variant === "split") {
    const mediaPosition = normalizeText(value.mediaPosition);
    const splitRatio = normalizeText(value.splitRatio);
    const contentAlign = normalizeText(value.contentAlign);

    return {
      mediaPosition: SPLIT_MEDIA_POSITION.has(mediaPosition)
        ? mediaPosition
        : splitDefaults.mediaPosition || "right",
      splitRatio: SPLIT_RATIO.has(splitRatio)
        ? splitRatio
        : splitDefaults.splitRatio || "50-50",
      contentAlign: SPLIT_CONTENT_ALIGN.has(contentAlign)
        ? contentAlign
        : splitDefaults.contentAlign || "left",
    };
  }

  const backgroundTone = normalizeText(value.backgroundTone);
  const textAlign = normalizeText(value.textAlign);

  return {
    backgroundTone: CENTERED_BACKGROUND_TONE.has(backgroundTone)
      ? backgroundTone
      : centeredDefaults.backgroundTone || "surface",
    textAlign: CENTERED_TEXT_ALIGN.has(textAlign)
      ? textAlign
      : centeredDefaults.textAlign || "center",
  };
}

export function normalizeHeroLayoutFields(input = {}, variant = "centered") {
  return normalizeSectionLayoutFields(input, variant, {
    centeredDefaults: {
      backgroundTone: "surface",
      textAlign: "center",
    },
    splitDefaults: {
      mediaPosition: "right",
      splitRatio: "50-50",
      contentAlign: "left",
    },
  });
}
