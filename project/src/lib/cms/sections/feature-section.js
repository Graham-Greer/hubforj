import { createSectionHeaderFragment } from "../fragments/section-header-fragment.js";
import {
  evaluateCtaGroupReadiness,
  normalizeCtaGroup,
} from "../fragments/cta-group-fragment.js";
import {
  evaluateMediaFragmentReadiness,
  extractMediaFragmentRefs,
  normalizeMediaFragment,
} from "../fragments/media-fragment.js";
import { normalizeSectionLayoutFields } from "../fragments/section-layout-fragment.js";
import { normalizeText } from "../fragments/shared.js";

const FEATURE_DESCRIPTION_MAX_LENGTH = 280;
const CENTERED_MEDIA_MODES = new Set(["none", "background", "inline"]);

const headerFragment = createSectionHeaderFragment({
  titleRequired: true,
  descriptionMaxLength: FEATURE_DESCRIPTION_MAX_LENGTH,
});

function normalizeVariant(value) {
  const variant = normalizeText(value);
  return variant === "split" ? "split" : "centered";
}

function normalizeCenteredMediaMode(value) {
  const mode = normalizeText(value);
  return CENTERED_MEDIA_MODES.has(mode) ? mode : "none";
}

export function normalizeFeatureSectionProps(props, variant = "centered") {
  const normalizedVariant = normalizeVariant(variant);
  const value = props && typeof props === "object" && !Array.isArray(props) ? props : {};
  const header = headerFragment.normalizeHeaderFields(value);
  const ctas = normalizeCtaGroup(value.ctas);
  if (ctas.length > 2) {
    throw new Error("FeatureSection.ctas supports up to two items.");
  }

  const media = normalizeMediaFragment(value.media);
  const layout = normalizeSectionLayoutFields(value, normalizedVariant, {
    centeredDefaults: {
      backgroundTone: "surface",
      textAlign: "left",
    },
    splitDefaults: {
      mediaPosition: "right",
      splitRatio: "50-50",
      contentAlign: "left",
    },
  });
  const centeredMediaMode =
    normalizedVariant === "centered"
      ? normalizeCenteredMediaMode(value.centeredMediaMode)
      : "none";

  return {
    ...header,
    ctas,
    media,
    centeredMediaMode,
    ...layout,
  };
}

export function evaluateFeatureSectionReadiness(rawProps, variant = "centered") {
  const normalizedVariant = normalizeVariant(variant);
  const props = normalizeFeatureSectionProps(rawProps, normalizedVariant);
  const requireMedia =
    normalizedVariant === "split" ||
    (normalizedVariant === "centered" && props.centeredMediaMode !== "none");
  const draftMissing = [
    ...headerFragment.evaluateHeaderReadiness(props),
    ...evaluateMediaFragmentReadiness(props.media, {
      requireMedia,
      requireAltWhenMediaSelected: true,
      missingMediaMessage:
        normalizedVariant === "split"
          ? "Split feature requires a featured image or video."
          : "Centered feature media mode requires a selected image or video.",
      missingAltMessage: "Alt text is required for feature media.",
    }),
  ];
  const publishMissing = [...draftMissing, ...evaluateCtaGroupReadiness(props.ctas)];

  return {
    readyForDraft: draftMissing.length === 0,
    readyForPublish: publishMissing.length === 0,
    missingRequiredFields: publishMissing,
    missingCount: publishMissing.length,
  };
}

export function extractFeatureSectionMediaRefs(rawProps, variant = "centered") {
  const props = normalizeFeatureSectionProps(rawProps, variant);
  if (normalizeVariant(variant) === "centered" && props.centeredMediaMode === "none") {
    return [];
  }
  return extractMediaFragmentRefs(props.media);
}

export const FEATURE_SECTION_SCHEMA = [
  {
    key: "core",
    type: "group",
    label: "Core",
    defaultOpen: true,
    fields: [
      {
        key: "variant",
        label: "Variant",
        type: "variant-select",
        required: true,
      },
      ...headerFragment.editorFields.map((field) => ({
        ...field,
        ...(field.key === "description"
          ? {
            hint: "Maximum 280 characters.",
          }
          : {}),
      })),
      {
        key: "centeredMediaMode",
        label: "Centered media mode",
        type: "select",
        options: ["none", "background", "inline"],
        variants: ["centered"],
      },
    ],
  },
  {
    key: "actions",
    type: "group",
    label: "Actions",
    defaultOpen: false,
    fields: [{ key: "ctas", label: "Calls to action", type: "ctas" }],
  },
  {
    key: "media",
    type: "group",
    label: "Media",
    defaultOpen: false,
    fields: [
      {
        key: "media",
        label: "Feature media",
        type: "media-ref",
        requiredForVariants: ["split"],
        requiredWhen: { key: "centeredMediaMode", notEquals: "none" },
        visibleWhen: [
          { key: "variant", equals: "split" },
          { key: "centeredMediaMode", notEquals: "none" },
        ],
      },
    ],
  },
  {
    key: "advanced",
    type: "group",
    label: "Advanced",
    defaultOpen: false,
    fields: [
      {
        key: "backgroundTone",
        label: "Background tone",
        type: "select",
        options: ["surface", "muted", "brand", "inverse"],
        variants: ["centered"],
      },
      {
        key: "textAlign",
        label: "Text align",
        type: "select",
        options: ["left", "center"],
        variants: ["centered"],
      },
      {
        key: "mediaPosition",
        label: "Media position",
        type: "select",
        options: ["left", "right"],
        variants: ["split"],
      },
      {
        key: "splitRatio",
        label: "Split ratio",
        type: "select",
        options: ["50-50", "60-40", "40-60"],
        variants: ["split"],
      },
      {
        key: "contentAlign",
        label: "Content align",
        type: "select",
        options: ["left", "center"],
        variants: ["split"],
      },
    ],
  },
];

export const FEATURE_SECTION_DEFAULT_PROPS = {
  eyebrow: "",
  title: "",
  description: "",
  ctas: [],
  media: {
    mediaId: "",
    kind: "image",
    alt: "",
    posterMediaId: "",
    aspect: "auto",
  },
  centeredMediaMode: "none",
  backgroundTone: "surface",
  textAlign: "left",
  mediaPosition: "right",
  splitRatio: "50-50",
  contentAlign: "left",
};

export const FEATURE_SECTION_PREVIEW_PROPS_BY_VARIANT = {
  centered: {
    eyebrow: "Spotlight",
    title: "Feature a key update with optional media",
    description: "Use this section to highlight a program or announcement mid-page.",
    ctas: [{ label: "Learn more", href: "/programs" }],
    centeredMediaMode: "background",
    media: {
      mediaId: "media_preview_feature",
      kind: "image",
      alt: "Feature section preview",
      posterMediaId: "",
      aspect: "16:9",
    },
    backgroundTone: "surface",
    textAlign: "left",
  },
  split: {
    eyebrow: "Program spotlight",
    title: "Pair content with a strong visual",
    description: "Split layout keeps the message concise while showcasing featured media.",
    ctas: [{ label: "View updates", href: "/updates" }],
    media: {
      mediaId: "media_preview_hero",
      kind: "image",
      alt: "Split feature preview",
      posterMediaId: "",
      aspect: "16:9",
    },
    mediaPosition: "right",
    splitRatio: "50-50",
    contentAlign: "left",
  },
};

export const FEATURE_SECTION_DESCRIPTION_MAX_LENGTH = FEATURE_DESCRIPTION_MAX_LENGTH;
