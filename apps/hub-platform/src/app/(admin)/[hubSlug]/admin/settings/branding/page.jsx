import { Suspense } from "react";
import BrandingSettingsForm from "./BrandingSettingsForm";
import AdminDirtyAwareBackButton from "@/components/patterns/admin-form-runtime/AdminDirtyAwareBackButton";
import { AdminFormRuntimeProvider } from "@/components/patterns/admin-form-runtime/AdminFormRuntime";
import { AdminSettingsEditorFallback } from "@/components/patterns/admin-route-fallbacks/AdminRouteFallbacks";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import { requireHubBySlug, requireHubCoreBySlug } from "@/lib/data/hubs";
import { getBrandingSettingsFormValuesByHub } from "@/lib/data/site-settings";
import { listMediaFoldersByHubId } from "@/lib/data/media";
import styles from "../settings.module.css";

async function BrandingSettingsWorkspace({ hubSlug }) {
  const hub = await requireHubBySlug(hubSlug);
  const [brandingFormValues, mediaFolders] = await Promise.all([
    getBrandingSettingsFormValuesByHub(hub),
    listMediaFoldersByHubId(hub.id),
  ]);

  return (
    <BrandingSettingsForm
      hub={hub}
      initialValues={brandingFormValues}
      mediaAssets={[]}
      mediaFolders={mediaFolders}
    />
  );
}

export default async function BrandingSettingsPage({ params }) {
  const { hubSlug } = await params;
  const hub = await requireHubCoreBySlug(hubSlug);

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
          <Suspense fallback={<AdminSettingsEditorFallback variant="branding" />}>
            <BrandingSettingsWorkspace hubSlug={hubSlug} />
          </Suspense>
        </WorkspaceSection>
      </div>
    </AdminFormRuntimeProvider>
  );
}
