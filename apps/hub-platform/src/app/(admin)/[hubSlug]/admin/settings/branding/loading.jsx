import { AdminSettingsEditorFallback } from "@/components/patterns/admin-route-fallbacks/AdminRouteFallbacks";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import { SkeletonBlock } from "@/components/patterns/loading-skeleton";
import styles from "../settings.module.css";

export default function BrandingSettingsLoading() {
  return (
    <div className={styles.layout}>
      <WorkspaceSection
        eyebrow="Settings"
        title="Brand and appearance"
        description="Update branding here to keep the public site aligned without affecting operational clarity in the admin workspace."
        actions={<SkeletonBlock variant="button" width="8rem" />}
      >
        <AdminSettingsEditorFallback variant="branding" />
      </WorkspaceSection>
    </div>
  );
}
