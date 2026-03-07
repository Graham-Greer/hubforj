import {
  ACCORDION_SECTION_DEFAULT_PROPS,
  ACCORDION_SECTION_PREVIEW_PROPS,
  ACCORDION_SECTION_SCHEMA,
  evaluateAccordionReadiness,
  normalizeAccordionSectionProps,
} from "./accordion-section.js";
import {
  extractHeroSectionMediaRefs,
  evaluateHeroSectionReadiness,
  HERO_SECTION_DEFAULT_PROPS,
  HERO_SECTION_PREVIEW_PROPS_BY_VARIANT,
  HERO_SECTION_SCHEMA,
  normalizeHeroSectionProps,
} from "../../cms/sections/hero-section.js";
import {
  extractFeatureSectionMediaRefs,
  evaluateFeatureSectionReadiness,
  FEATURE_SECTION_DEFAULT_PROPS,
  FEATURE_SECTION_PREVIEW_PROPS_BY_VARIANT,
  FEATURE_SECTION_SCHEMA,
  normalizeFeatureSectionProps,
} from "../../cms/sections/feature-section.js";
import {
  extractGridSectionMediaRefs,
  evaluateGridSectionReadiness,
  GRID_SECTION_DEFAULT_PROPS,
  GRID_SECTION_PREVIEW_PROPS_BY_VARIANT,
  GRID_SECTION_SCHEMA,
  normalizeGridSectionProps,
} from "../../cms/sections/grid-section.js";
import {
  evaluateStatsSectionReadiness,
  normalizeStatsSectionProps,
  STATS_SECTION_DEFAULT_PROPS,
  STATS_SECTION_PREVIEW_PROPS_BY_VARIANT,
  STATS_SECTION_SCHEMA,
} from "../../cms/sections/stats-section.js";
import {
  extractTeamSectionMediaRefs,
  evaluateTeamSectionReadiness,
  normalizeTeamSectionProps,
  TEAM_SECTION_DEFAULT_PROPS,
  TEAM_SECTION_PREVIEW_PROPS_BY_VARIANT,
  TEAM_SECTION_SCHEMA,
} from "../../cms/sections/team-section.js";
import {
  evaluatePricingSectionReadiness,
  normalizePricingSectionProps,
  PRICING_SECTION_DEFAULT_PROPS,
  PRICING_SECTION_PREVIEW_PROPS_BY_VARIANT,
  PRICING_SECTION_SCHEMA,
} from "../../cms/sections/pricing-section.js";
import {
  extractTestimonialsSectionMediaRefs,
  evaluateTestimonialsSectionReadiness,
  normalizeTestimonialsSectionProps,
  TESTIMONIALS_SECTION_DEFAULT_PROPS,
  TESTIMONIALS_SECTION_PREVIEW_PROPS_BY_VARIANT,
  TESTIMONIALS_SECTION_SCHEMA,
} from "../../cms/sections/testimonials-section.js";

