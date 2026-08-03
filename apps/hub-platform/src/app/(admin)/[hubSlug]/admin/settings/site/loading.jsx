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
        description="Update shared site defaults here so contact details, homepage hero content, and SEO settings stay consistent."
        actions={<SkeletonBlock variant="button" width="8rem" />}
      >
        <AdminSettingsEditorFallback variant="site" />
      </WorkspaceSection>
    </div>
  );
}
