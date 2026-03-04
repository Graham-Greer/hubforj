import {
  ACCORDION_SECTION_DEFAULT_PROPS,
  ACCORDION_SECTION_PREVIEW_PROPS,
  ACCORDION_SECTION_SCHEMA,
  evaluateAccordionReadiness,
  normalizeAccordionSectionProps,
} from "./accordion-section.js";

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
      centered: "Centered headline and CTA with optional supporting image.",
      split: "Two-column hero with copy beside media.",
    },
    defaultProps: {
      heading: "New hero heading",
      subheading: "Add supporting copy for this section.",
      ctas: [{ label: "Learn more", href: "/join" }],
      imageMediaId: "",
    },
    previewPropsByVariant: {
      centered: {
        heading: "Build your strongest season",
        subheading: "Weekly events, coaching, and resources tailored for your community.",
        ctas: [{ label: "Explore programs", href: "/programs" }],
        imageMediaId: "media_preview_hero",
      },
      split: {
        heading: "Grow together with your hub",
        subheading: "Pair storytelling with a visual to highlight your next campaign.",
        ctas: [{ label: "Join now", href: "/join" }],
        imageMediaId: "media_preview_feature",
      },
    },
    schema: [
      {
        key: "core",
        type: "group",
        label: "Core",
        defaultOpen: true,
        fields: [
          { key: "heading", label: "Heading", type: "text" },
          { key: "subheading", label: "Subheading", type: "textarea" },
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
      assertValidCtaContract(normalizedCtaList, "HeroSection.ctas");
      return {
        heading: normalizeText(value.heading),
        subheading: normalizeText(value.subheading),
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
    type: "FeatureGridSection",
    label: "Feature grid",
    variants: ["2col", "3col", "4col"],
    defaultVariant: "3col",
    variantDescriptions: {
      "2col": "Two-column feature cards for larger copy blocks.",
      "3col": "Balanced three-column grid for most landing pages.",
      "4col": "Compact four-column grid for short feature highlights.",
    },
    defaultProps: {
      title: "Features",
      itemsText: "Feature one|Description\nFeature two|Description",
    },
    previewPropsByVariant: {
      "2col": {
        title: "Why members stay",
        itemsText:
          "Expert coaches|Experienced staff and volunteer mentors\nWeekly sessions|Consistent programming for all levels\nMember support|Resources and guidance beyond events\nCommunity impact|Opportunities to give back locally",
      },
      "3col": {
        title: "Everything in one place",
        itemsText:
          "Programs|Track upcoming workshops and meetups\nRegistrations|Manage signups and waitlists clearly\nMemberships|Handle plans and renewals\nCommunications|Share announcements quickly\nMedia|Keep your visuals organized\nAnalytics|Measure what matters",
      },
      "4col": {
        title: "Built for speed",
        itemsText:
          "Fast setup|Launch pages quickly\nReusable blocks|Keep design consistent\nClear workflows|Draft, preview, publish\nSafe defaults|Guarded permissions",
      },
    },
    schema: [
      { key: "title", label: "Title", type: "text" },
      { key: "itemsText", label: "Items (title|description per line)", type: "textarea" },
    ],
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
    variants: ["3tier", "enterprise"],
    defaultVariant: "3tier",
    variantDescriptions: {
      "3tier": "Three pricing tiers for self-serve offerings.",
      enterprise: "Enterprise-focused presentation with premium emphasis.",
    },
    defaultProps: {
      title: "Membership plans",
      tiersText: "Starter|$19|Great for getting started",
    },
    previewPropsByVariant: {
      "3tier": {
        title: "Membership plans",
        tiersText:
          "Starter|$19/mo|Core access and weekly sessions\nGrowth|$39/mo|Expanded programs and workshops\nLeadership|$79/mo|Priority support and advanced tracks",
      },
      enterprise: {
        title: "Organization plans",
        tiersText:
          "Community|$199/mo|Support for one local chapter\nRegional|$499/mo|Multi-site tools and reporting\nEnterprise|Contact us|Custom onboarding and governance",
      },
    },
    schema: [
      { key: "title", label: "Title", type: "text" },
      { key: "tiersText", label: "Tiers (name|price|description per line)", type: "textarea" },
    ],
  },
  {
    type: "StatsSection",
    label: "Stats",
    variants: ["row", "cards"],
    defaultVariant: "row",
    variantDescriptions: {
      row: "Inline metrics row for quick impact statements.",
      cards: "Card-based metrics for stronger visual separation.",
    },
    defaultProps: {
      itemsText: "250+|Members\n35|Events",
    },
    previewPropsByVariant: {
      row: {
        itemsText: "2.4k|Active members\n148|Annual events\n96%|Retention rate",
      },
      cards: {
        itemsText: "18|Programs live\n42|Partner organizations\n12|Cities served",
      },
    },
    schema: [{ key: "itemsText", label: "Stats (value|label per line)", type: "textarea" }],
  },
  {
    type: "TeamSection",
    label: "Team",
    variants: ["grid", "withLead"],
    defaultVariant: "grid",
    variantDescriptions: {
      grid: "Balanced team grid for staff and volunteers.",
      withLead: "Lead-highlight layout with supporting team cards.",
    },
    defaultProps: {
      title: "Meet the team",
      membersText: "Name|Role|Bio",
    },
    previewPropsByVariant: {
      grid: {
        title: "Meet our team",
        membersText:
          "Jordan Lee|Program Director|Leads strategy and community partnerships\nAvery Kim|Operations Lead|Keeps events and volunteers coordinated\nMorgan Diaz|Member Success|Supports onboarding and engagement",
      },
      withLead: {
        title: "Leadership team",
        membersText:
          "Casey Morgan|Executive Director|Oversees mission and long-term growth\nRiley Chen|Programs Manager|Designs curriculum and seasonal tracks\nTaylor Brooks|Community Lead|Builds local partnerships and outreach",
      },
    },
    schema: [
      { key: "title", label: "Title", type: "text" },
      { key: "membersText", label: "Members (name|role|bio per line)", type: "textarea" },
    ],
  },
  {
    type: "TestimonialsSection",
    label: "Testimonials",
    variants: ["grid", "spotlight"],
    defaultVariant: "grid",
    variantDescriptions: {
      grid: "Multiple testimonials shown with equal weight.",
      spotlight: "Lead quote emphasis with supporting endorsements.",
    },
    defaultProps: {
      title: "What people say",
      itemsText: '"Great community"|Alex',
    },
    previewPropsByVariant: {
      grid: {
        title: "What members say",
        itemsText:
          '"This hub helped me build real momentum."|Alex\n"Programs are clear and easy to join."|Sam\n"I found mentors and collaborators quickly."|Jordan',
      },
      spotlight: {
        title: "Member spotlight",
        itemsText:
          '"The structure here changed how our team delivers programs."|Casey\n"Support has been excellent from day one."|Taylor',
      },
    },
    schema: [
      { key: "title", label: "Title", type: "text" },
      { key: "itemsText", label: "Items (quote|name per line)", type: "textarea" },
    ],
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
  return definition?.schema ? cloneValue(definition.schema) : [];
}

export function normalizeBlockProps(type, props) {
  const definition = getCmsBlockDefinition(type);
  if (!definition) return {};
  if (typeof definition.normalizeProps === "function") {
    return definition.normalizeProps(props);
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
    return definition.evaluateReadiness(block?.props || {});
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
