export const adminOnboardingVersion = "admin-onboarding-v1";

export const adminOnboardingJourneyOrder = [
  "welcome_overview",
  "regional_setup",
  "settings_overview",
  "settings_site",
  "settings_branding",
  "settings_pages_overview",
  "settings_pages_home",
  "settings_account",
  "payments_setup",
  "membership_plans",
  "members_list",
  "member_detail",
  "payments_records",
  "admins",
  "media",
  "what_we_do",
  "testimonials",
  "events_list",
  "courses_list",
];

export const adminOnboardingJourneys = {
  welcome_overview: {
    key: "welcome_overview",
    priority: 100,
    autoTrigger: true,
    routePatterns: ["/admin"],
    steps: [
      {
        id: "welcome",
        type: "text",
        title: "Welcome to your admin portal",
        body:
          "This is your operational home for managing your website, members, content, events, and courses. We will start with the core setup areas first.",
        ctaLabel: "Next",
      },
      {
        id: "settings",
        type: "text",
        title: "Start with your foundations",
        target: {
          keys: ["nav_site_settings", "nav_page_settings"],
          placement: "right",
          spotlight: true,
        },
        body:
          "Begin with Site settings, Site branding, and Pages so your hub identity and public content are in place before you move into operations.",
        ctaLabel: "Next",
      },
      {
        id: "content",
        type: "text",
        title: "Upload your media first",
        target: {
          key: "nav_media",
          placement: "right",
          spotlight: true,
        },
        body:
          "Add your logo, homepage visuals, and supporting images before editing content sections. It will make the rest of setup much smoother.",
        ctaLabel: "Next",
      },
      {
        id: "operations",
        type: "text",
        title: "Then move into operations",
        body:
          "Once the basics are in place, you can create events and courses, review members, and work through the rest of setup at your own pace.",
        ctaLabel: "Finish",
      },
    ],
  },
  regional_setup: {
    key: "regional_setup",
    priority: 95,
    autoTrigger: true,
    routePatterns: ["/admin/onboarding"],
    steps: [
      {
        id: "regional-basics",
        type: "text",
        target: {
          key: "regional_setup_form",
          placement: "right",
          spotlight: true,
        },
        title: "Confirm how your community operates",
        body:
          "Set the business country, timezone, community currency, and English date format here before you move into events, courses, or payments.",
        ctaLabel: "Next",
      },
      {
        id: "regional-save",
        type: "text",
        target: {
          key: "regional_setup_save",
          placement: "top",
          spotlight: true,
        },
        title: "Save these foundations first",
        body:
          "Saving here unlocks the parts of the admin portal that depend on scheduling, pricing, and Stripe country context.",
        ctaLabel: "Finish",
      },
    ],
  },
  settings_overview: {
    key: "settings_overview",
    priority: 90,
    autoTrigger: true,
    routePatterns: ["/admin/settings"],
    steps: [
      {
        id: "branding",
        type: "text",
        target: {
          key: "branding_settings_card",
          placement: "bottom",
          spotlight: true,
        },
        title: "Start with site branding",
        body:
          "Use Site branding to control the public identity and appearance of your hub before refining content elsewhere.",
        ctaLabel: "Next",
      },
      {
        id: "site",
        type: "text",
        target: {
          key: "site_settings_card",
          placement: "bottom",
          spotlight: true,
        },
        title: "Then complete site details",
        body:
          "Use Site to manage contact details and the core public-facing information that supports your website.",
        ctaLabel: "Finish",
      },
    ],
  },
  settings_site: {
    key: "settings_site",
    priority: 80,
    autoTrigger: true,
    routePatterns: ["/admin/settings/site"],
    steps: [
      {
        id: "site-details",
        type: "text",
        target: {
          key: "site_settings_form",
          placement: "right",
          spotlight: true,
        },
        title: "Set your hub details",
        body:
          "Complete the core identity and contact details for your hub here before moving deeper into homepage content.",
        ctaLabel: "Next",
      },
      {
        id: "save",
        type: "text",
        target: {
          key: "site_settings_save",
          placement: "top",
          spotlight: true,
        },
        title: "Save and continue",
        body: "When you save here, you can return to the rest of setup without losing your place.",
        ctaLabel: "Finish",
      },
    ],
  },
  settings_branding: {
    key: "settings_branding",
    priority: 80,
    autoTrigger: true,
    routePatterns: ["/admin/settings/branding"],
    steps: [
      {
        id: "branding-intro",
        type: "video",
        target: {
          key: "branding_settings_form",
          placement: "right",
          spotlight: true,
        },
        title: "Brand your hub",
        body:
          "This is where you control the visual identity of your public site, including logos, colors, and template presentation.",
        videoAssetKey: "branding-settings-overview",
        ctaLabel: "Next",
      },
      {
        id: "branding-save",
        type: "text",
        target: {
          key: "branding_settings_save",
          placement: "top",
          spotlight: true,
        },
        title: "Apply your site branding",
        body:
          "Save once your visual identity is in place, then review how it feels on the public site.",
        ctaLabel: "Finish",
      },
    ],
  },
  settings_pages_overview: {
    key: "settings_pages_overview",
    priority: 80,
    autoTrigger: true,
    routePatterns: ["/admin/settings/pages"],
    steps: [
      {
        id: "homepage-card",
        type: "text",
        target: {
          key: "page_settings_home_card",
          placement: "bottom",
          spotlight: true,
        },
        title: "Start with the homepage",
        body:
          "The homepage is the richest public page editor. It lets you shape the hero, supporting sections, testimonials, and your main calls to action.",
        ctaLabel: "Next",
      },
      {
        id: "secondary-pages",
        type: "text",
        target: {
          key: "page_settings_testimonials_card",
          placement: "bottom",
          spotlight: true,
        },
        title: "Then refine your other public routes",
        body:
          "Use the events, courses, and testimonials page settings to keep each route’s hero and supporting content aligned with the rest of your public site.",
        ctaLabel: "Finish",
      },
    ],
  },
  settings_pages_home: {
    key: "settings_pages_home",
    priority: 80,
    autoTrigger: true,
    routePatterns: ["/admin/settings/pages/home", "/admin/settings/homepage"],
    steps: [
      {
        id: "sections",
        type: "text",
        target: {
          key: "homepage_section_tabs",
          placement: "bottom",
          spotlight: true,
        },
        title: "Edit one homepage section at a time",
        body:
          "The homepage editor is broken into focused sections so you can update the page in manageable steps.",
        ctaLabel: "Next",
      },
      {
        id: "hero",
        type: "video",
        target: {
          key: "homepage_hero_panel",
          placement: "right",
          spotlight: true,
        },
        title: "Start with the hero",
        body:
          "Set the main message, media, and first actions visitors see before moving into the rest of the homepage.",
        videoAssetKey: "homepage-hero-editing",
        ctaLabel: "Next",
      },
      {
        id: "actions",
        type: "text",
        target: {
          key: "homepage_hero_actions",
          placement: "top",
          spotlight: true,
        },
        title: "Keep action links focused",
        body:
          "Use the primary and secondary actions to guide visitors toward joining, signing in, or exploring your events and courses.",
        ctaLabel: "Finish",
      },
    ],
  },
  settings_account: {
    key: "settings_account",
    priority: 80,
    autoTrigger: true,
    routePatterns: ["/admin/settings/account"],
    steps: [],
  },
  payments_setup: {
    key: "payments_setup",
    priority: 75,
    autoTrigger: true,
    routePatterns: ["/admin/payments"],
    queryKey: "view",
    queryValue: "setup",
    queryDefaultValue: "setup",
    steps: [],
  },
  membership_plans: {
    key: "membership_plans",
    priority: 74,
    autoTrigger: true,
    routePatterns: ["/admin/payments"],
    queryKey: "view",
    queryValue: "plans",
    queryDefaultValue: "setup",
    steps: [],
  },
  members_list: {
    key: "members_list",
    priority: 73,
    autoTrigger: true,
    routePatterns: ["/admin/members"],
    steps: [
      {
        id: "members-toolbar",
        type: "text",
        target: {
          key: "members_list_toolbar",
          placement: "bottom",
          spotlight: true,
          inset: 12,
        },
        title: "Search and narrow the directory here",
        body:
          "Use search, filters, and export here when you need to find the right member quickly or work through a specific operational group.",
        ctaLabel: "Next",
      },
      {
        id: "members-list",
        type: "text",
        target: {
          key: "members_list_records",
          placement: "top",
          spotlight: true,
          inset: 12,
        },
        title: "Open the right member record from this list",
        body:
          "Each row takes you into the full member record where you can review status, membership, bookings, and payment context in one place.",
        ctaLabel: "Finish",
      },
    ],
  },
  member_detail: {
    key: "member_detail",
    priority: 72,
    autoTrigger: true,
    routePatterns: [],
    routePrefixes: ["/admin/members/"],
    steps: [
      {
        id: "member-summary",
        type: "text",
        target: {
          key: "member_detail_summary",
          placement: "bottom",
          spotlight: true,
          inset: 12,
        },
        title: "Start with the member summary",
        body:
          "This top summary gives you identity, role, status, and basic timeline context before you make any operational changes.",
        ctaLabel: "Next",
      },
      {
        id: "member-state",
        type: "text",
        target: {
          key: "member_detail_state",
          placement: "top",
          spotlight: true,
          inset: 12,
        },
        title: "Use member state to control access",
        body:
          "This section is where you suspend or reactivate a member when the relationship changes or access needs to be controlled.",
        ctaLabel: "Next",
      },
      {
        id: "member-membership",
        type: "text",
        target: {
          key: "member_detail_membership",
          placement: "top",
          spotlight: true,
          inset: 12,
        },
        title: "Manage membership and upgrades here",
        body:
          "Use this section to review the current plan, approve upgrade requests, and adjust membership assignment when the member needs a different arrangement.",
        ctaLabel: "Finish",
      },
    ],
  },
  payments_records: {
    key: "payments_records",
    priority: 71,
    autoTrigger: true,
    requiresCapability: "paymentsEnabled",
    routePatterns: ["/admin/payments"],
    queryKey: "view",
    queryValue: "payments",
    steps: [
      {
        id: "payments-toolbar",
        type: "text",
        target: {
          key: "payments_records_toolbar",
          placement: "bottom",
          spotlight: true,
          inset: 12,
        },
        title: "Filter and export payment records here",
        body:
          "Use the date filters, search, status filters, and export action here when you need to narrow the ledger view or prepare operational follow-up.",
        ctaLabel: "Next",
      },
      {
        id: "payments-list",
        type: "text",
        target: {
          key: "payments_records_list",
          placement: "top",
          spotlight: true,
          inset: 12,
        },
        title: "Review the payment records in this table",
        body:
          "This table brings membership, event, and course payments into one operational list so you can trace status, member context, and next actions quickly.",
        ctaLabel: "Finish",
      },
    ],
  },
  admins: {
    key: "admins",
    priority: 70,
    autoTrigger: true,
    routePatterns: ["/admin/admins"],
    steps: [],
  },
  media: {
    key: "media",
    priority: 70,
    autoTrigger: true,
    routePatterns: ["/admin/media"],
    steps: [
      {
        id: "upload",
        type: "text",
        target: {
          key: "media_add_assets_button",
          placement: "left",
          spotlight: true,
        },
        title: "Upload your first media",
        body:
          "Start with your logo, a homepage image, and any visuals you know you will reuse across content and offerings.",
        ctaLabel: "Next",
      },
      {
        id: "folders",
        type: "text",
        target: {
          key: "media_add_folder_button",
          placement: "left",
          spotlight: true,
        },
        title: "Keep your files organised",
        body:
          "Create folders for logos, homepage imagery, events, and other repeated assets so your library stays easy to manage as it grows.",
        ctaLabel: "Next",
      },
      {
        id: "details",
        type: "text",
        target: {
          key: "media_details_panel",
          placement: "left",
          spotlight: true,
        },
        title: "Review and update media details",
        body:
          "Use the details panel to manage display names, folder placement, alt text, and usage references for each asset.",
        ctaLabel: "Finish",
      },
    ],
  },
  what_we_do: {
    key: "what_we_do",
    priority: 70,
    autoTrigger: true,
    routePatterns: ["/admin/settings/pages/home"],
    queryKey: "section",
    queryValue: "what-we-do",
    steps: [
      {
        id: "purpose",
        type: "text",
        target: {
          key: "homepage_what_we_do_items",
          placement: "right",
          spotlight: true,
        },
        title: "Explain what your hub does",
        body:
          "Use the homepage What we do panel to manage the main services, support, or outcomes your organisation offers.",
        ctaLabel: "Next",
      },
      {
        id: "quality",
        type: "text",
        target: {
          key: "homepage_what_we_do_items",
          placement: "top",
          spotlight: true,
        },
        title: "Keep the first items concise",
        body:
          "A short set of clear cards is stronger than trying to explain everything at once on day one.",
        ctaLabel: "Finish",
      },
    ],
  },
  testimonials: {
    key: "testimonials",
    priority: 70,
    autoTrigger: true,
    routePatterns: ["/admin/testimonials"],
    steps: [
      {
        id: "trust",
        type: "text",
        target: {
          key: "testimonials_list",
          placement: "right",
          spotlight: true,
        },
        title: "Use testimonials to build trust",
        body:
          "Testimonials help potential members and partners understand the value and credibility of your hub quickly.",
        ctaLabel: "Next",
      },
      {
        id: "first-testimonial",
        type: "text",
        target: {
          key: "testimonials_list",
          placement: "top",
          spotlight: true,
        },
        title: "Start with one strong example",
        body:
          "You do not need a full library straight away. One clear, relevant testimonial is enough to improve the homepage meaningfully.",
        ctaLabel: "Finish",
      },
    ],
  },
  events_list: {
    key: "events_list",
    priority: 60,
    autoTrigger: true,
    routePatterns: ["/admin/events"],
    steps: [
      {
        id: "events-intro",
        type: "text",
        target: {
          key: "events_create_button",
          placement: "left",
          spotlight: true,
        },
        title: "Create and manage events",
        body:
          "This is where you create events and manage them once registrations begin coming in.",
        ctaLabel: "Next",
      },
      {
        id: "events-lifecycle",
        type: "video",
        target: {
          key: "events_list",
          placement: "right",
          spotlight: true,
        },
        title: "The lifecycle grows with your activity",
        body:
          "Once events exist, this area becomes the place for editing, registrations, attendance, and operational follow-through.",
        videoAssetKey: "events-list-and-lifecycle",
        ctaLabel: "Finish",
      },
    ],
  },
  courses_list: {
    key: "courses_list",
    priority: 60,
    autoTrigger: true,
    routePatterns: ["/admin/courses"],
    steps: [
      {
        id: "courses-intro",
        type: "text",
        target: {
          key: "courses_create_button",
          placement: "left",
          spotlight: true,
        },
        title: "Create and manage courses",
        body:
          "This area is where you publish courses and manage the operational flow once enrolments begin.",
        ctaLabel: "Next",
      },
      {
        id: "courses-lifecycle",
        type: "video",
        target: {
          key: "courses_list",
          placement: "right",
          spotlight: true,
        },
        title: "Courses become more operational over time",
        body:
          "After your first course is live, this route becomes the place for editing, enrolments, and the supporting admin work around delivery.",
        videoAssetKey: "courses-list-and-lifecycle",
        ctaLabel: "Finish",
      },
    ],
  },
};

