import "server-only";
import crypto from "node:crypto";
import { getDataProvider } from "@/lib/data/shared/provider";

function inviteToViewModel(invite) {
  return {
    id: invite.id,
    hubId: invite.hubId,
    email: invite.email,
    role: invite.role,
    status: invite.status,
    createdAt: invite.createdAt,
    revokedAt: invite.revokedAt || null,
  };
}

export async function listInvites(hubId) {
  const provider = getDataProvider();

  if (provider.type === "firestore") {
    const snapshot = await provider.db
      .collection("hubs")
      .doc(hubId)
      .collection("invites")
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map((doc) => inviteToViewModel({ id: doc.id, ...doc.data() }));
  }

  const invites = provider.db.invites.get(hubId) || [];
  return invites.map(inviteToViewModel);
}

export async function createInvite(hubId, payload, actorId = "system") {
  const provider = getDataProvider();
  const now = new Date().toISOString();
  const email = String(payload.email || "").trim().toLowerCase();

  if (provider.type === "firestore") {
    const inviteCollection = provider.db.collection("hubs").doc(hubId).collection("invites");
    const existingPending = await inviteCollection
      .where("email", "==", email)
      .where("status", "==", "pending")
      .limit(1)
      .get();

    if (!existingPending.empty) {
      throw new Error("Invite already pending for this email.");
    }

    const ref = inviteCollection.doc();
    const next = {
      hubId,
      email,
      role: "admin",
      status: "pending",
      createdAt: now,
      createdBy: actorId,
    };
    await ref.set(next);
    return inviteToViewModel({ id: ref.id, ...next });
  }

  const current = provider.db.invites.get(hubId) || [];
  const hasPendingDuplicate = current.some((item) => item.email === email && item.status === "pending");
  if (hasPendingDuplicate) {
    throw new Error("Invite already pending for this email.");
  }

  const next = {
    id: `invite_${crypto.randomUUID().slice(0, 8)}`,
    hubId,
    email,
    role: "admin",
    status: "pending",
    createdAt: now,
    createdBy: actorId,
  };
  provider.db.invites.set(hubId, [next, ...current]);
  return inviteToViewModel(next);
}

export async function revokeInvite(hubId, inviteId) {
  const provider = getDataProvider();
  const now = new Date().toISOString();

  if (provider.type === "firestore") {
    const ref = provider.db.collection("hubs").doc(hubId).collection("invites").doc(inviteId);
    const doc = await ref.get();
    if (!doc.exists) return null;
    await ref.update({ status: "revoked", revokedAt: now });
    const updated = await ref.get();
    return inviteToViewModel({ id: updated.id, ...updated.data() });
  }

  const current = provider.db.invites.get(hubId) || [];
  const index = current.findIndex((item) => item.id === inviteId);
  if (index === -1) return null;

  const next = [...current];
  next[index] = { ...next[index], status: "revoked", revokedAt: now };
  provider.db.invites.set(hubId, next);
  return inviteToViewModel(next[index]);
}
