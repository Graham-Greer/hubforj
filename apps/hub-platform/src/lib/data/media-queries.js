try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { normalizeMediaFolderRecord } from "@/lib/domain/media";
import { FieldPath } from "firebase-admin/firestore";
import {
  buildMediaUsageForAssetId,
  buildMediaUsageReportForAssetId,
  folderCollection,
  mediaCollection,
  normalizeActiveMediaAsset,
  normalizeString,
} from "./media-shared.js";
import {
  getMediaUsageProjectionByAssetId,
  replaceMediaUsageProjectionForAsset,
} from "./media-usage-projection.js";

export const MEDIA_ASSET_PAGE_SIZE = 48;

function encodeMediaAssetCursor(asset) {
  const createdAt = normalizeString(asset?.createdAt);
  const id = normalizeString(asset?.id);

  if (!createdAt || !id) {
    return "";
  }

  return encodeURIComponent(JSON.stringify({ createdAt, id }));
}

function decodeMediaAssetCursor(cursor) {
  const normalizedCursor = normalizeString(cursor);

  if (!normalizedCursor) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(normalizedCursor));
    const createdAt = normalizeString(parsed?.createdAt);
    const id = normalizeString(parsed?.id);

    return createdAt && id ? { createdAt, id } : null;
  } catch {
    return null;
  }
}

function stripUsage(asset) {
  return {
    ...asset,
    usageRefs: [],
    usageCount: 0,
    usageLoaded: false,
  };
}

export async function listMediaAssetsByHubId(hubId) {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    return [];
  }

  const snapshot = await mediaCollection(normalizedHubId).orderBy("createdAt", "desc").get();

  return snapshot.docs
    .map((doc) => normalizeActiveMediaAsset(doc, normalizedHubId))
    .filter(Boolean)
    .map(stripUsage);
}

export async function listMediaAssetPageByHubId(hubId, options = {}) {
  const normalizedHubId = normalizeString(hubId);
  const limit = Math.min(Math.max(Number.parseInt(String(options.limit || MEDIA_ASSET_PAGE_SIZE), 10) || MEDIA_ASSET_PAGE_SIZE, 1), 96);
  const cursor = decodeMediaAssetCursor(options.cursor);

  if (!normalizedHubId) {
    return {
      assets: [],
      nextCursor: "",
      hasMore: false,
    };
  }

  let query = mediaCollection(normalizedHubId)
    .orderBy("createdAt", "desc")
    .orderBy(FieldPath.documentId(), "desc")
    .limit(limit + 1);

  if (cursor) {
    query = query.startAfter(cursor.createdAt, cursor.id);
  }

  const snapshot = await query.get();
  const rows = snapshot.docs
    .map((doc) => normalizeActiveMediaAsset(doc, normalizedHubId))
    .filter(Boolean)
    .map(stripUsage);
  const assets = rows.slice(0, limit);
  const nextCursor = rows.length > limit ? encodeMediaAssetCursor(assets[assets.length - 1]) : "";

  return {
    assets,
    nextCursor,
    hasMore: Boolean(nextCursor),
  };
}

export async function getMediaAssetById(hubId, assetId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedAssetId = normalizeString(assetId);

  if (!normalizedHubId || !normalizedAssetId) {
    return null;
  }

  const [doc, usageRefs] = await Promise.all([
    mediaCollection(normalizedHubId).doc(normalizedAssetId).get(),
    buildMediaUsageForAssetId(normalizedHubId, normalizedAssetId),
  ]);

  if (!doc.exists) {
    return null;
  }

  const asset = normalizeActiveMediaAsset(doc, normalizedHubId);

  if (!asset) {
    return null;
  }

  return {
    ...asset,
    usageRefs,
    usageCount: usageRefs.length,
    usageLoaded: true,
  };
}

export async function getMediaAssetMetadataById(hubId, assetId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedAssetId = normalizeString(assetId);

  if (!normalizedHubId || !normalizedAssetId) {
    return null;
  }

  const doc = await mediaCollection(normalizedHubId).doc(normalizedAssetId).get();

  if (!doc.exists) {
    return null;
  }

  const asset = normalizeActiveMediaAsset(doc, normalizedHubId);

  return asset ? stripUsage(asset) : null;
}

export async function getMediaAssetUsageById(hubId, assetId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedAssetId = normalizeString(assetId);

  if (!normalizedHubId || !normalizedAssetId) {
    return {
      usageRefs: [],
      usageCount: 0,
      usageVerificationComplete: true,
      failedSources: [],
    };
  }

  const projection = await getMediaUsageProjectionByAssetId(normalizedHubId, normalizedAssetId);

  if (projection) {
    return {
      usageRefs: projection.usageRefs,
      usageCount: projection.usageCount,
      usageVerificationComplete: projection.usageVerificationComplete,
      failedSources: projection.failedSources,
    };
  }

  const usageReport = await buildMediaUsageReportForAssetId(normalizedHubId, normalizedAssetId);

  if (usageReport.complete) {
    await replaceMediaUsageProjectionForAsset(normalizedHubId, normalizedAssetId, usageReport.usageRefs);
  }

  return {
    usageRefs: usageReport.usageRefs,
    usageCount: usageReport.usageRefs.length,
    usageVerificationComplete: usageReport.complete,
    failedSources: usageReport.failedSources,
  };
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
  const docs = await Promise.all(uniqueIds.map((assetId) => mediaCollection(normalizedHubId).doc(assetId).get()));

  return docs
    .filter((doc) => doc.exists)
    .map((doc) => normalizeActiveMediaAsset(doc, normalizedHubId))
    .filter(Boolean)
    .map(stripUsage);
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

  const folderSnapshot = await folderCollection(normalizedHubId).orderBy("name", "asc").get();

  return folderSnapshot.docs.map((doc) =>
    normalizeMediaFolderRecord({
      id: doc.id,
      hubId: normalizedHubId,
      assetCount: 0,
      ...doc.data(),
    })
  );
}
