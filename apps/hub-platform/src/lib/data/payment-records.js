try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { getFallbackRegionalMarket } from "@/lib/domain/regional-markets";

function normalizeString(value) {
  return String(value || "").trim();
}

function parseInteger(value) {
  const numeric = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(numeric) ? numeric : 0;
}

function getPaymentRecordsCollection(hubId) {
  return getFirebaseAdminDb().collection("hubs").doc(hubId).collection("paymentRecords");
}

function sanitizeIdSegment(value) {
  return normalizeString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120);
}

export function buildPaymentRecordDocumentId(sourceType, sourceId) {
  const normalizedSourceType = sanitizeIdSegment(sourceType);
  const normalizedSourceId = sanitizeIdSegment(sourceId);

  if (!normalizedSourceType || !normalizedSourceId) {
    return "";
  }

  return `${normalizedSourceType}_${normalizedSourceId}`;
}

export function normalizePaymentRecord(record = {}) {
  return {
    id: normalizeString(record.id),
    hubId: normalizeString(record.hubId),
    userId: normalizeString(record.userId),
    kind: normalizeString(record.kind),
    sourceType: normalizeString(record.sourceType),
    sourceId: normalizeString(record.sourceId),
    title: normalizeString(record.title),
    description: normalizeString(record.description),
    amountMinor: parseInteger(record.amountMinor),
    amountDisplay: normalizeString(record.amountDisplay),
    currency: normalizeString(record.currency).toUpperCase() || getFallbackRegionalMarket().defaultCurrency,
    paymentMode: normalizeString(record.paymentMode),
    provider: normalizeString(record.provider),
    operationalStatus: normalizeString(record.operationalStatus),
    financialStatus: normalizeString(record.financialStatus),
    occurredAt: normalizeString(record.occurredAt),
    dueAt: normalizeString(record.dueAt),
    paidAt: normalizeString(record.paidAt),
    refundedAt: normalizeString(record.refundedAt),
    refundAmountMinor: parseInteger(record.refundAmountMinor),
    refundDisplay: normalizeString(record.refundDisplay),
    nativeTransactionId: normalizeString(record.nativeTransactionId),
    stripeCheckoutSessionId: normalizeString(record.stripeCheckoutSessionId),
    stripePaymentIntentId: normalizeString(record.stripePaymentIntentId),
    stripeRefundId: normalizeString(record.stripeRefundId),
    membershipId: normalizeString(record.membershipId),
    membershipUpgradeRequestId: normalizeString(record.membershipUpgradeRequestId),
    eventId: normalizeString(record.eventId),
    eventBookingId: normalizeString(record.eventBookingId),
    eventRegistrationId: normalizeString(record.eventRegistrationId),
    courseId: normalizeString(record.courseId),
    courseRegistrationId: normalizeString(record.courseRegistrationId),
    packageTierAtTime: normalizeString(record.packageTierAtTime),
    paymentProcessingModeAtTime: normalizeString(record.paymentProcessingModeAtTime),
    sourceConfidence: normalizeString(record.sourceConfidence),
    reportingEligibility: normalizeString(record.reportingEligibility),
    createdAt: normalizeString(record.createdAt),
    updatedAt: normalizeString(record.updatedAt),
    createdBy: normalizeString(record.createdBy),
    updatedBy: normalizeString(record.updatedBy),
  };
}

