import HomepageSettingsForm from "../../homepage/HomepageSettingsForm";
import AdminDirtyAwareBackButton from "@/components/patterns/admin-form-runtime/AdminDirtyAwareBackButton";
import { AdminFormRuntimeProvider } from "@/components/patterns/admin-form-runtime/AdminFormRuntime";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import { requireHubBySlug } from "@/lib/data/hubs";
import { listMediaAssetsByHubId, listMediaFoldersByHubId } from "@/lib/data/media";
import { getSiteSettingsFormValuesByHub } from "@/lib/data/site-settings";
import styles from "../../settings.module.css";

export default async function HomepageSettingsPage({ params }) {
  const { hubSlug } = await params;
  const hub = await requireHubBySlug(hubSlug);
  const [initialValues, mediaAssets, mediaFolders] = await Promise.all([
    getSiteSettingsFormValuesByHub(hub),
    listMediaAssetsByHubId(hub.id),
    listMediaFoldersByHubId(hub.id),
  ]);

  return (
    <AdminFormRuntimeProvider>
      <div className={styles.layout}>
        <WorkspaceSection
          eyebrow="Page settings"
          title="Edit homepage"
          description="Edit the homepage hero separately so headline, supporting copy, and primary actions stay focused and easy to review."
          actions={
            <AdminDirtyAwareBackButton
              href={`/${hub.slug}/admin/settings/pages`}
              label="Back to page settings"
            />
          }
        >
          <HomepageSettingsForm
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
