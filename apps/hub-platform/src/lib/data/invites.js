import crypto from "node:crypto";

try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import {
  normalizeAcceptAdminInvitePayload,
  canResendInvite,
  canRevokeInvite,
  deriveInviteStatus,
  normalizeCreateAdminInvitePayload,
} from "@/lib/domain/invites";
import { rebuildMemberDirectoryForUser } from "@/lib/data/member-directory";
import { normalizeUserRecord } from "./user-shared.js";

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeInviteRecord(invite) {
  if (!invite) {
    return null;
  }

  return {
    id: normalizeString(invite.id),
    hubId: normalizeString(invite.hubId),
    email: normalizeString(invite.email).toLowerCase(),
    role: normalizeString(invite.role) || "admin",
    status: normalizeString(invite.status) || "pending",
    derivedStatus: deriveInviteStatus(invite.status, invite.expiresAt),
    createdAt: normalizeString(invite.createdAt),
    expiresAt: normalizeString(invite.expiresAt),
    revokedAt: normalizeString(invite.revokedAt),
    acceptedAt: normalizeString(invite.acceptedAt),
    invitedByUserId: normalizeString(invite.invitedByUserId),
    emailSentAt: normalizeString(invite.emailSentAt),
    lastEmailAttemptAt: normalizeString(invite.lastEmailAttemptAt),
    deliveryStatus: normalizeString(invite.deliveryStatus) || "pending_delivery",
    deliveryError: normalizeString(invite.deliveryError),
    deliveryProvider: normalizeString(invite.deliveryProvider),
    deliveryMessageId: normalizeString(invite.deliveryMessageId),
    updatedAt: normalizeString(invite.updatedAt),
    updatedBy: normalizeString(invite.updatedBy),
  };
}

async function listFirestoreInvitesByHub(hubId) {
  const snapshot = await getFirebaseAdminDb()
    .collection("hubs")
    .doc(hubId)
    .collection("invites")
    .get();

  return snapshot.docs
    .map((doc) => normalizeInviteRecord({ id: doc.id, ...doc.data() }))
    .sort((left, right) => String(right.createdAt || "").localeCompare(String(left.createdAt || "")));
}

async function getFirestoreInviteById(hubId, inviteId) {
  const snapshot = await getFirebaseAdminDb()
    .collection("hubs")
    .doc(hubId)
    .collection("invites")
    .doc(inviteId)
    .get();

  if (!snapshot.exists) {
    return null;
  }

  return normalizeInviteRecord({ id: snapshot.id, ...snapshot.data() });
}

async function getQueryCount(query) {
  const snapshot = await query.count().get();
  return Number(snapshot.data().count || 0);
}

export async function listInvitesByHub(hubId) {
  const normalizedHubId = normalizeString(hubId);
  if (!normalizedHubId) {
    return [];
  }

  return listFirestoreInvitesByHub(normalizedHubId);
}

export async function countPendingInvitesByHub(hubId) {
  const normalizedHubId = normalizeString(hubId);
  if (!normalizedHubId) {
    return 0;
  }

  return getQueryCount(
    getFirebaseAdminDb()
    .collection("hubs")
    .doc(normalizedHubId)
    .collection("invites")
    .where("status", "==", "pending")
  );
}

export async function getInviteById(hubId, inviteId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedInviteId = normalizeString(inviteId);

  if (!normalizedHubId || !normalizedInviteId) {
    return null;
  }

  return getFirestoreInviteById(normalizedHubId, normalizedInviteId);
}

