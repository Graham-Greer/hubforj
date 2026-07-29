try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import crypto from "node:crypto";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import {
  normalizeMediaFolderInput,
  normalizeMediaFolderRecord,
} from "@/lib/domain/media";
import { folderCollection, mediaCollection, normalizeString } from "./media-shared.js";

export async function createMediaFolderForHub(hubId, payload, actorId = "system") {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    throw new Error("Hub id is required.");
  }

  const next = normalizeMediaFolderInput(payload);
  const existing = await folderCollection(normalizedHubId).where("slug", "==", next.slug).limit(1).get();

  if (!existing.empty) {
    throw new Error("A folder with that name already exists.");
  }

  const folderId = `folder_${crypto.randomUUID().slice(0, 12)}`;
  const now = new Date().toISOString();
  const record = {
    hubId: normalizedHubId,
    ...next,
    assetCount: 0,
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
    createdBy: actorId,
    updatedBy: actorId,
  };

  await folderCollection(normalizedHubId).doc(folderId).set(record);
  return normalizeMediaFolderRecord({ id: folderId, ...record });
}

export async function updateMediaFolderForHub(hubId, folderId, payload, actorId = "system") {
  const normalizedHubId = normalizeString(hubId);
  const normalizedFolderId = normalizeString(folderId);

  if (!normalizedHubId || !normalizedFolderId) {
    throw new Error("Hub and folder ids are required.");
  }

  const next = normalizeMediaFolderInput(payload);
  const duplicate = await folderCollection(normalizedHubId).where("slug", "==", next.slug).limit(1).get();
  const duplicateDoc = duplicate.docs.find((doc) => doc.id !== normalizedFolderId);

  if (duplicateDoc) {
    throw new Error("A folder with that name already exists.");
  }

  const ref = folderCollection(normalizedHubId).doc(normalizedFolderId);
  const existing = await ref.get();

  if (!existing.exists) {
    throw new Error("Folder not found.");
  }

  const update = {
    ...next,
    updatedAt: new Date().toISOString(),
    updatedBy: actorId,
  };

  await ref.update(update);
  return normalizeMediaFolderRecord({ id: normalizedFolderId, ...existing.data(), ...update });
}

export async function deleteMediaFolderForHub(hubId, folderId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedFolderId = normalizeString(folderId);

  if (!normalizedHubId || !normalizedFolderId) {
    throw new Error("Hub and folder ids are required.");
  }

  const folderRef = folderCollection(normalizedHubId).doc(normalizedFolderId);
  const folderDoc = await folderRef.get();

  if (!folderDoc.exists) {
    throw new Error("Folder not found.");
  }

  const assetSnapshot = await mediaCollection(normalizedHubId).where("folderId", "==", normalizedFolderId).get();
  const batch = getFirebaseAdminDb().batch();
  const now = new Date().toISOString();

  assetSnapshot.docs.forEach((doc) => {
    batch.update(doc.ref, {
      folderId: "",
      updatedAt: now,
      updatedBy: "system",
    });
  });

  batch.delete(folderRef);
  await batch.commit();
}
