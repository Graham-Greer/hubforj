try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { getFallbackRegionalMarket } from "@/lib/domain/regional-markets";
import { FieldPath } from "firebase-admin/firestore";
import { syncMemberDirectoryPaymentAttentionForUser } from "./member-directory.js";
import { getUserById } from "./user-queries.js";

export const PAYMENT_ITEM_SCHEMA_VERSION = 1;

function normalizeString(value) {
  return String(value || "").trim();
}

function parseInteger(value) {
  const numeric = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(numeric) ? numeric : 0;
}

function getPaymentItemsCollection(hubId) {
  return getFirebaseAdminDb().collection("hubs").doc(hubId).collection("paymentItems");
}

function encodePaymentItemCursor(item) {
  const sortAt = normalizeString(item?.sortAt);
  const id = normalizeString(item?.id);

  if (!sortAt || !id) {
    return "";
  }

  return encodeURIComponent(JSON.stringify({ sortAt, id }));
}

function decodePaymentItemCursor(cursor) {
  const normalizedCursor = normalizeString(cursor);

  if (!normalizedCursor) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(normalizedCursor));
    const sortAt = normalizeString(parsed?.sortAt);
    const id = normalizeString(parsed?.id);

    return sortAt && id ? { sortAt, id } : null;
  } catch {
    return null;
  }
}

export function buildPaymentItemDocumentIdFromPaymentRecord(paymentRecordId) {
  const normalizedPaymentRecordId = normalizeString(paymentRecordId);
  return normalizedPaymentRecordId ? `payment_record_${normalizedPaymentRecordId}` : "";
}

function mapPaymentRecordKindToPaymentItemType(record = {}) {
  const kind = normalizeString(record.kind);
  const sourceType = normalizeString(record.sourceType);

  if (kind === "event_booking" || kind === "event_registration" || sourceType === "eventBooking") {
    return "eventBooking";
  }

  if (kind === "course_registration" || sourceType === "courseRegistration") {
    return "courseRegistration";
  }

  if (kind === "membership_upgrade" || sourceType === "membershipUpgradeRequest") {
    return "upgradeRequest";
  }

  return "membership";
}

function resolveSourceParentId(record = {}) {
  const type = mapPaymentRecordKindToPaymentItemType(record);

  if (type === "eventBooking") {
    return normalizeString(record.eventId);
  }

  if (type === "courseRegistration") {
    return normalizeString(record.courseId);
  }

  if (type === "membership" || type === "upgradeRequest") {
    return normalizeString(record.membershipId || record.membershipUpgradeRequestId);
  }

  return "";
}

function resolveAttentionStatus(record = {}) {
  const financialStatus = normalizeString(record.financialStatus);
  const operationalStatus = normalizeString(record.operationalStatus);
  const reportingEligibility = normalizeString(record.reportingEligibility);

  if (reportingEligibility === "informational_only") {
    return "none";
  }

  if (financialStatus === "failed" || financialStatus === "overdue") {
    return "action_required";
  }

  if (financialStatus === "unpaid" && operationalStatus !== "cancelled") {
    return "action_required";
  }

  return "none";
}

function resolveSortAt(record = {}) {
  return (
    normalizeString(record.paidAt) ||
    normalizeString(record.refundedAt) ||
    normalizeString(record.dueAt) ||
    normalizeString(record.occurredAt) ||
    normalizeString(record.updatedAt) ||
    normalizeString(record.createdAt)
  );
}

export function normalizePaymentItemRecord(record = {}) {
  return {
    id: normalizeString(record.id),
    hubId: normalizeString(record.hubId),
    type: normalizeString(record.type),
    sourceCollection: normalizeString(record.sourceCollection),
    sourceId: normalizeString(record.sourceId),
    sourceParentId: normalizeString(record.sourceParentId),
    sourceSlug: normalizeString(record.sourceSlug),
    userId: normalizeString(record.userId),
    memberId: normalizeString(record.memberId),
    displayName: normalizeString(record.displayName),
    email: normalizeString(record.email).toLowerCase(),
    title: normalizeString(record.title),
    amountMinor: parseInteger(record.amountMinor),
    amountDisplay: normalizeString(record.amountDisplay),
    currency: normalizeString(record.currency).toUpperCase() || getFallbackRegionalMarket().defaultCurrency,
    status: normalizeString(record.status),
    paymentStatus: normalizeString(record.paymentStatus),
    attentionStatus: normalizeString(record.attentionStatus) || "none",
    provider: normalizeString(record.provider),
    paymentMode: normalizeString(record.paymentMode),
    stripePaymentIntentId: normalizeString(record.stripePaymentIntentId),
    stripeCheckoutSessionId: normalizeString(record.stripeCheckoutSessionId),
    nativeTransactionId: normalizeString(record.nativeTransactionId),
    paymentRecordId: normalizeString(record.paymentRecordId),
    reportingEligibility: normalizeString(record.reportingEligibility),
    sourceConfidence: normalizeString(record.sourceConfidence),
    createdAt: normalizeString(record.createdAt),
    updatedAt: normalizeString(record.updatedAt),
    occurredAt: normalizeString(record.occurredAt),
    paidAt: normalizeString(record.paidAt),
    dueAt: normalizeString(record.dueAt),
    refundedAt: normalizeString(record.refundedAt),
    refundAmountMinor: parseInteger(record.refundAmountMinor),
    sortAt: normalizeString(record.sortAt),
    schemaVersion: parseInteger(record.schemaVersion),
  };
}

