const root = globalThis;

if (!root.__communityAppMemoryDb) {
  root.__communityAppMemoryDb = {
    users: new Map(),
    hubs: new Map(),
    invites: new Map(),
    events: new Map(),
    media: new Map(),
    mediaFolders: new Map(),
    registrations: new Map(),
    membershipPlans: new Map(),
    memberships: new Map(),
    pages: new Map(),
  };

  const demoHub = {
    id: "hub_demo",
    name: "Demo Hub",
    slug: "demo-hub",
    templateKey: "templateA",
    tokenOverrides: {},
    globalHeaderId: "standard",
    globalFooterId: "simple",
    features: {
      cmsPages: false,
      stripePayments: false,
      emailNotifications: false,
    },
    customDomains: [],
    themeRevision: 1,
    themeCssPath: "hubs/hub_demo/theme/theme-overrides.css",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  root.__communityAppMemoryDb.hubs.set(demoHub.id, demoHub);
  root.__communityAppMemoryDb.invites.set(demoHub.id, []);
  root.__communityAppMemoryDb.users.set("member_1", {
    id: "member_1",
    uid: "member_1",
    hubId: demoHub.id,
    role: "member",
    email: "member1@example.com",
    name: "Member One",
    avatarMediaId: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  root.__communityAppMemoryDb.users.set("member_2", {
    id: "member_2",
    uid: "member_2",
    hubId: demoHub.id,
    role: "member",
    email: "member2@example.com",
    name: "Member Two",
    avatarMediaId: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  root.__communityAppMemoryDb.users.set("member_3", {
    id: "member_3",
    uid: "member_3",
    hubId: demoHub.id,
    role: "member",
    email: "member3@example.com",
    name: "Member Three",
    avatarMediaId: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  const demoEventId = "event_demo_kickoff";
  root.__communityAppMemoryDb.events.set(demoHub.id, [
    {
      id: demoEventId,
      hubId: demoHub.id,
      slug: "community-kickoff",
      status: "published",
      title: "Community Kickoff",
      description: "Demo event for admin registrations workflows.",
      imageMediaIds: [],
      startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
      location: "Main Hall",
      capacity: 2,
      category: "Meetup",
      tags: ["demo"],
      pricingMode: "paid",
      price: 25,
      registrationEligibility: "members-only",
      visibility: "public",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "seed",
      updatedBy: "seed",
      registrationCount: 2,
    },
  ]);
  root.__communityAppMemoryDb.registrations.set(`${demoHub.id}:${demoEventId}`, [
    {
      id: "reg_demo_1",
      hubId: demoHub.id,
      eventId: demoEventId,
      userId: "member_1",
      status: "registered",
      paymentStatus: "paid",
      attendanceStatus: "unknown",
      notes: "Vegetarian meal",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "reg_demo_2",
      hubId: demoHub.id,
      eventId: demoEventId,
      userId: "member_2",
      status: "registered",
      paymentStatus: "unpaid",
      attendanceStatus: "unknown",
      notes: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "reg_demo_3",
      hubId: demoHub.id,
      eventId: demoEventId,
      userId: "member_3",
      status: "waitlisted",
      paymentStatus: "unpaid",
      attendanceStatus: "unknown",
      notes: "Needs parking info",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);
  root.__communityAppMemoryDb.mediaFolders.set(demoHub.id, [
    {
      id: "all-assets",
      hubId: demoHub.id,
      name: "All assets",
      system: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "folder_demo_marketing",
      hubId: demoHub.id,
      name: "Marketing",
      system: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);
  root.__communityAppMemoryDb.media.set(demoHub.id, [
    {
      id: "media_demo_hero",
      hubId: demoHub.id,
      filename: "hero.jpg",
      type: "image",
      publicUrl: "/next.svg",
      folderId: "folder_demo_marketing",
      alt: "Community hero banner",
      usageRefs: [
        {
          kind: "pageBlock",
          label: "About Our Community",
          pageId: "page_demo_about",
          pageSlug: "about",
        },
      ],
      usageCount: 1,
      createdAt: new Date().toISOString(),
    },
    {
      id: "media_demo_poster",
      hubId: demoHub.id,
      filename: "workshop-poster.png",
      type: "image",
      publicUrl: "/vercel.svg",
      folderId: "all-assets",
      alt: "Workshop promotional poster",
      usageCount: 0,
      createdAt: new Date().toISOString(),
    },
  ]);
  root.__communityAppMemoryDb.membershipPlans.set(demoHub.id, [
    {
      id: "plan_demo_monthly",
      hubId: demoHub.id,
      title: "Monthly Membership",
      description: "Access to members-only events and resources.",
      durationUnit: "months",
      durationValue: 1,
      price: 30,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "plan_demo_annual",
      hubId: demoHub.id,
      title: "Annual Membership",
      description: "Best value for long-term community members.",
      durationUnit: "years",
      durationValue: 1,
      price: 300,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);
  root.__communityAppMemoryDb.memberships.set(demoHub.id, [
    {
      id: "membership_demo_1",
      hubId: demoHub.id,
      userId: "member_1",
      planId: "plan_demo_monthly",
      status: "pending",
      paymentStatus: "unpaid",
      startDate: new Date().toISOString(),
      renewalDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
      notes: "Awaiting offline payment confirmation",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "membership_demo_2",
      hubId: demoHub.id,
      userId: "member_2",
      planId: "plan_demo_annual",
      status: "active",
      paymentStatus: "paid",
      startDate: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
      renewalDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      notes: "Will appear as expired when grace window is exceeded",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);
  root.__communityAppMemoryDb.pages.set(demoHub.id, [
    {
      id: "page_demo_about",
      hubId: demoHub.id,
      title: "About Our Community",
      slug: "about",
      status: "published",
      draftComposition: [
        {
          id: "blk_demo_hero",
          type: "HeroSection",
          variant: "centered",
          label: "Hero",
          props: {
            heading: "Welcome to Demo Hub",
            subheading: "A place to learn, build, and connect.",
            ctaText: "Join now",
            ctaHref: "/join",
            imageMediaId: "media_demo_hero",
          },
        },
      ],
      publishedComposition: [
        {
          id: "blk_demo_hero",
          type: "HeroSection",
          variant: "centered",
          label: "Hero",
          props: {
            heading: "Welcome to Demo Hub",
            subheading: "A place to learn, build, and connect.",
            ctaText: "Join now",
            ctaHref: "/join",
            imageMediaId: "media_demo_hero",
          },
        },
      ],
      seo: {
        title: "About Demo Hub",
        description: "Learn more about our mission and programs.",
        imageMediaId: "media_demo_hero",
      },
      headerIdOverride: "",
      footerIdOverride: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
    },
  ]);
}

export function getMemoryDb() {
  if (!root.__communityAppMemoryDb.users) {
    root.__communityAppMemoryDb.users = new Map();
  }
  if (!root.__communityAppMemoryDb.mediaFolders) {
    root.__communityAppMemoryDb.mediaFolders = new Map();
  }
  if (!root.__communityAppMemoryDb.pages) {
    root.__communityAppMemoryDb.pages = new Map();
  }
  return root.__communityAppMemoryDb;
}
