try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { getHubById } from "@/lib/data/hubs";
import { getUserById, listUsersByHub } from "@/lib/data/users";
import {
  getAvailableMembershipUpgradePlans,
  resolveMembershipPlanPricingMode,
} from "@/lib/domain/memberships";
import { getFallbackRegionalMarket } from "@/lib/domain/regional-markets";
import { listMembershipPlansByHub } from "./membership-plans.js";
import { getCurrentMembershipByUser, upsertMembershipForUser } from "./membership-user-records.js";
import { normalizeString } from "./membership-shared.js";

export function normalizeMembershipUpgradeRequestRecord(record) {
  if (!record) {
    return null;
  }

  return {
    id: normalizeString(record.id),
    hubId: normalizeString(record.hubId),
    userId: normalizeString(record.userId),
    status: normalizeString(record.status) || "pending",
    currentPlanId: normalizeString(record.currentPlanId),
    currentPlanTitle: normalizeString(record.currentPlanTitle),
    planId: normalizeString(record.planId),
    planTitle: normalizeString(record.planTitle),
    pricingMode: normalizeString(record.pricingMode) || "free",
    price: normalizeString(record.price),
    currency: normalizeString(record.currency).toUpperCase() || getFallbackRegionalMarket().defaultCurrency,
    paymentProcessingMode: normalizeString(record.paymentProcessingMode) || "none",
    externalPaymentUrl: normalizeString(record.externalPaymentUrl),
    paymentInstructions: normalizeString(record.paymentInstructions),
    nativePaymentTransactionId: normalizeString(record.nativePaymentTransactionId),
    nativePaymentStatus: normalizeString(record.nativePaymentStatus),
    nativePaymentCheckoutUrl: normalizeString(record.nativePaymentCheckoutUrl),
    nativePaymentSessionId: normalizeString(record.nativePaymentSessionId),
    paymentCompletedAt: normalizeString(record.paymentCompletedAt),
    requestedAt: normalizeString(record.requestedAt),
    approvedAt: normalizeString(record.approvedAt),
    createdAt: normalizeString(record.createdAt),
    updatedAt: normalizeString(record.updatedAt),
  };
}

export async function getPendingMembershipUpgradeRequestByUser(hubId, userId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedUserId = normalizeString(userId);

  if (!normalizedHubId || !normalizedUserId) {
    return null;
  }

  const snapshot = await getFirebaseAdminDb()
    .collection("hubs")
    .doc(normalizedHubId)
    .collection("membershipUpgradeRequests")
    .where("userId", "==", normalizedUserId)
    .where("status", "==", "pending")
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return normalizeMembershipUpgradeRequestRecord({
    id: doc.id,
    hubId: normalizedHubId,
    ...doc.data(),
  });
}

export async function getMembershipUpgradeRequestById(hubId, requestId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedRequestId = normalizeString(requestId);

  if (!normalizedHubId || !normalizedRequestId) {
    return null;
  }

  const snapshot = await getFirebaseAdminDb()
    .collection("hubs")
    .doc(normalizedHubId)
    .collection("membershipUpgradeRequests")
    .doc(normalizedRequestId)
    .get();

  if (!snapshot.exists) {
    return null;
  }

  return normalizeMembershipUpgradeRequestRecord({
    id: snapshot.id,
    hubId: normalizedHubId,
    ...snapshot.data(),
  });
}

export async function listPendingMembershipUpgradeRequestsByHub(hubId) {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    return [];
  }

  const [snapshot, users] = await Promise.all([
    getFirebaseAdminDb()
      .collection("hubs")
      .doc(normalizedHubId)
      .collection("membershipUpgradeRequests")
      .where("status", "==", "pending")
      .get(),
    listUsersByHub(normalizedHubId),
  ]);

  const usersById = new Map(users.map((user) => [user.id, user]));

  return snapshot.docs
    .map((doc) => {
      const request = normalizeMembershipUpgradeRequestRecord({
        id: doc.id,
        hubId: normalizedHubId,
        ...doc.data(),
      });
      const user = usersById.get(request.userId);

      return {
        ...request,
        userName: normalizeString(user?.name),
        userEmail: normalizeString(user?.email).toLowerCase(),
      };
    })
    .sort((left, right) => String(right.requestedAt || "").localeCompare(String(left.requestedAt || "")));
}

