import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import StatCard from "@/components/ui/stat-card/StatCard";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import { countActiveUpcomingPublishedEventsByHub } from "@/lib/data/events";
import { getHubById } from "@/lib/data/hubs";
import { countActiveMembersByHub } from "@/lib/data/users";
import styles from "./page.module.css";

const statusTones = {
  active: "success",
  provisioning: "warning",
  needs_attention: "danger",
};

function buildPaymentsCapabilityBadge(hub) {
  const paymentProcessingMode = hub?.packagePaymentProcessingMode || "none";

  if (paymentProcessingMode === "internal") {
    return {
      label: "Built-in payments",
      tone: "success",
    };
  }

  if (paymentProcessingMode === "external") {
    return {
      label: "External payments",
      tone: "accent",
    };
  }

  return {
    label: "Paid offerings locked",
    tone: "warning",
  };
}

export default async function PlatformHubDetailPage({ params }) {
  const { hubId } = await params;
  const hub = await getHubById(hubId);

  if (!hub) {
    return (
      <WorkspaceSection
        eyebrow="Hub detail"
        title="Hub not found"
        description="The requested hub record does not exist in the current data source."
        actions={<Button href="/platform/hubs">Back to hubs</Button>}
      />
    );
  }

  const [activeMemberCount, activeUpcomingPublishedEventCount] = await Promise.all([
    countActiveMembersByHub(hub.id),
    countActiveUpcomingPublishedEventsByHub(hub.id),
  ]);

  const activeMembersLimit = hub.packageLimits?.activeMembers;
  const activeUpcomingEventsLimit = hub.packageLimits?.activeUpcomingEvents;
  const capabilityBadges = [
    { label: hub.packageCapabilities?.coursesEnabled ? "Courses" : "Courses locked", tone: hub.packageCapabilities?.coursesEnabled ? "success" : "warning" },
    buildPaymentsCapabilityBadge(hub),
    {
      label: hub.packageCapabilities?.customDomainEnabled ? "Custom domain" : "Hubforj subdomain",
      tone: hub.packageCapabilities?.customDomainEnabled ? "success" : "neutral",
    },
    { label: hub.packageCapabilities?.brandingRemovalEnabled ? "Unbranded" : "Powered by branding", tone: hub.packageCapabilities?.brandingRemovalEnabled ? "success" : "neutral" },
  ];

  return (
    <div className={styles.layout}>
      <WorkspaceSection
        eyebrow="Hub detail"
        title={hub.name}
        description="Review provisioning state, confirm operator readiness, and choose the next action before entering support mode."
        actions={
          <div className={styles.actions}>
            <Button href={`/platform/support/${hub.id}`}>Open support access</Button>
            <Button href={`/platform/hubs/${hub.id}/invite-admin`} variant="secondary">
              Invite admin
            </Button>
          </div>
        }
      >
        <div className={styles.headerMeta}>
          <Badge tone={statusTones[hub.status] || "neutral"}>{hub.statusLabel}</Badge>
          <Badge tone="accent">{hub.packageTierLabel}</Badge>
          <Badge tone={hub.packageStatus === "active" ? "success" : hub.packageStatus === "trialing" ? "warning" : "danger"}>
            {hub.packageStatusLabel}
          </Badge>
          <span className={styles.metaItem}>{hub.slug}</span>
          <span className={styles.metaItem}>{hub.domainLabel}</span>
          <span className={styles.metaItem}>Template: {hub.template}</span>
          <span className={styles.metaItem}>Theme: {hub.theme}</span>
        </div>
      </WorkspaceSection>
      <div className={styles.stats}>
        <StatCard label="Admins" value={String(hub.adminCount)} detail="Current admin operators." />
        <StatCard
          label="Active members"
          value={
            Number.isFinite(activeMembersLimit)
              ? `${activeMemberCount}/${activeMembersLimit}`
              : String(activeMemberCount)
          }
          detail={
            Number.isFinite(activeMembersLimit)
              ? "Current active-member usage against the package limit."
              : "Active members allowed on the current package."
          }
        />
        <StatCard
          label="Active upcoming events"
          value={
            Number.isFinite(activeUpcomingEventsLimit)
              ? `${activeUpcomingPublishedEventCount}/${activeUpcomingEventsLimit}`
              : String(activeUpcomingPublishedEventCount)
          }
          detail={
            Number.isFinite(activeUpcomingEventsLimit)
              ? "Published upcoming event usage against the package limit."
              : "Published upcoming events allowed on the current package."
          }
        />
      </div>
      <WorkspaceSection
        eyebrow="Package visibility"
        title={`${hub.packageTierLabel} package`}
        description="Use this section to confirm what the hub can do today and where upgrade pressure is already emerging."
      >
        <div className={styles.capabilityBadges}>
          {capabilityBadges.map((badge) => (
            <Badge key={badge.label} tone={badge.tone}>
              {badge.label}
            </Badge>
          ))}
        </div>
        <div className={styles.packageMeta}>
          <span className={styles.metaItem}>Package source: {hub.packageSourceLabel}</span>
          <span className={styles.metaItem}>Assigned: {hub.packageAssignedAt || "Not recorded"}</span>
          <span className={styles.metaItem}>Updated: {hub.packageUpdatedAt || "Not recorded"}</span>
        </div>
      </WorkspaceSection>
    </div>
  );
}
