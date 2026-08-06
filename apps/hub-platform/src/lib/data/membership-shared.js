try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { cache } from "react";
import { getHubById } from "@/lib/data/hubs";
import { upsertPaymentRecordBySource } from "@/lib/data/payment-records";
import { deriveMembershipStatus, findDefaultMembershipPlan, resolveMembershipPlanPricingMode } from "@/lib/domain/memberships";
import { getFallbackRegionalMarket } from "@/lib/domain/regional-markets";

export function normalizeString(value) {
  return String(value || "").trim();
}

const zeroDecimalCurrencies = new Set([
  "BIF",
  "CLP",
  "DJF",
  "GNF",
  "JPY",
  "KMF",
  "KRW",
  "MGA",
  "PYG",
  "RWF",
  "UGX",
  "VND",
  "VUV",
  "XAF",
  "XOF",
  "XPF",
]);

function normalizeMoneyAmountToMinor(amount, currency = getFallbackRegionalMarket().defaultCurrency) {
  const numeric = Number.parseFloat(String(amount || ""));
  const normalizedCurrency = normalizeString(currency).toUpperCase() || getFallbackRegionalMarket().defaultCurrency;

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 0;
  }

  if (zeroDecimalCurrencies.has(normalizedCurrency)) {
    return Math.round(numeric);
  }

  return Math.round(numeric * 100);
}

export function normalizeMembershipPlanRecord(plan) {
  if (!plan) {
    return null;
  }

  return {
    id: normalizeString(plan.id),
    hubId: normalizeString(plan.hubId),
    title: normalizeString(plan.title),
    description: normalizeString(plan.description),
    pricingMode: resolveMembershipPlanPricingMode(plan),
    price: normalizeString(plan.price),
    currency: normalizeString(plan.currency).toUpperCase() || getFallbackRegionalMarket().defaultCurrency,
    externalPaymentUrl: normalizeString(plan.externalPaymentUrl),
    paymentInstructions: normalizeString(plan.paymentInstructions),
    durationUnit: normalizeString(plan.durationUnit),
    durationValue: Number.parseInt(String(plan.durationValue || ""), 10) || 0,
    isDefault: plan.isDefault === true,
    visibility: normalizeString(plan.visibility).toLowerCase() || "public",
    status: normalizeString(plan.status) || "active",
    createdAt: normalizeString(plan.createdAt),
    updatedAt: normalizeString(plan.updatedAt),
  };
}

export function requireDefaultMembershipPlan(plans = []) {
  const defaultPlan = findDefaultMembershipPlan(plans);

  if (!defaultPlan) {
    throw new Error("Default membership plan is missing for this hub.");
  }

  return defaultPlan;
}

export function normalizeMembershipRecord(membership, plan = null) {
  if (!membership) {
    return null;
  }

  const normalized = {
    id: normalizeString(membership.id),
    hubId: normalizeString(membership.hubId),
    userId: normalizeString(membership.userId),
    planId: normalizeString(membership.planId),
    status: normalizeString(membership.status) || "active",
    paymentStatus: normalizeString(membership.paymentStatus) || "unpaid",
    startDate: normalizeString(membership.startDate),
    renewalDate: normalizeString(membership.renewalDate),
    scheduledChangeStatus: normalizeString(membership.scheduledChangeStatus),
    scheduledChangeType: normalizeString(membership.scheduledChangeType),
    scheduledPlanId: normalizeString(membership.scheduledPlanId),
    scheduledPlanTitle: normalizeString(membership.scheduledPlanTitle),
    scheduledChangeAt: normalizeString(membership.scheduledChangeAt),
    scheduledChangeRequestedAt: normalizeString(membership.scheduledChangeRequestedAt),
    scheduledChangeRequestedBy: normalizeString(membership.scheduledChangeRequestedBy),
    scheduledChangeCancelledAt: normalizeString(membership.scheduledChangeCancelledAt),
    scheduledChangeCancelledBy: normalizeString(membership.scheduledChangeCancelledBy),
    scheduledChangeAppliedAt: normalizeString(membership.scheduledChangeAppliedAt),
    createdAt: normalizeString(membership.createdAt),
    updatedAt: normalizeString(membership.updatedAt),
    notes: normalizeString(membership.notes),
    userName: normalizeString(membership.userName),
    userEmail: normalizeString(membership.userEmail).toLowerCase(),
    planTitle: normalizeString(plan?.title),
    pricingMode: resolveMembershipPlanPricingMode(plan),
    planPrice: normalizeString(plan?.price),
    planCurrency: normalizeString(plan?.currency).toUpperCase() || getFallbackRegionalMarket().defaultCurrency,
    planDescription: normalizeString(plan?.description),
    isDefault: plan?.isDefault === true,
  };

  return {
    ...normalized,
    derivedStatus: deriveMembershipStatus(normalized),
  };
}

