try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import crypto from "node:crypto";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { buildBookingNotificationDedupeKey, isBookingNotificationKind } from "@/lib/domain/booking-notifications";

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeLowerString(value) {
  return normalizeString(value).toLowerCase();
}

function normalizeEmail(value) {
  return normalizeLowerString(value);
}

function normalizeInteger(value, fallback = 0) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeIsoString(value) {
  const normalized = normalizeString(value);

  if (!normalized) {
    return "";
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
}

function normalizeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? { ...value } : {};
}

const notificationOutboxStatuses = new Set([
  "pending",
  "processing",
  "sent",
  "failed",
  "cancelled",
  "suppressed",
]);

export function normalizeNotificationOutboxStatus(value, fallback = "pending") {
  const normalized = normalizeLowerString(value);
  return notificationOutboxStatuses.has(normalized) ? normalized : fallback;
}

export function buildNotificationOutboxDocumentId(dedupeKey) {
  const normalizedDedupeKey = normalizeString(dedupeKey);

  if (!normalizedDedupeKey) {
    return "";
  }

  return `notification_${crypto.createHash("sha256").update(normalizedDedupeKey).digest("hex").slice(0, 32)}`;
}

export function normalizeNotificationOutboxRecord(record = {}) {
  return {
    id: normalizeString(record.id),
    hubId: normalizeString(record.hubId),
    kind: normalizeString(record.kind),
    sourceType: normalizeString(record.sourceType),
    sourceId: normalizeString(record.sourceId),
    parentType: normalizeString(record.parentType),
    parentId: normalizeString(record.parentId),
    recipientRole: normalizeString(record.recipientRole) || "member",
    recipientUserId: normalizeString(record.recipientUserId),
    recipientEmail: normalizeEmail(record.recipientEmail),
    dedupeKey: normalizeString(record.dedupeKey),
    payloadVersion: normalizeInteger(record.payloadVersion, 1),
    payload: normalizeObject(record.payload),
    status: normalizeNotificationOutboxStatus(record.status),
    provider: normalizeString(record.provider),
    providerMessageId: normalizeString(record.providerMessageId),
    scheduledFor: normalizeIsoString(record.scheduledFor),
    sentAt: normalizeIsoString(record.sentAt),
    failedAt: normalizeIsoString(record.failedAt),
    cancelledAt: normalizeIsoString(record.cancelledAt),
    suppressedAt: normalizeIsoString(record.suppressedAt),
    processingStartedAt: normalizeIsoString(record.processingStartedAt),
    processorRunId: normalizeString(record.processorRunId),
    attemptCount: normalizeInteger(record.attemptCount, 0),
    lastAttemptAt: normalizeIsoString(record.lastAttemptAt),
    lastError: normalizeString(record.lastError),
    createdAt: normalizeIsoString(record.createdAt),
    updatedAt: normalizeIsoString(record.updatedAt),
    createdBy: normalizeString(record.createdBy),
    updatedBy: normalizeString(record.updatedBy),
  };
}

function buildNotificationOutboxWriteModel(hubId, payload = {}, actorId = "system", existing = null, now = new Date().toISOString()) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedKind = normalizeString(payload.kind);
  const normalizedSourceType = normalizeString(payload.sourceType);
  const normalizedSourceId = normalizeString(payload.sourceId);
  const normalizedParentType = normalizeString(payload.parentType);
  const normalizedParentId = normalizeString(payload.parentId);
  const normalizedRecipientRole = normalizeString(payload.recipientRole) || "member";
  const normalizedRecipientUserId = normalizeString(payload.recipientUserId);
  const normalizedRecipientEmail = normalizeEmail(payload.recipientEmail);
  const dedupeKey =
    normalizeString(payload.dedupeKey) ||
    buildBookingNotificationDedupeKey({
      kind: normalizedKind,
      hubId: normalizedHubId,
      sourceType: normalizedSourceType,
      sourceId: normalizedSourceId,
      parentType: normalizedParentType,
      parentId: normalizedParentId,
      recipientUserId: normalizedRecipientUserId,
      recipientEmail: normalizedRecipientEmail,
      scheduledFor: payload.scheduledFor,
    });

  const normalizedExisting = existing ? normalizeNotificationOutboxRecord(existing) : null;
  const defaultStatus = normalizedExisting?.status || "pending";

  return {
    hubId: normalizedHubId,
    kind: normalizedKind,
    sourceType: normalizedSourceType,
    sourceId: normalizedSourceId,
    parentType: normalizedParentType,
    parentId: normalizedParentId,
    recipientRole: normalizedRecipientRole,
    recipientUserId: normalizedRecipientUserId,
    recipientEmail: normalizedRecipientEmail,
    dedupeKey,
    payloadVersion: normalizeInteger(payload.payloadVersion, normalizedExisting?.payloadVersion || 1),
    payload: normalizeObject(payload.payload),
    status: normalizeNotificationOutboxStatus(payload.status, defaultStatus),
    provider: normalizeString(payload.provider || normalizedExisting?.provider),
    providerMessageId: normalizeString(payload.providerMessageId || normalizedExisting?.providerMessageId),
    scheduledFor: normalizeIsoString(payload.scheduledFor) || normalizedExisting?.scheduledFor || now,
    sentAt: normalizeIsoString(payload.sentAt || normalizedExisting?.sentAt),
    failedAt: normalizeIsoString(payload.failedAt || normalizedExisting?.failedAt),
    cancelledAt: normalizeIsoString(payload.cancelledAt || normalizedExisting?.cancelledAt),
    suppressedAt: normalizeIsoString(payload.suppressedAt || normalizedExisting?.suppressedAt),
    processingStartedAt: normalizeIsoString(payload.processingStartedAt || normalizedExisting?.processingStartedAt),
    processorRunId: normalizeString(payload.processorRunId || normalizedExisting?.processorRunId),
    attemptCount: normalizeInteger(
      payload.attemptCount,
      normalizedExisting?.attemptCount || 0
    ),
    lastAttemptAt: normalizeIsoString(payload.lastAttemptAt || normalizedExisting?.lastAttemptAt),
    lastError: normalizeString(payload.lastError || normalizedExisting?.lastError),
    createdAt: normalizedExisting?.createdAt || now,
    updatedAt: now,
    createdBy: normalizedExisting?.createdBy || normalizeString(actorId) || "system",
    updatedBy: normalizeString(actorId) || "system",
  };
}

