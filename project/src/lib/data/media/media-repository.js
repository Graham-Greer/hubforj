try {
  await import("server-only");
} catch {
  // Unit tests run in plain Node where this package may not be installed.
}
import crypto from "node:crypto";
import { getDataProvider } from "../shared/provider.js";
import { getFirebaseAdminStorage } from "../../firebase/admin.js";

const SYSTEM_FOLDER_ID = "all-assets";
const SYSTEM_FOLDER_NAME = "All assets";

function nowIso() {
  return new Date().toISOString();
}

function normalizeFolderName(value) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    throw new Error("Folder name is required.");
  }
  return normalized;
}

function folderToViewModel(folder, hubId) {
  return {
    id: folder.id,
    hubId,
    name: folder.name,
    system: Boolean(folder.system) || folder.id === SYSTEM_FOLDER_ID,
    createdAt: folder.createdAt || null,
    updatedAt: folder.updatedAt || null,
    createdByUserId: folder.createdByUserId || null,
  };
}

function ensureSystemFolder(folders, hubId) {
  const existing = folders.find((folder) => folder.id === SYSTEM_FOLDER_ID);
  if (existing) {
    return folders.map((folder) =>
      folder.id === SYSTEM_FOLDER_ID
        ? { ...folder, name: SYSTEM_FOLDER_NAME, system: true, hubId }
        : folder
    );
  }

  return [
    {
      id: SYSTEM_FOLDER_ID,
      hubId,
      name: SYSTEM_FOLDER_NAME,
      system: true,
      createdAt: null,
      updatedAt: null,
      createdByUserId: null,
    },
    ...folders,
  ];
}

function mediaToViewModel(media) {
  return {
    id: media.id,
    hubId: media.hubId,
    filename: media.filename,
    type: media.type,
    publicUrl: media.publicUrl || media.url || "",
    contentType: media.contentType || "",
    sizeBytes: Number(media.sizeBytes || 0),
    width: media.width ? Number(media.width) : null,
    height: media.height ? Number(media.height) : null,
    folderId: media.folderId || SYSTEM_FOLDER_ID,
    alt: media.alt || "",
    usageRefs: Array.isArray(media.usageRefs) ? media.usageRefs : [],
    usageCount: Number(media.usageCount || 0),
    status: media.status || "active",
    createdAt: media.createdAt,
    updatedAt: media.updatedAt || null,
  };
}

function buildMediaInUseError(media) {
  const error = new Error("Cannot delete media while it is still referenced by published content.");
  error.code = "MEDIA_IN_USE";
  error.usageCount = media.usageCount || 0;
  error.usageRefs = media.usageRefs || [];
  return error;
}

async function normalizeUploadItem(item, index) {
  const filename = String(item?.filename || item?.name || "").trim();
  if (!filename) {
    throw new Error(`Upload item ${index + 1} is missing filename.`);
  }

  const contentType = String(item?.contentType || item?.type || "").trim().toLowerCase();
  const type = contentType.startsWith("video/")
    ? "video"
    : contentType === "application/pdf"
      ? "pdf"
      : "image";

  let bytes = null;
  if (typeof item?.arrayBuffer === "function") {
    bytes = Buffer.from(await item.arrayBuffer());
  } else if (item?.bytes) {
    bytes = Buffer.isBuffer(item.bytes) ? item.bytes : Buffer.from(item.bytes);
  }

  return {
    filename,
    contentType,
    sizeBytes: Number(item?.sizeBytes || item?.size || 0),
    type,
    bytes,
  };
}

function toPublicUrl(bucketName, storagePath) {
  return `https://storage.googleapis.com/${bucketName}/${encodeURI(storagePath)}`;
}

