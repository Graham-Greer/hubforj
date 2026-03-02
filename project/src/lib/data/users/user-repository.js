import "server-only";
import crypto from "node:crypto";
import { getDataProvider } from "@/lib/data/shared/provider";

function userToViewModel(user) {
  return {
    id: user.id || user.uid,
    uid: user.uid || user.id,
    hubId: user.hubId,
    role: user.role,
    email: user.email,
    name: user.name || "",
    avatarMediaId: user.avatarMediaId || "",
    createdAt: user.createdAt || null,
    updatedAt: user.updatedAt || null,
  };
}

export async function getUserByEmail(email) {
  const provider = getDataProvider();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) return null;

  if (provider.type === "firestore") {
    const snapshot = await provider.db
      .collection("users")
      .where("email", "==", normalizedEmail)
      .limit(1)
      .get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return userToViewModel({ id: doc.id, ...doc.data() });
  }

  const rows = provider.db.users ? Array.from(provider.db.users.values()) : [];
  const found = rows.find((user) => String(user.email || "").toLowerCase() === normalizedEmail);
  return found ? userToViewModel(found) : null;
}

export async function getUserById(uid) {
  const provider = getDataProvider();
  const normalizedUid = String(uid || "").trim();
  if (!normalizedUid) return null;

  if (provider.type === "firestore") {
    const doc = await provider.db.collection("users").doc(normalizedUid).get();
    if (!doc.exists) return null;
    return userToViewModel({ id: doc.id, ...doc.data() });
  }

  const row = provider.db.users?.get(normalizedUid);
  return row ? userToViewModel(row) : null;
}

export async function createMemberUser(payload) {
  const provider = getDataProvider();
  const now = new Date().toISOString();
  const email = String(payload.email || "").trim().toLowerCase();
  const name = String(payload.name || "").trim();
  const hubId = String(payload.hubId || "").trim();
  const uid = String(payload.uid || "").trim() || `user_${crypto.randomUUID().slice(0, 8)}`;

  if (!email || !hubId) {
    throw new Error("email and hubId are required.");
  }

  if (provider.type === "firestore") {
    const existing = await getUserByEmail(email);
    if (existing) {
      throw new Error("An account already exists for this email.");
    }

    const row = {
      uid,
      hubId,
      role: "member",
      email,
      name,
      avatarMediaId: "",
      createdAt: now,
      updatedAt: now,
    };

    await provider.db.collection("users").doc(uid).set(row);
    return userToViewModel({ id: uid, ...row });
  }

  if (!provider.db.users) {
    provider.db.users = new Map();
  }

  const conflict = Array.from(provider.db.users.values()).find(
    (user) => String(user.email || "").toLowerCase() === email
  );
  if (conflict) {
    throw new Error("An account already exists for this email.");
  }

  const row = {
    id: uid,
    uid,
    hubId,
    role: "member",
    email,
    name,
    avatarMediaId: "",
    createdAt: now,
    updatedAt: now,
  };
  provider.db.users.set(uid, row);
  return userToViewModel(row);
}
