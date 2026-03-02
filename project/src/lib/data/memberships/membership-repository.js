import "server-only";
import crypto from "node:crypto";
import { getDataProvider } from "@/lib/data/shared/provider";
import { getMembershipPlanById } from "@/lib/data/memberships/membership-plan-repository";
import {
  addDurationToIso,
  deriveMembershipStatus,
  validateMembershipPaymentStatus,
  validateMembershipStatusTransition,
} from "@/lib/validation/memberships";

function membershipToViewModel(membership, hubGraceDays = 0) {
  const derivedStatus = deriveMembershipStatus(membership, hubGraceDays);
  return {
    id: membership.id,
    hubId: membership.hubId,
    userId: membership.userId,
    planId: membership.planId,
    status: derivedStatus,
    storedStatus: membership.status,
    paymentStatus: membership.paymentStatus,
    startDate: membership.startDate,
    renewalDate: membership.renewalDate,
    gracePeriodDaysOverride: membership.gracePeriodDaysOverride ?? null,
    notes: membership.notes || "",
    createdAt: membership.createdAt,
    updatedAt: membership.updatedAt,
  };
}

async function getHubGraceDays(provider, hubId) {
  if (provider.type === "firestore") {
    const hubDoc = await provider.db.collection("hubs").doc(hubId).get();
    if (!hubDoc.exists) return 0;
    return Number(hubDoc.data()?.gracePeriodDays || 0);
  }

  const hub = provider.db.hubs.get(hubId);
  return Number(hub?.gracePeriodDays || 0);
}

export async function listMembershipsByHub(hubId, options = {}) {
  const provider = getDataProvider();
  const search = String(options.search || "").trim().toLowerCase();
  const statusFilter = String(options.status || "all").trim();
  const paymentFilter = String(options.paymentStatus || "all").trim();
  const hubGraceDays = await getHubGraceDays(provider, hubId);

  let rows;
  if (provider.type === "firestore") {
    const snapshot = await provider.db
      .collection("hubs")
      .doc(hubId)
      .collection("memberships")
      .orderBy("renewalDate", "asc")
      .get();

    rows = snapshot.docs.map((doc) => membershipToViewModel({ id: doc.id, hubId, ...doc.data() }, hubGraceDays));
  } else {
    rows = (provider.db.memberships.get(hubId) || []).map((row) => membershipToViewModel(row, hubGraceDays));
  }

  return rows.filter((row) => {
    const bySearch = search
      ? String(row.userId || "").toLowerCase().includes(search) || String(row.notes || "").toLowerCase().includes(search)
      : true;
    const byStatus = statusFilter === "all" ? true : row.status === statusFilter;
    const byPayment = paymentFilter === "all" ? true : row.paymentStatus === paymentFilter;
    return bySearch && byStatus && byPayment;
  });
}

export async function listMembershipsByUser(hubId, userId) {
  const provider = getDataProvider();
  const normalizedUserId = String(userId || "").trim();
  if (!normalizedUserId) return [];
  const hubGraceDays = await getHubGraceDays(provider, hubId);

  if (provider.type === "firestore") {
    const snapshot = await provider.db
      .collection("hubs")
      .doc(hubId)
      .collection("memberships")
      .where("userId", "==", normalizedUserId)
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map((doc) => membershipToViewModel({ id: doc.id, hubId, ...doc.data() }, hubGraceDays));
  }

  const rows = provider.db.memberships.get(hubId) || [];
  return rows
    .filter((row) => row.userId === normalizedUserId)
    .map((row) => membershipToViewModel(row, hubGraceDays))
    .sort((left, right) => String(right.createdAt || "").localeCompare(String(left.createdAt || "")));
}

export async function getLatestMembershipByUser(hubId, userId) {
  const rows = await listMembershipsByUser(hubId, userId);
  return rows[0] || null;
}

export async function getMembershipById(hubId, membershipId) {
  const provider = getDataProvider();
  const hubGraceDays = await getHubGraceDays(provider, hubId);

  if (provider.type === "firestore") {
    const doc = await provider.db.collection("hubs").doc(hubId).collection("memberships").doc(membershipId).get();
    if (!doc.exists) return null;
    return membershipToViewModel({ id: doc.id, hubId, ...doc.data() }, hubGraceDays);
  }

  const rows = provider.db.memberships.get(hubId) || [];
  const found = rows.find((row) => row.id === membershipId);
  return found ? membershipToViewModel(found, hubGraceDays) : null;
}