export async function createPaymentRecord(hubId, payload, actorId = "system") {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    throw new Error("Hub id is required.");
  }

  const now = new Date().toISOString();
  const ref = getPaymentRecordsCollection(normalizedHubId).doc();
  const writeModel = {
    hubId: normalizedHubId,
    userId: normalizeString(payload.userId),
    kind: normalizeString(payload.kind),
    sourceType: normalizeString(payload.sourceType),
    sourceId: normalizeString(payload.sourceId),
    title: normalizeString(payload.title),
    description: normalizeString(payload.description),
    amountMinor: parseInteger(payload.amountMinor),
    amountDisplay: normalizeString(payload.amountDisplay),
    currency: normalizeString(payload.currency).toUpperCase() || getFallbackRegionalMarket().defaultCurrency,
    paymentMode: normalizeString(payload.paymentMode),
    provider: normalizeString(payload.provider),
    operationalStatus: normalizeString(payload.operationalStatus) || "open",
    financialStatus: normalizeString(payload.financialStatus) || "unpaid",
    occurredAt: normalizeString(payload.occurredAt) || now,
    dueAt: normalizeString(payload.dueAt),
    paidAt: normalizeString(payload.paidAt),
    refundedAt: normalizeString(payload.refundedAt),
    refundAmountMinor: parseInteger(payload.refundAmountMinor),
    refundDisplay: normalizeString(payload.refundDisplay),
    nativeTransactionId: normalizeString(payload.nativeTransactionId),
    stripeCheckoutSessionId: normalizeString(payload.stripeCheckoutSessionId),
    stripePaymentIntentId: normalizeString(payload.stripePaymentIntentId),
    stripeRefundId: normalizeString(payload.stripeRefundId),
    membershipId: normalizeString(payload.membershipId),
    membershipUpgradeRequestId: normalizeString(payload.membershipUpgradeRequestId),
    eventId: normalizeString(payload.eventId),
    eventBookingId: normalizeString(payload.eventBookingId),
    eventRegistrationId: normalizeString(payload.eventRegistrationId),
    courseId: normalizeString(payload.courseId),
    courseRegistrationId: normalizeString(payload.courseRegistrationId),
    packageTierAtTime: normalizeString(payload.packageTierAtTime),
    paymentProcessingModeAtTime: normalizeString(payload.paymentProcessingModeAtTime),
    sourceConfidence: normalizeString(payload.sourceConfidence) || "declared",
    reportingEligibility: normalizeString(payload.reportingEligibility) || "count_in_revenue",
    createdAt: now,
    updatedAt: now,
    createdBy: normalizeString(actorId) || "system",
    updatedBy: normalizeString(actorId) || "system",
  };

  await ref.set(writeModel);

  return normalizePaymentRecord({
    id: ref.id,
    ...writeModel,
  });
}

export async function getPaymentRecordById(hubId, paymentRecordId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedPaymentRecordId = normalizeString(paymentRecordId);

  if (!normalizedHubId || !normalizedPaymentRecordId) {
    return null;
  }

  const snapshot = await getPaymentRecordsCollection(normalizedHubId).doc(normalizedPaymentRecordId).get();

  if (!snapshot.exists) {
    return null;
  }

  return normalizePaymentRecord({
    id: snapshot.id,
    hubId: normalizedHubId,
    ...snapshot.data(),
  });
}

export async function listPaymentRecordsByHub(hubId) {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    return [];
  }

  const snapshot = await getPaymentRecordsCollection(normalizedHubId).get();

  return snapshot.docs
    .map((doc) =>
      normalizePaymentRecord({
        id: doc.id,
        hubId: normalizedHubId,
        ...doc.data(),
      })
    )
    .sort((left, right) =>
      String(right.paidAt || right.updatedAt || right.createdAt || "").localeCompare(
        String(left.paidAt || left.updatedAt || left.createdAt || "")
      )
    );
}

export async function listPaymentRecordsByUser(hubId, userId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedUserId = normalizeString(userId);

  if (!normalizedHubId || !normalizedUserId) {
    return [];
  }

  const snapshot = await getPaymentRecordsCollection(normalizedHubId)
    .where("userId", "==", normalizedUserId)
    .get();

  return snapshot.docs
    .map((doc) =>
      normalizePaymentRecord({
        id: doc.id,
        hubId: normalizedHubId,
        ...doc.data(),
      })
    )
    .sort((left, right) =>
      String(right.paidAt || right.updatedAt || right.createdAt || "").localeCompare(
        String(left.paidAt || left.updatedAt || left.createdAt || "")
      )
    );
}

