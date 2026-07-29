import BrandingSettingsForm from "./BrandingSettingsForm";
import AdminDirtyAwareBackButton from "@/components/patterns/admin-form-runtime/AdminDirtyAwareBackButton";
import { AdminFormRuntimeProvider } from "@/components/patterns/admin-form-runtime/AdminFormRuntime";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import { requireHubBySlug } from "@/lib/data/hubs";
import { getBrandingSettingsFormValuesByHub } from "@/lib/data/site-settings";
import { listMediaAssetsByHubId, listMediaFoldersByHubId } from "@/lib/data/media";
import styles from "../settings.module.css";

export default async function BrandingSettingsPage({ params }) {
  const { hubSlug } = await params;
  const hub = await requireHubBySlug(hubSlug);
  const [brandingFormValues, mediaAssets, mediaFolders] = await Promise.all([
    getBrandingSettingsFormValuesByHub(hub),
    listMediaAssetsByHubId(hub.id),
    listMediaFoldersByHubId(hub.id),
  ]);

  return (
    <AdminFormRuntimeProvider>
      <div className={styles.layout}>
        <WorkspaceSection
          eyebrow="Settings"
          title="Brand and appearance"
          description="Update branding here to keep the public site aligned without affecting operational clarity in the admin workspace."
          actions={
            <AdminDirtyAwareBackButton
              href={`/${hub.slug}/admin/settings`}
              label="Back to settings"
            />
          }
        >
          <BrandingSettingsForm
            hub={hub}
            initialValues={brandingFormValues}
            mediaAssets={mediaAssets}
            mediaFolders={mediaFolders}
          />
        </WorkspaceSection>
      </div>
    </AdminFormRuntimeProvider>
  );
}
