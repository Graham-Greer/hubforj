try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import crypto from "node:crypto";
import { Timestamp } from "firebase-admin/firestore";
import { getServerEnv } from "@/lib/config/env";
import { canAccessHubAdmin } from "@/lib/domain/users";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import {
  createSignedSessionValue,
  sessionDurationSeconds,
} from "@/lib/auth/session";
import { normalizeUserRecord } from "@/lib/data/user-shared";

const handoffCollectionName = "ownerAdminHandoffs";
const handoffTokenBytes = 32;
const handoffTtlSeconds = 5 * 60;
const defaultDestinationPath = "/admin";

function normalizeString(value) {
  return String(value || "").trim();
}

function hashToken(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("base64url");
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left || ""));
  const rightBuffer = Buffer.from(String(right || ""));

  if (!leftBuffer.length || leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function getExpiresAtEpochSeconds(now = Date.now()) {
  return Math.floor(now / 1000) + handoffTtlSeconds;
}

function buildHandoffPath(hubSlug, handoffId, token) {
  const params = new URLSearchParams({
    hub: hubSlug,
    handoff: handoffId,
    token,
  });

  return `/api/auth/owner-handoff?${params.toString()}`;
}

function sanitizeDestinationPath(value) {
  const normalizedPath = normalizeString(value) || defaultDestinationPath;

  if (normalizedPath !== "/admin" && !normalizedPath.startsWith("/admin/")) {
    return defaultDestinationPath;
  }

  if (normalizedPath.startsWith("//") || normalizedPath.includes("://")) {
    return defaultDestinationPath;
  }

  return normalizedPath;
}

function assertPendingHandoff(handoff, token, nowEpochSeconds) {
  if (!handoff) {
    throw new Error("Owner admin handoff not found.");
  }

  if (normalizeString(handoff.status) !== "pending") {
    throw new Error("Owner admin handoff has already been used.");
  }

  if (Number(handoff.expiresAtEpochSeconds || 0) <= nowEpochSeconds) {
    throw new Error("Owner admin handoff has expired.");
  }

  if (!safeEqual(hashToken(token), handoff.tokenHash)) {
    throw new Error("Owner admin handoff token is invalid.");
  }
}

function assertActiveOwnerUser(user, handoff) {
  if (!user) {
    throw new Error("Owner admin account not found.");
  }

  if (normalizeString(user.hubId) !== normalizeString(handoff.hubId)) {
    throw new Error("Owner admin account does not belong to this hub.");
  }

  if (!canAccessHubAdmin(user.role) || normalizeString(user.status) !== "active") {
    throw new Error("Owner admin account is not active.");
  }

  const expectedUid = normalizeString(handoff.authUid);
  if (expectedUid && normalizeString(user.uid) !== expectedUid) {
    throw new Error("Owner admin account does not match the authenticated owner.");
  }
}

export async function createOwnerAdminHandoff({ hub, user, ownerEmail, destinationPath = defaultDestinationPath }) {
  const hubId = normalizeString(hub?.id);
  const hubSlug = normalizeString(hub?.slug);
  const userId = normalizeString(user?.id);

  if (!hubId || !hubSlug || !userId) {
    throw new Error("Hub and owner user are required to create an admin handoff.");
  }

  const db = getFirebaseAdminDb();
  const handoffRef = db.collection(handoffCollectionName).doc();
  const token = crypto.randomBytes(handoffTokenBytes).toString("base64url");
  const now = new Date();
  const nowIso = now.toISOString();
  const expiresAtEpochSeconds = getExpiresAtEpochSeconds(now.getTime());
  const sanitizedDestinationPath = sanitizeDestinationPath(destinationPath);

  await handoffRef.create({
    status: "pending",
    tokenHash: hashToken(token),
    hubId,
    hubSlug,
    userId,
    authUid: normalizeString(user?.uid),
    ownerEmail: normalizeString(ownerEmail || user?.email).toLowerCase(),
    destinationPath: sanitizedDestinationPath,
    createdAt: nowIso,
    expiresAt: Timestamp.fromMillis(expiresAtEpochSeconds * 1000),
    expiresAtIso: new Date(expiresAtEpochSeconds * 1000).toISOString(),
    expiresAtEpochSeconds,
  });

  return {
    handoffId: handoffRef.id,
    expiresAtEpochSeconds,
    handoffPath: buildHandoffPath(hubSlug, handoffRef.id, token),
    destinationPath: sanitizedDestinationPath,
  };
}

export async function consumeOwnerAdminHandoff({ handoffId, token, requestHost = "" }) {
  const normalizedHandoffId = normalizeString(handoffId);
  const normalizedToken = normalizeString(token);

  if (!normalizedHandoffId || !normalizedToken) {
    throw new Error("Owner admin handoff credentials are required.");
  }

  const db = getFirebaseAdminDb();
  const handoffRef = db.collection(handoffCollectionName).doc(normalizedHandoffId);
  const nowEpochSeconds = Math.floor(Date.now() / 1000);
  const nowIso = new Date().toISOString();

  const sessionPayload = await db.runTransaction(async (transaction) => {
    const handoffSnapshot = await transaction.get(handoffRef);
    const handoff = handoffSnapshot.exists ? handoffSnapshot.data() : null;

    assertPendingHandoff(handoff, normalizedToken, nowEpochSeconds);

    const userRef = db.collection("users").doc(normalizeString(handoff.userId));
    const userSnapshot = await transaction.get(userRef);
    const user = userSnapshot.exists ? normalizeUserRecord({ id: userSnapshot.id, ...userSnapshot.data() }) : null;

    assertActiveOwnerUser(user, handoff);

    transaction.update(handoffRef, {
      status: "consumed",
      consumedAt: nowIso,
      consumedFromHost: normalizeString(requestHost).toLowerCase(),
    });
    transaction.update(userRef, {
      lastSignedInAt: nowIso,
    });

    return {
      userId: user.id,
      hubId: normalizeString(handoff.hubId),
      hubSlug: normalizeString(handoff.hubSlug),
      destinationPath: sanitizeDestinationPath(handoff.destinationPath),
      role: user.role,
      email: user.email,
      name: user.name,
    };
  });

  const expiresAt = Math.floor(Date.now() / 1000) + sessionDurationSeconds;

  return {
    ...sessionPayload,
    expiresAt,
    sessionValue: createSignedSessionValue(
      {
        userId: sessionPayload.userId,
        hubId: sessionPayload.hubId,
        role: sessionPayload.role,
        email: sessionPayload.email,
        name: sessionPayload.name,
        expiresAt,
      },
      getServerEnv().sessionHmacSecret
    ),
  };
}