export const adminOnboardingChecklistItems = [
  {
    key: "regional_setup",
    label: "Complete regional setup",
    href: "/admin/onboarding",
    completionMode: "regional_setup",
  },
  {
    key: "site_details",
    label: "Complete site details",
    href: "/admin/settings/site",
    completionMode: "setup_fact",
    factKey: "siteDetails",
  },
  {
    key: "branding",
    label: "Complete site branding",
    href: "/admin/settings/branding",
    completionMode: "setup_fact",
    factKey: "branding",
  },
  {
    key: "homepage",
    label: "Complete page content",
    href: "/admin/settings/pages",
    completionMode: "setup_fact",
    factKey: "homepage",
  },
  {
    key: "media_assets",
    label: "Upload core media assets",
    href: "/admin/media",
    completionMode: "record",
    recordKey: "media",
  },
  {
    key: "what_we_do",
    label: "Add What we do items",
    href: "/admin/settings/pages/home?section=what-we-do",
    completionMode: "record",
    recordKey: "whatWeDo",
  },
  {
    key: "testimonials",
    label: "Add testimonials",
    href: "/admin/testimonials",
    completionMode: "record",
    recordKey: "testimonials",
  },
  {
    key: "first_event",
    label: "Create your first event",
    href: "/admin/events",
    completionMode: "record",
    recordKey: "events",
  },
  {
    key: "first_course",
    label: "Create your first course",
    href: "/admin/courses",
    completionMode: "record",
    recordKey: "courses",
    requiresCapability: "coursesEnabled",
  },
  {
    key: "account_review",
    label: "Review account and package settings",
    href: "/admin/settings/account",
    completionMode: "setup_fact",
    factKey: "accountReview",
  },
  {
    key: "payments_setup",
    label: "Review payments setup",
    href: "/admin/payments?view=setup",
    completionMode: "journey",
    journeyKey: "payments_setup",
  },
  {
    key: "membership_plans",
    label: "Review membership plans",
    href: "/admin/payments?view=plans",
    completionMode: "setup_fact",
    factKey: "membershipPlans",
  },
];

