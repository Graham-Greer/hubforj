import Badge from "@/components/ui/badge/Badge";
import StatCard from "@/components/ui/stat-card/StatCard";
import FormMessage from "@/components/ui/form-message/FormMessage";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import AdminOnboardingChecklist from "@/components/patterns/admin-onboarding/AdminOnboardingChecklist";
import { getCurrentHubOperatorAccess } from "@/lib/auth/hub-access";
import { getHubAdminOverviewBySlug } from "@/lib/data/hub-admin";
import { getHubRegionalOnboardingHref, isHubRegionalSetupComplete } from "@/lib/domain/hub-regional-setup";
import { getLegalSettingsByHubId } from "@/lib/legal/legalRepository";
import { redirect } from "next/navigation";
import DashboardAttentionPanel from "./DashboardAttentionPanel";
import DashboardMembersPanel from "./DashboardMembersPanel";
import DashboardPanel from "./DashboardPanel";
import styles from "./page.module.css";

function joinClassNames(...values) {
  return values.filter(Boolean).join(" ");
}

function buildOwnerLegalAttentionItems(hub, legalSettings) {
  if (!hub || !legalSettings?.legalStatus) {
    return [];
  }

  const reviewTargets = legalSettings.legalStatus.reviewTargets || {};

  return (legalSettings.legalStatus.attentionItems || []).map((item) => {
    if (item.key === "terms_missing") {
      return {
        id: "legal-terms-missing",
        label: "Complete Terms of Service",
        count: 1,
        href: `/${hub.slug}/admin/settings/legal`,
      };
    }

    if (item.key === "privacy_missing") {
      return {
        id: "legal-privacy-missing",
        label: "Complete Privacy Policy",
        count: 1,
        href: `/${hub.slug}/admin/settings/legal`,
      };
    }

    if (item.key === "terms_review_required") {
      return {
        id: "legal-terms-review",
        label: "Review Terms of Service changes",
        count: Math.max(1, Array.isArray(reviewTargets.terms) ? reviewTargets.terms.length : 0),
        href: `/${hub.slug}/admin/settings/legal`,
      };
    }

    if (item.key === "privacy_review_required") {
      return {
        id: "legal-privacy-review",
        label: "Review Privacy Policy changes",
        count: Math.max(1, Array.isArray(reviewTargets.privacy) ? reviewTargets.privacy.length : 0),
        href: `/${hub.slug}/admin/settings/legal`,
      };
    }

    return null;
  }).filter(Boolean);
}

export default async function HubAdminPage({ params, searchParams }) {
  const { hubSlug } = await params;
  const { success = "" } = await searchParams;
  const overview = await getHubAdminOverviewBySlug(hubSlug);
  const hub = overview?.hub || null;

  if (hub && !isHubRegionalSetupComplete(hub)) {
    redirect(getHubRegionalOnboardingHref(hub));
  }

  const access = hub ? await getCurrentHubOperatorAccess(hub) : null;
  const legalSettings =
    hub && access?.actorRole === "owner" && access?.mode === "admin"
      ? await getLegalSettingsByHubId(hub.id)
      : null;
  const attentionItems = [
    ...(overview?.attentionItems || []),
    ...buildOwnerLegalAttentionItems(hub, legalSettings),
  ];
  const packageInfo = overview?.package || null;
  const activeMembersLimit = packageInfo?.limits?.activeMembers;
  const activeUpcomingEventsLimit = packageInfo?.limits?.activeUpcomingEvents;
  const isStarterOrGrowth = packageInfo?.packageTier === "starter" || packageInfo?.packageTier === "growth";
  const cards = isStarterOrGrowth
    ? [
        {
          label: "Members",
          value: hub ? String(overview.memberCount) : "0",
          detail: "Total members with access to this hub.",
        },
        {
          label: "Events",
          value: hub ? String(overview.activeUpcomingPublishedEventCount) : "0",
          detail: "Published upcoming events currently live.",
        },
        {
          label: "Courses",
          value: hub ? String(overview.activeUpcomingPublishedCourseCount) : "0",
          detail: "Published upcoming courses currently open.",
        },
        {
          label: "Revenue",
          value: hub ? overview.totalRevenue.formatted : "£0.00",
          detail: overview.totalRevenue.isMixedCurrency
            ? "Net native payments recorded across multiple currencies."
            : "Net native payments recorded after refunds.",
        },
      ]
    : [
        {
          label: "Active members",
          value: hub
            ? Number.isFinite(activeMembersLimit)
              ? `${overview.activeMemberCount}/${activeMembersLimit}`
              : String(overview.activeMemberCount)
            : "0",
          detail: Number.isFinite(activeMembersLimit)
            ? "Current usage against your active-member package limit."
            : "Active members available on this package.",
        },
        {
          label: "Upcoming events",
          value: hub
            ? Number.isFinite(activeUpcomingEventsLimit)
              ? `${overview.activeUpcomingPublishedEventCount}/${activeUpcomingEventsLimit}`
              : String(overview.activeUpcomingPublishedEventCount)
            : "0",
          detail: Number.isFinite(activeUpcomingEventsLimit)
            ? "Published upcoming event usage against your package limit."
            : "Published upcoming events available on this package.",
        },
        {
          label: "Pending invites",
          value: hub ? String(overview.pendingInviteCount) : "0",
          detail: "Admin access remains explicit and traceable.",
        },
      ];

  return (
    <div className={styles.layout}>
      {success === "inviteAccepted" ? <FormMessage tone="success">Admin onboarding complete. You now have active access to this hub.</FormMessage> : null}
      <PageHeader
        eyebrow="Overview"
        title={hub?.name || "Hub overview"}
        description="Use this overview to orient yourself quickly and move into the next operational task."
      />
      <AdminOnboardingChecklist />
      {packageInfo ? (
        <div className={styles.packageBar}>
          <div className={styles.packageIdentity}>
            <Badge tone="accent">{packageInfo.packageTierLabel}</Badge>
            <Badge
              tone={
                packageInfo.packageStatus === "active"
                  ? "success"
                  : packageInfo.packageStatus === "trialing"
                    ? "warning"
                    : "danger"
              }
            >
              {packageInfo.packageStatusLabel}
            </Badge>
          </div>
        </div>
      ) : null}
      <div className={styles.summary}>
        {cards.map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} detail={card.detail} />
        ))}
      </div>
      <div
        className={joinClassNames(
          styles.panels,
          packageInfo?.capabilities?.coursesEnabled ? "" : styles.panelsSingle
        )}
      >
        <DashboardPanel
          title="Recent Events"
          href={`/${hubSlug}/admin/events`}
          items={overview.recentEvents}
          kind="event"
        />
        {packageInfo?.capabilities?.coursesEnabled ? (
          <DashboardPanel
            title="Top Courses"
            href={`/${hubSlug}/admin/courses`}
            items={overview.topCourses}
            kind="course"
          />
        ) : null}
      </div>
      <div className={styles.panels}>
        <DashboardAttentionPanel items={attentionItems} />
        <DashboardMembersPanel items={overview.newestMembers} />
      </div>
    </div>
  );
}
