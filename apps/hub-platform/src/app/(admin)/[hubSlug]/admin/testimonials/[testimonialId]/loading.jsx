import { AdminTestimonialFormFallback } from "@/components/patterns/admin-route-fallbacks/AdminRouteFallbacks";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import { SkeletonBlock } from "@/components/patterns/loading-skeleton";
import styles from "./page.module.css";

export default function TestimonialDetailLoading() {
  return (
    <div className={styles.layout}>
      <PageHeader
        eyebrow="Testimonials"
        title="Loading testimonial"
        description="Keep testimonial editing focused on quality, attribution, and publication state."
        actions={<SkeletonBlock variant="button" width="9rem" />}
      />
      <WorkspaceSection
        title="Testimonial content"
        description="Testimonials are structured content. Keep the model tight so public sections can trust the data."
        actions={<SkeletonBlock variant="button" width="9rem" />}
      >
        <AdminTestimonialFormFallback detail />
      </WorkspaceSection>
    </div>
  );
}