const freeAndStarterChecklistOrder = [
  "regional_setup",
  "site_details",
  "branding",
  "homepage",
  "media_assets",
  "what_we_do",
  "testimonials",
  "membership_plans",
  "first_event",
  "first_course",
  "account_review",
  "payments_setup",
];

const growthChecklistOrder = adminOnboardingChecklistItems.map((item) => item.key);
const growthChecklistOrderWithStripeSecond = [
  "regional_setup",
  "payments_setup",
  ...growthChecklistOrder.filter((itemKey) => itemKey !== "regional_setup" && itemKey !== "payments_setup"),
];

export function getAdminOnboardingChecklistOrder(packageTier = "") {
  const normalizedTier = String(packageTier || "").trim().toLowerCase();

  if (normalizedTier === "free" || normalizedTier === "starter") {
    return freeAndStarterChecklistOrder;
  }

  return growthChecklistOrderWithStripeSecond;
}

const accountJourneyVariants = {
  free: [
    {
      id: "package-overview",
      type: "text",
      target: {
        key: "account_package_panel",
        placement: "bottom",
        spotlight: true,
        inset: 12,
      },
      title: "Start with your package status",
      body:
        "This top panel gives you the quickest read on your current package, live status, and the key capability chips that describe what is available right now.",
      ctaLabel: "Next",
    },
    {
      id: "domain-locked",
      type: "text",
      target: {
        key: "account_custom_domain_card",
        placement: "top",
        spotlight: true,
        inset: 12,
      },
      title: "Review custom domain readiness here",
      body:
        "This lower panel explains the domain capability for your hub and makes it clear that Free hubs stay on their Hubforj-hosted address.",
      ctaLabel: "Next",
    },
    {
      id: "growth-path",
      type: "text",
      target: {
        key: "account_upgrade_growth_button",
        placement: "left",
        spotlight: true,
      },
      title: "Upgrade here when you need more",
      body:
        "When you are ready for built-in payments, reporting, custom domain, and branding removal, this is the action that moves you toward Growth.",
      ctaLabel: "Finish",
    },
  ],
  starter: [
    {
      id: "package-overview",
      type: "text",
      target: {
        key: "account_package_panel",
        placement: "bottom",
        spotlight: true,
        inset: 12,
      },
      title: "Start with your package status",
      body:
        "This top panel shows your Starter package, live status, and the capability chips that tell you what is active for this hub.",
      ctaLabel: "Next",
    },
    {
      id: "domain-locked",
      type: "text",
      target: {
        key: "account_custom_domain_card",
        placement: "top",
        spotlight: true,
        inset: 12,
      },
      title: "Review custom domain readiness here",
      body:
        "This lower panel explains that Starter can use external payment links today, while custom domain remains part of the Growth path.",
      ctaLabel: "Next",
    },
    {
      id: "growth-path",
      type: "text",
      target: {
        key: "account_upgrade_growth_button",
        placement: "left",
        spotlight: true,
      },
      title: "Upgrade here when you need Growth capabilities",
      body:
        "Use this action when you are ready to move from external links into built-in Stripe payments, reporting, branding removal, and custom domain support.",
      ctaLabel: "Finish",
    },
  ],
  growth: [
    {
      id: "package-overview",
      type: "text",
      target: {
        key: "account_package_panel",
        placement: "bottom",
        spotlight: true,
        inset: 12,
      },
      title: "Start with your package status",
      body:
        "This top panel gives you the quickest read on your Growth package, live status, and the capability chips available on this hub.",
      ctaLabel: "Next",
    },
    {
      id: "domain-overview",
      type: "text",
      target: {
        key: "account_custom_domain_card",
        placement: "top",
        spotlight: true,
        inset: 12,
      },
      title: "Review your custom domain area here",
      body:
        "This lower panel is where Growth hubs review their branded domain setup while still keeping the Hubforj-hosted address available underneath.",
      ctaLabel: "Next",
    },
    {
      id: "domain-action",
      type: "text",
      target: {
        key: "account_domain_setup_panel",
        placement: "top",
        spotlight: true,
      },
      title: "Use the domain action panel for setup or changes",
      body:
        "This area is where you connect, verify, update, or disconnect a custom domain depending on the hub’s current domain state.",
      ctaLabel: "Finish",
    },
  ],
};