export async function createAdminInvite(hubId, payload, actorId = "system") {
  const normalizedHubId = normalizeString(hubId);
  const invitedByUserId = normalizeString(actorId);

  if (!normalizedHubId) {
    throw new Error("Hub id is required.");
  }
  const { email, role } = normalizeCreateAdminInvitePayload(payload);

  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + 14);

  const ref = getFirebaseAdminDb()
    .collection("hubs")
    .doc(normalizedHubId)
    .collection("invites")
    .doc();

  const writeModel = {
    hubId: normalizedHubId,
    email,
    role,
    status: "pending",
    deliveryStatus: "pending_delivery",
    emailSentAt: "",
    lastEmailAttemptAt: "",
    deliveryError: "",
    deliveryProvider: "",
    deliveryMessageId: "",
    invitedByUserId,
    expiresAt: expiresAt.toISOString(),
    createdAt: now.toISOString(),
  };

  const duplicateSnapshot = await getFirebaseAdminDb()
    .collection("hubs")
    .doc(normalizedHubId)
    .collection("invites")
    .where("email", "==", email)
    .where("status", "==", "pending")
    .limit(1)
    .get();

  if (!duplicateSnapshot.empty) {
    throw new Error("An admin invite is already pending for this email.");
  }

  await ref.set(writeModel);

  return normalizeInviteRecord({ id: ref.id, ...writeModel });
}

export async function revokeAdminInvite(hubId, inviteId, actorId = "system") {
  const normalizedHubId = normalizeString(hubId);
  const normalizedInviteId = normalizeString(inviteId);
  const updatedBy = normalizeString(actorId) || "system";

  if (!normalizedHubId || !normalizedInviteId) {
    throw new Error("Hub id and invite id are required.");
  }

  const ref = getFirebaseAdminDb()
    .collection("hubs")
    .doc(normalizedHubId)
    .collection("invites")
    .doc(normalizedInviteId);

  const snapshot = await ref.get();
  if (!snapshot.exists) {
    throw new Error("Invite not found.");
  }

  const invite = normalizeInviteRecord({ id: snapshot.id, ...snapshot.data() });
  if (!canRevokeInvite(invite.status, invite.expiresAt)) {
    throw new Error("Only pending or expired invites can be revoked.");
  }

  const revokedAt = new Date().toISOString();
  await ref.set(
    {
      status: "revoked",
      revokedAt,
      updatedAt: revokedAt,
      updatedBy,
    },
    { merge: true }
  );

  return normalizeInviteRecord({
    ...invite,
    status: "revoked",
    revokedAt,
    updatedAt: revokedAt,
  });
}

export async function resendAdminInvite(hubId, inviteId, actorId = "system") {
  const normalizedHubId = normalizeString(hubId);
  const normalizedInviteId = normalizeString(inviteId);
  const updatedBy = normalizeString(actorId) || "system";

  if (!normalizedHubId || !normalizedInviteId) {
    throw new Error("Hub id and invite id are required.");
  }

  const ref = getFirebaseAdminDb()
    .collection("hubs")
    .doc(normalizedHubId)
    .collection("invites")
    .doc(normalizedInviteId);

  const snapshot = await ref.get();
  if (!snapshot.exists) {
    throw new Error("Invite not found.");
  }

  const invite = normalizeInviteRecord({ id: snapshot.id, ...snapshot.data() });
  if (!canResendInvite(invite.status, invite.expiresAt)) {
    throw new Error("Only pending or expired invites can be resent.");
  }

  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + 14);

  await ref.set(
    {
      status: "pending",
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      revokedAt: "",
      deliveryStatus: "pending_delivery",
      emailSentAt: "",
      lastEmailAttemptAt: "",
      deliveryError: "",
      deliveryProvider: "",
      deliveryMessageId: "",
      updatedAt: now.toISOString(),
      updatedBy,
    },
    { merge: true }
  );

  return normalizeInviteRecord({
    ...invite,
    status: "pending",
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    revokedAt: "",
    deliveryStatus: "pending_delivery",
    emailSentAt: "",
    lastEmailAttemptAt: "",
    deliveryError: "",
    deliveryProvider: "",
    deliveryMessageId: "",
    updatedAt: now.toISOString(),
  });
}

