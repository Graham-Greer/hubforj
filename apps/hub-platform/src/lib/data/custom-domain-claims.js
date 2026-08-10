try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getFirebaseAdminDb } from "@/lib/firebase/admin";

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeHostname(value) {
  return normalizeString(value)
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/[/?#].*$/, "")
    .replace(/:\d+$/, "")
    .replace(/\.+$/, "");
}

function getClaimsCollection(db = getFirebaseAdminDb()) {
  return db.collection("customDomainClaims");
}

export function buildCustomDomainClaimId(hostname) {
  return normalizeHostname(hostname);
}

export function normalizeCustomDomainClaimRecord(record = {}) {
  const hostname = normalizeHostname(record.hostname);

  if (!hostname) {
    return null;
  }

  return {
    hostname,
    hubId: normalizeString(record.hubId),
    hubSlug: normalizeString(record.hubSlug),
    status: normalizeString(record.status) || "pending",
    createdAt: normalizeString(record.createdAt),
    updatedAt: normalizeString(record.updatedAt),
    expiresAt: normalizeString(record.expiresAt),
    createdByUserId: normalizeString(record.createdByUserId),
    updatedByUserId: normalizeString(record.updatedByUserId),
    releasedAt: normalizeString(record.releasedAt),
    releasedByUserId: normalizeString(record.releasedByUserId),
    releaseReason: normalizeString(record.releaseReason),
  };
}

export function isCustomDomainClaimActive(record = {}, now = new Date().toISOString()) {
  const claim = normalizeCustomDomainClaimRecord(record);

  if (!claim?.hubId) {
    return false;
  }

  if (claim.status === "released") {
    return false;
  }

  if (claim.status === "pending" && claim.expiresAt && claim.expiresAt <= now) {
    return false;
  }

  return true;
}

export async function getCustomDomainClaimByHostname(hostname, { db = getFirebaseAdminDb() } = {}) {
  const claimId = buildCustomDomainClaimId(hostname);

  if (!claimId) {
    return null;
  }

  const doc = await getClaimsCollection(db).doc(claimId).get();
  return doc.exists ? normalizeCustomDomainClaimRecord(doc.data()) : null;
}

export async function assertNoConflictingCustomDomainClaim(hostname, hubId, { db = getFirebaseAdminDb() } = {}) {
  const normalizedHubId = normalizeString(hubId);
  const claim = await getCustomDomainClaimByHostname(hostname, { db });

  if (claim && isCustomDomainClaimActive(claim) && claim.hubId !== normalizedHubId) {
    throw new Error("A hub already uses this domain.");
  }

  return claim;
}

export async function upsertCustomDomainClaimForHub({
  db = getFirebaseAdminDb(),
  transaction = null,
  hostname,
  hubId,
  hubSlug,
  actorId = "system",
  status = "pending",
  expiresAt = "",
  now = new Date().toISOString(),
} = {}) {
  const claimId = buildCustomDomainClaimId(hostname);
  const normalizedHubId = normalizeString(hubId);
  const normalizedHubSlug = normalizeString(hubSlug);

  if (!claimId || !normalizedHubId || !normalizedHubSlug) {
    throw new Error("Custom-domain claim requires hostname, hub id, and hub slug.");
  }

  const ref = getClaimsCollection(db).doc(claimId);
  const read = transaction ? await transaction.get(ref) : await ref.get();
  const existing = read.exists ? normalizeCustomDomainClaimRecord(read.data()) : null;

  if (existing && isCustomDomainClaimActive(existing, now) && existing.hubId !== normalizedHubId) {
    throw new Error("A hub already uses this domain.");
  }

  const nextClaim = {
    hostname: claimId,
    hubId: normalizedHubId,
    hubSlug: normalizedHubSlug,
    status,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    expiresAt: normalizeString(expiresAt),
    createdByUserId: existing?.createdByUserId || actorId,
    updatedByUserId: actorId,
    releasedAt: "",
    releasedByUserId: "",
    releaseReason: "",
  };

  if (transaction) {
    transaction.set(ref, nextClaim);
  } else {
    await ref.set(nextClaim);
  }

  return nextClaim;
}

export async function releaseCustomDomainClaimForHub({
  db = getFirebaseAdminDb(),
  transaction = null,
  hostname,
  hubId,
  actorId = "system",
  reason = "released",
  now = new Date().toISOString(),
} = {}) {
  const claimId = buildCustomDomainClaimId(hostname);
  const normalizedHubId = normalizeString(hubId);

  if (!claimId || !normalizedHubId) {
    return null;
  }

  const ref = getClaimsCollection(db).doc(claimId);
  const read = transaction ? await transaction.get(ref) : await ref.get();

  if (!read.exists) {
    return null;
  }

  const existing = normalizeCustomDomainClaimRecord(read.data());

  if (!existing || existing.hubId !== normalizedHubId) {
    return existing;
  }

  const nextClaim = {
    ...existing,
    status: "released",
    updatedAt: now,
    updatedByUserId: actorId,
    releasedAt: now,
    releasedByUserId: actorId,
    releaseReason: reason,
  };

  if (transaction) {
    transaction.set(ref, nextClaim);
  } else {
    await ref.set(nextClaim);
  }

  return nextClaim;
}