export function buildMembershipPaymentRecordId(membershipId, renewalDate, startDate = "") {
  const normalizedMembershipId = normalizeString(membershipId);
  const normalizedRenewalDate = normalizeString(renewalDate).replace(/[^0-9]/g, "");
  const normalizedStartDate = normalizeString(startDate).replace(/[^0-9]/g, "");
  return `${normalizedMembershipId}_${normalizedStartDate || normalizedRenewalDate || "current"}`;
}

export function normalizeMembershipPaymentRecord(record) {
  if (!record) {
    return null;
  }

  return {
    id: normalizeString(record.id),
    hubId: normalizeString(record.hubId),
    userId: normalizeString(record.userId),
    membershipId: normalizeString(record.membershipId),
    planId: normalizeString(record.planId),
    title: normalizeString(record.title) || "Membership",
    pricingMode: normalizeString(record.pricingMode) || "paid",
    amount: normalizeString(record.amount),
    currency: normalizeString(record.currency).toUpperCase() || getFallbackRegionalMarket().defaultCurrency,
    paymentStatus: normalizeString(record.paymentStatus) || "unpaid",
    paymentDate: normalizeString(record.paymentDate),
    renewalDate: normalizeString(record.renewalDate),
    createdAt: normalizeString(record.createdAt),
    updatedAt: normalizeString(record.updatedAt),
    historyLabel: normalizeString(record.historyLabel),
    historyTone: normalizeString(record.historyTone) || "neutral",
    isCurrentCycle: record.isCurrentCycle === true,
    isHistorical: record.isHistorical === true,
  };
}

async function getFirestoreMembershipPlansByIds(hubId, planIdsCsv) {
  const normalizedPlanIds = [...new Set(String(planIdsCsv || "").split(",").map(normalizeString).filter(Boolean))];

  if (!normalizedPlanIds.length) {
    return new Map();
  }

  const db = getFirebaseAdminDb();
  const refs = normalizedPlanIds.map((planId) =>
    db.collection("hubs").doc(hubId).collection("membershipPlans").doc(planId)
  );
  const docs = await db.getAll(...refs);

  return new Map(
    docs
      .filter((doc) => doc.exists)
      .map((doc) => [doc.id, normalizeMembershipPlanRecord({ id: doc.id, hubId, ...doc.data() })])
  );
}

const getCachedFirestoreMembershipPlansByIds = cache(getFirestoreMembershipPlansByIds);

export async function getMembershipPlansByIds(hubId, planIds) {
  const normalizedPlanIdsCsv = [...new Set(planIds.map(normalizeString).filter(Boolean))].sort().join(",");
  return getCachedFirestoreMembershipPlansByIds(hubId, normalizedPlanIdsCsv);
}

