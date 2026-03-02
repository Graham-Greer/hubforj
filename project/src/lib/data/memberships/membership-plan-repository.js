import "server-only";
import crypto from "node:crypto";
import { getDataProvider } from "@/lib/data/shared/provider";

function planToViewModel(plan) {
  return {
    id: plan.id,
    hubId: plan.hubId,
    title: plan.title,
    description: plan.description || "",
    durationUnit: plan.durationUnit,
    durationValue: Number(plan.durationValue || 1),
    price: Number(plan.price || 0),
    active: Boolean(plan.active),
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  };
}

export async function listMembershipPlansByHub(hubId) {
  const provider = getDataProvider();

  if (provider.type === "firestore") {
    const snapshot = await provider.db
      .collection("hubs")
      .doc(hubId)
      .collection("membershipPlans")
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map((doc) => planToViewModel({ id: doc.id, hubId, ...doc.data() }));
  }

  const rows = provider.db.membershipPlans.get(hubId) || [];
  return rows.map(planToViewModel);
}

export async function getMembershipPlanById(hubId, planId) {
  const provider = getDataProvider();

  if (provider.type === "firestore") {
    const doc = await provider.db.collection("hubs").doc(hubId).collection("membershipPlans").doc(planId).get();
    if (!doc.exists) return null;
    return planToViewModel({ id: doc.id, hubId, ...doc.data() });
  }

  const rows = provider.db.membershipPlans.get(hubId) || [];
  const found = rows.find((row) => row.id === planId);
  return found ? planToViewModel(found) : null;
}

export async function createMembershipPlan(hubId, payload, actorId = "system") {
  const provider = getDataProvider();
  const now = new Date().toISOString();

  if (provider.type === "firestore") {
    const ref = provider.db.collection("hubs").doc(hubId).collection("membershipPlans").doc();
    const next = {
      ...payload,
      hubId,
      createdAt: now,
      updatedAt: now,
      createdBy: actorId,
      updatedBy: actorId,
    };

    await ref.set(next);
    return planToViewModel({ id: ref.id, ...next });
  }

  const row = {
    id: `plan_${crypto.randomUUID().slice(0, 8)}`,
    hubId,
    ...payload,
    createdAt: now,
    updatedAt: now,
    createdBy: actorId,
    updatedBy: actorId,
  };

  const rows = provider.db.membershipPlans.get(hubId) || [];
  provider.db.membershipPlans.set(hubId, [row, ...rows]);
  return planToViewModel(row);
}

export async function updateMembershipPlan(hubId, planId, patch, actorId = "system") {
  const provider = getDataProvider();
  const now = new Date().toISOString();

  if (provider.type === "firestore") {
    const ref = provider.db.collection("hubs").doc(hubId).collection("membershipPlans").doc(planId);
    const existing = await ref.get();
    if (!existing.exists) return null;

    await ref.update({ ...patch, updatedAt: now, updatedBy: actorId });
    const updated = await ref.get();
    return planToViewModel({ id: updated.id, hubId, ...updated.data() });
  }

  const rows = provider.db.membershipPlans.get(hubId) || [];
  const index = rows.findIndex((row) => row.id === planId);
  if (index === -1) return null;

  const next = { ...rows[index], ...patch, updatedAt: now, updatedBy: actorId };
  const clone = [...rows];
  clone[index] = next;
  provider.db.membershipPlans.set(hubId, clone);
  return planToViewModel(next);
}

export async function deleteMembershipPlan(hubId, planId) {
  const provider = getDataProvider();

  if (provider.type === "firestore") {
    const ref = provider.db.collection("hubs").doc(hubId).collection("membershipPlans").doc(planId);
    const existing = await ref.get();
    if (!existing.exists) return false;
    await ref.delete();
    return true;
  }

  const rows = provider.db.membershipPlans.get(hubId) || [];
  const next = rows.filter((row) => row.id !== planId);
  provider.db.membershipPlans.set(hubId, next);
  return next.length !== rows.length;
}