const paymentsSetupJourneyVariants = {
  free: [
    {
      id: "locked-overview",
      type: "text",
      target: {
        key: "payments_setup_locked_root",
        placement: "bottom",
        spotlight: true,
        inset: 12,
      },
      title: "This route is a Growth payments overview",
      body:
        "On Free, built-in payments stay locked here. Use this screen to understand what Growth unlocks rather than expecting Stripe setup to start from this package.",
      ctaLabel: "Next",
    },
    {
      id: "locked-unlocks",
      type: "text",
      target: {
        key: "payments_setup_locked_unlocks",
        placement: "top",
        spotlight: true,
        inset: 12,
      },
      title: "Growth unlocks native payments in the hub",
      body:
        "This list summarises the built-in Stripe capabilities that only become available once the hub moves onto Growth.",
      ctaLabel: "Next",
    },
    {
      id: "plans-path",
      type: "text",
      target: {
        key: "payments_setup_locked_action",
        placement: "top",
        spotlight: true,
      },
      title: "Membership plans stay accessible separately",
      body:
        "Use this action to open membership plans. Free hubs can still review plan structure there even though native payments are not available on this route.",
      ctaLabel: "Finish",
    },
  ],
  starter: [
    {
      id: "locked-overview",
      type: "text",
      target: {
        key: "payments_setup_locked_root",
        placement: "bottom",
        spotlight: true,
        inset: 12,
      },
      title: "This route is reserved for built-in payments",
      body:
        "Starter can sell paid offerings with external payment links, but this setup route is specifically for the Stripe-powered payments that unlock on Growth.",
      ctaLabel: "Next",
    },
    {
      id: "locked-unlocks",
      type: "text",
      target: {
        key: "payments_setup_locked_unlocks",
        placement: "top",
        spotlight: true,
        inset: 12,
      },
      title: "Growth is where Stripe setup begins",
      body:
        "This area summarises the in-hub Stripe setup and reporting capabilities that become available once the hub moves from external payments into Growth.",
      ctaLabel: "Next",
    },
    {
      id: "plans-path",
      type: "text",
      target: {
        key: "payments_setup_locked_action",
        placement: "top",
        spotlight: true,
      },
      title: "Manage external-payment plans from here instead",
      body:
        "Use this action to open membership plans, where Starter hubs manage paid plans and external payment-link configuration.",
      ctaLabel: "Finish",
    },
  ],
  growth_not_configured: [
    {
      id: "setup-status",
      type: "text",
      target: {
        key: "payments_setup_hero_panel",
        placement: "bottom",
        spotlight: true,
        inset: 12,
      },
      title: "Start with the Stripe setup status",
      body:
        "This top panel shows the current readiness of built-in payments, including whether a connected account exists and which Stripe capabilities are still blocked.",
      ctaLabel: "Next",
    },
    {
      id: "setup-action",
      type: "text",
      target: {
        key: "payments_setup_guidance_panel",
        placement: "top",
        spotlight: true,
        inset: 12,
      },
      title: "Create the Stripe account from here",
      body:
        "Use this action panel to create the connected Stripe account first. Once it exists, the rest of Stripe onboarding can continue inside Hubforj.",
      ctaLabel: "Finish",
    },
  ],
  growth_ready: [
    {
      id: "setup-status",
      type: "text",
      target: {
        key: "payments_setup_hero_panel",
        placement: "bottom",
        spotlight: true,
        inset: 12,
      },
      title: "Review the live payments status here",
      body:
        "This top panel is the quickest way to confirm that Stripe is connected and native payments are ready for eligible Growth payment flows.",
      ctaLabel: "Finish",
    },
  ],
  growth_in_progress: [
    {
      id: "setup-status",
      type: "text",
      target: {
        key: "payments_setup_hero_panel",
        placement: "bottom",
        spotlight: true,
        inset: 12,
      },
      title: "Start with the Stripe setup status",
      body:
        "This top panel shows the current readiness of built-in payments, including account status, outstanding requirements, and which Stripe capabilities are still blocked.",
      ctaLabel: "Next",
    },
    {
      id: "setup-action",
      type: "text",
      target: {
        key: "payments_setup_guidance_panel",
        placement: "top",
        spotlight: true,
        inset: 12,
      },
      title: "Use this panel to continue setup",
      body:
        "This action panel tells you whether Stripe still needs more information and gives you the next step for refreshing or continuing the account state here.",
      ctaLabel: "Next",
    },
    {
      id: "embedded-onboarding",
      type: "text",
      target: {
        key: "payments_setup_embed_panel",
        placement: "top",
        spotlight: true,
        inset: 12,
      },
      title: "Complete Stripe onboarding inside Hubforj",
      body:
        "When a connected account already exists, this embedded panel is where you continue the remaining Stripe onboarding without leaving the admin portal.",
      ctaLabel: "Finish",
    },
  ],
};