async function ensureSystemFolderExists(provider, hubId) {
  const timestamp = nowIso();

  if (provider.type === "firestore") {
    const ref = provider.db.collection("hubs").doc(hubId).collection("mediaFolders").doc(SYSTEM_FOLDER_ID);
    const existing = await ref.get();
    if (!existing.exists) {
      await ref.set({
        hubId,
        name: SYSTEM_FOLDER_NAME,
        system: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }
    return;
  }

  const folders = provider.db.mediaFolders.get(hubId) || [];
  if (!folders.some((folder) => folder.id === SYSTEM_FOLDER_ID)) {
    provider.db.mediaFolders.set(hubId, [
      {
        id: SYSTEM_FOLDER_ID,
        hubId,
        name: SYSTEM_FOLDER_NAME,
        system: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      ...folders,
    ]);
  }
}

export async function listMediaFoldersByHub(hubId) {
  const provider = getDataProvider();
  await ensureSystemFolderExists(provider, hubId);

  if (provider.type === "firestore") {
    const snapshot = await provider.db
      .collection("hubs")
      .doc(hubId)
      .collection("mediaFolders")
      .orderBy("name", "asc")
      .get();

    const folders = snapshot.docs.map((doc) => folderToViewModel({ id: doc.id, ...doc.data() }, hubId));
    return ensureSystemFolder(folders, hubId);
  }

  const rows = provider.db.mediaFolders.get(hubId) || [];
  const folders = rows.map((row) => folderToViewModel(row, hubId));
  return ensureSystemFolder(folders, hubId);
}

export async function createMediaFolder(hubId, payload, actorId = "system") {
  const provider = getDataProvider();
  await ensureSystemFolderExists(provider, hubId);

  const name = normalizeFolderName(payload?.name);
  const timestamp = nowIso();

  if (provider.type === "firestore") {
    const ref = provider.db.collection("hubs").doc(hubId).collection("mediaFolders").doc();
    const row = {
      hubId,
      name,
      system: false,
      createdAt: timestamp,
      updatedAt: timestamp,
      createdByUserId: actorId,
    };
    await ref.set(row);
    return folderToViewModel({ id: ref.id, ...row }, hubId);
  }

  const folders = provider.db.mediaFolders.get(hubId) || [];
  const next = {
    id: `folder_${crypto.randomUUID().slice(0, 8)}`,
    hubId,
    name,
    system: false,
    createdAt: timestamp,
    updatedAt: timestamp,
    createdByUserId: actorId,
  };
  provider.db.mediaFolders.set(hubId, [...folders, next]);
  return folderToViewModel(next, hubId);
}

export async function updateMediaFolder(hubId, folderId, payload) {
  const provider = getDataProvider();
  await ensureSystemFolderExists(provider, hubId);

  if (!folderId || folderId === SYSTEM_FOLDER_ID) {
    throw new Error("The system folder cannot be renamed.");
  }

  const name = normalizeFolderName(payload?.name);
  const timestamp = nowIso();

  if (provider.type === "firestore") {
    const ref = provider.db.collection("hubs").doc(hubId).collection("mediaFolders").doc(folderId);
    const existing = await ref.get();
    if (!existing.exists) {
      throw new Error("Media folder not found.");
    }
    if (existing.data()?.system) {
      throw new Error("The system folder cannot be renamed.");
    }

    await ref.update({ name, updatedAt: timestamp });
    const updated = await ref.get();
    return folderToViewModel({ id: updated.id, ...updated.data() }, hubId);
  }

  const folders = provider.db.mediaFolders.get(hubId) || [];
  const index = folders.findIndex((folder) => folder.id === folderId);
  if (index < 0) {
    throw new Error("Media folder not found.");
  }
  if (folders[index].system) {
    throw new Error("The system folder cannot be renamed.");
  }

  const next = { ...folders[index], name, updatedAt: timestamp };
  const clone = [...folders];
  clone[index] = next;
  provider.db.mediaFolders.set(hubId, clone);

  return folderToViewModel(next, hubId);
}

export async function deleteMediaFolder(hubId, folderId) {
  const provider = getDataProvider();
  await ensureSystemFolderExists(provider, hubId);

  if (!folderId || folderId === SYSTEM_FOLDER_ID) {
    throw new Error("The system folder cannot be deleted.");
  }

  const timestamp = nowIso();

  if (provider.type === "firestore") {
    const folderRef = provider.db.collection("hubs").doc(hubId).collection("mediaFolders").doc(folderId);
    const existing = await folderRef.get();
    if (!existing.exists) {
      throw new Error("Media folder not found.");
    }
    if (existing.data()?.system) {
      throw new Error("The system folder cannot be deleted.");
    }

    const mediaSnapshot = await provider.db
      .collection("hubs")
      .doc(hubId)
      .collection("media")
      .where("folderId", "==", folderId)
      .get();

    await Promise.all(
      mediaSnapshot.docs.map((doc) =>
        doc.ref.update({
          folderId: SYSTEM_FOLDER_ID,
          updatedAt: timestamp,
        })
      )
    );

    await folderRef.delete();
    return { movedAssetCount: mediaSnapshot.docs.length };
  }

  const folders = provider.db.mediaFolders.get(hubId) || [];
  const folder = folders.find((item) => item.id === folderId);
  if (!folder) {
    throw new Error("Media folder not found.");
  }
  if (folder.system) {
    throw new Error("The system folder cannot be deleted.");
  }

  const media = provider.db.media.get(hubId) || [];
  const movedAssetCount = media.filter((item) => item.folderId === folderId).length;
  provider.db.media.set(
    hubId,
    media.map((item) =>
      item.folderId === folderId ? { ...item, folderId: SYSTEM_FOLDER_ID, updatedAt: timestamp } : item
    )
  );

  provider.db.mediaFolders.set(
    hubId,
    folders.filter((item) => item.id !== folderId)
  );

  return { movedAssetCount };
}

export async function listMediaByHub(hubId, options = {}) {
  const provider = getDataProvider();
  await ensureSystemFolderExists(provider, hubId);

  const includeDeleted = Boolean(options.includeDeleted);

  let rows;
  if (provider.type === "firestore") {
    const snapshot = await provider.db
      .collection("hubs")
      .doc(hubId)
      .collection("media")
      .orderBy("createdAt", "desc")
      .get();

    rows = snapshot.docs.map((doc) => mediaToViewModel({ id: doc.id, hubId, ...doc.data() }));
  } else {
    const records = provider.db.media.get(hubId) || [];
    rows = records.map(mediaToViewModel);
  }

  if (!includeDeleted) {
    rows = rows.filter((item) => item.status !== "deleted");
  }

  return rows;
}

export async function getMediaByIds(hubId, ids = []) {
  const all = await listMediaByHub(hubId);
  const requested = new Set(ids.map((item) => String(item || "").trim()).filter(Boolean));
  return all.filter((item) => requested.has(item.id));
}

export async function updateMediaAsset(hubId, mediaId, patch = {}) {
  const provider = getDataProvider();
  await ensureSystemFolderExists(provider, hubId);

  const nextPatch = {};
  if (Object.hasOwn(patch, "alt")) {
    nextPatch.alt = String(patch.alt || "").trim();
  }

  if (Object.hasOwn(patch, "folderId")) {
    const folderId = String(patch.folderId || "").trim() || SYSTEM_FOLDER_ID;
    if (folderId !== SYSTEM_FOLDER_ID) {
      const folders = await listMediaFoldersByHub(hubId);
      if (!folders.some((folder) => folder.id === folderId)) {
        throw new Error("Target folder does not exist.");
      }
    }
    nextPatch.folderId = folderId;
  }

  nextPatch.updatedAt = nowIso();

  if (provider.type === "firestore") {
    const ref = provider.db.collection("hubs").doc(hubId).collection("media").doc(mediaId);
    const existing = await ref.get();
    if (!existing.exists) {
      throw new Error("Media asset not found.");
    }

    await ref.update(nextPatch);
    const updated = await ref.get();
    return mediaToViewModel({ id: updated.id, hubId, ...updated.data() });
  }

  const records = provider.db.media.get(hubId) || [];
  const index = records.findIndex((item) => item.id === mediaId);
  if (index < 0) {
    throw new Error("Media asset not found.");
  }

  const next = { ...records[index], ...nextPatch };
  const clone = [...records];
  clone[index] = next;
  provider.db.media.set(hubId, clone);
  return mediaToViewModel(next);
}

export async function uploadMediaAssets(hubId, files = [], options = {}, actorId = "system") {
  const provider = getDataProvider();
  await ensureSystemFolderExists(provider, hubId);

  const folderId = String(options.folderId || "").trim() || SYSTEM_FOLDER_ID;
  if (folderId !== SYSTEM_FOLDER_ID) {
    const folders = await listMediaFoldersByHub(hubId);
    if (!folders.some((folder) => folder.id === folderId)) {
      throw new Error("Target folder does not exist.");
    }
  }

  const timestamp = nowIso();
  const normalized = await Promise.all(files.map((item, index) => normalizeUploadItem(item, index)));

  if (provider.type === "firestore") {
    const collection = provider.db.collection("hubs").doc(hubId).collection("media");
    const bucket = getFirebaseAdminStorage().bucket();
    const bucketName = String(bucket.name || "").trim();
    if (!bucketName) {
      throw new Error("Firebase Storage bucket is not configured.");
    }
    const rows = [];

    for (const item of normalized) {
      const ref = collection.doc();
      const storagePath = `hubs/${hubId}/media/${ref.id}/${item.filename}`;
      if (!item.bytes) {
        throw new Error("Missing file payload for upload.");
      }

      await bucket.file(storagePath).save(item.bytes, {
        resumable: false,
        contentType: item.contentType || undefined,
        metadata: {
          contentType: item.contentType || undefined,
          cacheControl: "public,max-age=31536000,immutable",
        },
      });

      const row = {
        hubId,
        filename: item.filename,
        type: item.type,
        contentType: item.contentType,
        sizeBytes: item.sizeBytes,
        storagePath,
        publicUrl: toPublicUrl(bucketName, storagePath),
        folderId,
        alt: "",
        usageRefs: [],
        usageCount: 0,
        status: "active",
        createdAt: timestamp,
        updatedAt: timestamp,
        createdByUserId: actorId,
      };
      await ref.set(row);
      rows.push(mediaToViewModel({ id: ref.id, ...row }));
    }

    return rows;
  }

  const rows = provider.db.media.get(hubId) || [];
  const created = normalized.map((item) => {
    const id = `media_${crypto.randomUUID().slice(0, 8)}`;
    return {
      id,
      hubId,
      filename: item.filename,
      type: item.type,
      contentType: item.contentType,
      sizeBytes: item.sizeBytes,
      storagePath: `hubs/${hubId}/media/${id}/${item.filename}`,
      publicUrl: `https://example.invalid/hubs/${hubId}/media/${id}/${item.filename}`,
      folderId,
      alt: "",
      usageRefs: [],
      usageCount: 0,
      status: "active",
      createdAt: timestamp,
      updatedAt: timestamp,
      createdByUserId: actorId,
    };
  });

  provider.db.media.set(hubId, [...created, ...rows]);
  return created.map(mediaToViewModel);
}

export async function deleteMediaAsset(hubId, mediaId, options = {}) {
  const provider = getDataProvider();
  const hardDelete = Boolean(options.hardDelete);

  if (provider.type === "firestore") {
    const ref = provider.db.collection("hubs").doc(hubId).collection("media").doc(mediaId);
    const existing = await ref.get();
    if (!existing.exists) {
      throw new Error("Media asset not found.");
    }

    const media = mediaToViewModel({ id: existing.id, hubId, ...existing.data() });
    if (media.usageCount > 0) {
      throw buildMediaInUseError(media);
    }

    if (hardDelete) {
      await ref.delete();
      return { deleted: true, hardDelete: true };
    }

    await ref.update({ status: "deleted", updatedAt: nowIso() });
    return { deleted: true, hardDelete: false };
  }

  const records = provider.db.media.get(hubId) || [];
  const index = records.findIndex((item) => item.id === mediaId);
  if (index < 0) {
    throw new Error("Media asset not found.");
  }

  const media = mediaToViewModel(records[index]);
  if (media.usageCount > 0) {
    throw buildMediaInUseError(media);
  }

  if (hardDelete) {
    provider.db.media.set(hubId, records.filter((item) => item.id !== mediaId));
    return { deleted: true, hardDelete: true };
  }

  const next = { ...records[index], status: "deleted", updatedAt: nowIso() };
  const clone = [...records];
  clone[index] = next;
  provider.db.media.set(hubId, clone);
  return { deleted: true, hardDelete: false };
}

export { SYSTEM_FOLDER_ID, SYSTEM_FOLDER_NAME };
