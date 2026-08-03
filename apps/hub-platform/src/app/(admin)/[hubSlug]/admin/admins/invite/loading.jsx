import { AdminInviteFormFallback } from "@/components/patterns/admin-route-fallbacks/AdminRouteFallbacks";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import { SkeletonBlock } from "@/components/patterns/loading-skeleton";
import styles from "./page.module.css";

export default function AdminInviteLoading() {
  return (
    <div className={styles.layout}>
      <WorkspaceSection
        eyebrow="Admins"
        title="Invite admin"
        description="Invite a new admin here and keep access changes explicit and auditable."
        actions={<SkeletonBlock variant="button" width="8rem" />}
      >
        <AdminInviteFormFallback />
      </WorkspaceSection>
    </div>
  );
}
