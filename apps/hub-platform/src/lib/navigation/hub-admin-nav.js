import { resolveHubPackageEntitlements } from "@/lib/domain/hub-package";
import {
  getHubRegionalOnboardingHref,
  isHubRegionalSetupComplete,
} from "@/lib/domain/hub-regional-setup";

export function getHubAdminNavGroups(hubOrSlug) {
  const hub = typeof hubOrSlug === "object" && hubOrSlug !== null ? hubOrSlug : { slug: hubOrSlug };
  const base = `/${hub.slug}/admin`;
  const entitlements = resolveHubPackageEntitlements(hub);
  const regionalSetupComplete = isHubRegionalSetupComplete(hub);
  const regionalOnboardingHref = getHubRegionalOnboardingHref(hub);

  return [
    !regionalSetupComplete
      ? {
          title: "Launch setup",
          items: [
            {
              href: regionalOnboardingHref,
              label: "Regional setup",
              shortLabel: "RG",
              iconName: "public",
              onboardingKey: "nav-regional-setup",
            },
          ],
        }
      : null,
    {
      title: "Overview",
      items: [
        { href: base, label: "Overview", shortLabel: "OV", iconName: "space_dashboard", onboardingKey: "nav-overview" },
      ],
    },
    {
      title: "People",
      items: [
        { href: `${base}/admins`, label: "Admins", shortLabel: "AD", iconName: "admin_panel_settings", onboardingKey: "nav-admins" },
        { href: `${base}/members`, label: "Members", shortLabel: "MB", iconName: "groups", onboardingKey: "nav-members" },
      ],
    },
    {
      title: "Programmes",
      items: [
        {
          href: `${base}/events`,
          label: "Events",
          shortLabel: "EV",
          iconName: "event",
          locked: !regionalSetupComplete,
          onboardingKey: "nav-events",
        },
        {
          href: `${base}/courses`,
          label: "Courses",
          shortLabel: "CR",
          iconName: "school",
          locked: !regionalSetupComplete || !entitlements.capabilities.coursesEnabled,
          onboardingKey: "nav-courses",
        },
      ],
    },
    {
      title: "Content",
      items: [
        { href: `${base}/media`, label: "Media", shortLabel: "MD", iconName: "perm_media", onboardingKey: "nav-media" },
        { href: `${base}/what-we-do`, label: "What we do", shortLabel: "WD", iconName: "view_module", onboardingKey: "nav-what-we-do" },
        { href: `${base}/testimonials`, label: "Testimonials", shortLabel: "TS", iconName: "format_quote", onboardingKey: "nav-testimonials" },
      ],
    },
    {
      title: "Finance",
      items: [
        {
          href: `${base}/payments?view=setup`,
          label: "Stripe setup",
          shortLabel: "ST",
          iconName: "account_balance",
          queryKey: "view",
          queryValue: "setup",
          locked: !regionalSetupComplete || !entitlements.capabilities.paymentsEnabled,
          onboardingKey: "nav-stripe-setup",
        },
        {
          href: `${base}/payments?view=payments`,
          label: "Payments",
          shortLabel: "PM",
          iconName: "payments",
          queryKey: "view",
          queryValue: "payments",
          locked: !regionalSetupComplete || !entitlements.capabilities.paymentsEnabled,
          onboardingKey: "nav-payments",
        },
        {
          href: `${base}/payments?view=plans`,
          label: "Membership plans",
          shortLabel: "PP",
          iconName: "credit_card",
          queryKey: "view",
          queryValue: "plans",
          locked: !regionalSetupComplete,
          onboardingKey: "nav-membership-plans",
        },
      ],
    },
    {
      title: "Settings",
      items: [
        {
          href: `${base}/settings`,
          label: "Site settings",
          shortLabel: "SS",
          iconName: "settings",
          exactMatch: true,
          activeMatchPrefixes: [`${base}/settings/branding`, `${base}/settings/site`],
          onboardingKey: "nav-site-settings",
        },
        { href: `${base}/settings/pages`, label: "Page settings", shortLabel: "PS", iconName: "web", onboardingKey: "nav-page-settings" },
        { href: `${base}/settings/legal`, label: "Legal pages", shortLabel: "LG", iconName: "gavel", onboardingKey: "nav-legal-pages" },
        { href: `${base}/settings/account`, label: "Account settings", shortLabel: "AS", iconName: "manage_accounts", onboardingKey: "nav-account-settings" },
      ],
    },
  ].filter((group) => group && group.items.length > 0);
}