export function buildPaymentItemFromPaymentRecord(record = {}, user = null) {
  const paymentRecordId = normalizeString(record.id);
  const type = mapPaymentRecordKindToPaymentItemType(record);
  const sourceId = normalizeString(record.sourceId) || paymentRecordId;

  return normalizePaymentItemRecord({
    id: buildPaymentItemDocumentIdFromPaymentRecord(paymentRecordId),
    hubId: record.hubId,
    type,
    sourceCollection: "paymentRecords",
    sourceId,
    sourceParentId: resolveSourceParentId(record),
    userId: record.userId,
    memberId: record.userId,
    displayName: normalizeString(user?.name),
    email: normalizeString(user?.email),
    title: record.title,
    amountMinor: record.amountMinor,
    amountDisplay: record.amountDisplay,
    currency: record.currency,
    status: record.operationalStatus,
    paymentStatus: record.financialStatus,
    attentionStatus: resolveAttentionStatus(record),
    provider: record.provider,
    paymentMode: record.paymentMode,
    stripePaymentIntentId: record.stripePaymentIntentId,
    stripeCheckoutSessionId: record.stripeCheckoutSessionId,
    nativeTransactionId: record.nativeTransactionId,
    paymentRecordId,
    sourceSlug: record.sourceSlug || record.eventSlug || record.courseSlug,
    reportingEligibility: record.reportingEligibility,
    sourceConfidence: record.sourceConfidence,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    occurredAt: record.occurredAt,
    paidAt: record.paidAt,
    dueAt: record.dueAt,
    refundedAt: record.refundedAt,
    refundAmountMinor: record.refundAmountMinor,
    sortAt: resolveSortAt(record),
    schemaVersion: PAYMENT_ITEM_SCHEMA_VERSION,
  });
}

export async function upsertPaymentItemFromPaymentRecord(hubId, paymentRecord, options = {}) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedUserId = normalizeString(paymentRecord?.userId);
  let projectionUser = options.user || null;

  if (!projectionUser && normalizedHubId && normalizedUserId) {
    projectionUser = await getUserById(normalizedHubId, normalizedUserId);
  }

  const item = buildPaymentItemFromPaymentRecord({ ...paymentRecord, hubId: normalizedHubId }, projectionUser);

  if (!normalizedHubId || !item.id || !item.paymentRecordId) {
    return null;
  }

  const now = normalizeString(options.updatedAt) || new Date().toISOString();
  const ref = getPaymentItemsCollection(normalizedHubId).doc(item.id);
  const snapshot = await ref.get();
  const existing = snapshot.exists ? snapshot.data() || {} : {};
  const writeModel = {
    ...item,
    hubId: normalizedHubId,
    displayName: item.displayName || normalizeString(existing.displayName),
    email: item.email || normalizeString(existing.email).toLowerCase(),
    updatedAt: now,
    schemaVersion: PAYMENT_ITEM_SCHEMA_VERSION,
  };

  if (!snapshot.exists) {
    await ref.set({
      ...writeModel,
      createdAt: item.createdAt || now,
    });
  } else {
    await ref.set(writeModel, { merge: true });
  }

  if (options.syncMemberDirectory !== false && item.userId) {
    await syncMemberDirectoryPaymentAttentionForUser(normalizedHubId, item.userId, "payment-item-write", {
      maintainDashboardProjections: false,
    });
  }

  return normalizePaymentItemRecord({
    ...writeModel,
    createdAt: snapshot.exists ? existing.createdAt : item.createdAt || now,
  });
}

