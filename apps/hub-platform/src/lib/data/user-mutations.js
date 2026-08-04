try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import {
  canManageHubAdmins,
  canTransferHubOwnership,
  normalizeHubUserStatusPayload,
  normalizeMemberProfilePayload,
} from "@/lib/domain/users";
import { normalizeString } from "./user-shared.js";
import { getUserById, listUsersByHub } from "./user-queries.js";
import { createMediaUsageReference, syncMediaUsageReferenceForAssetChange } from "./media-usage-projection.js";

export async function updateMemberProfileById(hubId, userId, payload, actorId = "system") {
  const normalizedHubId = normalizeString(hubId);
  const normalizedUserId = normalizeString(userId);

  if (!normalizedHubId || !normalizedUserId) {
    throw new Error("Hub and user ids are required.");
  }

  const existing = await getUserById(normalizedHubId, normalizedUserId);

  if (!existing) {
    throw new Error("Member not found.");
  }

  if (existing.role !== "member") {
    throw new Error("Only member profiles can be updated through this flow.");
  }

  const next = normalizeMemberProfilePayload(payload);
  const now = new Date().toISOString();

  await getFirebaseAdminDb().collection("users").doc(normalizedUserId).update({
    name: next.name,
    updatedAt: now,
    updatedBy: actorId,
  });

  return {
    ...existing,
    ...next,
    updatedAt: now,
  };
}

export async function updateMemberAvatarById(hubId, userId, payload, actorId = "system") {
  const normalizedHubId = normalizeString(hubId);
  const normalizedUserId = normalizeString(userId);

  if (!normalizedHubId || !normalizedUserId) {
    throw new Error("Hub and user ids are required.");
  }

  const existing = await getUserById(normalizedHubId, normalizedUserId);

  if (!existing) {
    throw new Error("Member not found.");
  }

  if (existing.role !== "member") {
    throw new Error("Only member profiles can be updated through this flow.");
  }

  const avatarAssetId = normalizeString(payload.avatarAssetId);
  const avatarAlt = normalizeString(payload.avatarAlt);
  const now = new Date().toISOString();

  await getFirebaseAdminDb().collection("users").doc(normalizedUserId).update({
    avatarAssetId,
    avatarAlt,
    updatedAt: now,
    updatedBy: actorId,
  });
  await syncMediaUsageReferenceForAssetChange({
    hubId: normalizedHubId,
    previousAssetId: existing.avatarAssetId,
    nextAssetId: avatarAssetId,
    usageRef: createMediaUsageReference({
      entityType: "user",
      entityId: normalizedUserId,
      field: "avatar",
      label: existing.name || existing.email || "User avatar",
      href: "",
    }),
    updatedAt: now,
  });

  return {
    ...existing,
    avatarAssetId,
    avatarAlt,
    updatedAt: now,
  };
}

export async function updateHubUserStatusById(hubId, userId, payload, actorId = "system") {
  const normalizedHubId = normalizeString(hubId);
  const normalizedUserId = normalizeString(userId);

  if (!normalizedHubId || !normalizedUserId) {
    throw new Error("Hub and user ids are required.");
  }

  const existing = await getUserById(normalizedHubId, normalizedUserId);

  if (!existing) {
    throw new Error("User not found.");
  }

  if (existing.role === "superadmin") {
    throw new Error("Superadmin status cannot be changed here.");
  }

  const next = normalizeHubUserStatusPayload(payload);
  const now = new Date().toISOString();

  await getFirebaseAdminDb().collection("users").doc(normalizedUserId).update({
    status: next.status,
    updatedAt: now,
    updatedBy: actorId,
  });

  return {
    ...existing,
    status: next.status,
    updatedAt: now,
  };
}

export async function updateHubAdminStatusById(hubId, userId, payload, actorId = "system", actorRole = "") {
  const normalizedHubId = normalizeString(hubId);
  const normalizedUserId = normalizeString(userId);
  const normalizedActorId = normalizeString(actorId);

  if (!normalizedHubId || !normalizedUserId) {
    throw new Error("Hub and user ids are required.");
  }

  if (!canManageHubAdmins(actorRole)) {
    throw new Error("Only the owner can manage admin access.");
  }

  const existing = await getUserById(normalizedHubId, normalizedUserId);

  if (!existing) {
    throw new Error("Admin not found.");
  }

  if (existing.role !== "admin") {
    throw new Error("Only invited admins can be updated through this flow.");
  }

  const next = normalizeHubUserStatusPayload(payload);
  const now = new Date().toISOString();

  await getFirebaseAdminDb().collection("users").doc(normalizedUserId).update({
    status: next.status,
    updatedAt: now,
    updatedBy: normalizedActorId || "system",
  });

  return {
    ...existing,
    status: next.status,
    updatedAt: now,
  };
}

export async function transferHubOwnershipById(hubId, targetUserId, actorId = "system", actorRole = "") {
  const normalizedHubId = normalizeString(hubId);
  const normalizedTargetUserId = normalizeString(targetUserId);
  const normalizedActorId = normalizeString(actorId);

  if (!normalizedHubId || !normalizedTargetUserId || !normalizedActorId) {
    throw new Error("Hub, actor, and target user ids are required.");
  }

  if (!canTransferHubOwnership(actorRole)) {
    throw new Error("Only the owner can transfer ownership.");
  }

  const [actorUser, targetUser, hubUsers] = await Promise.all([
    getUserById(normalizedHubId, normalizedActorId),
    getUserById(normalizedHubId, normalizedTargetUserId),
    listUsersByHub(normalizedHubId),
  ]);

  if (!actorUser || actorUser.role !== "owner" || actorUser.status !== "active") {
    throw new Error("Active owner account required.");
  }

  if (!targetUser) {
    throw new Error("Target admin not found.");
  }

  if (targetUser.role !== "admin") {
    throw new Error("Only an active admin can receive ownership.");
  }

  if (targetUser.status !== "active") {
    throw new Error("Only an active admin can receive ownership.");
  }

  const ownerUsers = hubUsers.filter((user) => user.role === "owner" && user.status === "active");

  if (ownerUsers.length !== 1 || ownerUsers[0].id !== actorUser.id) {
    throw new Error("Exactly one active owner must exist before transfer.");
  }

  const now = new Date().toISOString();
  const batch = getFirebaseAdminDb().batch();
  const usersCollection = getFirebaseAdminDb().collection("users");

  batch.update(usersCollection.doc(actorUser.id), {
    role: "admin",
    updatedAt: now,
    updatedBy: normalizedActorId,
  });

  batch.update(usersCollection.doc(targetUser.id), {
    role: "owner",
    updatedAt: now,
    updatedBy: normalizedActorId,
  });

  await batch.commit();

  return {
    previousOwner: {
      ...actorUser,
      role: "admin",
      updatedAt: now,
    },
    newOwner: {
      ...targetUser,
      role: "owner",
      updatedAt: now,
    },
  };
}
