function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeInteger(value, fallback = 0) {
  const next = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(next) ? next : fallback;
}

function normalizeNumber(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

export function inferMediaType(contentType, filename = "") {
  const normalizedContentType = normalizeString(contentType).toLowerCase();
  const normalizedFilename = normalizeString(filename).toLowerCase();

  if (normalizedContentType.startsWith("image/")) {
    return "image";
  }

  if (normalizedContentType.startsWith("video/")) {
    return "video";
  }

  if (normalizedContentType === "application/pdf" || normalizedFilename.endsWith(".pdf")) {
    return "pdf";
  }

  return "file";
}

export function sanitizeMediaFilename(filename) {
  const normalizedFilename = normalizeString(filename).toLowerCase();
  if (!normalizedFilename) {
    throw new Error("Filename is required.");
  }

  const cleaned = normalizedFilename
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/-\./g, ".")
    .replace(/^-|-$/g, "");

  return cleaned || "asset";
}

export function slugifyFolderName(name) {
  const normalized = normalizeString(name).toLowerCase();
  if (!normalized) {
    throw new Error("Folder name is required.");
  }

  return normalized
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function normalizeMediaFolderInput(payload = {}) {
  const name = normalizeString(payload.name);

  if (!name) {
    throw new Error("Folder name is required.");
  }

  if (name.length > 50) {
    throw new Error("Folder name must be 50 characters or fewer.");
  }

  return {
    name,
    slug: slugifyFolderName(name),
  };
}

export function normalizeMediaUploadInput(payload) {
  const filename = sanitizeMediaFilename(payload.filename);
  const contentType = normalizeString(payload.contentType).toLowerCase();
  const alt = normalizeString(payload.alt);
  const sizeBytes = normalizeInteger(payload.sizeBytes, 0);
  const folderId = normalizeString(payload.folderId);

  if (!contentType) {
    throw new Error("Media content type is required.");
  }

  if (sizeBytes <= 0) {
    throw new Error("Uploaded media must not be empty.");
  }

  if (sizeBytes > 10 * 1024 * 1024) {
    throw new Error("Uploaded media must be 10 MB or smaller.");
  }

  return {
    filename,
    contentType,
    type: inferMediaType(contentType, filename),
    alt,
    folderId,
    sizeBytes,
  };
}

export function buildMediaStoragePath(hubId, assetId, filename) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedAssetId = normalizeString(assetId);
  const normalizedFilename = sanitizeMediaFilename(filename);

  if (!normalizedHubId || !normalizedAssetId) {
    throw new Error("Hub and asset ids are required to build media storage paths.");
  }

  return `hubs/${normalizedHubId}/media/${normalizedAssetId}/${normalizedFilename}`;
}

export function buildFirebasePublicUrl(bucketName, storagePath, token) {
  const normalizedBucketName = normalizeString(bucketName);
  const normalizedStoragePath = normalizeString(storagePath);
  const normalizedToken = normalizeString(token);

  if (!normalizedBucketName || !normalizedStoragePath || !normalizedToken) {
    throw new Error("Bucket name, storage path, and token are required to build a media URL.");
  }

  return `https://firebasestorage.googleapis.com/v0/b/${normalizedBucketName}/o/${encodeURIComponent(normalizedStoragePath)}?alt=media&token=${normalizedToken}`;
}

export function normalizeMediaAssetRecord(record = {}) {
  return {
    id: normalizeString(record.id),
    hubId: normalizeString(record.hubId),
    filename: normalizeString(record.filename),
    displayName: normalizeString(record.displayName) || normalizeString(record.filename),
    type: inferMediaType(record.contentType || record.type, record.filename),
    contentType: normalizeString(record.contentType).toLowerCase(),
    storagePath: normalizeString(record.storagePath),
    publicUrl: normalizeString(record.publicUrl),
    sizeBytes: normalizeInteger(record.sizeBytes, 0),
    status: normalizeString(record.status) || "active",
    width: normalizeInteger(record.width, 0),
    height: normalizeInteger(record.height, 0),
    alt: normalizeString(record.alt),
    folderId: normalizeString(record.folderId),
    usageRefs: Array.isArray(record.usageRefs) ? record.usageRefs.filter(Boolean) : [],
    usageCount: normalizeInteger(record.usageCount, 0),
    createdAt: normalizeString(record.createdAt),
    updatedAt: normalizeString(record.updatedAt),
    createdBy: normalizeString(record.createdBy),
    updatedBy: normalizeString(record.updatedBy),
  };
}

export function normalizeMediaFolderRecord(record = {}) {
  return {
    id: normalizeString(record.id),
    hubId: normalizeString(record.hubId),
    name: normalizeString(record.name),
    slug: normalizeString(record.slug),
    assetCount: normalizeInteger(record.assetCount, 0),
    sortOrder: normalizeInteger(record.sortOrder, 0),
    createdAt: normalizeString(record.createdAt),
    updatedAt: normalizeString(record.updatedAt),
    createdBy: normalizeString(record.createdBy),
    updatedBy: normalizeString(record.updatedBy),
  };
}

export function getMediaFilterType(type) {
  const normalized = normalizeString(type).toLowerCase();

  if (normalized === "image" || normalized === "video") {
    return normalized;
  }

  if (normalized === "pdf" || normalized === "file") {
    return "doc";
  }

  return "all";
}

export function formatMediaFileSize(sizeBytes) {
  const normalized = normalizeNumber(sizeBytes, 0);

  if (normalized <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  let value = normalized;
  let index = 0;

  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }

  const rounded = value >= 100 || index === 0
    ? Math.round(value)
    : Number.isInteger(value)
      ? Math.round(value)
      : value.toFixed(1);
  return `${rounded} ${units[index]}`;
}