export async function getPaymentRecordByNativeTransactionId(hubId, nativeTransactionId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedTransactionId = normalizeString(nativeTransactionId);

  if (!normalizedHubId || !normalizedTransactionId) {
    return null;
  }

  const snapshot = await getPaymentRecordsCollection(normalizedHubId)
    .where("nativeTransactionId", "==", normalizedTransactionId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return normalizePaymentRecord({
    id: doc.id,
    hubId: normalizedHubId,
    ...doc.data(),
  });
}

export async function getPaymentRecordBySource(hubId, sourceType, sourceId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedSourceType = normalizeString(sourceType);
  const normalizedSourceId = normalizeString(sourceId);

  if (!normalizedHubId || !normalizedSourceType || !normalizedSourceId) {
    return null;
  }

  const snapshot = await getPaymentRecordsCollection(normalizedHubId)
    .where("sourceType", "==", normalizedSourceType)
    .where("sourceId", "==", normalizedSourceId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return normalizePaymentRecord({
    id: doc.id,
    hubId: normalizedHubId,
    ...doc.data(),
  });
}

export async function upsertPaymentRecordBySource(hubId, payload, actorId = "system") {
  const normalizedHubId = normalizeString(hubId);
  const normalizedSourceType = normalizeString(payload?.sourceType);
  const normalizedSourceId = normalizeString(payload?.sourceId);

  if (!normalizedHubId || !normalizedSourceType || !normalizedSourceId) {
    throw new Error("Hub id, source type, and source id are required.");
  }

  const documentId = buildPaymentRecordDocumentId(normalizedSourceType, normalizedSourceId);

  if (!documentId) {
    throw new Error("A deterministic payment record id could not be derived.");
  }

  const ref = getPaymentRecordsCollection(normalizedHubId).doc(documentId);
  const existing = await ref.get();
  const now = new Date().toISOString();
  const normalizedActorId = normalizeString(actorId) || "system";
  const writeModel = {
    hubId: normalizedHubId,
    userId: normalizeString(payload.userId),
    kind: normalizeString(payload.kind),
    sourceType: normalizedSourceType,
    sourceId: normalizedSourceId,
    title: normalizeString(payload.title),
    description: normalizeString(payload.description),
    amountMinor: parseInteger(payload.amountMinor),
    amountDisplay: normalizeString(payload.amountDisplay),
    currency: normalizeString(payload.currency).toUpperCase() || getFallbackRegionalMarket().defaultCurrency,
    paymentMode: normalizeString(payload.paymentMode),
    provider: normalizeString(payload.provider),
    operationalStatus: normalizeString(payload.operationalStatus) || "open",
    financialStatus: normalizeString(payload.financialStatus) || "unpaid",
    occurredAt: normalizeString(payload.occurredAt) || now,
    dueAt: normalizeString(payload.dueAt),
    paidAt: normalizeString(payload.paidAt),
    refundedAt: normalizeString(payload.refundedAt),
    refundAmountMinor: parseInteger(payload.refundAmountMinor),
    refundDisplay: normalizeString(payload.refundDisplay),
    nativeTransactionId: normalizeString(payload.nativeTransactionId),
    stripeCheckoutSessionId: normalizeString(payload.stripeCheckoutSessionId),
    stripePaymentIntentId: normalizeString(payload.stripePaymentIntentId),
    stripeRefundId: normalizeString(payload.stripeRefundId),
    membershipId: normalizeString(payload.membershipId),
    membershipUpgradeRequestId: normalizeString(payload.membershipUpgradeRequestId),
    eventId: normalizeString(payload.eventId),
    eventBookingId: normalizeString(payload.eventBookingId),
    eventRegistrationId: normalizeString(payload.eventRegistrationId),
    courseId: normalizeString(payload.courseId),
    courseRegistrationId: normalizeString(payload.courseRegistrationId),
    packageTierAtTime: normalizeString(payload.packageTierAtTime),
    paymentProcessingModeAtTime: normalizeString(payload.paymentProcessingModeAtTime),
    sourceConfidence: normalizeString(payload.sourceConfidence) || "declared",
    reportingEligibility: normalizeString(payload.reportingEligibility) || "count_in_revenue",
    updatedAt: now,
    updatedBy: normalizedActorId,
  };

  if (!existing.exists) {
    await ref.set({
      ...writeModel,
      createdAt: now,
      createdBy: normalizedActorId,
    });

    return normalizePaymentRecord({
      id: documentId,
      ...writeModel,
      createdAt: now,
      createdBy: normalizedActorId,
    });
  }

  await ref.set(writeModel, { merge: true });

  return normalizePaymentRecord({
    id: documentId,
    hubId: normalizedHubId,
    ...existing.data(),
    ...writeModel,
  });
}

export async function updatePaymentRecord(hubId, paymentRecordId, payload, actorId = "system") {
  const normalizedHubId = normalizeString(hubId);
  const normalizedPaymentRecordId = normalizeString(paymentRecordId);

  if (!normalizedHubId || !normalizedPaymentRecordId) {
    throw new Error("Hub id and payment record id are required.");
  }

  const ref = getPaymentRecordsCollection(normalizedHubId).doc(normalizedPaymentRecordId);
  const existing = await ref.get();

  if (!existing.exists) {
    throw new Error("Payment record not found.");
  }

  const writeModel = {
    ...payload,
    updatedAt: new Date().toISOString(),
    updatedBy: normalizeString(actorId) || "system",
  };

  await ref.set(writeModel, { merge: true });

  return normalizePaymentRecord({
    id: normalizedPaymentRecordId,
    hubId: normalizedHubId,
    ...existing.data(),
    ...writeModel,
  });
}
