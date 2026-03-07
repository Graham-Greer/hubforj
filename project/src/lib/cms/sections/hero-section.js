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
import { normalizeHeroLayoutFields } from "../fragments/section-layout-fragment.js";
import { normalizeText } from "../fragments/shared.js";

const HERO_DESCRIPTION_MAX_LENGTH = 280;

const headerFragment = createSectionHeaderFragment({
  titleRequired: true,
  descriptionMaxLength: HERO_DESCRIPTION_MAX_LENGTH,
});

function normalizeVariant(value) {
  const variant = normalizeText(value);
  return variant === "split" ? "split" : "centered";
}

export function normalizeHeroSectionProps(props, variant = "centered") {
  const normalizedVariant = normalizeVariant(variant);
  const value = props && typeof props === "object" && !Array.isArray(props) ? props : {};
  const header = headerFragment.normalizeHeaderFields(value);
  const ctas = normalizeCtaGroup(value.ctas);
  if (ctas.length > 2) {
    throw new Error("HeroSection.ctas supports up to two items.");
  }

  const media = normalizeMediaFragment(value.media);
  const layout = normalizeHeroLayoutFields(value, normalizedVariant);

  return {
    ...header,
    ctas,
    media,
    ...layout,
  };
}

export function evaluateHeroSectionReadiness(rawProps, variant = "centered") {
  const normalizedVariant = normalizeVariant(variant);
  const props = normalizeHeroSectionProps(rawProps, normalizedVariant);
  const draftMissing = [
    ...headerFragment.evaluateHeaderReadiness(props),
    ...evaluateMediaFragmentReadiness(props.media, {
      requireMedia: normalizedVariant === "split",
      requireAltWhenMediaSelected: true,
      missingMediaMessage: "Split hero requires a featured image or video.",
      missingAltMessage: "Alt text is required for hero media.",
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

export function extractHeroSectionMediaRefs(rawProps) {
  const props = rawProps && typeof rawProps === "object" ? rawProps : {};
  return extractMediaFragmentRefs(props.media);
}

export const HERO_SECTION_SCHEMA = [
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
        label: "Hero media",
        type: "media-ref",
        requiredForVariants: ["split"],
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

export const HERO_SECTION_DEFAULT_PROPS = {
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
  backgroundTone: "surface",
  textAlign: "center",
  mediaPosition: "right",
  splitRatio: "50-50",
  contentAlign: "left",
};

export const HERO_SECTION_PREVIEW_PROPS_BY_VARIANT = {
  centered: {
    eyebrow: "Community programs",
    title: "Build your strongest season",
    description:
      "Weekly events, coaching, and resources tailored for your community.",
    ctas: [{ label: "Explore programs", href: "/programs" }],
    media: {
      mediaId: "media_preview_hero",
      kind: "image",
      alt: "Hero preview",
      posterMediaId: "",
      aspect: "16:9",
    },
    backgroundTone: "surface",
    textAlign: "center",
  },
  split: {
    eyebrow: "Your hub growth",
    title: "Grow together with your hub",
    description: "Pair storytelling with a visual to highlight your next campaign.",
    ctas: [{ label: "Join now", href: "/join" }],
    media: {
      mediaId: "media_preview_feature",
      kind: "image",
      alt: "Feature preview",
      posterMediaId: "",
      aspect: "16:9",
    },
    mediaPosition: "right",
    splitRatio: "50-50",
    contentAlign: "left",
  },
};

export const HERO_SECTION_DESCRIPTION_MAX_LENGTH = HERO_DESCRIPTION_MAX_LENGTH;
