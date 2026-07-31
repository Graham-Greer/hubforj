try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { normalizeMembershipAssignmentPayload, resolveMembershipPlanPricingMode } from "@/lib/domain/memberships";
import { getUserById, listUsersByHub } from "@/lib/data/users";
import { getDefaultMembershipPlanByHub, listMembershipPlansByHub } from "./membership-plans.js";
import {
  getMembershipPlansByIds,
  normalizeMembershipRecord,
  requireDefaultMembershipPlan,
  normalizeString,
  upsertMembershipPaymentRecord,
} from "./membership-shared.js";

function parseIsoDate(value) {
  const normalized = normalizeString(value);

  if (!normalized) {
    return null;
  }

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getMembershipSortValue(membership) {
  return String(membership?.startDate || membership?.updatedAt || membership?.createdAt || membership?.renewalDate || "");
}

export async function listMembershipsByUser(hubId, userId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedUserId = normalizeString(userId);

  if (!normalizedHubId || !normalizedUserId) {
    return [];
  }

  const snapshot = await getFirebaseAdminDb()
    .collection("hubs")
    .doc(normalizedHubId)
    .collection("memberships")
    .where("userId", "==", normalizedUserId)
    .get();

  const baseRows = snapshot.docs.map((doc) => ({
    id: doc.id,
    hubId: normalizedHubId,
    ...doc.data(),
  }));
  const plansById = await getMembershipPlansByIds(
    normalizedHubId,
    baseRows.map((row) => row.planId)
  );

  return baseRows
    .map((row) => normalizeMembershipRecord(row, plansById.get(row.planId)))
    .sort((left, right) => getMembershipSortValue(right).localeCompare(getMembershipSortValue(left)));
}

export async function getCurrentMembershipByUser(hubId, userId) {
  const rows = await listMembershipsByUser(hubId, userId);
  return rows[0] || null;
}

export async function listMembershipsByHub(hubId) {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    return [];
  }

  const snapshot = await getFirebaseAdminDb()
    .collection("hubs")
    .doc(normalizedHubId)
    .collection("memberships")
    .get();

  const baseRows = snapshot.docs.map((doc) => ({
    id: doc.id,
    hubId: normalizedHubId,
    ...doc.data(),
  }));

  const [plansById, users] = await Promise.all([
    getMembershipPlansByIds(normalizedHubId, baseRows.map((row) => row.planId)),
    listUsersByHub(normalizedHubId),
  ]);
  const usersById = new Map(users.map((user) => [user.id, user]));

  return baseRows
    .map((row) => {
      const user = usersById.get(row.userId);
      return normalizeMembershipRecord(
        {
          ...row,
          userName: user?.name,
          userEmail: user?.email,
        },
        plansById.get(row.planId)
      );
    })
    .sort((left, right) => getMembershipSortValue(right).localeCompare(getMembershipSortValue(left)));
}

export async function listMembershipDirectorySummariesByHub(hubId) {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    return [];
  }

  const snapshot = await getFirebaseAdminDb()
    .collection("hubs")
    .doc(normalizedHubId)
    .collection("memberships")
    .select("userId", "planId", "status", "paymentStatus", "startDate", "renewalDate", "createdAt", "updatedAt")
    .get();

  const baseRows = snapshot.docs.map((doc) => ({
    id: doc.id,
    hubId: normalizedHubId,
    ...doc.data(),
  }));
  const plansById = await getMembershipPlansByIds(
    normalizedHubId,
    baseRows.map((row) => row.planId)
  );

  return baseRows
    .map((row) => {
      const plan = plansById.get(row.planId);
      const membership = normalizeMembershipRecord(row, plan);

      return {
        id: membership.id,
        userId: membership.userId,
        planTitle: membership.planTitle,
        isDefault: membership.isDefault,
        status: membership.status,
        paymentStatus: membership.paymentStatus,
        sortValue: getMembershipSortValue(membership),
      };
    })
    .sort((left, right) => String(right.sortValue || "").localeCompare(String(left.sortValue || "")));
}

