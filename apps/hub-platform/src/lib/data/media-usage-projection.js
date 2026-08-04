try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { collectSiteSettingsMediaUsageReferences, hubRef, normalizeString, normalizeUsageRef } from "./media-shared.js";

const MEDIA_USAGE_SCHEMA_VERSION = 1;

function mediaUsageCollection(hubId) {
  return hubRef(hubId).collection("mediaUsage");
}

function normalizeUsageReferenceKey(ref = {}) {
  const usageRef = normalizeUsageRef(ref);
  const parts = [usageRef.entityType, usageRef.entityId, usageRef.field].map((part) => encodeURIComponent(normalizeString(part)));
  return parts.every(Boolean) ? parts.join("__") : "";
}

function normalizeReferenceEntries(value) {
  if (Array.isArray(value)) {
    return value.map((ref) => normalizeUsageRef(ref)).filter((ref) => normalizeUsageReferenceKey(ref));
  }

  if (value && typeof value === "object") {
    return Object.values(value).map((ref) => normalizeUsageRef(ref)).filter((ref) => normalizeUsageReferenceKey(ref));
  }

  return [];
}

function normalizeProjectionDoc(doc, hubId, assetId) {
  const data = doc?.exists ? doc.data() : {};
  const references = normalizeReferenceEntries(data?.references);

  return {
    hubId,
    assetId,
    references,
    usageRefs: references,
    usageCount: references.length,
    usageVerificationComplete: true,
    failedSources: [],
    schemaVersion: Number.parseInt(String(data?.schemaVersion || MEDIA_USAGE_SCHEMA_VERSION), 10) || MEDIA_USAGE_SCHEMA_VERSION,
    updatedAt: normalizeString(data?.updatedAt),
  };
}

function buildReferenceMap(doc) {
  return new Map(
    normalizeReferenceEntries(doc?.exists ? doc.data()?.references : []).map((ref) => [normalizeUsageReferenceKey(ref), ref])
  );
}

async function writeReferenceMap(transaction, docRef, hubId, assetId, referencesByKey, now) {
  const references = [...referencesByKey.values()];

  transaction.set(docRef, {
    hubId,
    assetId,
    usageCount: references.length,
    references,
    lastReferencedAt: references.length ? now : "",
    updatedAt: now,
    schemaVersion: MEDIA_USAGE_SCHEMA_VERSION,
  }, { merge: false });
}

export function createMediaUsageReference({ entityType, entityId, field = "media", label = "", href = "" } = {}) {
  return normalizeUsageRef({ entityType, entityId, field, label, href });
}

export async function getMediaUsageProjectionByAssetId(hubId, assetId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedAssetId = normalizeString(assetId);

  if (!normalizedHubId || !normalizedAssetId) {
    return null;
  }

  const doc = await mediaUsageCollection(normalizedHubId).doc(normalizedAssetId).get();
  return doc.exists ? normalizeProjectionDoc(doc, normalizedHubId, normalizedAssetId) : null;
}

export async function replaceMediaUsageProjectionForAsset(hubId, assetId, usageRefs = [], options = {}) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedAssetId = normalizeString(assetId);

  if (!normalizedHubId || !normalizedAssetId) {
    return null;
  }

  const now = normalizeString(options.updatedAt) || new Date().toISOString();
  const referencesByKey = new Map(
    usageRefs
      .map((ref) => normalizeUsageRef(ref))
      .filter((ref) => normalizeUsageReferenceKey(ref))
      .map((ref) => [normalizeUsageReferenceKey(ref), ref])
  );
  const docRef = mediaUsageCollection(normalizedHubId).doc(normalizedAssetId);
  const db = getFirebaseAdminDb();

  await db.runTransaction(async (transaction) => {
    await writeReferenceMap(transaction, docRef, normalizedHubId, normalizedAssetId, referencesByKey, now);
  });

  return {
    hubId: normalizedHubId,
    assetId: normalizedAssetId,
    references: [...referencesByKey.values()],
    usageRefs: [...referencesByKey.values()],
    usageCount: referencesByKey.size,
    usageVerificationComplete: true,
    failedSources: [],
    schemaVersion: MEDIA_USAGE_SCHEMA_VERSION,
    updatedAt: now,
  };
}

