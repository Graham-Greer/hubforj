try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { getHubById } from "@/lib/data/hubs";
import { upsertPaymentRecordBySource } from "@/lib/data/payment-records";
import { resolveMembershipUpgradeLedgerState } from "@/lib/domain/payment-records";
import { getFallbackRegionalMarket } from "@/lib/domain/regional-markets";
import { normalizeNativePaymentTransactionRecord } from "@/lib/domain/native-payment-transactions";

function normalizeString(value) {
  return String(value || "").trim();
}

function getNativePaymentTransactionsCollection(hubId) {
  return getFirebaseAdminDb()
    .collection("hubs")
    .doc(hubId)
    .collection("nativePaymentTransactions");
}

export async function createNativePaymentTransaction(hubId, payload, actorId = "system") {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    throw new Error("Hub id is required.");
  }

  const now = new Date().toISOString();
  const ref = getNativePaymentTransactionsCollection(normalizedHubId).doc();
  const writeModel = {
    hubId: normalizedHubId,
    kind: normalizeString(payload.kind) || "membership_upgrade",
    status: normalizeString(payload.status) || "checkout_open",
    provider: normalizeString(payload.provider) || "stripe",
    paymentRecordId: normalizeString(payload.paymentRecordId),
    userId: normalizeString(payload.userId),
    stripeAccountId: normalizeString(payload.stripeAccountId),
    stripeCheckoutSessionId: normalizeString(payload.stripeCheckoutSessionId),
    stripePaymentIntentId: normalizeString(payload.stripePaymentIntentId),
    membershipUpgradeRequestId: normalizeString(payload.membershipUpgradeRequestId),
    membershipId: normalizeString(payload.membershipId),
    planId: normalizeString(payload.planId),
    planTitle: normalizeString(payload.planTitle),
    eventId: normalizeString(payload.eventId),
    eventTitle: normalizeString(payload.eventTitle),
    eventBookingId: normalizeString(payload.eventBookingId),
    courseId: normalizeString(payload.courseId),
    courseTitle: normalizeString(payload.courseTitle),
    registrationId: normalizeString(payload.registrationId),
    amountMinor: Number.parseInt(String(payload.amountMinor || ""), 10) || 0,
    amount: normalizeString(payload.amount),
    currency: normalizeString(payload.currency).toUpperCase() || getFallbackRegionalMarket().defaultCurrency,
    checkoutUrl: normalizeString(payload.checkoutUrl),
    applicationFeeAmountMinor: Number.parseInt(String(payload.applicationFeeAmountMinor || ""), 10) || 0,
    refundStatus: normalizeString(payload.refundStatus),
    refundAmountMinor: Number.parseInt(String(payload.refundAmountMinor || ""), 10) || 0,
    refundAmount: normalizeString(payload.refundAmount),
    refundedAt: normalizeString(payload.refundedAt),
    stripeRefundId: normalizeString(payload.stripeRefundId),
    checkoutCompletedAt: normalizeString(payload.checkoutCompletedAt),
    paymentReceivedAt: normalizeString(payload.paymentReceivedAt),
    createdAt: now,
    updatedAt: now,
    updatedBy: normalizeString(actorId) || "system",
  };

  await ref.set(writeModel);

  return normalizeNativePaymentTransactionRecord({
    id: ref.id,
    ...writeModel,
  });
}

export async function getNativePaymentTransactionById(hubId, transactionId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedTransactionId = normalizeString(transactionId);

  if (!normalizedHubId || !normalizedTransactionId) {
    return null;
  }

  const snapshot = await getNativePaymentTransactionsCollection(normalizedHubId).doc(normalizedTransactionId).get();

  if (!snapshot.exists) {
    return null;
  }

  return normalizeNativePaymentTransactionRecord({
    id: snapshot.id,
    hubId: normalizedHubId,
    ...snapshot.data(),
  });
}

export async function getNativePaymentTransactionByPaymentIntentId(hubId, stripePaymentIntentId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedPaymentIntentId = normalizeString(stripePaymentIntentId);

  if (!normalizedHubId || !normalizedPaymentIntentId) {
    return null;
  }

  const snapshot = await getNativePaymentTransactionsCollection(normalizedHubId)
    .where("stripePaymentIntentId", "==", normalizedPaymentIntentId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];

  return normalizeNativePaymentTransactionRecord({
    id: doc.id,
    hubId: normalizedHubId,
    ...doc.data(),
  });
}

export async function listNativePaymentTransactionsByHub(hubId) {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    return [];
  }

  const snapshot = await getNativePaymentTransactionsCollection(normalizedHubId).get();

  return snapshot.docs
    .map((doc) =>
      normalizeNativePaymentTransactionRecord({
        id: doc.id,
        hubId: normalizedHubId,
        ...doc.data(),
      })
    )
    .sort((left, right) => String(right.paymentReceivedAt || right.updatedAt || "").localeCompare(String(left.paymentReceivedAt || left.updatedAt || "")));
}