export async function listPendingMembershipUpgradeRequestUserIdsByHub(hubId) {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    return [];
  }

  const snapshot = await getFirebaseAdminDb()
    .collection("hubs")
    .doc(normalizedHubId)
    .collection("membershipUpgradeRequests")
    .where("status", "==", "pending")
    .select("userId")
    .get();

  return snapshot.docs
    .map((doc) => normalizeString(doc.data()?.userId))
    .filter(Boolean);
}

export async function createMembershipUpgradeRequest(hubId, userId, planId, actorId = "member") {
  const normalizedHubId = normalizeString(hubId);
  const normalizedUserId = normalizeString(userId);
  const normalizedPlanId = normalizeString(planId);
  const normalizedActorId = normalizeString(actorId) || "member";

  if (!normalizedHubId || !normalizedUserId || !normalizedPlanId) {
    throw new Error("Hub, member, and plan context are required.");
  }

  const [hub, user, membershipPlans, currentMembership, existingRequest] = await Promise.all([
    getHubById(normalizedHubId),
    getUserById(normalizedHubId, normalizedUserId),
    listMembershipPlansByHub(normalizedHubId),
    getCurrentMembershipByUser(normalizedHubId, normalizedUserId),
    getPendingMembershipUpgradeRequestByUser(normalizedHubId, normalizedUserId),
  ]);

  if (!hub) {
    throw new Error("Hub not found.");
  }

  if (!user || user.role !== "member") {
    throw new Error("Member not found.");
  }

  if (existingRequest) {
    throw new Error("You already have a membership upgrade request awaiting review.");
  }

  const requestedPlan = getAvailableMembershipUpgradePlans(membershipPlans, currentMembership)
    .find((plan) => plan.id === normalizedPlanId);

  if (!requestedPlan) {
    throw new Error("This membership plan is not available for self-serve upgrade.");
  }

  const now = new Date().toISOString();
  const ref = getFirebaseAdminDb()
    .collection("hubs")
    .doc(normalizedHubId)
    .collection("membershipUpgradeRequests")
    .doc();

  const writeModel = {
    hubId: normalizedHubId,
    userId: normalizedUserId,
    status: "pending",
    currentPlanId: normalizeString(currentMembership?.planId),
    currentPlanTitle: normalizeString(currentMembership?.planTitle),
    planId: requestedPlan.id,
    planTitle: requestedPlan.title,
    pricingMode: resolveMembershipPlanPricingMode(requestedPlan),
    price: normalizeString(requestedPlan.price),
    currency: normalizeString(requestedPlan.currency).toUpperCase() || getFallbackRegionalMarket().defaultCurrency,
    paymentProcessingMode: normalizeString(hub.packagePaymentProcessingMode) || "none",
    externalPaymentUrl: normalizeString(requestedPlan.externalPaymentUrl),
    paymentInstructions: normalizeString(requestedPlan.paymentInstructions),
    nativePaymentTransactionId: "",
    nativePaymentStatus: "",
    nativePaymentCheckoutUrl: "",
    nativePaymentSessionId: "",
    paymentCompletedAt: "",
    requestedAt: now,
    createdAt: now,
    updatedAt: now,
    createdBy: normalizedActorId,
    updatedBy: normalizedActorId,
  };

  await ref.set(writeModel);

  return normalizeMembershipUpgradeRequestRecord({
    id: ref.id,
    ...writeModel,
  });
}

