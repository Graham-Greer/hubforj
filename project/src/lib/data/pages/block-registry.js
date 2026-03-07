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

function normalizeText(value) {
  return String(value || "").trim();
}

function isValidCtaHref(href) {
  if (!href) return false;
  if (href.startsWith("/")) return true;
  if (/^https?:\/\//i.test(href)) return true;
  return false;
}

function normalizeCtas(input, fallback = null) {
  const source = Array.isArray(input) ? input : [];
  const normalized = source
    .map((cta) => (cta && typeof cta === "object" ? cta : {}))
    .map((cta) => ({
      label: normalizeText(cta.label),
      href: normalizeText(cta.href),
    }));

  if (normalized.length) return normalized;
  if (!fallback || typeof fallback !== "object") return [];

  const label = normalizeText(fallback.label);
  const href = normalizeText(fallback.href);
  return label || href ? [{ label, href }] : [];
}

function evaluateCtaReadiness(ctas = []) {
  const missing = [];
  const normalized = normalizeCtas(ctas);
  normalized.forEach((cta, index) => {
    if (!cta.label) missing.push(`CTA ${index + 1}: label is required.`);
    if (!cta.href) missing.push(`CTA ${index + 1}: link is required.`);
    if (cta.href && !isValidCtaHref(cta.href)) {
      missing.push(`CTA ${index + 1}: link must be internal (/path) or external (http/https).`);
    }
  });
  return missing;
}

function assertValidCtaContract(ctas = [], fieldPrefix = "ctas") {
  if (!Array.isArray(ctas)) {
    throw new Error(`${fieldPrefix} must be an array.`);
  }
  if (ctas.length > 2) {
    throw new Error(`${fieldPrefix} supports up to two items.`);
  }

  ctas.forEach((cta, index) => {
    if (!cta || typeof cta !== "object" || Array.isArray(cta)) {
      throw new Error(`${fieldPrefix}[${index}] must be an object.`);
    }

    const label = normalizeText(cta.label);
    const href = normalizeText(cta.href);
    if (!label) {
      throw new Error(`${fieldPrefix}[${index}].label is required when CTA is added.`);
    }
    if (!href) {
      throw new Error(`${fieldPrefix}[${index}].href is required when CTA is added.`);
    }
    if (!isValidCtaHref(href)) {
      throw new Error(`${fieldPrefix}[${index}].href must be internal (/path) or external (http/https).`);
    }
  });
}

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
    type: "RichTextSection",
    label: "Rich text",
    variants: ["default"],
    defaultVariant: "default",
    variantDescriptions: {
      default: "Simple long-form content block for copy-driven pages.",
    },
    defaultProps: {
      content: "",
    },
    previewPropsByVariant: {
      default: {
        content:
          "This block is great for mission statements, policy notes, and long-form updates.",
      },
    },
    schema: [{ key: "content", label: "Content", type: "wysiwyg" }],
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
    type: "CTASection",
    label: "Call to action",
    variants: ["centered", "split"],
    defaultVariant: "centered",
    variantDescriptions: {
      centered: "Focused CTA with centered content.",
      split: "CTA copy paired with supporting media.",
    },
    defaultProps: {
      title: "Ready to join?",
      body: "Add supporting text for the CTA.",
      ctas: [{ label: "Get started", href: "/join" }],
      imageMediaId: "",
    },
    previewPropsByVariant: {
      centered: {
        title: "Ready to take the next step?",
        body: "Invite visitors to become members, register, or contact your team.",
        ctas: [{ label: "Become a member", href: "/join" }],
        imageMediaId: "media_preview_feature",
      },
      split: {
        title: "Partner with our programs",
        body: "Highlight your value proposition with a visual and concise copy.",
        ctas: [
          { label: "Contact us", href: "/contact" },
          { label: "View programs", href: "/programs" },
        ],
        imageMediaId: "media_preview_cta",
      },
    },
    schema: [
      {
        key: "core",
        type: "group",
        label: "Core",
        defaultOpen: true,
        fields: [
          { key: "title", label: "Title", type: "text" },
          { key: "body", label: "Body", type: "textarea" },
        ],
      },
      {
        key: "actions",
        type: "group",
        label: "Actions",
        defaultOpen: false,
        fields: [
          { key: "ctas", label: "Calls to action", type: "ctas" },
        ],
      },
      {
        key: "media",
        type: "group",
        label: "Media",
        defaultOpen: false,
        fields: [
          { key: "imageMediaId", label: "Image media ID", type: "media" },
        ],
      },
    ],
    normalizeProps: (props) => {
      const value = props && typeof props === "object" && !Array.isArray(props) ? props : {};
      const normalizedCtaList = normalizeCtas(value.ctas, { label: value.ctaText, href: value.ctaHref });
      assertValidCtaContract(normalizedCtaList, "CTASection.ctas");
      return {
        title: normalizeText(value.title),
        body: normalizeText(value.body),
        ctas: normalizedCtaList,
        imageMediaId: normalizeText(value.imageMediaId),
      };
    },
    evaluateReadiness: (props) => {
      const missing = evaluateCtaReadiness(props?.ctas);
      return {
        readyForDraft: missing.length === 0,
        readyForPublish: missing.length === 0,
        missingRequiredFields: missing,
        missingCount: missing.length,
      };
    },
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
    type: "EventListSection",
    label: "Event list",
    variants: ["upcoming", "featured", "category"],
    defaultVariant: "upcoming",
    variantDescriptions: {
      upcoming: "Chronological list of upcoming events.",
      featured: "Highlight a shorter set of key events.",
      category: "Filter event cards by a selected category.",
    },
    defaultProps: {
      title: "Upcoming events",
      category: "",
      limit: "6",
    },
    previewPropsByVariant: {
      upcoming: {
        title: "Upcoming events",
        category: "",
        limit: "6",
      },
      featured: {
        title: "Featured events",
        category: "",
        limit: "2",
      },
      category: {
        title: "Workshop events",
        category: "Workshop",
        limit: "6",
      },
    },
    schema: [
      { key: "title", label: "Title", type: "text" },
      { key: "category", label: "Category filter", type: "text" },
      { key: "limit", label: "Limit", type: "text" },
    ],
  },
  {
    type: "ContactSection",
    label: "Contact",
    variants: ["card", "split"],
    defaultVariant: "card",
    variantDescriptions: {
      card: "Single card layout for straightforward contact details.",
      split: "Split arrangement for broader contact content.",
    },
    defaultProps: {
      address: "123 Main St",
      email: "hello@example.com",
      phone: "",
      mapLink: "",
    },
    previewPropsByVariant: {
      card: {
        address: "120 Market Street, San Diego, CA",
        email: "support@communityhub.org",
        phone: "(555) 010-1200",
        mapLink: "https://maps.google.com",
      },
      split: {
        address: "500 Lakeshore Avenue, Oakland, CA",
        email: "hello@communityhub.org",
        phone: "(555) 014-4400",
        mapLink: "https://maps.google.com",
      },
    },
    schema: [
      { key: "address", label: "Address", type: "textarea" },
      { key: "email", label: "Email", type: "text" },
      { key: "phone", label: "Phone", type: "text" },
      { key: "mapLink", label: "Map link", type: "text" },
    ],
  },
  {
    type: "LogoMarqueeSection",
    label: "Logo marquee",
    variants: ["marquee", "grid"],
    defaultVariant: "grid",
    variantDescriptions: {
      marquee: "Auto-flowing row style for partner logos.",
      grid: "Static grid for partner and sponsor marks.",
    },
    defaultProps: {
      logosMediaIds: "",
    },
    previewPropsByVariant: {
      marquee: {
        logosMediaIds: "media_preview_logo_a,media_preview_logo_b,media_preview_logo_c",
      },
      grid: {
        logosMediaIds: "media_preview_logo_a,media_preview_logo_b,media_preview_logo_c,media_preview_logo_d",
      },
    },
    schema: [{ key: "logosMediaIds", label: "Logo media IDs (comma separated)", type: "media-list" }],
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
  {
    type: "LegalDocumentSection",
    label: "Legal document",
    variants: ["default"],
    defaultVariant: "default",
    variantDescriptions: {
      default: "Simple legal content section with standardized heading.",
    },
    defaultProps: {
      content: "",
    },
    previewPropsByVariant: {
      default: {
        content:
          "By continuing, you agree to the member code of conduct and attendance policy.",
      },
    },
    schema: [{ key: "content", label: "Content", type: "wysiwyg" }],
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
