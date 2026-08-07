import { AdminSettingsEditorFallback } from "@/components/patterns/admin-route-fallbacks/AdminRouteFallbacks";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import { SkeletonBlock } from "@/components/patterns/loading-skeleton";
import styles from "../settings.module.css";

export default function BrandingSettingsLoading() {
  return (
    <div className={styles.layout}>
      <WorkspaceSection
        eyebrow="Settings"
        title="Site branding"
        description="Update the public visual identity, logo, theme, template, and header call to action without affecting operational clarity in the admin workspace."
        actions={<SkeletonBlock variant="button" width="8rem" />}
      >
        <AdminSettingsEditorFallback variant="branding" />
      </WorkspaceSection>
    </div>
  );
}
