try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { getMediaAssetById, getMediaAssetsByIds } from "@/lib/data/media";
import { normalizeString, normalizeUserRecord, sortUsers } from "./user-shared.js";

async function listFirestoreUsersByHub(hubId, role = "") {
  let query = getFirebaseAdminDb().collection("users").where("hubId", "==", hubId);

  if (role) {
    query = query.where("role", "==", role);
  }

  const snapshot = await query.get();
  const users = snapshot.docs.map((doc) => normalizeUserRecord({ id: doc.id, ...doc.data() }));
  const assetIds = [...new Set(users.map((user) => user.avatarAssetId).filter(Boolean))];

  if (!assetIds.length) {
    return sortUsers(users);
  }

  const assets = await getMediaAssetsByIds(hubId, assetIds);
  const byId = new Map(assets.map((asset) => [asset.id, asset]));

  return sortUsers(
    users.map((user) => ({
      ...user,
      avatarAsset: user.avatarAssetId ? byId.get(user.avatarAssetId) || null : null,
    }))
  );
}

async function listFirestoreUserDirectoryRowsByHub(hubId, role = "") {
  let query = getFirebaseAdminDb()
    .collection("users")
    .where("hubId", "==", hubId);

  if (role) {
    query = query.where("role", "==", role);
  }

  const snapshot = await query
    .select("hubId", "role", "status", "email", "name", "createdAt", "lastSignedInAt", "updatedAt")
    .get();

  return sortUsers(snapshot.docs.map((doc) => normalizeUserRecord({ id: doc.id, ...doc.data() })));
}

async function getFirestoreUserById(hubId, userId) {
  const doc = await getFirebaseAdminDb().collection("users").doc(userId).get();

  if (!doc.exists) {
    return null;
  }

  const user = normalizeUserRecord({ id: doc.id, ...doc.data() });

  if (!user || user.hubId !== hubId) {
    return null;
  }

  if (!user.avatarAssetId) {
    return user;
  }

  return {
    ...user,
    avatarAsset: await getMediaAssetById(hubId, user.avatarAssetId),
  };
}

async function getFirestoreGlobalUserById(userId) {
  const doc = await getFirebaseAdminDb().collection("users").doc(userId).get();

  if (!doc.exists) {
    return null;
  }

  return normalizeUserRecord({ id: doc.id, ...doc.data() });
}

async function getFirestoreUserByAuthUid(hubId, uid) {
  const byId = await getFirestoreUserById(hubId, uid);

  if (byId) {
    return byId;
  }

  const snapshot = await getFirebaseAdminDb()
    .collection("users")
    .where("hubId", "==", hubId)
    .where("uid", "==", uid)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const user = normalizeUserRecord({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });

  if (!user?.avatarAssetId) {
    return user;
  }

  return {
    ...user,
    avatarAsset: await getMediaAssetById(hubId, user.avatarAssetId),
  };
}

async function getFirestoreSuperadminByAuthUid(uid) {
  const byId = await getFirestoreGlobalUserById(uid);

  if (byId?.role === "superadmin") {
    return byId;
  }

  const snapshot = await getFirebaseAdminDb()
    .collection("users")
    .where("uid", "==", uid)
    .where("role", "==", "superadmin")
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  return normalizeUserRecord({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
}

async function getQueryCount(query) {
  const snapshot = await query.count().get();
  return Number(snapshot.data().count || 0);
}

export async function listUsersByHub(hubId, options = {}) {
  const normalizedHubId = normalizeString(hubId);
  const role = normalizeString(options.role);

  if (!normalizedHubId) {
    return [];
  }

  return listFirestoreUsersByHub(normalizedHubId, role);
}

export async function listUserDirectoryRowsByHub(hubId, options = {}) {
  const normalizedHubId = normalizeString(hubId);
  const role = normalizeString(options.role);

  if (!normalizedHubId) {
    return [];
  }

  return listFirestoreUserDirectoryRowsByHub(normalizedHubId, role);
}

export async function countActiveMembersByHub(hubId) {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    return 0;
  }

  return getQueryCount(
    getFirebaseAdminDb()
    .collection("users")
    .where("hubId", "==", normalizedHubId)
    .where("role", "==", "member")
    .where("status", "==", "active")
  );
}

export async function summarizeMembersByHub(hubId) {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    return {
      memberCount: 0,
      activeMemberCount: 0,
    };
  }

  const memberQuery = getFirebaseAdminDb()
    .collection("users")
    .where("hubId", "==", normalizedHubId)
    .where("role", "==", "member");
  const [memberCount, activeMemberCount] = await Promise.all([
    getQueryCount(memberQuery),
    getQueryCount(memberQuery.where("status", "==", "active")),
  ]);

  return {
    memberCount,
    activeMemberCount,
  };
}

export async function countMembersByHub(hubId) {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    return 0;
  }

  return getQueryCount(
    getFirebaseAdminDb()
    .collection("users")
    .where("hubId", "==", normalizedHubId)
    .where("role", "==", "member")
  );
}

export async function getUserById(hubId, userId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedUserId = normalizeString(userId);

  if (!normalizedHubId || !normalizedUserId) {
    return null;
  }

  return getFirestoreUserById(normalizedHubId, normalizedUserId);
}

export async function getUserByAuthUid(hubId, uid) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedUid = normalizeString(uid);

  if (!normalizedHubId || !normalizedUid) {
    return null;
  }

  return getFirestoreUserByAuthUid(normalizedHubId, normalizedUid);
}

export async function getSuperadminById(userId) {
  const normalizedUserId = normalizeString(userId);

  if (!normalizedUserId) {
    return null;
  }

  const user = await getFirestoreGlobalUserById(normalizedUserId);

  if (!user || user.role !== "superadmin") {
    return null;
  }

  return user;
}

export async function getSuperadminByAuthUid(uid) {
  const normalizedUid = normalizeString(uid);

  if (!normalizedUid) {
    return null;
  }

  const user = await getFirestoreSuperadminByAuthUid(normalizedUid);

  if (!user || user.role !== "superadmin") {
    return null;
  }

  return user;
}
