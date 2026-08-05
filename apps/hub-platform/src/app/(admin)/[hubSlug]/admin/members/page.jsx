import { Suspense } from "react";
import EmptyState from "@/components/patterns/empty-state/EmptyState";
import MembersWorkspace from "@/components/patterns/members-workspace/MembersWorkspace";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import Surface from "@/components/primitives/surface/Surface";
import SubmitButton from "@/components/ui/submit-button/SubmitButton";
import {
  SkeletonButtonRow,
  SkeletonList,
  SkeletonMetricGrid,
} from "@/components/patterns/loading-skeleton";
import { getCurrentHubOperatorAccess } from "@/lib/auth/hub-access";
import { listCourseRegistrationPaymentAttentionUserIdsByHub } from "@/lib/data/course-registrations";
import { listEventBookingPaymentAttentionUserIdsByHub } from "@/lib/data/event-bookings";
import { requireHubCoreBySlug } from "@/lib/data/hubs";
import {
  getHubMemberDirectoryReconciliationReport,
  getMemberDirectorySummaryByHubId,
  isMemberDirectoryReadModelEnabled,
  listMemberDirectoryPageByHubId,
  normalizeMemberDirectoryFilters,
} from "@/lib/data/member-directory";
import {
  listMembershipDirectorySummariesByHub,
  listPendingMembershipUpgradeRequestUserIdsByHub,
} from "@/lib/data/memberships";
import { listUserDirectoryRowsByHub } from "@/lib/data/users";
import { getRequestHostFromHeaders, resolveHubRuntimeRouteMode } from "@/lib/domain/hub-hosts";
import { buildHubRuntimeHref } from "@/lib/domain/hub-runtime-paths";
import { getUserStatusLabel, getUserStatusTone } from "@/lib/domain/users";
import { headers } from "next/headers";
import {
  repairHubMemberDirectoryReconciliationAction,
  syncHubDashboardStatsFromMembersAction,
  syncHubMemberDirectoryAction,
} from "./actions";
import styles from "./page.module.css";

function MembersWorkspaceFallback() {
  return (
    <section className={styles.workspaceFallback} aria-busy="true" aria-label="Loading member directory">
      <SkeletonMetricGrid count={4} columns={4} />
      <SkeletonButtonRow count={4} />
      <SkeletonList rows={8} withBadges />
    </section>
  );
}

function getMembersFeedback(searchParams = {}) {
  const success = String(searchParams?.success || "");
  const error = String(searchParams?.error || "");

  if (error) {
    return { tone: "danger", message: error };
  }

  if (success === "memberDirectorySynced") {
    return { tone: "success", message: "Member directory sync completed." };
  }

  if (success === "memberDirectoryRepaired") {
    return { tone: "success", message: "Member directory reconciliation repair completed." };
  }

  if (success === "dashboardStatsSynced") {
    return { tone: "success", message: "Dashboard stats sync completed." };
  }

  return null;
}

