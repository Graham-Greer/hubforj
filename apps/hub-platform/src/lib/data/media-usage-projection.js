try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import {
  buildMediaUsageByHubId,
  collectSiteSettingsMediaUsageReferences,
  hubRef,
  mediaCollection,
  normalizeActiveMediaAsset,
  normalizeString,
  normalizeUsageRef,
} from "./media-shared.js";

export const MEDIA_USAGE_SCHEMA_VERSION = 1;
const MEDIA_USAGE_BATCH_LIMIT = 400;

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

function serializeProjectionPayload(hubId, assetId, usageRefs = [], now = new Date().toISOString()) {
  const referencesByKey = new Map(
    usageRefs
      .map((ref) => normalizeUsageRef(ref))
      .filter((ref) => normalizeUsageReferenceKey(ref))
      .map((ref) => [normalizeUsageReferenceKey(ref), ref])
  );
  const references = [...referencesByKey.values()];

  return {
    hubId,
    assetId,
    usageCount: references.length,
    references,
    lastReferencedAt: references.length ? now : "",
    updatedAt: now,
    schemaVersion: MEDIA_USAGE_SCHEMA_VERSION,
  };
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

function stableReferenceEntries(value = []) {
  return normalizeReferenceEntries(value)
    .map((ref) => [normalizeUsageReferenceKey(ref), ref])
    .filter(([key]) => key)
    .sort(([left], [right]) => left.localeCompare(right));
}

function referencesAreEqual(leftRefs = [], rightRefs = []) {
  const left = stableReferenceEntries(leftRefs);
  const right = stableReferenceEntries(rightRefs);

  if (left.length !== right.length) {
    return false;
  }

  return left.every(([leftKey, leftRef], index) => {
    const [rightKey, rightRef] = right[index];

    return leftKey === rightKey
      && leftRef.entityType === rightRef.entityType
      && leftRef.entityId === rightRef.entityId
      && leftRef.field === rightRef.field
      && leftRef.label === rightRef.label
      && leftRef.href === rightRef.href;
  });
}

function summarizeIssues(issues = []) {
  const byCode = new Map();

  issues.forEach((issue) => {
    const existing = byCode.get(issue.code) || {
      code: issue.code,
      title: issue.title,
      count: 0,
    };

    existing.count += 1;
    byCode.set(issue.code, existing);
  });

  return [...byCode.values()].sort((left, right) => left.title.localeCompare(right.title));
}

function createIssue(code, title, detail, values = {}) {
  return {
    code,
    title,
    detail,
    ...values,
  };
}

async function listActiveMediaAssetIds(hubId) {
  const snapshot = await mediaCollection(hubId).get();
  const assetIds = snapshot.docs
    .map((doc) => normalizeActiveMediaAsset(doc, hubId))
    .filter(Boolean)
    .map((asset) => asset.id);

  return new Set(assetIds);
}

async function listMediaUsageProjectionDocs(hubId) {
  const snapshot = await mediaUsageCollection(hubId).get();

  return new Map(snapshot.docs.map((doc) => [doc.id, normalizeProjectionDoc(doc, hubId, doc.id)]));
}

async function commitMediaUsageBatch(operations = []) {
  const db = getFirebaseAdminDb();
  let batch = db.batch();
  let pending = 0;

  for (const operation of operations) {
    if (operation.type === "delete") {
      batch.delete(operation.ref);
    } else {
      batch.set(operation.ref, operation.payload, { merge: false });
    }

    pending += 1;

    if (pending >= MEDIA_USAGE_BATCH_LIMIT) {
      await batch.commit();
      batch = db.batch();
      pending = 0;
    }
  }

  if (pending > 0) {
    await batch.commit();
  }
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
  const payload = serializeProjectionPayload(normalizedHubId, normalizedAssetId, usageRefs, now);
  const docRef = mediaUsageCollection(normalizedHubId).doc(normalizedAssetId);
  const db = getFirebaseAdminDb();

  await db.runTransaction(async (transaction) => {
    transaction.set(docRef, payload, { merge: false });
  });

  return {
    hubId: normalizedHubId,
    assetId: normalizedAssetId,
    references: payload.references,
    usageRefs: payload.references,
    usageCount: payload.usageCount,
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

export async function getHubMediaUsageReconciliationReport(hubId) {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    return {
      generatedAt: new Date().toISOString(),
      totalIssues: 0,
      summary: [],
      issues: [],
      expectedRows: 0,
      actualRows: 0,
      sourceReferenceCount: 0,
      missingReferencedAssetCount: 0,
    };
  }

  const generatedAt = new Date().toISOString();
  const [activeAssetIds, projectionsByAssetId, sourceUsageByAssetId] = await Promise.all([
    listActiveMediaAssetIds(normalizedHubId),
    listMediaUsageProjectionDocs(normalizedHubId),
    buildMediaUsageByHubId(normalizedHubId),
  ]);
  const issues = [];
  let sourceReferenceCount = 0;
  let missingReferencedAssetCount = 0;

  sourceUsageByAssetId.forEach((usageRefs, assetId) => {
    const normalizedAssetId = normalizeString(assetId);
    sourceReferenceCount += usageRefs.length;

    if (!activeAssetIds.has(normalizedAssetId)) {
      missingReferencedAssetCount += 1;
      issues.push(createIssue(
        "missing_asset_reference",
        "Source references missing asset",
        `${usageRefs.length} source reference${usageRefs.length === 1 ? "" : "s"} point to missing or inactive asset ${normalizedAssetId}.`,
        {
          assetId: normalizedAssetId,
          sourceReferenceCount: usageRefs.length,
        }
      ));
    }
  });

  activeAssetIds.forEach((assetId) => {
    const expectedRefs = sourceUsageByAssetId.get(assetId) || [];
    const projection = projectionsByAssetId.get(assetId);

    if (!projection) {
      issues.push(createIssue(
        "missing_projection",
        "Missing usage projection",
        `Active asset ${assetId} does not have a mediaUsage projection row.`,
        {
          assetId,
          expectedUsageCount: expectedRefs.length,
        }
      ));
      return;
    }

    if (projection.schemaVersion !== MEDIA_USAGE_SCHEMA_VERSION) {
      issues.push(createIssue(
        "schema_mismatch",
        "Usage projection schema mismatch",
        `Asset ${assetId} has schema ${projection.schemaVersion}; expected ${MEDIA_USAGE_SCHEMA_VERSION}.`,
        {
          assetId,
          actualSchemaVersion: projection.schemaVersion,
          expectedSchemaVersion: MEDIA_USAGE_SCHEMA_VERSION,
        }
      ));
    }

    if (projection.usageCount !== expectedRefs.length) {
      issues.push(createIssue(
        "usage_count_mismatch",
        "Usage count mismatch",
        `Asset ${assetId} projects ${projection.usageCount} references; source scan found ${expectedRefs.length}.`,
        {
          assetId,
          actualUsageCount: projection.usageCount,
          expectedUsageCount: expectedRefs.length,
        }
      ));
    }

    if (!referencesAreEqual(projection.usageRefs, expectedRefs)) {
      issues.push(createIssue(
        "reference_mismatch",
        "Usage reference mismatch",
        `Asset ${assetId} projection references differ from the source scan.`,
        {
          assetId,
          actualUsageCount: projection.usageRefs.length,
          expectedUsageCount: expectedRefs.length,
        }
      ));
    }
  });

  projectionsByAssetId.forEach((projection, assetId) => {
    if (activeAssetIds.has(assetId)) {
      return;
    }

    issues.push(createIssue(
      "orphan_projection",
      "Orphan usage projection",
      `mediaUsage/${assetId} exists but the active media asset does not.`,
      {
        assetId,
        actualUsageCount: projection.usageCount,
      }
    ));
  });

  return {
    generatedAt,
    totalIssues: issues.length,
    summary: summarizeIssues(issues),
    issues,
    expectedRows: activeAssetIds.size,
    actualRows: projectionsByAssetId.size,
    sourceReferenceCount,
    missingReferencedAssetCount,
    schemaVersion: MEDIA_USAGE_SCHEMA_VERSION,
  };
}

export async function rebuildHubMediaUsageProjections(hubId, actorId = "system") {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    return {
      status: "skipped",
      reason: "Hub id is required.",
      assetsScanned: 0,
      projectionsWritten: 0,
      orphanedProjectionsDeleted: 0,
      sourceReferenceCount: 0,
      missingReferencedAssetCount: 0,
      completedAt: new Date().toISOString(),
    };
  }

  const completedAt = new Date().toISOString();
  const [activeAssetIds, projectionsByAssetId, sourceUsageByAssetId] = await Promise.all([
    listActiveMediaAssetIds(normalizedHubId),
    listMediaUsageProjectionDocs(normalizedHubId),
    buildMediaUsageByHubId(normalizedHubId),
  ]);
  const operations = [];
  let sourceReferenceCount = 0;
  let missingReferencedAssetCount = 0;

  sourceUsageByAssetId.forEach((usageRefs, assetId) => {
    sourceReferenceCount += usageRefs.length;

    if (!activeAssetIds.has(normalizeString(assetId))) {
      missingReferencedAssetCount += 1;
    }
  });

  activeAssetIds.forEach((assetId) => {
    operations.push({
      type: "set",
      ref: mediaUsageCollection(normalizedHubId).doc(assetId),
      payload: {
        ...serializeProjectionPayload(normalizedHubId, assetId, sourceUsageByAssetId.get(assetId) || [], completedAt),
        reconciledAt: completedAt,
        reconciledBy: normalizeString(actorId) || "system",
      },
    });
  });

  projectionsByAssetId.forEach((_projection, assetId) => {
    if (activeAssetIds.has(assetId)) {
      return;
    }

    operations.push({
      type: "delete",
      ref: mediaUsageCollection(normalizedHubId).doc(assetId),
    });
  });

  await commitMediaUsageBatch(operations);

  return {
    status: "completed",
    assetsScanned: activeAssetIds.size,
    projectionsWritten: activeAssetIds.size,
    orphanedProjectionsDeleted: Math.max(operations.length - activeAssetIds.size, 0),
    sourceReferenceCount,
    missingReferencedAssetCount,
    completedAt,
    actorId: normalizeString(actorId) || "system",
    schemaVersion: MEDIA_USAGE_SCHEMA_VERSION,
  };
}