export async function createMembership(hubId, payload, options = {}, actorId = "system") {
  const provider = getDataProvider();
  const now = new Date().toISOString();
  const plan = await getMembershipPlanById(hubId, payload.planId);
  if (!plan) {
    throw new Error("Membership plan not found.");
  }

  const stripeEnabled = Boolean(options.stripeEnabled);
  const startDate = payload.startDate || now;
  const renewalDate = addDurationToIso(startDate, plan.durationUnit, plan.durationValue);

  let paymentStatus = "not-required";
  let status = "active";

  if (Number(plan.price) > 0) {
    paymentStatus = "unpaid";
    status = stripeEnabled ? "pending" : "pending";
  }

  if (provider.type === "firestore") {
    const ref = provider.db.collection("hubs").doc(hubId).collection("memberships").doc();
    const next = {
      hubId,
      userId: payload.userId,
      planId: payload.planId,
      status,
      paymentStatus,
      startDate,
      renewalDate,
      notes: String(payload.notes || "").trim(),
      createdAt: now,
      updatedAt: now,
      createdBy: actorId,
      updatedBy: actorId,
    };
    await ref.set(next);
    return membershipToViewModel({ id: ref.id, ...next }, await getHubGraceDays(provider, hubId));
  }

  const row = {
    id: `membership_${crypto.randomUUID().slice(0, 8)}`,
    hubId,
    userId: payload.userId,
    planId: payload.planId,
    status,
    paymentStatus,
    startDate,
    renewalDate,
    notes: String(payload.notes || "").trim(),
    createdAt: now,
    updatedAt: now,
    createdBy: actorId,
    updatedBy: actorId,
  };

  const rows = provider.db.memberships.get(hubId) || [];
  provider.db.memberships.set(hubId, [row, ...rows]);
  return membershipToViewModel(row, await getHubGraceDays(provider, hubId));
}

async function getRawMembership(provider, hubId, membershipId) {
  if (provider.type === "firestore") {
    const doc = await provider.db.collection("hubs").doc(hubId).collection("memberships").doc(membershipId).get();
    if (!doc.exists) return null;
    return { id: doc.id, hubId, ...doc.data() };
  }

  const rows = provider.db.memberships.get(hubId) || [];
  return rows.find((row) => row.id === membershipId) || null;
}

async function applyPatch(provider, hubId, membershipId, patch) {
  if (provider.type === "firestore") {
    const ref = provider.db.collection("hubs").doc(hubId).collection("memberships").doc(membershipId);
    await ref.update(patch);
    const updated = await ref.get();
    return { id: updated.id, hubId, ...updated.data() };
  }

  const rows = provider.db.memberships.get(hubId) || [];
  const index = rows.findIndex((row) => row.id === membershipId);
  if (index === -1) return null;

  const next = { ...rows[index], ...patch };
  const clone = [...rows];
  clone[index] = next;
  provider.db.memberships.set(hubId, clone);
  return next;
}

export async function transitionMembershipStatus(hubId, membershipId, nextStatus, actorId = "system") {
  const provider = getDataProvider();
  const raw = await getRawMembership(provider, hubId, membershipId);
  if (!raw) throw new Error("Membership not found.");

  const hubGraceDays = await getHubGraceDays(provider, hubId);
  const currentStatus = deriveMembershipStatus(raw, hubGraceDays);
  const resolved = validateMembershipStatusTransition(currentStatus, nextStatus, { isSystem: false });

  const updated = await applyPatch(provider, hubId, membershipId, {
    status: resolved,
    updatedAt: new Date().toISOString(),
    updatedBy: actorId,
  });

  return membershipToViewModel(updated, hubGraceDays);
}

export async function markMembershipPaymentStatus(hubId, membershipId, paymentStatus, actorId = "system") {
  const provider = getDataProvider();
  const raw = await getRawMembership(provider, hubId, membershipId);
  if (!raw) throw new Error("Membership not found.");

  const nextPayment = validateMembershipPaymentStatus(paymentStatus);
  const hubGraceDays = await getHubGraceDays(provider, hubId);
  const currentStatus = deriveMembershipStatus(raw, hubGraceDays);

  let nextStatus = raw.status;
  if (nextPayment === "paid" && (currentStatus === "pending" || currentStatus === "expired")) {
    nextStatus = validateMembershipStatusTransition(currentStatus, "active", { isSystem: false });
  }

  const updated = await applyPatch(provider, hubId, membershipId, {
    paymentStatus: nextPayment,
    status: nextStatus,
    updatedAt: new Date().toISOString(),
    updatedBy: actorId,
  });

  return membershipToViewModel(updated, hubGraceDays);
}

export async function renewMembership(hubId, membershipId, actorId = "system") {
  const provider = getDataProvider();
  const raw = await getRawMembership(provider, hubId, membershipId);
  if (!raw) throw new Error("Membership not found.");

  const plan = await getMembershipPlanById(hubId, raw.planId);
  if (!plan) throw new Error("Membership plan not found.");

  const hubGraceDays = await getHubGraceDays(provider, hubId);
  const currentStatus = deriveMembershipStatus(raw, hubGraceDays);
  const nextStatus = validateMembershipStatusTransition(currentStatus, "active", { isSystem: false });

  const startDate = new Date().toISOString();
  const renewalDate = addDurationToIso(startDate, plan.durationUnit, plan.durationValue);

  const patch = {
    status: nextStatus,
    startDate,
    renewalDate,
    updatedAt: new Date().toISOString(),
    updatedBy: actorId,
  };

  if (raw.paymentStatus !== "not-required") {
    patch.paymentStatus = "paid";
  }

  const updated = await applyPatch(provider, hubId, membershipId, patch);
  return membershipToViewModel(updated, hubGraceDays);
}