export async function deleteMediaUsageProjectionForAsset(hubId, assetId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedAssetId = normalizeString(assetId);

  if (!normalizedHubId || !normalizedAssetId) {
    return;
  }

  await mediaUsageCollection(normalizedHubId).doc(normalizedAssetId).delete();
}

export async function syncMediaUsageReferenceForAssetChange({
  hubId,
  previousAssetId = "",
  nextAssetId = "",
  usageRef,
  updatedAt = "",
} = {}) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedPreviousAssetId = normalizeString(previousAssetId);
  const normalizedNextAssetId = normalizeString(nextAssetId);
  const normalizedUsageRef = normalizeUsageRef(usageRef);
  const usageKey = normalizeUsageReferenceKey(normalizedUsageRef);

  if (!normalizedHubId || !usageKey || (!normalizedPreviousAssetId && !normalizedNextAssetId)) {
    return;
  }

  const now = normalizeString(updatedAt) || new Date().toISOString();
  const db = getFirebaseAdminDb();
  const touchedAssetIds = [...new Set([normalizedPreviousAssetId, normalizedNextAssetId].filter(Boolean))];
  const refsByAssetId = new Map(touchedAssetIds.map((assetId) => [assetId, mediaUsageCollection(normalizedHubId).doc(assetId)]));

  await db.runTransaction(async (transaction) => {
    const docsByAssetId = new Map();

    await Promise.all(touchedAssetIds.map(async (assetId) => {
      docsByAssetId.set(assetId, await transaction.get(refsByAssetId.get(assetId)));
    }));

    for (const assetId of touchedAssetIds) {
      const referencesByKey = buildReferenceMap(docsByAssetId.get(assetId));

      if (assetId === normalizedPreviousAssetId) {
        referencesByKey.delete(usageKey);
      }

      if (assetId === normalizedNextAssetId) {
        referencesByKey.set(usageKey, normalizedUsageRef);
      }

      await writeReferenceMap(transaction, refsByAssetId.get(assetId), normalizedHubId, assetId, referencesByKey, now);
    }
  });
}

export async function removeMediaUsageReference({
  hubId,
  assetId,
  usageRef,
  updatedAt = "",
} = {}) {
  return syncMediaUsageReferenceForAssetChange({
    hubId,
    previousAssetId: assetId,
    nextAssetId: "",
    usageRef,
    updatedAt,
  });
}

export async function syncSiteSettingsMediaUsageProjection(hubId, previousSettings = {}, nextSettings = {}, options = {}) {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    return;
  }

  const now = normalizeString(options.updatedAt) || new Date().toISOString();
  const previousRefs = collectSiteSettingsMediaUsageReferences(previousSettings);
  const nextRefs = collectSiteSettingsMediaUsageReferences(nextSettings);
  const refsByKey = new Map();

  previousRefs.forEach(({ assetId, usageRef }) => {
    const usageKey = normalizeUsageReferenceKey(usageRef);

    if (!usageKey) {
      return;
    }

    refsByKey.set(usageKey, {
      usageRef,
      previousAssetId: assetId,
      nextAssetId: "",
    });
  });

  nextRefs.forEach(({ assetId, usageRef }) => {
    const usageKey = normalizeUsageReferenceKey(usageRef);

    if (!usageKey) {
      return;
    }

    const existing = refsByKey.get(usageKey) || {
      usageRef,
      previousAssetId: "",
      nextAssetId: "",
    };

    refsByKey.set(usageKey, {
      ...existing,
      usageRef,
      nextAssetId: assetId,
    });
  });

  await Promise.all(
    [...refsByKey.values()].map((change) =>
      syncMediaUsageReferenceForAssetChange({
        hubId: normalizedHubId,
        previousAssetId: change.previousAssetId,
        nextAssetId: change.nextAssetId,
        usageRef: change.usageRef,
        updatedAt: now,
      })
    )
  );
}
