import { Suspense } from "react";
import Badge from "@/components/ui/badge/Badge";
import StatCard from "@/components/ui/stat-card/StatCard";
import FormMessage from "@/components/ui/form-message/FormMessage";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import AdminOnboardingChecklist from "@/components/patterns/admin-onboarding/AdminOnboardingChecklist";
import { getCurrentHubOperatorAccess } from "@/lib/auth/hub-access";
import {
  getHubAdminDashboardDeferredOverviewBySlug,
  getHubAdminDashboardSummaryBySlug,
} from "@/lib/data/hub-admin";
import { getRequestHostFromHeaders, resolveHubRuntimeRouteMode } from "@/lib/domain/hub-hosts";
import { buildHubRuntimeHref } from "@/lib/domain/hub-runtime-paths";
import { isHubRegionalSetupComplete } from "@/lib/domain/hub-regional-setup";
import { getLegalSettingsByHubId } from "@/lib/legal/legalRepository";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardAttentionPanel from "./DashboardAttentionPanel";
import DashboardMembersPanel from "./DashboardMembersPanel";
import DashboardPanel from "./DashboardPanel";
import DashboardSection from "./DashboardSection";
import styles from "./page.module.css";

function joinClassNames(...values) {
  return values.filter(Boolean).join(" ");
}

function buildAdminHref(hubSlug, pathname, routeMode) {
  return buildHubRuntimeHref(hubSlug, pathname, routeMode);
}

function buildOwnerLegalAttentionItems(hub, legalSettings, routeMode = "path") {
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
        href: buildAdminHref(hub.slug, "/admin/settings/legal", routeMode),
      };
    }

    if (item.key === "privacy_missing") {
      return {
        id: "legal-privacy-missing",
        label: "Complete Privacy Policy",
        count: 1,
        href: buildAdminHref(hub.slug, "/admin/settings/legal", routeMode),
      };
    }

    if (item.key === "terms_review_required") {
      return {
        id: "legal-terms-review",
        label: "Review Terms of Service changes",
        count: Math.max(1, Array.isArray(reviewTargets.terms) ? reviewTargets.terms.length : 0),
        href: buildAdminHref(hub.slug, "/admin/settings/legal", routeMode),
      };
    }

    if (item.key === "privacy_review_required") {
      return {
        id: "legal-privacy-review",
        label: "Review Privacy Policy changes",
        count: Math.max(1, Array.isArray(reviewTargets.privacy) ? reviewTargets.privacy.length : 0),
        href: buildAdminHref(hub.slug, "/admin/settings/legal", routeMode),
      };
    }

    return null;
  }).filter(Boolean);
}

function DashboardLoadingSection({ title }) {
  return (
    <DashboardSection title={title}>
      <div className={styles.panelLoading}>
        <span className={styles.loadingLine} />
        <span className={styles.loadingLine} />
        <span className={styles.loadingLineShort} />
      </div>
    </DashboardSection>
  );
}

function DashboardPanelsFallback({ coursesEnabled }) {
  return (
    <>
      <div
        className={joinClassNames(
          styles.panels,
          coursesEnabled ? "" : styles.panelsSingle
        )}
      >
        <DashboardLoadingSection title="Recent Events" />
        {coursesEnabled ? <DashboardLoadingSection title="Top Courses" /> : null}
      </div>
      <div className={styles.panels}>
        <DashboardLoadingSection title="Attention required" />
        <DashboardLoadingSection title="Newest members" />
      </div>
    </>
  );
}

async function DashboardRevenueCard({ overviewPromise }) {
  const overview = await overviewPromise;
  const totalRevenue = overview?.totalRevenue || {
    formatted: "£0.00",
    isMixedCurrency: false,
  };

  return (
    <StatCard
      label="Revenue"
      value={totalRevenue.formatted}
      detail={
        totalRevenue.isMixedCurrency
          ? "Net native payments recorded across multiple currencies."
          : "Net native payments recorded after refunds."
      }
    />
  );
}

async function DashboardCoursesCard({ overviewPromise }) {
  const overview = await overviewPromise;

  return (
    <StatCard
      label="Courses"
      value={overview ? String(overview.activeUpcomingPublishedCourseCount) : "0"}
      detail="Published upcoming courses currently open."
    />
  );
}