export async function updateMembershipUpgradeRequestPaymentState(
  hubId,
  requestId,
  payload = {},
  actorId = "system"
) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedRequestId = normalizeString(requestId);
  const normalizedActorId = normalizeString(actorId) || "system";

  if (!normalizedHubId || !normalizedRequestId) {
    throw new Error("Hub and request context are required.");
  }

  const ref = getFirebaseAdminDb()
    .collection("hubs")
    .doc(normalizedHubId)
    .collection("membershipUpgradeRequests")
    .doc(normalizedRequestId);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new Error("Membership upgrade request not found.");
  }

  const request = normalizeMembershipUpgradeRequestRecord({
    id: snapshot.id,
    hubId: normalizedHubId,
    ...snapshot.data(),
  });
  const now = new Date().toISOString();
  const update = {
    nativePaymentTransactionId: normalizeString(payload.nativePaymentTransactionId) || request.nativePaymentTransactionId,
    nativePaymentStatus: normalizeString(payload.nativePaymentStatus) || request.nativePaymentStatus,
    nativePaymentCheckoutUrl:
      normalizeString(payload.nativePaymentCheckoutUrl) || request.nativePaymentCheckoutUrl,
    nativePaymentSessionId:
      normalizeString(payload.nativePaymentSessionId) || request.nativePaymentSessionId,
    paymentCompletedAt: normalizeString(payload.paymentCompletedAt) || request.paymentCompletedAt,
    updatedAt: now,
    updatedBy: normalizedActorId,
  };

  await ref.set(update, { merge: true });

  return normalizeMembershipUpgradeRequestRecord({
    ...request,
    ...update,
  });
}

export async function approveMembershipUpgradeRequest(
  hubId,
  requestId,
  { paymentStatus = "paid", actorId = "hub-admin" } = {}
) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedRequestId = normalizeString(requestId);
  const normalizedActorId = normalizeString(actorId) || "hub-admin";

  if (!normalizedHubId || !normalizedRequestId) {
    throw new Error("Hub and request context are required.");
  }

  const ref = getFirebaseAdminDb()
    .collection("hubs")
    .doc(normalizedHubId)
    .collection("membershipUpgradeRequests")
    .doc(normalizedRequestId);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new Error("Membership upgrade request not found.");
  }

  const request = normalizeMembershipUpgradeRequestRecord({
    id: snapshot.id,
    hubId: normalizedHubId,
    ...snapshot.data(),
  });

  if (request.status !== "pending") {
    throw new Error("This membership upgrade request is no longer pending.");
  }

  await upsertMembershipForUser(
    normalizedHubId,
    request.userId,
    {
      planId: request.planId,
      status: "active",
      paymentStatus,
      notes: "Approved from membership upgrade request.",
      syncPaymentRecordToLedger: !normalizeString(request.nativePaymentTransactionId),
    },
    normalizedActorId
  );

  const now = new Date().toISOString();
  const update = {
    status: "approved",
    approvedAt: now,
    updatedAt: now,
    updatedBy: normalizedActorId,
  };

  await ref.set(update, { merge: true });

  return normalizeMembershipUpgradeRequestRecord({
    ...request,
    ...update,
  });
}

export async function cancelMembershipUpgradeRequest(hubId, requestId, actorId = "member") {
  const normalizedHubId = normalizeString(hubId);
  const normalizedRequestId = normalizeString(requestId);
  const normalizedActorId = normalizeString(actorId) || "member";

  if (!normalizedHubId || !normalizedRequestId) {
    throw new Error("Hub and request context are required.");
  }

  const ref = getFirebaseAdminDb()
    .collection("hubs")
    .doc(normalizedHubId)
    .collection("membershipUpgradeRequests")
    .doc(normalizedRequestId);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new Error("Membership upgrade request not found.");
  }

  const request = normalizeMembershipUpgradeRequestRecord({
    id: snapshot.id,
    hubId: normalizedHubId,
    ...snapshot.data(),
  });

  if (request.status !== "pending") {
    throw new Error("This membership upgrade request can no longer be cancelled.");
  }

  const now = new Date().toISOString();
  const update = {
    status: "cancelled",
    updatedAt: now,
    updatedBy: normalizedActorId,
  };

  await ref.set(update, { merge: true });

  return normalizeMembershipUpgradeRequestRecord({
    ...request,
    ...update,
  });
}
