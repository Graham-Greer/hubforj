import { Suspense } from "react";
import EmptyState from "@/components/patterns/empty-state/EmptyState";
import MembersWorkspace from "@/components/patterns/members-workspace/MembersWorkspace";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import {
  SkeletonButtonRow,
  SkeletonList,
  SkeletonMetricGrid,
} from "@/components/patterns/loading-skeleton";
import { listCourseRegistrationPaymentAttentionUserIdsByHub } from "@/lib/data/course-registrations";
import { listEventBookingPaymentAttentionUserIdsByHub } from "@/lib/data/event-bookings";
import { requireHubCoreBySlug } from "@/lib/data/hubs";
import {
  listMembershipDirectorySummariesByHub,
  listPendingMembershipUpgradeRequestUserIdsByHub,
} from "@/lib/data/memberships";
import { listUserDirectoryRowsByHub } from "@/lib/data/users";
import { getRequestHostFromHeaders, resolveHubRuntimeRouteMode } from "@/lib/domain/hub-hosts";
import { buildHubRuntimeHref } from "@/lib/domain/hub-runtime-paths";
import { getUserStatusLabel, getUserStatusTone } from "@/lib/domain/users";
import { headers } from "next/headers";
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

async function MembersDirectoryLoader({ hubSlug }) {
  const headerStore = await headers();
  const routeMode = resolveHubRuntimeRouteMode(getRequestHostFromHeaders(headerStore));
  const hub = await requireHubCoreBySlug(hubSlug);
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

  const filterDefinitions = [
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
  ];

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

export default async function MembersPage({ params }) {
  const { hubSlug } = await params;

  return (
    <div className={styles.layout}>
      <PageHeader
        eyebrow="Members"
        title="Member directory"
        description="Review members, check their status and payment context, and open the right record for follow-up."
      />
      <Suspense fallback={<MembersWorkspaceFallback />}>
        <MembersDirectoryLoader hubSlug={hubSlug} />
      </Suspense>
    </div>
  );
}