export async function upsertMembershipForUser(hubId, userId, payload, actorId = "system") {
  const normalizedHubId = normalizeString(hubId);
  const normalizedUserId = normalizeString(userId);

  if (!normalizedHubId || !normalizedUserId) {
    throw new Error("Hub and user ids are required.");
  }

  const user = await getUserById(normalizedHubId, normalizedUserId);
  if (!user || user.role !== "member") {
    throw new Error("Member not found.");
  }

  const plans = await listMembershipPlansByHub(normalizedHubId);
  const plan = plans.find((entry) => entry.id === normalizeString(payload.planId));
  const existingMembership = await getCurrentMembershipByUser(normalizedHubId, normalizedUserId);
  const next = normalizeMembershipAssignmentPayload(payload, plan, existingMembership);

  const collection = getFirebaseAdminDb().collection("hubs").doc(normalizedHubId).collection("memberships");
  const existingSnapshot = await collection.where("userId", "==", normalizedUserId).limit(1).get();

  const now = new Date().toISOString();
  const writeModel = {
    hubId: normalizedHubId,
    userId: normalizedUserId,
    planId: next.planId,
    status: next.status,
    paymentStatus: next.paymentStatus,
    startDate: next.startDate,
    renewalDate: next.renewalDate,
    scheduledChangeStatus: "",
    scheduledChangeType: "",
    scheduledPlanId: "",
    scheduledPlanTitle: "",
    scheduledChangeAt: "",
    scheduledChangeRequestedAt: "",
    scheduledChangeRequestedBy: "",
    scheduledChangeCancelledAt: "",
    scheduledChangeCancelledBy: "",
    scheduledChangeAppliedAt: "",
    notes: next.notes,
    updatedAt: now,
    updatedBy: actorId,
  };

  let membershipId = "";
  if (existingSnapshot.empty) {
    const ref = collection.doc();
    membershipId = ref.id;
    await ref.set({
      ...writeModel,
      createdAt: now,
      createdBy: actorId,
    });
  } else {
    const doc = existingSnapshot.docs[0];
    membershipId = doc.id;
    await doc.ref.set(writeModel, { merge: true });
  }

  await upsertMembershipPaymentRecord({
    hubId: normalizedHubId,
    membershipId,
    userId: normalizedUserId,
    paymentStatus: next.paymentStatus,
    renewalDate: next.renewalDate,
    startDate: next.startDate,
    plan,
    paymentDate: next.paymentStatus === "paid" ? now : "",
    syncToLedger: payload.syncPaymentRecordToLedger !== false,
    actorId,
  });

  return normalizeMembershipRecord(
    {
      id: membershipId,
      ...writeModel,
      userName: user.name,
      userEmail: user.email,
    },
    plan
  );
}

export async function assignDefaultMembershipToUser(hubId, userId, actorId = "system") {
  const normalizedHubId = normalizeString(hubId);
  const normalizedUserId = normalizeString(userId);

  if (!normalizedHubId || !normalizedUserId) {
    throw new Error("Hub and user ids are required.");
  }

  const defaultPlan = requireDefaultMembershipPlan([
    await getDefaultMembershipPlanByHub(normalizedHubId),
  ].filter(Boolean));

  return upsertMembershipForUser(
    normalizedHubId,
    normalizedUserId,
    {
      planId: defaultPlan.id,
      status: "active",
      paymentStatus: resolveMembershipPlanPricingMode(defaultPlan) === "free" ? "not_required" : "paid",
      notes: "",
    },
    actorId
  );
}

export async function revertMembershipToDefaultPlanForUser(
  hubId,
  userId,
  actorId = "system",
  notes = "Reverted to the default membership plan."
) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedUserId = normalizeString(userId);

  if (!normalizedHubId || !normalizedUserId) {
    throw new Error("Hub and user ids are required.");
  }

  const [currentMembership, defaultPlan] = await Promise.all([
    getCurrentMembershipByUser(normalizedHubId, normalizedUserId),
    getDefaultMembershipPlanByHub(normalizedHubId),
  ]);

  if (!currentMembership) {
    throw new Error("This member does not have a membership to revert.");
  }

  if (!defaultPlan) {
    throw new Error("Default membership plan is missing for this hub.");
  }

  if (currentMembership.planId === defaultPlan.id) {
    throw new Error("This member is already on the default membership plan.");
  }

  return upsertMembershipForUser(
    normalizedHubId,
    normalizedUserId,
    {
      planId: defaultPlan.id,
      status: "active",
      paymentStatus: resolveMembershipPlanPricingMode(defaultPlan) === "free" ? "not_required" : "paid",
      startDate: new Date().toISOString(),
      renewalDate: "",
      notes,
    },
    actorId
  );
}