function getNotificationOutboxCollectionGroup() {
  return getFirebaseAdminDb().collectionGroup("notificationOutbox");
}

export function getNotificationOutboxCollection(hubId) {
  return getFirebaseAdminDb().collection("hubs").doc(hubId).collection("notificationOutbox");
}

export function getNotificationOutboxDocRef(hubId, notificationId) {
  return getNotificationOutboxCollection(hubId).doc(notificationId);
}

export function isNotificationOutboxRecordStale(record = {}, options = {}) {
  const normalized = normalizeNotificationOutboxRecord(record);
  const now = new Date(options.now || Date.now());
  const staleAfterMs = normalizeInteger(options.staleAfterMs, 15 * 60 * 1000);

  if (normalized.status !== "processing" || !normalized.processingStartedAt) {
    return false;
  }

  const processingStartedAt = new Date(normalized.processingStartedAt);

  if (Number.isNaN(processingStartedAt.getTime()) || Number.isNaN(now.getTime())) {
    return false;
  }

  return now.getTime() - processingStartedAt.getTime() >= staleAfterMs;
}

function isNotificationDue(record = {}, now = new Date()) {
  const normalized = normalizeNotificationOutboxRecord(record);
  const scheduledFor = new Date(normalized.scheduledFor || 0);
  const nowValue = now instanceof Date ? now : new Date(now);

  if (normalized.status !== "pending") {
    return false;
  }

  if (Number.isNaN(scheduledFor.getTime()) || Number.isNaN(nowValue.getTime())) {
    return false;
  }

  return scheduledFor.getTime() <= nowValue.getTime();
}

export async function createOrUpdateNotificationOutboxByDedupeKey(hubId, payload = {}, actorId = "system") {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    throw new Error("Hub id is required.");
  }

  if (!isBookingNotificationKind(payload.kind)) {
    throw new Error("A valid notification kind is required.");
  }

  const now = new Date().toISOString();
  const writeModel = buildNotificationOutboxWriteModel(normalizedHubId, payload, actorId, null, now);

  if (!writeModel.dedupeKey) {
    throw new Error("Notification outbox dedupe key is required.");
  }

  const notificationId = buildNotificationOutboxDocumentId(writeModel.dedupeKey);

  if (!notificationId) {
    throw new Error("Notification outbox document id is required.");
  }

  const ref = getNotificationOutboxDocRef(normalizedHubId, notificationId);

  await getFirebaseAdminDb().runTransaction(async (transaction) => {
    const existingSnapshot = await transaction.get(ref);
    const existingRecord = existingSnapshot.exists
      ? { id: existingSnapshot.id, hubId: normalizedHubId, ...existingSnapshot.data() }
      : null;
    const nextWriteModel = buildNotificationOutboxWriteModel(
      normalizedHubId,
      payload,
      actorId,
      existingRecord,
      now
    );

    transaction.set(ref, nextWriteModel, { merge: true });
  });

  const snapshot = await ref.get();

  return normalizeNotificationOutboxRecord({
    id: snapshot.id,
    hubId: normalizedHubId,
    ...snapshot.data(),
  });
}

