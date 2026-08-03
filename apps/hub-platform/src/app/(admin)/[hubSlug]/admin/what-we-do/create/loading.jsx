import { AdminContentItemFormFallback } from "@/components/patterns/admin-route-fallbacks/AdminRouteFallbacks";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import { SkeletonBlock } from "@/components/patterns/loading-skeleton";
import styles from "./page.module.css";

export default function CreateWhatWeDoLoading() {
  return (
    <div className={styles.layout}>
      <WorkspaceSection
        eyebrow="What we do"
        title="New item"
        description="Capture What we do content as a structured record so it stays reusable and easy to surface on the public site."
        actions={<SkeletonBlock variant="button" width="9rem" />}
      >
        <AdminContentItemFormFallback />
      </WorkspaceSection>
    </div>
  );
}
