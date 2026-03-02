import { notFound, redirect } from "next/navigation";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import ErrorState from "@/components/ui/error-state/ErrorState";
import Text from "@/components/primitives/text/Text";
import { requireSessionRole } from "@/lib/auth/guards";
import { getHubById } from "@/lib/data/hubs/hub-repository";
import {
  createMediaFolder,
  deleteMediaAsset,
  deleteMediaFolder,
  listMediaByHub,
  listMediaFoldersByHub,
  updateMediaAsset,
  updateMediaFolder,
} from "@/lib/data/media/media-repository";
import { listCmsBlocks } from "@/lib/data/pages/block-registry";
import { getPageById, publishPage, savePageDraft } from "@/lib/data/pages/page-repository";
import { validateCompositionInput, validateUpdatePageDraftInput } from "@/lib/validation/pages";
import CmsPageEditorClient from "../_components/CmsPageEditorClient";
import styles from "./page.module.css";

function rethrowIfRedirectError(error) {
  if (String(error?.digest || "").startsWith("NEXT_REDIRECT")) {
    throw error;
  }
}

function parseJson(value, fallback) {
  try {
    return JSON.parse(String(value || ""));
  } catch {
    return fallback;
  }
}

async function saveDraftAction(formData) {
  "use server";

  const session = await requireSessionRole("superadmin", "/platform/sign-in");
  const hubId = String(formData.get("hubId") || "").trim();
  const pageId = String(formData.get("pageId") || "").trim();

  try {
    const settings = parseJson(formData.get("settings"), {});
    const draftCompositionRaw = parseJson(formData.get("draftComposition"), []);

    const patch = validateUpdatePageDraftInput({
      ...settings,
      draftComposition: validateCompositionInput(draftCompositionRaw),
    });
    delete patch.status;

    await savePageDraft(hubId, pageId, patch, session?.uid || "local-superadmin");
    redirect(`/platform/hubs/${hubId}/cms/${pageId}?success=draftSaved`);
  } catch (error) {
    rethrowIfRedirectError(error);
    const message = encodeURIComponent(error?.message || "Unable to save page draft.");
    redirect(`/platform/hubs/${hubId}/cms/${pageId}?error=${message}`);
  }
}

async function publishPageAction(formData) {
  "use server";

  const session = await requireSessionRole("superadmin", "/platform/sign-in");
  const hubId = String(formData.get("hubId") || "").trim();
  const pageId = String(formData.get("pageId") || "").trim();

  try {
    await publishPage(hubId, pageId, session?.uid || "local-superadmin");
    redirect(`/platform/hubs/${hubId}/cms/${pageId}?success=published`);
  } catch (error) {
    rethrowIfRedirectError(error);
    const message = encodeURIComponent(error?.message || "Unable to publish page.");
    redirect(`/platform/hubs/${hubId}/cms/${pageId}?error=${message}`);
  }
}

async function createMediaFolderAction(input) {
  "use server";

  const session = await requireSessionRole("superadmin", "/platform/sign-in");
  const hubId = String(input?.hubId || "").trim();

  try {
    const folder = await createMediaFolder(
      hubId,
      { name: input?.name },
      session?.uid || "local-superadmin"
    );
    return { ok: true, folder };
  } catch (error) {
    return { ok: false, message: error?.message || "Unable to create folder." };
  }
}

async function renameMediaFolderAction(input) {
  "use server";

  await requireSessionRole("superadmin", "/platform/sign-in");
  const hubId = String(input?.hubId || "").trim();
  const folderId = String(input?.folderId || "").trim();
  try {
    const folder = await updateMediaFolder(hubId, folderId, { name: input?.name });
    return { ok: true, folder };
  } catch (error) {
    return { ok: false, message: error?.message || "Unable to rename folder." };
  }
}

async function deleteMediaFolderAction(input) {
  "use server";

  await requireSessionRole("superadmin", "/platform/sign-in");
  const hubId = String(input?.hubId || "").trim();
  const folderId = String(input?.folderId || "").trim();
  try {
    const result = await deleteMediaFolder(hubId, folderId);
    return { ok: true, result };
  } catch (error) {
    return { ok: false, message: error?.message || "Unable to delete folder." };
  }
}

async function updateMediaAssetAction(input) {
  "use server";

  await requireSessionRole("superadmin", "/platform/sign-in");
  const hubId = String(input?.hubId || "").trim();
  const mediaId = String(input?.mediaId || "").trim();
  try {
    const media = await updateMediaAsset(hubId, mediaId, {
      alt: input?.alt,
      folderId: input?.folderId,
    });
    return { ok: true, media };
  } catch (error) {
    return { ok: false, message: error?.message || "Unable to update media." };
  }
}

async function deleteMediaAssetAction(input) {
  "use server";

  await requireSessionRole("superadmin", "/platform/sign-in");
  const hubId = String(input?.hubId || "").trim();
  const mediaId = String(input?.mediaId || "").trim();
  try {
    const result = await deleteMediaAsset(hubId, mediaId, { hardDelete: false });
    return { ok: true, result };
  } catch (error) {
    return {
      ok: false,
      message: error?.message || "Unable to delete media.",
      usageRefs: Array.isArray(error?.usageRefs) ? error.usageRefs : [],
    };
  }
}

export const dynamic = "force-dynamic";

export default async function HubCmsPageEditorPage({ params, searchParams }) {
  await requireSessionRole("superadmin", "/platform/sign-in");
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const hub = await getHubById(resolvedParams?.hubId);
  if (!hub) notFound();

  const page = await getPageById(hub.id, resolvedParams?.pageId);
  if (!page) notFound();

  const [media, mediaFolders, availableBlocks] = await Promise.all([
    listMediaByHub(hub.id),
    listMediaFoldersByHub(hub.id),
    Promise.resolve(listCmsBlocks()),
  ]);

  const errorMessage = resolvedSearchParams?.error ? decodeURIComponent(resolvedSearchParams.error) : null;
  const success = String(resolvedSearchParams?.success || "").trim();

  return (
    <section className={styles.root}>
      <PageHeader
        title={`Edit page: ${page.title}`}
        subtitle="Draft composition uses structured forms. Publish copies draft to live content."
      />
      {errorMessage ? <ErrorState title="CMS action failed" body={errorMessage} variant="compact" /> : null}
      {success ? <Text className={styles.notice}>CMS update applied.</Text> : null}

      <CmsPageEditorClient
        hub={hub}
        initialPage={page}
        availableBlocks={availableBlocks}
        media={media}
        mediaFolders={mediaFolders}
        saveDraftAction={saveDraftAction}
        publishAction={publishPageAction}
        createMediaFolderAction={createMediaFolderAction}
        renameMediaFolderAction={renameMediaFolderAction}
        deleteMediaFolderAction={deleteMediaFolderAction}
        updateMediaAssetAction={updateMediaAssetAction}
        deleteMediaAssetAction={deleteMediaAssetAction}
      />
    </section>
  );
}