export async function getNotificationOutboxRecordById(hubId, notificationId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedNotificationId = normalizeString(notificationId);

  if (!normalizedHubId || !normalizedNotificationId) {
    return null;
  }

  const snapshot = await getNotificationOutboxDocRef(normalizedHubId, normalizedNotificationId).get();

  if (!snapshot.exists) {
    return null;
  }

  return normalizeNotificationOutboxRecord({
    id: snapshot.id,
    hubId: normalizedHubId,
    ...snapshot.data(),
  });
}

export async function listDueNotificationOutboxRecords({ now = new Date().toISOString(), batchSize = 50 } = {}) {
  const normalizedNow = normalizeIsoString(now) || new Date().toISOString();
  const normalizedBatchSize = Math.max(1, normalizeInteger(batchSize, 50));
  const snapshot = await getNotificationOutboxCollectionGroup()
    .where("status", "==", "pending")
    .where("scheduledFor", "<=", normalizedNow)
    .orderBy("scheduledFor", "asc")
    .limit(normalizedBatchSize)
    .get();

  return snapshot.docs.map((doc) =>
    normalizeNotificationOutboxRecord({
      id: doc.id,
      ...doc.data(),
    })
  );
}

export async function listStaleProcessingNotificationOutboxRecords({
  now = new Date().toISOString(),
  staleAfterMs = 15 * 60 * 1000,
  batchSize = 50,
} = {}) {
  const nowDate = new Date(now || Date.now());
  const normalizedBatchSize = Math.max(1, normalizeInteger(batchSize, 50));
  const staleCutoff = new Date(nowDate.getTime() - Math.max(1, normalizeInteger(staleAfterMs, 15 * 60 * 1000))).toISOString();
  const snapshot = await getNotificationOutboxCollectionGroup()
    .where("status", "==", "processing")
    .where("processingStartedAt", "<=", staleCutoff)
    .orderBy("processingStartedAt", "asc")
    .limit(normalizedBatchSize)
    .get();

  return snapshot.docs.map((doc) =>
    normalizeNotificationOutboxRecord({
      id: doc.id,
      ...doc.data(),
    })
  );
}

export async function claimNotificationOutboxRecordForProcessing(
  hubId,
  notificationId,
  {
    now = new Date().toISOString(),
    staleAfterMs = 15 * 60 * 1000,
    processorRunId = "",
  } = {}
) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedNotificationId = normalizeString(notificationId);

  if (!normalizedHubId || !normalizedNotificationId) {
    return null;
  }

  const ref = getNotificationOutboxDocRef(normalizedHubId, normalizedNotificationId);
  const normalizedNow = normalizeIsoString(now) || new Date().toISOString();
  let claimedRecord = null;

  await getFirebaseAdminDb().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);

    if (!snapshot.exists) {
      return;
    }

    const current = normalizeNotificationOutboxRecord({
      id: snapshot.id,
      hubId: normalizedHubId,
      ...snapshot.data(),
    });

    const canClaim =
      isNotificationDue(current, new Date(normalizedNow)) ||
      isNotificationOutboxRecordStale(current, { now: normalizedNow, staleAfterMs });

    if (!canClaim) {
      return;
    }

    claimedRecord = normalizeNotificationOutboxRecord({
      ...current,
      status: "processing",
      processingStartedAt: normalizedNow,
      processorRunId: normalizeString(processorRunId),
      attemptCount: current.attemptCount + 1,
      updatedAt: normalizedNow,
    });

    transaction.set(
      ref,
      {
        status: claimedRecord.status,
        processingStartedAt: claimedRecord.processingStartedAt,
        processorRunId: claimedRecord.processorRunId,
        attemptCount: claimedRecord.attemptCount,
        updatedAt: claimedRecord.updatedAt,
      },
      { merge: true }
    );
  });

  return claimedRecord;
}

export async function claimDueNotificationOutboxRecords({
  now = new Date().toISOString(),
  batchSize = 50,
  staleAfterMs = 15 * 60 * 1000,
  processorRunId = "",
} = {}) {
  const normalizedBatchSize = Math.max(1, normalizeInteger(batchSize, 50));
  const [dueRecords, staleRecords] = await Promise.all([
    listDueNotificationOutboxRecords({ now, batchSize: normalizedBatchSize }),
    listStaleProcessingNotificationOutboxRecords({ now, staleAfterMs, batchSize: normalizedBatchSize }),
  ]);

  const candidates = [...dueRecords, ...staleRecords];
  const uniqueCandidates = [
    ...new Map(candidates.map((record) => [`${record.hubId}:${record.id}`, record])).values(),
  ];
  const claimed = [];

  for (const candidate of uniqueCandidates) {
    if (claimed.length >= normalizedBatchSize) {
      break;
    }

    const claimedRecord = await claimNotificationOutboxRecordForProcessing(candidate.hubId, candidate.id, {
      now,
      staleAfterMs,
      processorRunId,
    });

    if (claimedRecord) {
      claimed.push(claimedRecord);
    }
  }

  return claimed;
}

