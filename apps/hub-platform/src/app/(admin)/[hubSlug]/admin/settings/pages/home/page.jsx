import { Suspense } from "react";
import HomepageSettingsForm from "../../homepage/HomepageSettingsForm";
import AdminDirtyAwareBackButton from "@/components/patterns/admin-form-runtime/AdminDirtyAwareBackButton";
import { AdminFormRuntimeProvider } from "@/components/patterns/admin-form-runtime/AdminFormRuntime";
import { AdminPublicPageSettingsFallback } from "@/components/patterns/admin-route-fallbacks/AdminRouteFallbacks";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import { requireHubBySlug, requireHubCoreBySlug } from "@/lib/data/hubs";
import { listMediaFoldersByHubId } from "@/lib/data/media";
import { getSiteSettingsFormValuesByHub } from "@/lib/data/site-settings";
import { listWhatWeDoItemsByHub } from "@/lib/data/what-we-do";
import { buildWhatWeDoHomeReturnContext } from "@/lib/navigation/admin-return-context";
import { deleteWhatWeDoAction } from "../../../what-we-do/actions";
import styles from "../../settings.module.css";

function normalizeSectionParam(value) {
  const normalizedValue = String(value || "").trim();
  return normalizedValue === "what-we-do" ? normalizedValue : "";
}

async function HomepageSettingsWorkspace({ hubSlug, initialSection = "" }) {
  const hub = await requireHubBySlug(hubSlug);
  const [initialValues, mediaFolders, whatWeDoItems] = await Promise.all([
    getSiteSettingsFormValuesByHub(hub),
    listMediaFoldersByHubId(hub.id),
    listWhatWeDoItemsByHub(hub),
  ]);
  const whatWeDoReturnContext = buildWhatWeDoHomeReturnContext(hub.slug);

  return (
    <HomepageSettingsForm
      hub={hub}
      initialValues={initialValues}
      mediaAssets={[]}
      mediaFolders={mediaFolders}
      initialSection={initialSection}
      whatWeDoItems={whatWeDoItems}
      whatWeDoReturnContext={whatWeDoReturnContext}
      deleteWhatWeDoAction={deleteWhatWeDoAction}
    />
  );
}

export default async function HomepageSettingsPage({ params, searchParams }) {
  const { hubSlug } = await params;
  const resolvedSearchParams = await searchParams;
  const initialSection = normalizeSectionParam(resolvedSearchParams?.section);
  const hub = await requireHubCoreBySlug(hubSlug);

  return (
    <AdminFormRuntimeProvider>
      <div className={styles.layout}>
        <WorkspaceSection
          eyebrow="Content"
          title="Edit homepage"
          description="Edit the homepage hero separately so headline, supporting copy, and primary actions stay focused and easy to review."
          actions={
            <AdminDirtyAwareBackButton
              href={`/${hub.slug}/admin/settings/pages`}
              label="Back to pages"
            />
          }
        >
          <Suspense fallback={<AdminPublicPageSettingsFallback tabs={5} cta />}>
            <HomepageSettingsWorkspace hubSlug={hubSlug} initialSection={initialSection} />
          </Suspense>
        </WorkspaceSection>
      </div>
    </AdminFormRuntimeProvider>
  );
}
