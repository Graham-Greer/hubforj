try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { normalizeMediaFolderRecord } from "@/lib/domain/media";
import {
  attachUsageToAsset,
  buildMediaUsageByHubId,
  folderCollection,
  mediaCollection,
  normalizeActiveMediaAsset,
  normalizeString,
} from "./media-shared.js";

export async function listMediaAssetsByHubId(hubId) {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    return [];
  }

  const [snapshot, usageByAssetId] = await Promise.all([
    mediaCollection(normalizedHubId).orderBy("createdAt", "desc").get(),
    buildMediaUsageByHubId(normalizedHubId),
  ]);

  return snapshot.docs
    .map((doc) => normalizeActiveMediaAsset(doc, normalizedHubId))
    .filter(Boolean)
    .map((asset) => attachUsageToAsset(asset, usageByAssetId));
}

export async function getMediaAssetById(hubId, assetId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedAssetId = normalizeString(assetId);

  if (!normalizedHubId || !normalizedAssetId) {
    return null;
  }

  const [doc, usageByAssetId] = await Promise.all([
    mediaCollection(normalizedHubId).doc(normalizedAssetId).get(),
    buildMediaUsageByHubId(normalizedHubId),
  ]);

  if (!doc.exists) {
    return null;
  }

  const asset = normalizeActiveMediaAsset(doc, normalizedHubId);

  if (!asset) {
    return null;
  }

  return attachUsageToAsset(asset, usageByAssetId);
}

export async function getPublicMediaAssetById(hubId, assetId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedAssetId = normalizeString(assetId);

  if (!normalizedHubId || !normalizedAssetId) {
    return null;
  }

  const doc = await mediaCollection(normalizedHubId).doc(normalizedAssetId).get();

  if (!doc.exists) {
    return null;
  }

  return normalizeActiveMediaAsset(doc, normalizedHubId);
}

export async function getMediaAssetsByIds(hubId, assetIds = []) {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId || !Array.isArray(assetIds) || !assetIds.length) {
    return [];
  }

  const uniqueIds = [...new Set(assetIds.map((value) => normalizeString(value)).filter(Boolean))];
  const [docs, usageByAssetId] = await Promise.all([
    Promise.all(uniqueIds.map((assetId) => mediaCollection(normalizedHubId).doc(assetId).get())),
    buildMediaUsageByHubId(normalizedHubId),
  ]);

  return docs
    .filter((doc) => doc.exists)
    .map((doc) => normalizeActiveMediaAsset(doc, normalizedHubId))
    .filter(Boolean)
    .map((asset) => attachUsageToAsset(asset, usageByAssetId));
}

export async function getPublicMediaAssetsByIds(hubId, assetIds = []) {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId || !Array.isArray(assetIds) || !assetIds.length) {
    return [];
  }

  const uniqueIds = [...new Set(assetIds.map((value) => normalizeString(value)).filter(Boolean))];
  const docs = await Promise.all(uniqueIds.map((assetId) => mediaCollection(normalizedHubId).doc(assetId).get()));

  return docs
    .filter((doc) => doc.exists)
    .map((doc) => normalizeActiveMediaAsset(doc, normalizedHubId))
    .filter(Boolean);
}

export async function listMediaFoldersByHubId(hubId) {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    return [];
  }

  const [folderSnapshot, assetSnapshot] = await Promise.all([
    folderCollection(normalizedHubId).orderBy("name", "asc").get(),
    mediaCollection(normalizedHubId).where("status", "==", "active").get(),
  ]);

  const counts = new Map();
  assetSnapshot.docs.forEach((doc) => {
    const folderId = normalizeString(doc.data().folderId);

    if (!folderId) {
      return;
    }

    counts.set(folderId, (counts.get(folderId) || 0) + 1);
  });

  return folderSnapshot.docs.map((doc) =>
    normalizeMediaFolderRecord({
      id: doc.id,
      hubId: normalizedHubId,
      assetCount: counts.get(doc.id) || 0,
      ...doc.data(),
    })
  );
}
