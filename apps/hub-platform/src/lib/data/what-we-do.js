try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import crypto from "node:crypto";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { requireHubBySlug } from "@/lib/data/hubs";
import { normalizeCreateWhatWeDoPayload } from "@/lib/domain/what-we-do";

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeWhatWeDoRecord(item) {
  if (!item) {
    return null;
  }

  return {
    id: normalizeString(item.id),
    hubId: normalizeString(item.hubId),
    status: normalizeString(item.status) || "draft",
    title: normalizeString(item.title),
    description: normalizeString(item.description),
    sortOrder: Number.parseInt(String(item.sortOrder || "0"), 10) || 0,
    createdAt: normalizeString(item.createdAt),
    updatedAt: normalizeString(item.updatedAt),
  };
}

function sortWhatWeDoItems(rows) {
  return [...rows].sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    return String(right.updatedAt || "").localeCompare(String(left.updatedAt || ""));
  });
}

export async function listWhatWeDoItemsByHubSlug(hubSlug) {
  const hub = await requireHubBySlug(hubSlug);
  return listWhatWeDoItemsByHub(hub);
}

export async function listWhatWeDoItemsByHub(hub) {
  const hubId = normalizeString(hub?.id);

  if (!hubId) {
    return [];
  }

  const snapshot = await getFirebaseAdminDb().collection("hubs").doc(hubId).collection("whatWeDoItems").get();
  const items = snapshot.docs.map((doc) => normalizeWhatWeDoRecord({ id: doc.id, hubId, ...doc.data() }));
  return sortWhatWeDoItems(items);
}

export async function listPublicWhatWeDoItemsByHubSlug(hubSlug) {
  const items = await listWhatWeDoItemsByHubSlug(hubSlug);
  return items.filter((item) => item.status === "published").slice(0, 6);
}

export async function listPublicWhatWeDoItemsByHub(hub) {
  const hubId = normalizeString(hub?.id);

  if (!hubId) {
    return [];
  }

  const snapshot = await getFirebaseAdminDb()
    .collection("hubs")
    .doc(hubId)
    .collection("whatWeDoItems")
    .where("status", "==", "published")
    .get();
  const items = snapshot.docs.map((doc) => normalizeWhatWeDoRecord({ id: doc.id, hubId, ...doc.data() }));
  return sortWhatWeDoItems(items).slice(0, 6);
}

export async function getWhatWeDoItemById(hubId, itemId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedItemId = normalizeString(itemId);
  if (!normalizedHubId || !normalizedItemId) {
    return null;
  }

  const doc = await getFirebaseAdminDb().collection("hubs").doc(normalizedHubId).collection("whatWeDoItems").doc(normalizedItemId).get();
  if (!doc.exists) {
    return null;
  }

  return normalizeWhatWeDoRecord({ id: doc.id, hubId: normalizedHubId, ...doc.data() });
}

export async function createWhatWeDoItemByHubSlug(hubSlug, payload, actorId = "system") {
  const hub = await requireHubBySlug(hubSlug);
  const next = normalizeCreateWhatWeDoPayload(payload);
  const now = new Date().toISOString();
  const ref = getFirebaseAdminDb().collection("hubs").doc(hub.id).collection("whatWeDoItems").doc(`what_we_do_${crypto.randomUUID().slice(0, 12)}`);

  const writeModel = {
    hubId: hub.id,
    ...next,
    createdAt: now,
    updatedAt: now,
    createdBy: actorId,
    updatedBy: actorId,
  };

  await ref.set(writeModel);
  return normalizeWhatWeDoRecord({ id: ref.id, ...writeModel });
}

export async function updateWhatWeDoItem(hubId, itemId, payload, actorId = "system") {
  const normalizedHubId = normalizeString(hubId);
  const normalizedItemId = normalizeString(itemId);
  if (!normalizedHubId || !normalizedItemId) {
    throw new Error("Hub and What we do item ids are required.");
  }

  const ref = getFirebaseAdminDb().collection("hubs").doc(normalizedHubId).collection("whatWeDoItems").doc(normalizedItemId);
  const existing = await ref.get();
  if (!existing.exists) {
    throw new Error("What we do item not found.");
  }

  const next = normalizeCreateWhatWeDoPayload(payload);
  const update = {
    ...next,
    updatedAt: new Date().toISOString(),
    updatedBy: actorId,
  };

  await ref.update(update);
  return normalizeWhatWeDoRecord({ id: normalizedItemId, hubId: normalizedHubId, ...existing.data(), ...update });
}

export async function deleteWhatWeDoItem(hubId, itemId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedItemId = normalizeString(itemId);
  if (!normalizedHubId || !normalizedItemId) {
    throw new Error("Hub and What we do item ids are required.");
  }

  const ref = getFirebaseAdminDb().collection("hubs").doc(normalizedHubId).collection("whatWeDoItems").doc(normalizedItemId);
  const existing = await ref.get();
  if (!existing.exists) {
    throw new Error("What we do item not found.");
  }

  await ref.delete();
}