async function updateNotificationOutboxLifecycle(hubId, notificationId, patch = {}, actorId = "system") {
  const normalizedHubId = normalizeString(hubId);
  const normalizedNotificationId = normalizeString(notificationId);

  if (!normalizedHubId || !normalizedNotificationId) {
    throw new Error("Hub id and notification id are required.");
  }

  const now = new Date().toISOString();
  const ref = getNotificationOutboxDocRef(normalizedHubId, normalizedNotificationId);

  await ref.set(
    {
      ...patch,
      updatedAt: now,
      updatedBy: normalizeString(actorId) || "system",
    },
    { merge: true }
  );

  const snapshot = await ref.get();
  return normalizeNotificationOutboxRecord({
    id: snapshot.id,
    hubId: normalizedHubId,
    ...snapshot.data(),
  });
}

export async function markNotificationOutboxRecordSent(
  hubId,
  notificationId,
  { provider = "", providerMessageId = "", attemptedAt = "", sentAt = "" } = {},
  actorId = "system"
) {
  const now = new Date().toISOString();

  return updateNotificationOutboxLifecycle(
    hubId,
    notificationId,
    {
      status: "sent",
      provider: normalizeString(provider),
      providerMessageId: normalizeString(providerMessageId),
      lastAttemptAt: normalizeIsoString(attemptedAt) || now,
      sentAt: normalizeIsoString(sentAt) || now,
      failedAt: "",
      lastError: "",
      processingStartedAt: "",
      processorRunId: "",
    },
    actorId
  );
}

export async function markNotificationOutboxRecordFailed(
  hubId,
  notificationId,
  { attemptedAt = "", error = "" } = {},
  actorId = "system"
) {
  const now = new Date().toISOString();

  return updateNotificationOutboxLifecycle(
    hubId,
    notificationId,
    {
      status: "failed",
      lastAttemptAt: normalizeIsoString(attemptedAt) || now,
      failedAt: now,
      lastError: normalizeString(error),
      processingStartedAt: "",
      processorRunId: "",
    },
    actorId
  );
}

export async function markNotificationOutboxRecordCancelled(hubId, notificationId, actorId = "system") {
  const now = new Date().toISOString();

  return updateNotificationOutboxLifecycle(
    hubId,
    notificationId,
    {
      status: "cancelled",
      cancelledAt: now,
      processingStartedAt: "",
      processorRunId: "",
    },
    actorId
  );
}

export async function markNotificationOutboxRecordSuppressed(hubId, notificationId, actorId = "system") {
  const now = new Date().toISOString();

  return updateNotificationOutboxLifecycle(
    hubId,
    notificationId,
    {
      status: "suppressed",
      suppressedAt: now,
      processingStartedAt: "",
      processorRunId: "",
    },
    actorId
  );
}

export async function listNotificationOutboxRecordsBySource(hubId, sourceType, sourceId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedSourceType = normalizeString(sourceType);
  const normalizedSourceId = normalizeString(sourceId);

  if (!normalizedHubId || !normalizedSourceType || !normalizedSourceId) {
    return [];
  }

  const snapshot = await getNotificationOutboxCollection(normalizedHubId)
    .where("sourceType", "==", normalizedSourceType)
    .where("sourceId", "==", normalizedSourceId)
    .get();

  return snapshot.docs
    .map((doc) =>
      normalizeNotificationOutboxRecord({
        id: doc.id,
        hubId: normalizedHubId,
        ...doc.data(),
      })
    )
    .sort((left, right) => String(left.scheduledFor || left.createdAt).localeCompare(String(right.scheduledFor || right.createdAt)));
}

export async function listNotificationOutboxRecordsByParent(hubId, parentType, parentId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedParentType = normalizeString(parentType);
  const normalizedParentId = normalizeString(parentId);

  if (!normalizedHubId || !normalizedParentType || !normalizedParentId) {
    return [];
  }

  const snapshot = await getNotificationOutboxCollection(normalizedHubId)
    .where("parentType", "==", normalizedParentType)
    .where("parentId", "==", normalizedParentId)
    .get();

  return snapshot.docs
    .map((doc) =>
      normalizeNotificationOutboxRecord({
        id: doc.id,
        hubId: normalizedHubId,
        ...doc.data(),
      })
    )
    .sort((left, right) => String(left.scheduledFor || left.createdAt).localeCompare(String(right.scheduledFor || right.createdAt)));
}
