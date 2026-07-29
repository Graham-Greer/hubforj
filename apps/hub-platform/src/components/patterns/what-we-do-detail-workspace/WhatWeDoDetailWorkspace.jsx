import { AdminFormRuntimeProvider } from "@/components/patterns/admin-form-runtime/AdminFormRuntime";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import { getWhatWeDoStatusLabel, getWhatWeDoStatusTone } from "@/lib/domain/what-we-do";
import styles from "./WhatWeDoDetailWorkspace.module.css";

export default function WhatWeDoDetailWorkspace({ hub, item, form }) {
  return (
    <AdminFormRuntimeProvider>
      <div className={styles.root}>
        <PageHeader
          eyebrow="What we do"
          title={item.title || "What we do item"}
          description="Keep What we do editing focused on concise, reusable public-site messaging."
          actions={
            <div className={styles.headerActions}>
              <Badge tone={getWhatWeDoStatusTone(item.status)}>{getWhatWeDoStatusLabel(item.status)}</Badge>
              <Button href={`/${hub.slug}/admin/what-we-do`} variant="ghost">Back to What we do</Button>
            </div>
          }
        />

        <WorkspaceSection
          title="Item content"
          description="What we do items should stay concise and scannable so grid sections remain clear and reusable."
        >
          {form}
        </WorkspaceSection>
      </div>
    </AdminFormRuntimeProvider>
  );
}