const BLOCK_DEFINITIONS = [
  {
    type: "HeroSection",
    label: "Hero",
    variants: ["centered", "split"],
    defaultVariant: "centered",
    variantDescriptions: {
      centered: "Centered headline and CTA with optional background media.",
      split: "Two-column hero with copy beside featured media.",
    },
    defaultProps: HERO_SECTION_DEFAULT_PROPS,
    previewPropsByVariant: HERO_SECTION_PREVIEW_PROPS_BY_VARIANT,
    schema: HERO_SECTION_SCHEMA,
    normalizeProps: (props, variant) => normalizeHeroSectionProps(props, variant),
    evaluateReadiness: (props, variant) => evaluateHeroSectionReadiness(props, variant),
    extractMediaRefs: (props) => extractHeroSectionMediaRefs(props),
  },
  {
    type: "FeatureSection",
    label: "Feature",
    variants: ["centered", "split"],
    defaultVariant: "centered",
    variantDescriptions: {
      centered: "Mid-page highlight with optional media mode.",
      split: "Two-column feature content beside required media.",
    },
    defaultProps: FEATURE_SECTION_DEFAULT_PROPS,
    previewPropsByVariant: FEATURE_SECTION_PREVIEW_PROPS_BY_VARIANT,
    schema: FEATURE_SECTION_SCHEMA,
    normalizeProps: (props, variant) => normalizeFeatureSectionProps(props, variant),
    evaluateReadiness: (props, variant) => evaluateFeatureSectionReadiness(props, variant),
    extractMediaRefs: (props, variant) => extractFeatureSectionMediaRefs(props, variant),
  },
  {
    type: "GridSection",
    label: "Grid",
    variants: ["default"],
    defaultVariant: "default",
    variantDescriptions: {
      default: "Flexible card grid with optional lead layout.",
    },
    defaultProps: GRID_SECTION_DEFAULT_PROPS,
    previewPropsByVariant: GRID_SECTION_PREVIEW_PROPS_BY_VARIANT,
    schema: GRID_SECTION_SCHEMA,
    normalizeProps: (props) => normalizeGridSectionProps(props),
    evaluateReadiness: (props) => evaluateGridSectionReadiness(props),
    extractMediaRefs: (props) => extractGridSectionMediaRefs(props),
  },
  {
    type: "AccordionSection",
    label: "Accordion",
    variants: ["default"],
    defaultVariant: "default",
    variantDescriptions: {
      default: "Reusable single-open accordion for FAQs, policies, and explainers.",
    },
    defaultProps: ACCORDION_SECTION_DEFAULT_PROPS,
    previewPropsByVariant: {
      default: ACCORDION_SECTION_PREVIEW_PROPS,
    },
    schema: ACCORDION_SECTION_SCHEMA,
    normalizeProps: normalizeAccordionSectionProps,
    evaluateReadiness: evaluateAccordionReadiness,
  },
  {
    type: "PricingSection",
    label: "Pricing",
    variants: ["tiers"],
    defaultVariant: "tiers",
    variantDescriptions: {
      tiers: "Pricing tiers rendered as cards with structured features and CTA.",
    },
    defaultProps: PRICING_SECTION_DEFAULT_PROPS,
    previewPropsByVariant: PRICING_SECTION_PREVIEW_PROPS_BY_VARIANT,
    schema: PRICING_SECTION_SCHEMA,
    normalizeProps: (props, variant) => normalizePricingSectionProps(props, variant),
    evaluateReadiness: (props, variant) => evaluatePricingSectionReadiness(props, variant),
  },
  {
    type: "StatsSection",
    label: "Stats",
    variants: ["cards", "split"],
    defaultVariant: "cards",
    variantDescriptions: {
      cards: "Card-based stats grid with optional icons and badges.",
      split: "Two-column stats section with header and actions alongside metrics.",
    },
    defaultProps: STATS_SECTION_DEFAULT_PROPS,
    previewPropsByVariant: STATS_SECTION_PREVIEW_PROPS_BY_VARIANT,
    schema: STATS_SECTION_SCHEMA,
    normalizeProps: (props, variant) => normalizeStatsSectionProps(props, variant),
    evaluateReadiness: (props, variant) => evaluateStatsSectionReadiness(props, variant),
  },
  {
    type: "TeamSection",
    label: "Team",
    variants: ["default"],
    defaultVariant: "default",
    variantDescriptions: {
      default: "Responsive team people grid with optional avatars, badges, and social links.",
    },
    defaultProps: TEAM_SECTION_DEFAULT_PROPS,
    previewPropsByVariant: TEAM_SECTION_PREVIEW_PROPS_BY_VARIANT,
    schema: TEAM_SECTION_SCHEMA,
    normalizeProps: (props) => normalizeTeamSectionProps(props),
    evaluateReadiness: (props) => evaluateTeamSectionReadiness(props),
    extractMediaRefs: (props) => extractTeamSectionMediaRefs(props),
  },
  {
    type: "TestimonialsSection",
    label: "Testimonials",
    variants: ["grid", "lead"],
    defaultVariant: "grid",
    variantDescriptions: {
      grid: "Multiple testimonials shown with equal weight.",
      lead: "Lead testimonial followed by supporting testimonials.",
    },
    defaultProps: TESTIMONIALS_SECTION_DEFAULT_PROPS,
    previewPropsByVariant: TESTIMONIALS_SECTION_PREVIEW_PROPS_BY_VARIANT,
    schema: TESTIMONIALS_SECTION_SCHEMA,
    normalizeProps: (props, variant) => normalizeTestimonialsSectionProps(props, variant),
    evaluateReadiness: (props, variant) => evaluateTestimonialsSectionReadiness(props, variant),
    extractMediaRefs: (props, variant) => extractTestimonialsSectionMediaRefs(props, variant),
  },
];

