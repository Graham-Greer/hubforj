try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

export {
  getMediaAssetById,
  getMediaAssetsByIds,
  getPublicMediaAssetById,
  getPublicMediaAssetsByIds,
  listMediaAssetsByHubId,
  listMediaFoldersByHubId,
} from "./media-queries.js";
export {
  createMediaFolderForHub,
  deleteMediaFolderForHub,
  updateMediaFolderForHub,
} from "./media-folder-records.js";
export {
  deleteMediaAssetForHub,
  updateMediaAssetForHub,
  uploadMediaAssetForHub,
} from "./media-asset-records.js";
