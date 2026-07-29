import AdminDirtyAwareBackButton from "@/components/patterns/admin-form-runtime/AdminDirtyAwareBackButton";
import { AdminFormRuntimeProvider } from "@/components/patterns/admin-form-runtime/AdminFormRuntime";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import TestimonialsPageSettingsForm from "./TestimonialsPageSettingsForm";
import { requireHubBySlug } from "@/lib/data/hubs";
import { getTestimonialsPageSettingsFormValuesByHub } from "@/lib/data/site-settings";
import { listMediaAssetsByHubId, listMediaFoldersByHubId } from "@/lib/data/media";
import styles from "../../settings.module.css";

export default async function TestimonialsPageSettingsPage({ params }) {
  const { hubSlug } = await params;
  const hub = await requireHubBySlug(hubSlug);
  const [initialValues, mediaAssets, mediaFolders] = await Promise.all([
    getTestimonialsPageSettingsFormValuesByHub(hub),
    listMediaAssetsByHubId(hub.id),
    listMediaFoldersByHubId(hub.id),
  ]);

  return (
    <AdminFormRuntimeProvider>
      <div className={styles.layout}>
        <WorkspaceSection
          eyebrow="Page settings"
          title="Edit testimonials page"
          description="Manage the testimonials route hero separately from the published testimonial cards so the trust page stays system-led while still allowing light personalization."
          actions={
            <AdminDirtyAwareBackButton
              href={`/${hub.slug}/admin/settings/pages`}
              label="Back to page settings"
            />
          }
        >
          <TestimonialsPageSettingsForm
            hub={hub}
            initialValues={initialValues}
            mediaAssets={mediaAssets}
            mediaFolders={mediaFolders}
          />
        </WorkspaceSection>
      </div>
    </AdminFormRuntimeProvider>
  );
}