export async function upsertMembershipPaymentRecord({
  hubId,
  membershipId,
  userId,
  paymentStatus,
  renewalDate,
  startDate = "",
  plan,
  paymentDate = "",
  syncToLedger = true,
  actorId = "system",
}) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedMembershipId = normalizeString(membershipId);
  const normalizedUserId = normalizeString(userId);
  const normalizedActorId = normalizeString(actorId) || "system";
  const now = new Date().toISOString();
  const recordId = buildMembershipPaymentRecordId(normalizedMembershipId, renewalDate, startDate);
  const ref = getFirebaseAdminDb()
    .collection("hubs")
    .doc(normalizedHubId)
    .collection("membershipPayments")
    .doc(recordId);

  const existing = await ref.get();
  const writeModel = {
    hubId: normalizedHubId,
    userId: normalizedUserId,
    membershipId: normalizedMembershipId,
    planId: normalizeString(plan?.id),
    title: normalizeString(plan?.title) || "Membership",
    pricingMode: resolveMembershipPlanPricingMode(plan),
    amount: normalizeString(plan?.price),
    currency: normalizeString(plan?.currency).toUpperCase() || getFallbackRegionalMarket().defaultCurrency,
    paymentStatus: normalizeString(paymentStatus) || "unpaid",
    paymentDate:
      normalizeString(paymentDate) ||
      (normalizeString(paymentStatus) === "paid" ? now : normalizeString(existing.data()?.paymentDate)),
    renewalDate: normalizeString(renewalDate),
    updatedAt: now,
    updatedBy: normalizedActorId,
  };

  if (!existing.exists) {
    await ref.set({
      ...writeModel,
      createdAt: now,
      createdBy: normalizedActorId,
    });
  } else {
    await ref.set(writeModel, { merge: true });
  }

  const normalizedRecord = normalizeMembershipPaymentRecord({
    id: recordId,
    ...existing.data(),
    ...writeModel,
    createdAt: existing.exists ? existing.data()?.createdAt : now,
  });

  if (syncToLedger) {
    await syncMembershipPaymentRecordToLedger({
      hubId: normalizedHubId,
      membershipPaymentRecord: normalizedRecord,
      actorId: normalizedActorId,
    });
  }

  return normalizedRecord;
}

export async function syncMembershipPaymentRecordToLedger({
  hubId,
  membershipPaymentRecord,
  actorId = "system",
  syncMemberDirectory = true,
}) {
  const normalizedHubId = normalizeString(hubId);
  const record = normalizeMembershipPaymentRecord(membershipPaymentRecord);

  if (!normalizedHubId || !record?.id) {
    return null;
  }

  const hub = await getHubById(normalizedHubId);
  const pricingMode = normalizeString(record.pricingMode) || "paid";
  const paymentStatus = normalizeString(record.paymentStatus) || "unpaid";
  const isChargeable = pricingMode === "paid";
  const sourceConfidence = isChargeable ? "declared" : "authoritative";
  const reportingEligibility =
    paymentStatus === "not_required" || !isChargeable ? "informational_only" : "count_in_revenue";
  const paymentMode = !isChargeable ? "none" : normalizeString(hub?.packagePaymentProcessingMode) === "internal" ? "manual" : "external";
  const provider = !isChargeable ? "internal" : paymentMode === "external" ? "external" : "manual";
  const operationalStatus =
    paymentStatus === "failed" ? "cancelled" : paymentStatus === "paid" || paymentStatus === "not_required" ? "completed" : "open";

  return upsertPaymentRecordBySource(
    normalizedHubId,
    {
      userId: record.userId,
      kind: "membership_cycle",
      sourceType: "membershipPayment",
      sourceId: record.id,
      title: record.title || "Membership",
      description: record.renewalDate ? "Membership renewal cycle." : "Membership plan payment record.",
      amountMinor: normalizeMoneyAmountToMinor(record.amount, record.currency),
      amountDisplay: record.amount,
      currency: record.currency,
      paymentMode,
      provider,
      operationalStatus,
      financialStatus: paymentStatus,
      occurredAt: record.paymentDate || record.createdAt || record.updatedAt,
      dueAt: record.renewalDate || record.createdAt || record.updatedAt,
      paidAt: paymentStatus === "paid" ? record.paymentDate || record.updatedAt : "",
      membershipId: record.membershipId,
      packageTierAtTime: normalizeString(hub?.packageTier),
      paymentProcessingModeAtTime: normalizeString(hub?.packagePaymentProcessingMode),
      sourceConfidence,
      reportingEligibility,
    },
    actorId,
    {
      syncMemberDirectory,
    }
  );
}
