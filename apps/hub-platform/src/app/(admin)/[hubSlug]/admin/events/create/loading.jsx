import { AdminWizardFormFallback } from "@/components/patterns/admin-route-fallbacks/AdminRouteFallbacks";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import { SkeletonBlock } from "@/components/patterns/loading-skeleton";
import styles from "./page.module.css";

export default function CreateEventLoading() {
  return (
    <div className={styles.layout}>
      <WorkspaceSection
        eyebrow="Events"
        title="Create event"
        description="Set the schedule, capacity, pricing, visibility, and registration rules before publishing."
        actions={<SkeletonBlock variant="button" width="7rem" />}
      >
        <AdminWizardFormFallback steps={4} fields={6} />
      </WorkspaceSection>
    </div>
  );
}