const membershipPlansJourneyVariants = {
  free: [
    {
      id: "plans-create",
      type: "text",
      target: {
        key: "membership_plans_create_button",
        placement: "left",
        spotlight: true,
      },
      title: "Create and manage free membership plans here",
      body:
        "Use this action to add the membership structure your community needs. On Free, this workspace stays focused on baseline and free membership plan setup.",
      ctaLabel: "Next",
    },
    {
      id: "plans-workspace",
      type: "text",
      target: {
        key: "membership_plans_list",
        placement: "top",
        spotlight: true,
        inset: 12,
      },
      title: "This workspace becomes your plan management area",
      body:
        "Once plans exist, this is where you review the default plan, optional upgrades, and any future plan changes. Paid membership plans begin on Starter.",
      ctaLabel: "Finish",
    },
  ],
  starter: [
    {
      id: "plans-create",
      type: "text",
      target: {
        key: "membership_plans_create_button",
        placement: "left",
        spotlight: true,
      },
      title: "Create paid or free membership plans here",
      body:
        "Starter is where paid membership plans begin. Use this action to add free or paid upgrade plans for members once your structure is ready.",
      ctaLabel: "Next",
    },
    {
      id: "plans-workspace",
      type: "text",
      target: {
        key: "membership_plans_list",
        placement: "top",
        spotlight: true,
        inset: 12,
      },
      title: "Manage plan visibility, pricing, and upgrades here",
      body:
        "This workspace is where you control which plans are public, which stay admin-only, and how Starter paid plans use external payment links or payment instructions.",
      ctaLabel: "Finish",
    },
  ],
  growth: [
    {
      id: "plans-create",
      type: "text",
      target: {
        key: "membership_plans_create_button",
        placement: "left",
        spotlight: true,
      },
      title: "Create membership plans from here",
      body:
        "Use this action to add the default and upgrade plans your community needs, including paid plans that can participate in Growth’s native payments model where eligible.",
      ctaLabel: "Next",
    },
    {
      id: "plans-workspace",
      type: "text",
      target: {
        key: "membership_plans_list",
        placement: "top",
        spotlight: true,
        inset: 12,
      },
      title: "This is the operational hub for membership plans",
      body:
        "Once plans exist, this area becomes the place to manage visibility, pricing, upgrade options, and any member-initiated upgrade work that follows.",
      ctaLabel: "Finish",
    },
  ],
};

