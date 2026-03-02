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
      ctaText: "Learn more",
      ctaHref: "/join",
      imageMediaId: "",
    },
    previewPropsByVariant: {
      centered: {
        heading: "Build your strongest season",
        subheading: "Weekly events, coaching, and resources tailored for your community.",
        ctaText: "Explore programs",
        ctaHref: "/programs",
        imageMediaId: "media_preview_hero",
      },
      split: {
        heading: "Grow together with your hub",
        subheading: "Pair storytelling with a visual to highlight your next campaign.",
        ctaText: "Join now",
        ctaHref: "/join",
        imageMediaId: "media_preview_feature",
      },
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
      ctaText: "Get started",
      ctaHref: "/join",
      imageMediaId: "",
    },
    previewPropsByVariant: {
      centered: {
        title: "Ready to take the next step?",
        body: "Invite visitors to become members, register, or contact your team.",
        ctaText: "Become a member",
        ctaHref: "/join",
        imageMediaId: "media_preview_feature",
      },
      split: {
        title: "Partner with our programs",
        body: "Highlight your value proposition with a visual and concise copy.",
        ctaText: "Contact us",
        ctaHref: "/contact",
        imageMediaId: "media_preview_cta",
      },
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
    type: "FAQSection",
    label: "FAQ",
    variants: ["compact", "detailed"],
    defaultVariant: "compact",
    variantDescriptions: {
      compact: "Tighter accordion spacing for short answers.",
      detailed: "Expanded spacing for longer explanatory content.",
    },
    defaultProps: {
      title: "Frequently asked questions",
      itemsText: "Question one|Answer one\nQuestion two|Answer two",
    },
    previewPropsByVariant: {
      compact: {
        title: "Frequently asked questions",
        itemsText:
          "Who can join?|Anyone can create an account and request membership.\nHow do I register for events?|Choose an event and complete registration from your account.",
      },
      detailed: {
        title: "Membership and event FAQs",
        itemsText:
          "Can guests attend?|Eligibility depends on event settings and hub policy.\nDo I need to renew?|Paid plans renew based on plan duration and hub rules.",
      },
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

export function listCmsBlocks() {
  return BLOCK_DEFINITIONS.map((definition) => ({
    type: definition.type,
    label: definition.label,
    variants: [...definition.variants],
    variantDescriptions: { ...(definition.variantDescriptions || {}) },
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

export function buildBlockForVariant(type, variant) {
  const definition = getCmsBlockDefinition(type);
  if (!definition) return null;

  return {
    type: definition.type,
    variant: normalizeVariant(type, variant),
    props: { ...definition.defaultProps },
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
    props: {
      ...block.props,
      ...previewProps,
    },
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
  return definition?.schema ? definition.schema.map((field) => ({ ...field })) : [];
}

export function isSupportedBlockType(type) {
  return Boolean(getCmsBlockDefinition(type));
}