export async function updateNativePaymentTransaction(hubId, transactionId, payload, actorId = "system") {
  const normalizedHubId = normalizeString(hubId);
  const normalizedTransactionId = normalizeString(transactionId);

  if (!normalizedHubId || !normalizedTransactionId) {
    throw new Error("Hub id and transaction id are required.");
  }

  const ref = getNativePaymentTransactionsCollection(normalizedHubId).doc(normalizedTransactionId);
  const existing = await ref.get();

  if (!existing.exists) {
    throw new Error("Native payment transaction not found.");
  }

  const writeModel = {
    ...payload,
    updatedAt: new Date().toISOString(),
    updatedBy: normalizeString(actorId) || "system",
  };

  await ref.set(writeModel, { merge: true });

  return normalizeNativePaymentTransactionRecord({
    id: normalizedTransactionId,
    hubId: normalizedHubId,
    ...existing.data(),
    ...writeModel,
  });
}

export async function backfillNativeMembershipUpgradeTransactionsToLedger(hubId, actorId = "ledger-backfill") {
  const normalizedHubId = normalizeString(hubId);
  const normalizedActorId = normalizeString(actorId) || "ledger-backfill";
  const since = normalizeString(arguments[2]?.since);

  if (!normalizedHubId) {
    return { total: 0, synced: 0 };
  }

  const [hub, transactions] = await Promise.all([
    getHubById(normalizedHubId),
    listNativePaymentTransactionsByHub(normalizedHubId),
  ]);

  let synced = 0;
  let scanned = 0;
  let skipped = 0;
  let latestSourceTimestamp = "";

  for (const transaction of transactions) {
    if (normalizeString(transaction.kind) !== "membership_upgrade") {
      continue;
    }

    scanned += 1;
    const candidateTimestamp = normalizeString(
      transaction.updatedAt || transaction.paymentReceivedAt || transaction.checkoutCompletedAt || transaction.createdAt
    );
    if (candidateTimestamp && (!latestSourceTimestamp || candidateTimestamp > latestSourceTimestamp)) {
      latestSourceTimestamp = candidateTimestamp;
    }

    if (since && candidateTimestamp && candidateTimestamp <= since) {
      skipped += 1;
      continue;
    }

    const ledgerState = resolveMembershipUpgradeLedgerState(transaction.status, {
      membershipApplied: normalizeString(transaction.status) === "payment_received",
    });
    const sourceType = normalizeString(transaction.membershipUpgradeRequestId)
      ? "membershipUpgradeRequest"
      : "nativePaymentTransaction";
    const sourceId = normalizeString(transaction.membershipUpgradeRequestId) || normalizeString(transaction.id);

    const record = await upsertPaymentRecordBySource(
      normalizedHubId,
      {
        userId: transaction.userId,
        kind: "membership_upgrade",
        sourceType,
        sourceId,
        title: transaction.planTitle ? `${transaction.planTitle} upgrade` : "Membership upgrade",
        description: normalizeString(hub?.name) ? `Membership upgrade for ${hub.name}` : "Membership upgrade",
        amountMinor: transaction.amountMinor,
        amountDisplay: transaction.amount,
        currency: transaction.currency,
        paymentMode: "native",
        provider: transaction.provider || "stripe",
        operationalStatus: ledgerState.operationalStatus,
        financialStatus: normalizeString(transaction.refundStatus) === "refunded" ? "refunded" : ledgerState.financialStatus,
        occurredAt: transaction.createdAt,
        dueAt: transaction.createdAt,
        paidAt: normalizeString(transaction.paymentReceivedAt),
        refundedAt: normalizeString(transaction.refundedAt),
        refundAmountMinor: transaction.refundAmountMinor || 0,
        refundDisplay: transaction.refundAmount,
        nativeTransactionId: transaction.id,
        stripeCheckoutSessionId: transaction.stripeCheckoutSessionId,
        stripePaymentIntentId: transaction.stripePaymentIntentId,
        stripeRefundId: transaction.stripeRefundId,
        membershipId: transaction.membershipId,
        membershipUpgradeRequestId: transaction.membershipUpgradeRequestId,
        packageTierAtTime: normalizeString(hub?.packageTier),
        paymentProcessingModeAtTime: normalizeString(hub?.packagePaymentProcessingMode),
        sourceConfidence: "authoritative",
        reportingEligibility: "count_in_revenue",
      },
      normalizedActorId
    );

    if (record && normalizeString(transaction.paymentRecordId) !== normalizeString(record.id)) {
      await updateNativePaymentTransaction(
        normalizedHubId,
        transaction.id,
        {
          paymentRecordId: record.id,
        },
        normalizedActorId
      );
    }

    synced += 1;
  }

  return {
    total: transactions.filter((transaction) => normalizeString(transaction.kind) === "membership_upgrade").length,
    scanned,
    synced,
    skipped,
    latestSourceTimestamp,
  };
}
