import { AdminContentItemFormFallback } from "@/components/patterns/admin-route-fallbacks/AdminRouteFallbacks";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import { SkeletonBlock } from "@/components/patterns/loading-skeleton";
import styles from "./page.module.css";

export default function WhatWeDoDetailLoading() {
  return (
    <div className={styles.layout}>
      <PageHeader
        eyebrow="What we do"
        title="Loading item"
        description="Keep What we do editing focused on concise, reusable public-site messaging."
        actions={<SkeletonBlock variant="button" width="9rem" />}
      />
      <WorkspaceSection
        title="Item content"
        description="What we do items should stay concise and scannable so grid sections remain clear and reusable."
        actions={<SkeletonBlock variant="button" width="9rem" />}
      >
        <AdminContentItemFormFallback detail />
      </WorkspaceSection>
    </div>
  );
}
