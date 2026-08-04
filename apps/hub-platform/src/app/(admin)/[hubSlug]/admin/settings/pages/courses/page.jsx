import { Suspense } from "react";
import AdminDirtyAwareBackButton from "@/components/patterns/admin-form-runtime/AdminDirtyAwareBackButton";
import { AdminFormRuntimeProvider } from "@/components/patterns/admin-form-runtime/AdminFormRuntime";
import { AdminPublicPageSettingsFallback } from "@/components/patterns/admin-route-fallbacks/AdminRouteFallbacks";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import CoursesPageSettingsForm from "./CoursesPageSettingsForm";
import { requireHubBySlug, requireHubCoreBySlug } from "@/lib/data/hubs";
import { getCoursesPageSettingsFormValuesByHub } from "@/lib/data/site-settings";
import { listMediaFoldersByHubId } from "@/lib/data/media";
import styles from "../../settings.module.css";

async function CoursesPageSettingsWorkspace({ hubSlug }) {
  const hub = await requireHubBySlug(hubSlug);
  const [initialValues, mediaFolders] = await Promise.all([
    getCoursesPageSettingsFormValuesByHub(hub),
    listMediaFoldersByHubId(hub.id),
  ]);

  return (
    <CoursesPageSettingsForm
      hub={hub}
      initialValues={initialValues}
      mediaAssets={[]}
      mediaFolders={mediaFolders}
    />
  );
}

export default async function CoursesPageSettingsPage({ params }) {
  const { hubSlug } = await params;
  const hub = await requireHubCoreBySlug(hubSlug);

  return (
    <AdminFormRuntimeProvider>
      <div className={styles.layout}>
        <WorkspaceSection
          eyebrow="Page settings"
          title="Edit courses page"
          description="Manage the courses route hero copy separately from the listing section so discovery stays system-led while still allowing light personalization."
          actions={
            <AdminDirtyAwareBackButton
              href={`/${hub.slug}/admin/settings/pages`}
              label="Back to page settings"
            />
          }
        >
          <Suspense fallback={<AdminPublicPageSettingsFallback />}>
            <CoursesPageSettingsWorkspace hubSlug={hubSlug} />
          </Suspense>
        </WorkspaceSection>
      </div>
    </AdminFormRuntimeProvider>
  );
}
