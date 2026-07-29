try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import crypto from "node:crypto";
import { getPublicEnv } from "@/lib/config/env";
import { getFirebaseAdminStorage } from "@/lib/firebase/admin";
import {
  buildFirebasePublicUrl,
  buildMediaStoragePath,
  normalizeMediaAssetRecord,
  normalizeMediaUploadInput,
} from "@/lib/domain/media";
import { folderCollection, mediaCollection, normalizeString } from "./media-shared.js";
import { getMediaAssetById } from "./media-queries.js";

export async function updateMediaAssetForHub(hubId, assetId, payload, actorId = "system") {
  const normalizedHubId = normalizeString(hubId);
  const normalizedAssetId = normalizeString(assetId);

  if (!normalizedHubId || !normalizedAssetId) {
    throw new Error("Hub and asset ids are required.");
  }

  const ref = mediaCollection(normalizedHubId).doc(normalizedAssetId);
  const existing = await ref.get();

  if (!existing.exists) {
    throw new Error("Asset not found.");
  }

  const alt = normalizeString(payload.alt);
  const folderId = normalizeString(payload.folderId);
  const displayName = normalizeString(payload.displayName);

  if (folderId) {
    const folderDoc = await folderCollection(normalizedHubId).doc(folderId).get();

    if (!folderDoc.exists) {
      throw new Error("Destination folder not found.");
    }
  }

  const update = {
    alt,
    folderId,
    displayName: displayName || normalizeString(existing.data()?.filename),
    updatedAt: new Date().toISOString(),
    updatedBy: actorId,
  };

  await ref.update(update);
  return normalizeMediaAssetRecord({ id: normalizedAssetId, hubId: normalizedHubId, ...existing.data(), ...update });
}

export async function deleteMediaAssetForHub(hubId, assetId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedAssetId = normalizeString(assetId);

  if (!normalizedHubId || !normalizedAssetId) {
    throw new Error("Hub and asset ids are required.");
  }

  const asset = await getMediaAssetById(normalizedHubId, normalizedAssetId);

  if (!asset) {
    throw new Error("Asset not found.");
  }

  if (asset.usageCount > 0) {
    throw new Error("This asset is still in use and cannot be deleted.");
  }

  const bucketName = getPublicEnv().firebaseStorageBucket;
  await getFirebaseAdminStorage().bucket(bucketName).file(asset.storagePath).delete({ ignoreNotFound: true });
  await mediaCollection(normalizedHubId).doc(normalizedAssetId).delete();
}

export async function uploadMediaAssetForHub(hubId, payload, actorId = "system") {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    throw new Error("Hub id is required.");
  }

  const normalized = normalizeMediaUploadInput(payload);

  if (normalized.folderId) {
    const folderDoc = await folderCollection(normalizedHubId).doc(normalized.folderId).get();

    if (!folderDoc.exists) {
      throw new Error("Destination folder not found.");
    }
  }

  const assetId = `asset_${crypto.randomUUID().slice(0, 12)}`;
  const storagePath = buildMediaStoragePath(normalizedHubId, assetId, normalized.filename);
  const downloadToken = crypto.randomUUID();
  const now = new Date().toISOString();
  const bucketName = getPublicEnv().firebaseStorageBucket;
  const file = getFirebaseAdminStorage().bucket(bucketName).file(storagePath);

  await file.save(payload.buffer, {
    resumable: false,
    metadata: {
      contentType: normalized.contentType,
      cacheControl: "public,max-age=31536000,immutable",
      metadata: {
        firebaseStorageDownloadTokens: downloadToken,
      },
    },
  });

  const record = {
    hubId: normalizedHubId,
    filename: normalized.filename,
    displayName: normalized.filename,
    type: normalized.type,
    contentType: normalized.contentType,
    storagePath,
    publicUrl: buildFirebasePublicUrl(bucketName, storagePath, downloadToken),
    sizeBytes: normalized.sizeBytes,
    status: "active",
    folderId: normalized.folderId,
    alt: normalized.alt,
    usageRefs: [],
    usageCount: 0,
    createdAt: now,
    updatedAt: now,
    createdBy: actorId,
    updatedBy: actorId,
  };

  await mediaCollection(normalizedHubId).doc(assetId).set(record);
  return normalizeMediaAssetRecord({ id: assetId, ...record });
}