const adminsJourneyVariants = {
  manager: [
    {
      id: "admins-invite",
      type: "text",
      target: {
        key: "admins_invite_button",
        placement: "left",
        spotlight: true,
      },
      title: "Invite additional admins from here",
      body:
        "Use this action when you want to give another person admin access to the hub. Invitations flow through the access management area on this page.",
      ctaLabel: "Next",
    },
    {
      id: "admins-active",
      type: "text",
      target: {
        key: "admins_active_list",
        placement: "top",
        spotlight: true,
        inset: 12,
      },
      title: "Review active admin access here",
      body:
        "This list shows who already has admin access, their role, and the actions available for suspension, reactivation, or ownership transfer.",
      ctaLabel: "Next",
    },
    {
      id: "admins-pending",
      type: "text",
      target: {
        key: "admins_pending_list",
        placement: "top",
        spotlight: true,
        inset: 12,
      },
      title: "Keep pending invites visible here",
      body:
        "Pending or expired admin invites stay in this section until they are accepted, resent, or revoked, so access changes do not get lost in the workflow.",
      ctaLabel: "Finish",
    },
  ],
  viewer: [
    {
      id: "admins-active",
      type: "text",
      target: {
        key: "admins_active_list",
        placement: "top",
        spotlight: true,
        inset: 12,
      },
      title: "Review current admin access here",
      body:
        "This route shows who currently has admin access to the hub and the status of that access, even when you are not the person managing invitations yourself.",
      ctaLabel: "Next",
    },
    {
      id: "admins-pending",
      type: "text",
      target: {
        key: "admins_pending_list",
        placement: "top",
        spotlight: true,
        inset: 12,
      },
      title: "Pending invites remain visible here",
      body:
        "If invites are awaiting action, they stay in this section so the current access picture remains clear even without direct management controls.",
      ctaLabel: "Finish",
    },
  ],
};

