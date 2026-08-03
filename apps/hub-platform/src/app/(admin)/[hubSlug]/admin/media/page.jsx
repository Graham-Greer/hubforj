import MediaLibraryWorkspace from "@/components/patterns/media-library-workspace/MediaLibraryWorkspace";
import { requireHubCoreBySlug } from "@/lib/data/hubs";
import { listMediaAssetsByHubId, listMediaFoldersByHubId } from "@/lib/data/media";

function normalizeSearchParam(value) {
  return typeof value === "string" ? value.trim() : "";
}

export default async function MediaPage({ params, searchParams }) {
  const { hubSlug } = await params;
  const resolvedSearchParams = await searchParams;
  const hub = await requireHubCoreBySlug(hubSlug);

  const [assets, folders] = await Promise.all([
    listMediaAssetsByHubId(hub.id),
    listMediaFoldersByHubId(hub.id),
  ]);

  const pickerContext = normalizeSearchParam(resolvedSearchParams?.mode) === "pick"
    ? {
        returnTo: normalizeSearchParam(resolvedSearchParams?.returnTo),
        field: normalizeSearchParam(resolvedSearchParams?.field),
        altField: normalizeSearchParam(resolvedSearchParams?.altField),
        label: normalizeSearchParam(resolvedSearchParams?.label),
        selectedAssetId: normalizeSearchParam(resolvedSearchParams?.selectedAssetId),
      }
    : null;

  return (
    <MediaLibraryWorkspace
      hub={hub}
      assets={assets}
      folders={folders}
      initialSelectedAssetId={pickerContext?.selectedAssetId || ""}
      pickerContext={pickerContext}
    />
  );
}