export async function getPaymentItemById(hubId, paymentItemId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedPaymentItemId = normalizeString(paymentItemId);

  if (!normalizedHubId || !normalizedPaymentItemId) {
    return null;
  }

  const snapshot = await getPaymentItemsCollection(normalizedHubId).doc(normalizedPaymentItemId).get();

  if (!snapshot.exists) {
    return null;
  }

  return normalizePaymentItemRecord({
    id: snapshot.id,
    hubId: normalizedHubId,
    ...snapshot.data(),
  });
}

export async function deletePaymentItemById(hubId, paymentItemId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedPaymentItemId = normalizeString(paymentItemId);

  if (!normalizedHubId || !normalizedPaymentItemId) {
    return false;
  }

  const ref = getPaymentItemsCollection(normalizedHubId).doc(normalizedPaymentItemId);
  const snapshot = await ref.get();
  const userId = snapshot.exists ? normalizeString(snapshot.data()?.userId) : "";

  await ref.delete();

  if (userId) {
    await syncMemberDirectoryPaymentAttentionForUser(normalizedHubId, userId, "payment-item-delete", {
      maintainDashboardProjections: false,
    });
  }

  return true;
}

export async function listPaymentItemPageByHubId(hubId, options = {}) {
  const normalizedHubId = normalizeString(hubId);
  const limit = Math.min(Math.max(parseInteger(options.limit) || 25, 1), 100);
  const cursor = decodePaymentItemCursor(options.cursor);

  if (!normalizedHubId) {
    return { items: [], nextCursor: "", hasMore: false };
  }

  let query = getPaymentItemsCollection(normalizedHubId).where("hubId", "==", normalizedHubId);

  const status = normalizeString(options.status);
  const paymentStatus = normalizeString(options.paymentStatus);
  const attentionStatus = normalizeString(options.attentionStatus);
  const type = normalizeString(options.type);
  const typeValues = Array.isArray(options.typeValues)
    ? options.typeValues.map(normalizeString).filter(Boolean).slice(0, 10)
    : [];
  const userId = normalizeString(options.userId);
  const memberId = normalizeString(options.memberId);
  const activeFilters = [
    ["status", status],
    ["paymentStatus", paymentStatus],
    ["attentionStatus", attentionStatus],
    ["type", type || typeValues.join("|")],
    ["userId", userId],
    ["memberId", memberId],
  ].filter(([, value]) => value);

  if (activeFilters.length > 1) {
    throw new Error("Payment item queries currently support one indexed filter at a time.");
  }

  if (status) {
    query = query.where("status", "==", status);
  }

  if (paymentStatus) {
    query = query.where("paymentStatus", "==", paymentStatus);
  }

  if (attentionStatus) {
    query = query.where("attentionStatus", "==", attentionStatus);
  }

  if (typeValues.length > 1) {
    query = query.where("type", "in", typeValues);
  } else if (type || typeValues.length === 1) {
    const resolvedType = type || typeValues[0];
    query = query.where("type", "==", resolvedType);
  }

  if (userId) {
    query = query.where("userId", "==", userId);
  }

  if (memberId) {
    query = query.where("memberId", "==", memberId);
  }

  query = query.orderBy("sortAt", "desc").orderBy(FieldPath.documentId(), "desc");

  if (cursor) {
    query = query.startAfter(cursor.sortAt, cursor.id);
  }

  query = query.limit(limit + 1);

  const snapshot = await query.get();
  const docs = snapshot.docs.slice(0, limit);
  const items = docs.map((doc) =>
    normalizePaymentItemRecord({
      id: doc.id,
      hubId: normalizedHubId,
      ...doc.data(),
    })
  );
  const lastItem = items[items.length - 1];

  return {
    items,
    nextCursor: snapshot.docs.length > limit ? encodePaymentItemCursor(lastItem) : "",
    hasMore: snapshot.docs.length > limit,
  };
}

export async function listPaymentItemsByHubId(hubId) {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    return [];
  }

  const snapshot = await getPaymentItemsCollection(normalizedHubId).get();

  return snapshot.docs
    .map((doc) =>
      normalizePaymentItemRecord({
        id: doc.id,
        hubId: normalizedHubId,
        ...doc.data(),
      })
    )
    .sort((left, right) =>
      String(right.sortAt || right.updatedAt || right.createdAt || "").localeCompare(
        String(left.sortAt || left.updatedAt || left.createdAt || "")
      )
    );
}