export async function scheduleMembershipDefaultPlanDowngradeForUser(
  hubId,
  userId,
  actorId = "member",
  notes = "Member scheduled their upgraded membership to return to the default plan."
) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedUserId = normalizeString(userId);
  const normalizedActorId = normalizeString(actorId) || "member";

  if (!normalizedHubId || !normalizedUserId) {
    throw new Error("Hub and user ids are required.");
  }

  const [currentMembership, defaultPlan] = await Promise.all([
    getCurrentMembershipByUser(normalizedHubId, normalizedUserId),
    getDefaultMembershipPlanByHub(normalizedHubId),
  ]);

  if (!currentMembership) {
    throw new Error("This member does not have a membership to schedule.");
  }

  if (!defaultPlan) {
    throw new Error("Default membership plan is missing for this hub.");
  }

  if (currentMembership.planId === defaultPlan.id || currentMembership.isDefault) {
    throw new Error("This member is already on the default membership plan.");
  }

  if (currentMembership.scheduledChangeStatus === "pending") {
    throw new Error("A membership change is already scheduled.");
  }

  const scheduledChangeDate = parseIsoDate(currentMembership.renewalDate);

  if (!scheduledChangeDate || scheduledChangeDate.getTime() <= Date.now()) {
    throw new Error("A future renewal date is required before this membership can be scheduled to return to the default plan.");
  }

  const now = new Date().toISOString();
  const ref = getFirebaseAdminDb()
    .collection("hubs")
    .doc(normalizedHubId)
    .collection("memberships")
    .doc(currentMembership.id);
  const update = {
    scheduledChangeStatus: "pending",
    scheduledChangeType: "default_plan_downgrade",
    scheduledPlanId: defaultPlan.id,
    scheduledPlanTitle: normalizeString(defaultPlan.title) || "Default membership",
    scheduledChangeAt: scheduledChangeDate.toISOString(),
    scheduledChangeRequestedAt: now,
    scheduledChangeRequestedBy: normalizedActorId,
    scheduledChangeCancelledAt: "",
    scheduledChangeCancelledBy: "",
    scheduledChangeAppliedAt: "",
    notes,
    updatedAt: now,
    updatedBy: normalizedActorId,
  };

  await ref.set(update, { merge: true });

  return {
    ...currentMembership,
    ...update,
  };
}

export async function cancelScheduledMembershipDefaultPlanDowngradeForUser(
  hubId,
  userId,
  actorId = "member",
  notes = "Scheduled membership return to the default plan was cancelled."
) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedUserId = normalizeString(userId);
  const normalizedActorId = normalizeString(actorId) || "member";

  if (!normalizedHubId || !normalizedUserId) {
    throw new Error("Hub and user ids are required.");
  }

  const currentMembership = await getCurrentMembershipByUser(normalizedHubId, normalizedUserId);

  if (!currentMembership) {
    throw new Error("This member does not have a membership schedule to cancel.");
  }

  if (currentMembership.scheduledChangeStatus !== "pending") {
    throw new Error("No scheduled membership change exists for this member.");
  }

  const now = new Date().toISOString();
  const ref = getFirebaseAdminDb()
    .collection("hubs")
    .doc(normalizedHubId)
    .collection("memberships")
    .doc(currentMembership.id);
  const update = {
    scheduledChangeStatus: "cancelled",
    scheduledChangeCancelledAt: now,
    scheduledChangeCancelledBy: normalizedActorId,
    notes,
    updatedAt: now,
    updatedBy: normalizedActorId,
  };

  await ref.set(update, { merge: true });

  return {
    ...currentMembership,
    ...update,
  };
}

export async function listDueScheduledMembershipDefaultPlanDowngrades(now = new Date(), batchSize = 50) {
  const normalizedNow = (now instanceof Date ? now : new Date(now)).toISOString();
  const normalizedBatchSize = Math.max(1, Number.parseInt(String(batchSize || ""), 10) || 50);
  const snapshot = await getFirebaseAdminDb()
    .collectionGroup("memberships")
    .where("scheduledChangeStatus", "==", "pending")
    .where("scheduledChangeType", "==", "default_plan_downgrade")
    .where("scheduledChangeAt", "<=", normalizedNow)
    .orderBy("scheduledChangeAt", "asc")
    .limit(normalizedBatchSize)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ref: doc.ref,
    ...doc.data(),
  }));
}

export async function applyScheduledMembershipDefaultPlanDowngrade(
  membership,
  actorId = "internal-automation"
) {
  const normalizedHubId = normalizeString(membership?.hubId);
  const normalizedUserId = normalizeString(membership?.userId);
  const normalizedActorId = normalizeString(actorId) || "internal-automation";

  if (!normalizedHubId || !normalizedUserId) {
    throw new Error("Scheduled membership change is missing hub or member context.");
  }

  const applied = await revertMembershipToDefaultPlanForUser(
    normalizedHubId,
    normalizedUserId,
    normalizedActorId,
    "Scheduled membership return to the default plan was applied."
  );
  const now = new Date().toISOString();

  await getFirebaseAdminDb()
    .collection("hubs")
    .doc(normalizedHubId)
    .collection("memberships")
    .doc(applied.id)
    .set(
      {
        scheduledChangeStatus: "applied",
        scheduledChangeType: "default_plan_downgrade",
        scheduledPlanId: normalizeString(applied.planId),
        scheduledPlanTitle: normalizeString(applied.planTitle),
        scheduledChangeAt: normalizeString(membership.scheduledChangeAt),
        scheduledChangeRequestedAt: normalizeString(membership.scheduledChangeRequestedAt),
        scheduledChangeRequestedBy: normalizeString(membership.scheduledChangeRequestedBy),
        scheduledChangeAppliedAt: now,
        updatedAt: now,
        updatedBy: normalizedActorId,
      },
      { merge: true }
    );

  return applied;
}
