try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getFirebaseAdminDb } from "@/lib/firebase/admin";

function normalizeString(value) {
  return String(value || "").trim();
}

function getStripeWebhookEventsCollection() {
  return getFirebaseAdminDb().collection("stripeWebhookEvents");
}

function normalizeWebhookEventRecord(record = {}) {
  return {
    id: normalizeString(record.id || record.eventId),
    eventId: normalizeString(record.eventId || record.id),
    type: normalizeString(record.type),
    account: normalizeString(record.account),
    livemode: record.livemode === true,
    apiVersion: normalizeString(record.apiVersion),
    processingStatus: normalizeString(record.processingStatus) || "completed",
    processedAt: normalizeString(record.processedAt),
    result: typeof record.result === "object" && record.result ? record.result : {},
  };
}

export async function getProcessedStripeWebhookEventById(eventId) {
  const normalizedEventId = normalizeString(eventId);

  if (!normalizedEventId) {
    return null;
  }

  const snapshot = await getStripeWebhookEventsCollection().doc(normalizedEventId).get();

  if (!snapshot.exists) {
    return null;
  }

  return normalizeWebhookEventRecord({
    id: snapshot.id,
    ...snapshot.data(),
  });
}

export async function recordProcessedStripeWebhookEvent(event, result = {}) {
  const normalizedEventId = normalizeString(event?.id);

  if (!normalizedEventId) {
    throw new Error("Stripe webhook event id is required.");
  }

  const now = new Date().toISOString();
  const writeModel = {
    eventId: normalizedEventId,
    type: normalizeString(event?.type),
    account: normalizeString(event?.account),
    livemode: event?.livemode === true,
    apiVersion: normalizeString(event?.api_version),
    processingStatus: "completed",
    processedAt: now,
    result,
  };

  await getStripeWebhookEventsCollection().doc(normalizedEventId).set(writeModel, { merge: true });

  return normalizeWebhookEventRecord({
    id: normalizedEventId,
    ...writeModel,
  });
}

export async function claimStripeWebhookEventProcessing(event) {
  const normalizedEventId = normalizeString(event?.id);

  if (!normalizedEventId) {
    throw new Error("Stripe webhook event id is required.");
  }

  const writeModel = {
    eventId: normalizedEventId,
    type: normalizeString(event?.type),
    account: normalizeString(event?.account),
    livemode: event?.livemode === true,
    apiVersion: normalizeString(event?.api_version),
    processingStatus: "processing",
    processedAt: "",
    result: {},
  };

  try {
    await getStripeWebhookEventsCollection().doc(normalizedEventId).create(writeModel);

    return {
      claimed: true,
      record: normalizeWebhookEventRecord({
        id: normalizedEventId,
        ...writeModel,
      }),
    };
  } catch (error) {
    if (error?.code === 6 || error?.code === "already-exists") {
      const existing = await getProcessedStripeWebhookEventById(normalizedEventId);
      return {
        claimed: false,
        record: existing,
      };
    }

    throw error;
  }
}

export async function releaseStripeWebhookEventProcessing(eventId) {
  const normalizedEventId = normalizeString(eventId);

  if (!normalizedEventId) {
    return;
  }

  await getStripeWebhookEventsCollection().doc(normalizedEventId).delete();
}

export async function listProcessedStripeWebhookEventsByHub(hubId, options = {}) {
  const normalizedHubId = normalizeString(hubId);
  const maxItems = Number.parseInt(String(options.limit || "50"), 10) || 50;

  if (!normalizedHubId) {
    return [];
  }

  const snapshot = await getStripeWebhookEventsCollection()
    .where("result.hubId", "==", normalizedHubId)
    .limit(Math.max(1, Math.min(maxItems, 200)))
    .get();

  return snapshot.docs
    .map((doc) =>
      normalizeWebhookEventRecord({
        id: doc.id,
        ...doc.data(),
      })
    )
    .sort((left, right) => String(right.processedAt || "").localeCompare(String(left.processedAt || "")));
}