async function DashboardDeferredPanels({ hubSlug, routeMode, overviewPromise }) {
  const overview = await overviewPromise;
  const hub = overview?.hub || null;
  const packageInfo = overview?.package || null;
  const access = hub ? await getCurrentHubOperatorAccess(hub) : null;
  const legalSettings =
    hub && access?.actorRole === "owner" && access?.mode === "admin"
      ? await getLegalSettingsByHubId(hub.id)
      : null;
  const attentionItems = [
    ...(overview?.attentionItems || []),
    ...buildOwnerLegalAttentionItems(hub, legalSettings, routeMode),
  ];

  return (
    <>
      <div
        className={joinClassNames(
          styles.panels,
          packageInfo?.capabilities?.coursesEnabled ? "" : styles.panelsSingle
        )}
      >
        <DashboardPanel
          title="Recent Events"
          href={buildAdminHref(hubSlug, "/admin/events", routeMode)}
          items={overview?.recentEvents || []}
          kind="event"
        />
        {packageInfo?.capabilities?.coursesEnabled ? (
          <DashboardPanel
            title="Top Courses"
            href={buildAdminHref(hubSlug, "/admin/courses", routeMode)}
            items={overview?.topCourses || []}
            kind="course"
          />
        ) : null}
      </div>
      <div className={styles.panels}>
        <DashboardAttentionPanel items={attentionItems} />
        <DashboardMembersPanel items={overview?.newestMembers || []} />
      </div>
    </>
  );
}

export default async function HubAdminPage({ params, searchParams }) {
  const { hubSlug } = await params;
  const { success = "" } = await searchParams;
  const headerStore = await headers();
  const routeMode = resolveHubRuntimeRouteMode(getRequestHostFromHeaders(headerStore));
  const summary = await getHubAdminDashboardSummaryBySlug(hubSlug);
  const hub = summary?.hub || null;

  if (hub && !isHubRegionalSetupComplete(hub)) {
    redirect(buildAdminHref(hub.slug, "/admin/onboarding", routeMode));
  }

  const packageInfo = summary?.package || null;
  const deferredOverviewPromise = hub
    ? getHubAdminDashboardDeferredOverviewBySlug(hubSlug, { routeMode })
    : Promise.resolve(null);
  const activeMembersLimit = packageInfo?.limits?.activeMembers;
  const activeUpcomingEventsLimit = packageInfo?.limits?.activeUpcomingEvents;
  const isStarterOrGrowth = packageInfo?.packageTier === "starter" || packageInfo?.packageTier === "growth";
  const cards = isStarterOrGrowth
    ? [
        {
          label: "Members",
          value: hub ? String(summary.memberCount) : "0",
          detail: "Total members with access to this hub.",
        },
        {
          label: "Events",
          value: hub ? String(summary.activeUpcomingPublishedEventCount) : "0",
          detail: "Published upcoming events currently live.",
        },
      ]
    : [
        {
          label: "Active members",
          value: hub
            ? Number.isFinite(activeMembersLimit)
              ? `${summary.activeMemberCount}/${activeMembersLimit}`
              : String(summary.activeMemberCount)
            : "0",
          detail: Number.isFinite(activeMembersLimit)
            ? "Current usage against your active-member package limit."
            : "Active members available on this package.",
        },
        {
          label: "Upcoming events",
          value: hub
            ? Number.isFinite(activeUpcomingEventsLimit)
              ? `${summary.activeUpcomingPublishedEventCount}/${activeUpcomingEventsLimit}`
              : String(summary.activeUpcomingPublishedEventCount)
            : "0",
          detail: Number.isFinite(activeUpcomingEventsLimit)
            ? "Published upcoming event usage against your package limit."
            : "Published upcoming events available on this package.",
        },
        {
          label: "Pending invites",
          value: hub ? String(summary.pendingInviteCount) : "0",
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
        {isStarterOrGrowth ? (
          <>
            <Suspense fallback={<StatCard label="Courses" value="Loading" detail="Published upcoming courses currently open." />}>
              <DashboardCoursesCard overviewPromise={deferredOverviewPromise} />
            </Suspense>
            <Suspense fallback={<StatCard label="Revenue" value="Loading" detail="Net native payments recorded after refunds." />}>
              <DashboardRevenueCard overviewPromise={deferredOverviewPromise} />
            </Suspense>
          </>
        ) : null}
      </div>
      <Suspense fallback={<DashboardPanelsFallback coursesEnabled={packageInfo?.capabilities?.coursesEnabled} />}>
        <DashboardDeferredPanels hubSlug={hubSlug} routeMode={routeMode} overviewPromise={deferredOverviewPromise} />
      </Suspense>
    </div>
  );
}
