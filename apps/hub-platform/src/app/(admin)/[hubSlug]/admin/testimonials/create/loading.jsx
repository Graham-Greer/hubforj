import { AdminTestimonialFormFallback } from "@/components/patterns/admin-route-fallbacks/AdminRouteFallbacks";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import { SkeletonBlock } from "@/components/patterns/loading-skeleton";
import styles from "./page.module.css";

export default function CreateTestimonialLoading() {
  return (
    <div className={styles.layout}>
      <WorkspaceSection
        eyebrow="Testimonials"
        title="New testimonial"
        description="Capture testimonial content as a structured record so it stays reusable and trustworthy wherever the public site needs it."
        actions={<SkeletonBlock variant="button" width="9rem" />}
      >
        <AdminTestimonialFormFallback />
      </WorkspaceSection>
    </div>
  );
}
