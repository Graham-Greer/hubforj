import AdminDirtyAwareBackButton from "@/components/patterns/admin-form-runtime/AdminDirtyAwareBackButton";
import { AdminFormRuntimeProvider } from "@/components/patterns/admin-form-runtime/AdminFormRuntime";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import EventsPageSettingsForm from "./EventsPageSettingsForm";
import { requireHubBySlug } from "@/lib/data/hubs";
import { getEventsPageSettingsFormValuesByHub } from "@/lib/data/site-settings";
import { listMediaAssetsByHubId, listMediaFoldersByHubId } from "@/lib/data/media";
import styles from "../../settings.module.css";

export default async function EventsPageSettingsPage({ params }) {
  const { hubSlug } = await params;
  const hub = await requireHubBySlug(hubSlug);
  const [initialValues, mediaAssets, mediaFolders] = await Promise.all([
    getEventsPageSettingsFormValuesByHub(hub),
    listMediaAssetsByHubId(hub.id),
    listMediaFoldersByHubId(hub.id),
  ]);

  return (
    <AdminFormRuntimeProvider>
      <div className={styles.layout}>
        <WorkspaceSection
          eyebrow="Page settings"
          title="Edit events page"
          description="Manage the events route hero copy separately from the listing section so discovery stays system-led while still allowing light personalization."
          actions={
            <AdminDirtyAwareBackButton
              href={`/${hub.slug}/admin/settings/pages`}
              label="Back to page settings"
            />
          }
        >
          <EventsPageSettingsForm
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
