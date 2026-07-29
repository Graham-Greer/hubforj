import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Surface from "@/components/primitives/surface/Surface";
import styles from "./HubSummaryCard.module.css";

const statusTones = {
  active: "success",
  provisioning: "warning",
  needs_attention: "danger",
};

export default function HubSummaryCard({ hub }) {
  return (
    <Surface className={styles.root}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h3 className={styles.title}>{hub.name}</h3>
          <p className={styles.meta}>
            {hub.slug} · {hub.domainLabel}
          </p>
        </div>
        <Badge tone={statusTones[hub.status] || "neutral"}>{hub.statusLabel}</Badge>
      </div>
      <div className={styles.stats}>
        <span>{hub.adminCount} admins</span>
        <span>{hub.memberCount} members</span>
        <span>{hub.upcomingEventsCount} upcoming events</span>
        <span>{hub.pendingInvitesCount} pending invites</span>
      </div>
      <p className={styles.support}>Support state: {hub.supportStateLabel}</p>
      <div className={styles.actions}>
        <Button href={`/platform/hubs/${hub.id}`}>Open hub</Button>
        <Button href={`/platform/hubs/${hub.id}/invite-admin`} variant="secondary">
          Invite admin
        </Button>
        <Button href={`/platform/support/${hub.id}`} variant="ghost">
          Support mode
        </Button>
      </div>
    </Surface>
  );
}
