const BLOCK_DEFINITIONS = [
  {
    type: "HeroSection",
    label: "Hero",
    variants: ["centered", "split"],
    defaultVariant: "centered",
    defaultProps: {
      heading: "New hero heading",
      subheading: "Add supporting copy for this section.",
      ctaText: "Learn more",
      ctaHref: "/join",
      imageMediaId: "",
    },
    schema: [
      { key: "heading", label: "Heading", type: "text" },
      { key: "subheading", label: "Subheading", type: "textarea" },
      { key: "ctaText", label: "CTA text", type: "text" },
      { key: "ctaHref", label: "CTA link", type: "text" },
      { key: "imageMediaId", label: "Image media ID", type: "media" },
    ],
  },
  {
    type: "RichTextSection",
    label: "Rich text",
    variants: ["default"],
    defaultVariant: "default",
    defaultProps: {
      content: "",
    },
    schema: [{ key: "content", label: "Content", type: "wysiwyg" }],
  },
  {
    type: "CTASection",
    label: "Call to action",
    variants: ["centered", "split"],
    defaultVariant: "centered",
    defaultProps: {
      title: "Ready to join?",
      body: "Add supporting text for the CTA.",
      ctaText: "Get started",
      ctaHref: "/join",
      imageMediaId: "",
    },
    schema: [
      { key: "title", label: "Title", type: "text" },
      { key: "body", label: "Body", type: "textarea" },
      { key: "ctaText", label: "CTA text", type: "text" },
      { key: "ctaHref", label: "CTA link", type: "text" },
      { key: "imageMediaId", label: "Image media ID", type: "media" },
    ],
  },
  {
    type: "FeatureGridSection",
    label: "Feature grid",
    variants: ["2col", "3col", "4col"],
    defaultVariant: "3col",
    defaultProps: {
      title: "Features",
      itemsText: "Feature one|Description\nFeature two|Description",
    },
    schema: [
      { key: "title", label: "Title", type: "text" },
      { key: "itemsText", label: "Items (title|description per line)", type: "textarea" },
    ],
  },
  {
    type: "FAQSection",
    label: "FAQ",
    variants: ["compact", "detailed"],
    defaultVariant: "compact",
    defaultProps: {
      title: "Frequently asked questions",
      itemsText: "Question one|Answer one\nQuestion two|Answer two",
    },
    schema: [
      { key: "title", label: "Title", type: "text" },
      { key: "itemsText", label: "Items (question|answer per line)", type: "textarea" },
    ],
  },
  {
    type: "EventListSection",
    label: "Event list",
    variants: ["upcoming", "featured", "category"],
    defaultVariant: "upcoming",
    defaultProps: {
      title: "Upcoming events",
      category: "",
      limit: "6",
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
    defaultProps: {
      address: "123 Main St",
      email: "hello@example.com",
      phone: "",
      mapLink: "",
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
    defaultProps: {
      logosMediaIds: "",
    },
    schema: [{ key: "logosMediaIds", label: "Logo media IDs (comma separated)", type: "media-list" }],
  },
  {
    type: "PricingSection",
    label: "Pricing",
    variants: ["3tier", "enterprise"],
    defaultVariant: "3tier",
    defaultProps: {
      title: "Membership plans",
      tiersText: "Starter|$19|Great for getting started",
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
    defaultProps: {
      itemsText: "250+|Members\n35|Events",
    },
    schema: [{ key: "itemsText", label: "Stats (value|label per line)", type: "textarea" }],
  },
  {
    type: "TeamSection",
    label: "Team",
    variants: ["grid", "withLead"],
    defaultVariant: "grid",
    defaultProps: {
      title: "Meet the team",
      membersText: "Name|Role|Bio",
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
    defaultProps: {
      title: "What people say",
      itemsText: "\"Great community\"|Alex",
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
    defaultProps: {
      content: "",
    },
    schema: [{ key: "content", label: "Content", type: "wysiwyg" }],
  },
];

export function listCmsBlocks() {
  return BLOCK_DEFINITIONS.map((definition) => ({
    type: definition.type,
    label: definition.label,
    variants: [...definition.variants],
    defaultVariant: definition.defaultVariant,
    defaultProps: { ...definition.defaultProps },
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

export function buildDefaultBlock(type) {
  const definition = getCmsBlockDefinition(type);
  if (!definition) return null;

  return {
    type: definition.type,
    variant: definition.defaultVariant,
    props: { ...definition.defaultProps },
    label: definition.label,
  };
}

export function getBlockEditorSchema(type) {
  const definition = getCmsBlockDefinition(type);
  return definition?.schema ? definition.schema.map((field) => ({ ...field })) : [];
}

export function isSupportedBlockType(type) {
  return Boolean(getCmsBlockDefinition(type));
}
