import Surface from "@/components/primitives/surface/Surface";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import { getMemberStatusAction } from "./admin-member-detail-helpers";
import MemberStatusActionButton from "./MemberStatusActionButton";
import styles from "./AdminMemberDetailWorkspace.module.css";

export default function MemberStateSection({ hub, user, statusAction = null, membersQuery = "" }) {
  const statusMeta = getMemberStatusAction(user.status);

  return (
    <WorkspaceSection
      eyebrow="Admin controls"
      title="Member state"
      description="Change member status here when you need to control access or reflect the current relationship."
      data-onboarding="member-detail-state"
    >
      <Surface as="div" tone="muted" padding="md" className={styles.controlsCard}>
        <div className={styles.controlsCopy}>
          <p className={styles.controlTitle}>Current status</p>
          <p className={styles.controlBody}>{statusMeta.description}</p>
        </div>
        {statusAction ? (
          <MemberStatusActionButton
            hubSlug={hub.slug}
            memberId={user.id}
            nextStatus={statusMeta.nextStatus}
            actionLabel={statusMeta.actionLabel}
            statusAction={statusAction}
            membersQuery={membersQuery}
            className={styles.controlForm}
          />
        ) : null}
      </Surface>
    </WorkspaceSection>
  );
}
