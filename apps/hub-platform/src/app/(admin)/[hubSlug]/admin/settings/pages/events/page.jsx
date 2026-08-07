import { Suspense } from "react";
import AdminDirtyAwareBackButton from "@/components/patterns/admin-form-runtime/AdminDirtyAwareBackButton";
import { AdminFormRuntimeProvider } from "@/components/patterns/admin-form-runtime/AdminFormRuntime";
import { AdminPublicPageSettingsFallback } from "@/components/patterns/admin-route-fallbacks/AdminRouteFallbacks";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import EventsPageSettingsForm from "./EventsPageSettingsForm";
import { requireHubBySlug, requireHubCoreBySlug } from "@/lib/data/hubs";
import { getEventsPageSettingsFormValuesByHub } from "@/lib/data/site-settings";
import { listMediaFoldersByHubId } from "@/lib/data/media";
import styles from "../../settings.module.css";

async function EventsPageSettingsWorkspace({ hubSlug }) {
  const hub = await requireHubBySlug(hubSlug);
  const [initialValues, mediaFolders] = await Promise.all([
    getEventsPageSettingsFormValuesByHub(hub),
    listMediaFoldersByHubId(hub.id),
  ]);

  return (
    <EventsPageSettingsForm
      hub={hub}
      initialValues={initialValues}
      mediaAssets={[]}
      mediaFolders={mediaFolders}
    />
  );
}

export default async function EventsPageSettingsPage({ params }) {
  const { hubSlug } = await params;
  const hub = await requireHubCoreBySlug(hubSlug);

  return (
    <AdminFormRuntimeProvider>
      <div className={styles.layout}>
        <WorkspaceSection
          eyebrow="Content"
          title="Edit events page"
          description="Manage the events route hero copy separately from the listing section so discovery stays system-led while still allowing light personalization."
          actions={
            <AdminDirtyAwareBackButton
              href={`/${hub.slug}/admin/settings/pages`}
              label="Back to pages"
            />
          }
        >
          <Suspense fallback={<AdminPublicPageSettingsFallback />}>
            <EventsPageSettingsWorkspace hubSlug={hubSlug} />
          </Suspense>
        </WorkspaceSection>
      </div>
    </AdminFormRuntimeProvider>
  );
}
