import { AdminPublicPageSettingsFallback } from "@/components/patterns/admin-route-fallbacks/AdminRouteFallbacks";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import { SkeletonBlock } from "@/components/patterns/loading-skeleton";
import styles from "../../settings.module.css";

export default function TestimonialsPageSettingsLoading() {
  return (
    <div className={styles.layout}>
      <WorkspaceSection
        eyebrow="Page settings"
        title="Edit testimonials page"
        description="Manage the testimonials route hero separately from the published testimonial cards so the trust page stays system-led while still allowing light personalization."
        actions={<SkeletonBlock variant="button" width="11rem" />}
      >
        <AdminPublicPageSettingsFallback tabs={2} cta />
      </WorkspaceSection>
    </div>
  );
}
