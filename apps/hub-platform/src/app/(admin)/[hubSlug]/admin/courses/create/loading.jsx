import { AdminWizardFormFallback } from "@/components/patterns/admin-route-fallbacks/AdminRouteFallbacks";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import { SkeletonBlock } from "@/components/patterns/loading-skeleton";
import styles from "./page.module.css";

export default function CreateCourseLoading() {
  return (
    <div className={styles.layout}>
      <WorkspaceSection
        eyebrow="Courses"
        title="Create course"
        description="Set the structure, commitment, pricing, and enrolment rules before opening the course to members."
        actions={<SkeletonBlock variant="button" width="7rem" />}
      >
        <AdminWizardFormFallback steps={5} fields={6} />
      </WorkspaceSection>
    </div>
  );
}