export async function acceptAdminInvite(hubId, inviteId, payload) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedInviteId = normalizeString(inviteId);
  const authUid = normalizeString(payload?.authUid);
  const email = normalizeString(payload?.email).toLowerCase();

  if (!normalizedHubId || !normalizedInviteId) {
    throw new Error("Hub id and invite id are required.");
  }

  if (!authUid || !email) {
    throw new Error("Authenticated admin identity is required.");
  }

  const { name } = normalizeAcceptAdminInvitePayload(payload);
  const invite = await getInviteById(normalizedHubId, normalizedInviteId);

  if (!invite) {
    throw new Error("Invite not found.");
  }

  if (deriveInviteStatus(invite.status, invite.expiresAt) !== "pending") {
    throw new Error("This invite can no longer be accepted.");
  }

  if (invite.email !== email) {
    throw new Error("Invite email does not match the authenticated account.");
  }

  const db = getFirebaseAdminDb();
  const [legacyById, existingByUid, existingByEmail] = await Promise.all([
    db.collection("users").doc(authUid).get(),
    db.collection("users").where("hubId", "==", normalizedHubId).where("uid", "==", authUid).limit(1).get(),
    db.collection("users").where("hubId", "==", normalizedHubId).where("email", "==", email).limit(1).get(),
  ]);

  if (legacyById.exists) {
    const legacyUser = normalizeUserRecord({ id: legacyById.id, ...legacyById.data() });

    if (legacyUser?.hubId === normalizedHubId) {
      throw new Error("A hub account already exists for this email.");
    }
  }

  if (!existingByUid.empty || !existingByEmail.empty) {
    throw new Error("A hub account already exists for this email.");
  }

  const now = new Date().toISOString();
  const userRef = db.collection("users").doc();
  const userRecord = {
    uid: authUid,
    hubId: normalizedHubId,
    role: invite.role || "admin",
    status: "active",
    email,
    name,
    createdAt: now,
    updatedAt: now,
    authProvider: "password",
    profileRevision: crypto.randomUUID().slice(0, 12),
  };

  const batch = db.batch();
  batch.create(userRef, userRecord);
  batch.set(
    db.collection("hubs").doc(normalizedHubId).collection("invites").doc(normalizedInviteId),
    {
      status: "accepted",
      acceptedAt: now,
      acceptedByUserId: userRef.id,
      updatedAt: now,
    },
    { merge: true }
  );
  await batch.commit();

  if (userRecord.role === "member") {
    await rebuildMemberDirectoryForUser(normalizedHubId, userRef.id, authUid);
  }

  return {
    invite: normalizeInviteRecord({
      ...invite,
      status: "accepted",
      acceptedAt: now,
      acceptedByUserId: userRef.id,
      updatedAt: now,
    }),
    user: normalizeUserRecord({
      id: userRef.id,
      ...userRecord,
    }),
  };
}

export async function markAdminInviteDelivery(hubId, inviteId, payload, actorId = "system") {
  const normalizedHubId = normalizeString(hubId);
  const normalizedInviteId = normalizeString(inviteId);
  const updatedBy = normalizeString(actorId) || "system";

  if (!normalizedHubId || !normalizedInviteId) {
    throw new Error("Hub id and invite id are required.");
  }

  const ref = getFirebaseAdminDb()
    .collection("hubs")
    .doc(normalizedHubId)
    .collection("invites")
    .doc(normalizedInviteId);

  const snapshot = await ref.get();
  if (!snapshot.exists) {
    throw new Error("Invite not found.");
  }

  const now = new Date().toISOString();
  const deliveryStatus = normalizeString(payload?.deliveryStatus || payload?.status) || "failed";
  const deliveryError = normalizeString(payload?.deliveryError || payload?.error);
  const emailSentAt = deliveryStatus === "sent" ? normalizeString(payload?.emailSentAt || payload?.sentAt || now) : "";
  const lastEmailAttemptAt = normalizeString(payload?.lastEmailAttemptAt || payload?.attemptedAt || now) || now;
  const deliveryProvider = normalizeString(payload?.deliveryProvider || payload?.provider);
  const deliveryMessageId = normalizeString(payload?.deliveryMessageId || payload?.messageId);

  await ref.set(
    {
      deliveryStatus,
      deliveryError,
      emailSentAt,
      lastEmailAttemptAt,
      deliveryProvider,
      deliveryMessageId,
      updatedAt: now,
      updatedBy,
    },
    { merge: true }
  );

  return normalizeInviteRecord({
    id: snapshot.id,
    ...snapshot.data(),
    deliveryStatus,
    deliveryError,
    emailSentAt,
    lastEmailAttemptAt,
    deliveryProvider,
    deliveryMessageId,
    updatedAt: now,
    updatedBy,
  });
}