export function resolveAdminOnboardingJourneyDefinition(journeyKey, context = {}) {
  const journey = adminOnboardingJourneys[journeyKey];
  if (!journey) {
    return null;
  }

  if (journeyKey !== "settings_account" && journeyKey !== "payments_setup" && journeyKey !== "membership_plans" && journeyKey !== "admins") {
    return journey;
  }

  const packageTier = String(context?.packageTier || "starter").trim() || "starter";

  if (journeyKey === "settings_account") {
    const steps = accountJourneyVariants[packageTier] || accountJourneyVariants.starter;

    return {
      ...journey,
      steps,
    };
  }

  if (journeyKey === "membership_plans") {
    const steps = membershipPlansJourneyVariants[packageTier] || membershipPlansJourneyVariants.starter;

    return {
      ...journey,
      steps,
    };
  }

  if (journeyKey === "admins") {
    const variantKey = String(context?.actorRole || "").trim() === "owner" ? "manager" : "viewer";
    const steps = adminsJourneyVariants[variantKey] || adminsJourneyVariants.viewer;

    return {
      ...journey,
      steps,
    };
  }

  const paymentSetupStateKey = String(context?.paymentSetupStateKey || "").trim();
  const paymentSetupHasConnectedAccount = context?.paymentSetupHasConnectedAccount === true;
  let variantKey = packageTier;

  if (packageTier === "growth") {
    if (paymentSetupStateKey === "ready") {
      variantKey = "growth_ready";
    } else if (paymentSetupStateKey === "not_configured" || !paymentSetupHasConnectedAccount) {
      variantKey = "growth_not_configured";
    } else {
      variantKey = "growth_in_progress";
    }
  }

  const steps = paymentsSetupJourneyVariants[variantKey] || paymentsSetupJourneyVariants.starter;

  return {
    ...journey,
    steps,
  };
}