function MembersSupportDiagnostics({ hubSlug, report }) {
  return (
    <Surface tone="muted" padding="md" className={styles.supportPanel}>
      <div className={styles.supportContent}>
        <div className={styles.supportCopy}>
          <h2 className={styles.supportTitle}>Member directory diagnostics</h2>
          <p className={styles.supportText}>
            Projection diagnostics compare source member, membership, upgrade, and payment-attention records with the
            optimized member directory read model.
          </p>
          <div className={styles.supportGrid}>
            <span>Generated: {report?.generatedAt || "Not run"}</span>
            <span>Open issues: {Number(report?.totalIssues || 0)}</span>
            <span>Source rows: {Number(report?.expectedRows || 0)}</span>
            <span>Projected rows: {Number(report?.actualRows || 0)}</span>
          </div>
          {report?.summary?.length ? (
            <ul className={styles.issueList}>
              {report.summary.map((item) => (
                <li key={item.code}>
                  {item.title}: {item.count}
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.supportText}>No member directory reconciliation issues are currently flagged.</p>
          )}
        </div>
        <div className={styles.supportActions}>
          <form action={syncHubMemberDirectoryAction}>
            <input type="hidden" name="hubSlug" value={hubSlug} />
            <SubmitButton idleLabel="Sync member directory" pendingLabel="Syncing member directory" variant="secondary" size="sm" />
          </form>
          <form action={repairHubMemberDirectoryReconciliationAction}>
            <input type="hidden" name="hubSlug" value={hubSlug} />
            <SubmitButton idleLabel="Repair safe issues" pendingLabel="Repairing issues" variant="secondary" size="sm" />
          </form>
          <form action={syncHubDashboardStatsFromMembersAction}>
            <input type="hidden" name="hubSlug" value={hubSlug} />
            <SubmitButton idleLabel="Sync dashboard stats" pendingLabel="Syncing dashboard stats" variant="secondary" size="sm" />
          </form>
        </div>
      </div>
    </Surface>
  );
}

function buildFilterDefinitions({ includeLastSeen = true } = {}) {
  return [
    {
      key: "status",
      label: "Status",
      icon: "toggle_on",
      options: [
        { value: "all", label: "All" },
        { value: "active", label: "Active" },
        { value: "suspended", label: "Suspended" },
      ],
    },
    {
      key: "membership",
      label: "Membership",
      icon: "credit_card_heart",
      options: [
        { value: "all", label: "All" },
        { value: "default", label: "Default plan" },
        { value: "upgrade", label: "Upgrade plan" },
        { value: "none", label: "No membership" },
      ],
    },
    {
      key: "attention",
      label: "Attention",
      icon: "notification_important",
      options: [
        { value: "all", label: "All" },
        { value: "upgrade_request", label: "Upgrade request" },
        { value: "payment_attention", label: "Payment attention" },
      ],
    },
  ].concat(
    includeLastSeen
      ? [
          {
            key: "lastSeen",
            label: "Last seen",
            icon: "schedule",
            options: [
              { value: "all", label: "All" },
              { value: "last_7", label: "Seen in last 7 days" },
              { value: "last_30", label: "Seen in last 30 days" },
              { value: "over_30", label: "Seen over 30 days ago" },
              { value: "never", label: "Never seen" },
            ],
          },
        ]
      : []
  );
}

function buildMemberBadgesFromDirectoryItem(item) {
  const badges = [
    {
      label: getUserStatusLabel(item.status),
      tone: getUserStatusTone(item.status),
    },
  ];

  if (item.membershipType !== "none") {
    badges.push({
      label: item.membershipType === "default" ? "Default plan" : "Upgrade plan",
      tone: "neutral",
    });
  }

  if (item.attentionStatus === "upgrade_request") {
    badges.push({ label: "Upgrade request", tone: "accent" });
  } else if (item.attentionStatus === "payment_attention") {
    badges.push({ label: "Payment attention", tone: "warning" });
  }

  return badges;
}

function buildMemberItemFromDirectoryItem(item, hub, routeMode) {
  return {
    id: item.id,
    href: buildHubRuntimeHref(hub.slug, `/admin/members/${item.id}`, routeMode),
    name: item.displayName || item.email,
    email: item.email || "",
    lastSignedInAt: item.lastSignedInAt || "",
    membershipSummary: item.membershipPlanName || "No membership assigned yet.",
    badges: buildMemberBadgesFromDirectoryItem(item),
    searchTerms: [item.email, item.membershipPlanName],
    filterValues: {
      status: item.status || "active",
      membership: item.membershipType || "none",
      attention: item.attentionStatus || "all_clear",
    },
  };
}

function buildCursorHref({ basePath, searchParams, cursor = "", cursorStack = [] }) {
  const params = new URLSearchParams(searchParams);

  if (cursor) {
    params.set("cursor", cursor);
  } else {
    params.delete("cursor");
  }

  if (cursorStack.length) {
    params.set("cursorStack", cursorStack.join(","));
  } else {
    params.delete("cursorStack");
  }

  const queryString = params.toString();
  return `${basePath}${queryString ? `?${queryString}` : ""}`;
}

function buildMembersExportHref({ basePath, searchParams }) {
  const params = new URLSearchParams(searchParams);

  params.delete("cursor");
  params.delete("cursorStack");
  params.delete("limit");

  const queryString = params.toString();
  return `${basePath}/export${queryString ? `?${queryString}` : ""}`;
}

async function OptimizedMembersDirectoryLoader({ hub, searchParams }) {
  const headerStore = await headers();
  const routeMode = resolveHubRuntimeRouteMode(getRequestHostFromHeaders(headerStore));
  const filters = normalizeMemberDirectoryFilters(searchParams);
  const [page, summary] = await Promise.all([
    listMemberDirectoryPageByHubId(hub.id, filters),
    getMemberDirectorySummaryByHubId(hub.id),
  ]);
  const filterDefinitions = buildFilterDefinitions({ includeLastSeen: false });
  const memberItems = page.items.map((item) => buildMemberItemFromDirectoryItem(item, hub, routeMode));
  const basePath = buildHubRuntimeHref(hub.slug, "/admin/members", routeMode);
  const exportHref = buildMembersExportHref({ basePath, searchParams });
  const currentCursor = filters.cursor || "";
  const cursorStack = String(searchParams?.cursorStack || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const nextHref = page.nextCursor
    ? buildCursorHref({
        basePath,
        searchParams: {
          ...searchParams,
          limit: String(filters.limit),
        },
        cursor: page.nextCursor,
        cursorStack: currentCursor ? [...cursorStack, currentCursor] : cursorStack,
      })
    : "";
  const previousCursorStack = cursorStack.slice(0, -1);
  const previousCursor = cursorStack[cursorStack.length - 1] || "";
  const previousHref = currentCursor
    ? buildCursorHref({
        basePath,
        searchParams: {
          ...searchParams,
          limit: String(filters.limit),
        },
        cursor: previousCursor,
        cursorStack: previousCursorStack,
      })
    : "";

  const hasActiveDirectoryView = Boolean(filters.q || filters.status !== "all" || filters.membership !== "all" || filters.attention !== "all");

  return (
    <>
      {summary.total || hasActiveDirectoryView ? (
        <MembersWorkspace
          items={memberItems}
          summary={summary}
          filterDefinitions={filterDefinitions}
          hubSlug={hub.slug}
          serverDriven
          pageSize={filters.limit}
          nextHref={nextHref}
          previousHref={previousHref}
          exportHref={exportHref}
        />
      ) : null}
      {!summary.total && !hasActiveDirectoryView ? (
        <EmptyState
          eyebrow="No members yet"
          title="No members have joined yet"
          description="Member records will appear here after people join through the public or booking flows."
          primaryAction={{ href: buildHubRuntimeHref(hub.slug, "/admin", routeMode), label: "Back to overview" }}
        />
      ) : null}
    </>
  );
}

async function LegacyMembersDirectoryLoader({ hub }) {
  const headerStore = await headers();
  const routeMode = resolveHubRuntimeRouteMode(getRequestHostFromHeaders(headerStore));
  const [members, memberships, upgradeRequestUserIds, eventPaymentAttentionUserIds, coursePaymentAttentionUserIds] = await Promise.all([
    listUserDirectoryRowsByHub(hub.id, { role: "member" }),
    listMembershipDirectorySummariesByHub(hub.id),
    listPendingMembershipUpgradeRequestUserIdsByHub(hub.id),
    listEventBookingPaymentAttentionUserIdsByHub(hub.id),
    listCourseRegistrationPaymentAttentionUserIdsByHub(hub.id),
  ]);

  const membershipsByUserId = new Map();
  memberships.forEach((membership) => {
    if (!membership?.userId || membershipsByUserId.has(membership.userId)) {
      return;
    }

    membershipsByUserId.set(membership.userId, membership);
  });

  const upgradeRequestUserIdSet = new Set(upgradeRequestUserIds);
  const paymentAttentionUserIds = new Set([
    ...memberships
      .filter((membership) => ["unpaid", "overdue", "failed"].includes(String(membership?.paymentStatus || "")))
      .map((membership) => membership.userId)
      .filter(Boolean),
    ...eventPaymentAttentionUserIds,
    ...coursePaymentAttentionUserIds,
  ]);

  const memberItems = members.map((member) => {
    const membership = membershipsByUserId.get(member.id) || null;
    const hasUpgradeRequest = upgradeRequestUserIdSet.has(member.id);
    const hasPaymentAttention = paymentAttentionUserIds.has(member.id);
    const membershipType = membership ? (membership.isDefault ? "default" : "upgrade") : "none";
    const badges = [
      {
        label: getUserStatusLabel(member.status),
        tone: getUserStatusTone(member.status),
      },
    ];

    if (membership) {
      badges.push({
        label: membership.isDefault ? "Default plan" : "Upgrade plan",
        tone: "neutral",
      });
    }

    if (hasUpgradeRequest) {
      badges.push({ label: "Upgrade request", tone: "accent" });
    } else if (hasPaymentAttention) {
      badges.push({ label: "Payment attention", tone: "warning" });
    }

    return {
      id: member.id,
      href: buildHubRuntimeHref(hub.slug, `/admin/members/${member.id}`, routeMode),
      name: member.name || member.email,
      email: member.email || "",
      lastSignedInAt: member.lastSignedInAt || "",
      membershipSummary: membership
        ? membership.planTitle || (membership.isDefault ? "Default membership plan assigned." : "Membership plan assigned.")
        : "No membership assigned yet.",
      badges,
      searchTerms: [member.email, membership?.planTitle],
      filterValues: {
        status: member.status || "active",
        membership: membershipType,
        attention: hasUpgradeRequest ? "upgrade_request" : hasPaymentAttention ? "payment_attention" : "all_clear",
      },
    };
  });

  const summary = {
    total: members.length,
    suspended: members.filter((member) => member.status === "suspended").length,
    upgradeRequests: upgradeRequestUserIds.length,
    paymentAttention: paymentAttentionUserIds.size,
  };

  const filterDefinitions = buildFilterDefinitions();

  return (
    <>
      {members.length ? (
        <MembersWorkspace items={memberItems} summary={summary} filterDefinitions={filterDefinitions} hubSlug={hub.slug} />
      ) : null}
      {!members.length ? (
        <EmptyState
          eyebrow="No members yet"
          title="No members have joined yet"
          description="Member records will appear here after people join through the public or booking flows."
          primaryAction={{ href: buildHubRuntimeHref(hub.slug, "/admin", routeMode), label: "Back to overview" }}
        />
      ) : null}
    </>
  );
}

export default async function MembersPage({ params, searchParams }) {
  const { hubSlug } = await params;
  const resolvedSearchParams = await searchParams;
  const hub = await requireHubCoreBySlug(hubSlug);
  const access = await getCurrentHubOperatorAccess(hub);
  const showSupportDiagnostics = access?.mode === "support";
  const [feedback, reconciliationReport] = await Promise.all([
    Promise.resolve(getMembersFeedback(resolvedSearchParams || {})),
    showSupportDiagnostics ? getHubMemberDirectoryReconciliationReport(hub.id) : Promise.resolve(null),
  ]);

  return (
    <div className={styles.layout}>
      <PageHeader
        eyebrow="Members"
        title="Member directory"
        description="Review members, check their status and payment context, and open the right record for follow-up."
      />
      {feedback ? (
        <Surface tone={feedback.tone === "danger" ? "accent" : "muted"} padding="sm">
          {feedback.message}
        </Surface>
      ) : null}
      {showSupportDiagnostics ? <MembersSupportDiagnostics hubSlug={hub.slug} report={reconciliationReport} /> : null}
      <Suspense fallback={<MembersWorkspaceFallback />}>
        {isMemberDirectoryReadModelEnabled() ? (
          <OptimizedMembersDirectoryLoader hub={hub} searchParams={resolvedSearchParams || {}} />
        ) : (
          <LegacyMembersDirectoryLoader hub={hub} />
        )}
      </Suspense>
    </div>
  );
}
