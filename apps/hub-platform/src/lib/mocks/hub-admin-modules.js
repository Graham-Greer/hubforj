export function getHubAdminModuleDefinitions(hubSlug) {
  const base = `/${hubSlug}/admin`;

  return {
    admins: {
      eyebrow: "Admins",
      title: `${hubSlug} admin access`,
      description:
        "Admin access should be explicit, auditable, and easy to reason about. This module is where invites, roles, and access status belong.",
      stats: [
        { label: "Active admins", value: "0", detail: "Confirmed operators with access." },
        { label: "Pending invites", value: "0", detail: "Outstanding admin invitations." },
        { label: "Support access", value: "Controlled", detail: "Support mode remains explicit." },
      ],
      emptyState: {
        eyebrow: "No admins yet",
        title: "Invite the first admin",
        description:
          "The real version of this module should handle invite lifecycle, role boundaries, and deterministic access history without turning account management into noise.",
        primaryAction: { href: base, label: "Back to overview" },
        secondaryAction: { href: `${base}/members`, label: "View members" },
      },
    },
    events: {
      eyebrow: "Events",
      title: `${hubSlug} events operations`,
      description:
        "Events should be managed through a lifecycle-focused workspace covering scheduling, pricing, registrations, capacity, and attendance.",
      stats: [
        { label: "Upcoming", value: "0", detail: "Scheduled future events." },
        { label: "Drafts", value: "0", detail: "Unpublished event records." },
        { label: "Attendance issues", value: "0", detail: "Events needing operator follow-up." },
      ],
      emptyState: {
        eyebrow: "No events yet",
        title: "Create the first event workflow",
        description:
          "This module should help admins move cleanly from event setup to registrations and attendance, without forcing them across disconnected screens.",
        primaryAction: { href: base, label: "Back to overview" },
        secondaryAction: { href: `${base}/courses`, label: "View courses" },
      },
    },
    courses: {
      eyebrow: "Courses",
      title: `${hubSlug} course operations`,
      description:
        "Courses should support structured delivery, capacity, registrations, and progress-aware administration without becoming an events clone.",
      stats: [
        { label: "Active courses", value: "0", detail: "Currently available course offerings." },
        { label: "Drafts", value: "0", detail: "Course records still being prepared." },
        { label: "Registrations", value: "0", detail: "Course signups and enrollment state." },
      ],
      emptyState: {
        eyebrow: "No courses yet",
        title: "Plan the first course flow",
        description:
          "The full course module should handle sessions, enrolment, payment state, and completion-oriented administration with low mental overhead.",
        primaryAction: { href: base, label: "Back to overview" },
        secondaryAction: { href: `${base}/events`, label: "View events" },
      },
    },
    testimonials: {
      eyebrow: "Testimonials",
      title: `${hubSlug} testimonials`,
      description:
        "Testimonials should be a structured content bridge between admin operations and the public site, not a generic CMS entry point.",
      stats: [
        { label: "Published", value: "0", detail: "Visible to the public site." },
        { label: "Drafts", value: "0", detail: "Awaiting review or approval." },
        { label: "Featured", value: "0", detail: "Prioritized for highlighted surfaces." },
      ],
      emptyState: {
        eyebrow: "No testimonials yet",
        title: "Create the first testimonial workflow",
        description:
          "This module should support capture, review, publishing, and selective use across public site sections without needing a page builder.",
        primaryAction: { href: base, label: "Back to overview" },
        secondaryAction: { href: `/${hubSlug}`, label: "View public site" },
      },
    },
    payments: {
      eyebrow: "Payments",
      title: `${hubSlug} payments`,
      description:
        "Payments should be explicit and traceable across events, courses, and memberships. Admins need status clarity before they need deep reporting.",
      stats: [
        { label: "Pending", value: "0", detail: "Transactions still awaiting confirmation." },
        { label: "Collected", value: "0", detail: "Settled records for the current period." },
        { label: "Exceptions", value: "0", detail: "Items requiring follow-up." },
      ],
      emptyState: {
        eyebrow: "No payments yet",
        title: "Connect payment workflows to operations",
        description:
          "This module should centralize operational payment state while keeping event and course flows understandable for admins.",
        primaryAction: { href: base, label: "Back to overview" },
        secondaryAction: { href: `${base}/members`, label: "View members" },
      },
    },
    settings: {
      eyebrow: "Settings",
      title: `${hubSlug} settings`,
      description:
        "Settings should be organized around branding, domain, contact, social, and operational defaults. This surface should feel methodical, not sprawling.",
      stats: [
        { label: "Theme mode", value: "Light", detail: "Theme defaults are token-driven." },
        { label: "Template", value: "Civic", detail: "Template family remains a controlled choice." },
        { label: "Domain", value: "Pending", detail: "Public domain configuration follows provisioning." },
      ],
      emptyState: {
        eyebrow: "Settings foundation",
        title: "Organize configuration into focused panels",
        description:
          "The full version should separate branding, domain, contact details, and operational defaults into clear panels with minimal cross-talk.",
        primaryAction: { href: base, label: "Back to overview" },
        secondaryAction: { href: `/${hubSlug}`, label: "View public site" },
      },
    },
  };
}
