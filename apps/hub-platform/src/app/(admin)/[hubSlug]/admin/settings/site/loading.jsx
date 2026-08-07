import { AdminSettingsEditorFallback } from "@/components/patterns/admin-route-fallbacks/AdminRouteFallbacks";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import { SkeletonBlock } from "@/components/patterns/loading-skeleton";
import styles from "../settings.module.css";

export default function SiteSettingsLoading() {
  return (
    <div className={styles.layout}>
      <WorkspaceSection
        eyebrow="Settings"
        title="Site details"
        description="Update structured public details such as contact information, address, hours, social links, SEO defaults, and regional defaults."
        actions={<SkeletonBlock variant="button" width="8rem" />}
      >
        <AdminSettingsEditorFallback variant="site" />
      </WorkspaceSection>
    </div>
  );
}
