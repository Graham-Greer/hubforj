import { Suspense } from "react";
import AdminDirtyAwareBackButton from "@/components/patterns/admin-form-runtime/AdminDirtyAwareBackButton";
import { AdminFormRuntimeProvider } from "@/components/patterns/admin-form-runtime/AdminFormRuntime";
import { AdminPublicPageSettingsFallback } from "@/components/patterns/admin-route-fallbacks/AdminRouteFallbacks";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import TestimonialsPageSettingsForm from "./TestimonialsPageSettingsForm";
import { requireHubBySlug, requireHubCoreBySlug } from "@/lib/data/hubs";
import { getTestimonialsPageSettingsFormValuesByHub } from "@/lib/data/site-settings";
import { listMediaFoldersByHubId } from "@/lib/data/media";
import styles from "../../settings.module.css";

async function TestimonialsPageSettingsWorkspace({ hubSlug }) {
  const hub = await requireHubBySlug(hubSlug);
  const [initialValues, mediaFolders] = await Promise.all([
    getTestimonialsPageSettingsFormValuesByHub(hub),
    listMediaFoldersByHubId(hub.id),
  ]);

  return (
    <TestimonialsPageSettingsForm
      hub={hub}
      initialValues={initialValues}
      mediaAssets={[]}
      mediaFolders={mediaFolders}
    />
  );
}

export default async function TestimonialsPageSettingsPage({ params }) {
  const { hubSlug } = await params;
  const hub = await requireHubCoreBySlug(hubSlug);

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
          <Suspense fallback={<AdminPublicPageSettingsFallback tabs={2} cta />}>
            <TestimonialsPageSettingsWorkspace hubSlug={hubSlug} />
          </Suspense>
        </WorkspaceSection>
      </div>
    </AdminFormRuntimeProvider>
  );
}
