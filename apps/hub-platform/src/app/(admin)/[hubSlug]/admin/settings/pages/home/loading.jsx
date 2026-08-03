import { AdminPublicPageSettingsFallback } from "@/components/patterns/admin-route-fallbacks/AdminRouteFallbacks";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import { SkeletonBlock } from "@/components/patterns/loading-skeleton";
import styles from "../../settings.module.css";

export default function HomepageSettingsLoading() {
  return (
    <div className={styles.layout}>
      <WorkspaceSection
        eyebrow="Page settings"
        title="Edit homepage"
        description="Edit the homepage hero separately so headline, supporting copy, and primary actions stay focused and easy to review."
        actions={<SkeletonBlock variant="button" width="11rem" />}
      >
        <AdminPublicPageSettingsFallback tabs={5} cta />
      </WorkspaceSection>
    </div>
  );
}
