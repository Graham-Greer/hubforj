import { AdminPublicPageSettingsFallback } from "@/components/patterns/admin-route-fallbacks/AdminRouteFallbacks";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import { SkeletonBlock } from "@/components/patterns/loading-skeleton";
import styles from "../../settings.module.css";

export default function CoursesPageSettingsLoading() {
  return (
    <div className={styles.layout}>
      <WorkspaceSection
        eyebrow="Page settings"
        title="Edit courses page"
        description="Manage the courses route hero copy separately from the listing section so discovery stays system-led while still allowing light personalization."
        actions={<SkeletonBlock variant="button" width="11rem" />}
      >
        <AdminPublicPageSettingsFallback />
      </WorkspaceSection>
    </div>
  );
}