function cloneValue(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

export function listCmsBlocks() {
  return BLOCK_DEFINITIONS.map((definition) => ({
    type: definition.type,
    label: definition.label,
    variants: [...definition.variants],
    variantDescriptions: { ...(definition.variantDescriptions || {}) },
    defaultVariant: definition.defaultVariant,
    defaultProps: cloneValue(definition.defaultProps || {}),
  }));
}

export function getCmsBlockDefinition(type) {
  const key = String(type || "").trim();
  return BLOCK_DEFINITIONS.find((definition) => definition.type === key) || null;
}

export function normalizeVariant(type, variant) {
  const definition = getCmsBlockDefinition(type);
  if (!definition) return "default";

  const requested = String(variant || "").trim();
  return definition.variants.includes(requested) ? requested : definition.defaultVariant;
}

export function buildBlockForVariant(type, variant) {
  const definition = getCmsBlockDefinition(type);
  if (!definition) return null;

  return {
    type: definition.type,
    variant: normalizeVariant(type, variant),
    props: cloneValue(definition.defaultProps || {}),
    label: definition.label,
  };
}

export function buildDefaultBlock(type) {
  return buildBlockForVariant(type);
}

export function buildPreviewBlockForVariant(type, variant) {
  const definition = getCmsBlockDefinition(type);
  if (!definition) return null;

  const block = buildBlockForVariant(type, variant);
  const previewProps =
    definition.previewPropsByVariant?.[block.variant] ||
    definition.previewPropsByVariant?.[definition.defaultVariant] ||
    definition.defaultProps;

  return {
    ...block,
    props: cloneValue({
      ...(definition.defaultProps || {}),
      ...(previewProps || {}),
    }),
  };
}

export function getVariantDescription(type, variant) {
  const definition = getCmsBlockDefinition(type);
  if (!definition) return "";
  const normalized = normalizeVariant(type, variant);
  return String(definition.variantDescriptions?.[normalized] || "");
}

export function getBlockEditorSchema(type) {
  const definition = getCmsBlockDefinition(type);
  if (!definition?.schema) return [];
  const schema = cloneValue(definition.schema);
  return schema.map((group) => ({
    ...group,
    fields: (group.fields || []).map((field) => {
      if (field.type !== "variant-select" || Array.isArray(field.options)) return field;
      return {
        ...field,
        options: definition.variants.map((variant) => ({
          value: variant,
          label: variant,
        })),
      };
    }),
  }));
}

export function normalizeBlockProps(type, props, variant) {
  const definition = getCmsBlockDefinition(type);
  if (!definition) return {};
  if (typeof definition.normalizeProps === "function") {
    return definition.normalizeProps(props, normalizeVariant(type, variant));
  }
  return props && typeof props === "object" && !Array.isArray(props) ? props : {};
}

function normalizePropsWithVariant(type, variant, props) {
  const definition = getCmsBlockDefinition(type);
  if (!definition) return {};
  if (typeof definition.normalizeProps === "function") {
    return definition.normalizeProps(props, normalizeVariant(type, variant));
  }
  return props && typeof props === "object" && !Array.isArray(props) ? props : {};
}

export function evaluateBlockReadiness(block) {
  const definition = getCmsBlockDefinition(block?.type);
  if (!definition) {
    return {
      readyForDraft: true,
      readyForPublish: true,
      missingRequiredFields: [],
      missingCount: 0,
    };
  }

  if (typeof definition.evaluateReadiness === "function") {
    return definition.evaluateReadiness(
      normalizePropsWithVariant(block?.type, block?.variant, block?.props || {}),
      normalizeVariant(block?.type, block?.variant)
    );
  }

  return {
    readyForDraft: true,
    readyForPublish: true,
    missingRequiredFields: [],
    missingCount: 0,
  };
}

export function isSupportedBlockType(type) {
  return Boolean(getCmsBlockDefinition(type));
}

function collectMediaIdsFromValue(value, ids) {
  if (!value) return;

  if (typeof value === "string") {
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => {
        if (/^media_[a-z0-9_-]+$/i.test(item)) {
          ids.add(item);
        }
      });
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectMediaIdsFromValue(item, ids));
    return;
  }

  if (typeof value === "object") {
    for (const nested of Object.values(value)) {
      collectMediaIdsFromValue(nested, ids);
    }
  }
}

export function collectMediaIdsForBlock(block) {
  const ids = new Set();
  const definition = getCmsBlockDefinition(block?.type);
  const variant = normalizeVariant(block?.type, block?.variant);
  const normalizedProps = normalizePropsWithVariant(block?.type, variant, block?.props || {});

  if (typeof definition?.extractMediaRefs === "function") {
    const refs = definition.extractMediaRefs(normalizedProps, variant) || [];
    refs
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .forEach((value) => ids.add(value));
    return Array.from(ids);
  }

  collectMediaIdsFromValue(normalizedProps, ids);
  return Array.from(ids);
}
