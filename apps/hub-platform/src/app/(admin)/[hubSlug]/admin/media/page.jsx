import MediaLibraryWorkspace from "@/components/patterns/media-library-workspace/MediaLibraryWorkspace";
import { requireHubCoreBySlug } from "@/lib/data/hubs";
import { getMediaAssetById, listMediaAssetPageByHubId, listMediaFoldersByHubId } from "@/lib/data/media";

function normalizeSearchParam(value) {
  return typeof value === "string" ? value.trim() : "";
}

export default async function MediaPage({ params, searchParams }) {
  const { hubSlug } = await params;
  const resolvedSearchParams = await searchParams;
  const hub = await requireHubCoreBySlug(hubSlug);

  const [assetPage, folders] = await Promise.all([
    listMediaAssetPageByHubId(hub.id),
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

  let assets = assetPage.assets;

  if (pickerContext?.selectedAssetId && !assets.some((asset) => asset.id === pickerContext.selectedAssetId)) {
    const selectedAsset = await getMediaAssetById(hub.id, pickerContext.selectedAssetId);

    if (selectedAsset) {
      assets = [selectedAsset, ...assets];
    }
  }

  return (
    <MediaLibraryWorkspace
      hub={hub}
      assets={assets}
      folders={folders}
      initialAssetCursor={assetPage.nextCursor}
      initialHasMoreAssets={assetPage.hasMore}
      initialSelectedAssetId={pickerContext?.selectedAssetId || ""}
      pickerContext={pickerContext}
    />
  );
}
