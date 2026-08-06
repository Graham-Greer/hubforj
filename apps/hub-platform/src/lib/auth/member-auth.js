try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/lib/firebase/admin";
import { getHubBySlug } from "@/lib/data/hubs";
import { rebuildMemberDirectoryForUser } from "@/lib/data/member-directory";
import { getUserByAuthUid } from "@/lib/data/users";
import { createSignedSessionValue, sessionDurationSeconds } from "@/lib/auth/session";
import { getServerEnv } from "@/lib/config/env";
import { canAccessHubAdmin } from "@/lib/domain/users";
import { createPerformanceTimer } from "@/lib/observability/performance-timing";

function normalizeString(value) {
  return String(value || "").trim();
}

export async function createHubUserSessionFromIdToken(hubSlug, idToken) {
  const normalizedHubSlug = normalizeString(hubSlug);
  const normalizedIdToken = normalizeString(idToken);
  const timer = createPerformanceTimer("member-auth-session", {
    hubSlug: normalizedHubSlug,
  });

  if (!normalizedHubSlug) {
    throw new Error("Hub slug is required.");
  }

  if (!normalizedIdToken) {
    throw new Error("Sign-in token is required.");
  }

  const [hub, decodedToken] = await Promise.all([
    getHubBySlug(normalizedHubSlug),
    getFirebaseAdminAuth().verifyIdToken(normalizedIdToken, true),
  ]);
  timer.log("hub-and-token-verified", {
    hubId: normalizeString(hub?.id),
  });
  if (!hub) {
    throw new Error("Hub not found.");
  }

  const user = await getUserByAuthUid(hub.id, decodedToken.uid);
  timer.log("hub-user-loaded", {
    hubId: hub.id,
    userId: normalizeString(user?.id),
    role: normalizeString(user?.role),
  });

  if (!user || (user.role !== "member" && !canAccessHubAdmin(user.role))) {
    throw new Error("No hub account exists for this sign-in.");
  }

  if (user.status !== "active") {
    throw new Error("This hub account is not currently active.");
  }

  const now = new Date().toISOString();

  await getFirebaseAdminDb().collection("users").doc(user.id).update({
    lastSignedInAt: now,
  });
  timer.log("last-sign-in-updated", {
    hubId: hub.id,
    userId: user.id,
  });

  const expiresAt = Math.floor(Date.now() / 1000) + sessionDurationSeconds;
  const sessionValue = createSignedSessionValue(
    {
      userId: user.id,
      hubId: hub.id,
      role: user.role,
      email: user.email,
      name: user.name,
      expiresAt,
    },
    getServerEnv().sessionHmacSecret
  );

  timer.end({
    hubId: hub.id,
    userId: user.id,
    role: user.role,
  });

  return {
    hub,
    user,
    expiresAt,
    sessionValue,
  };
}

export async function rebuildSignedInMemberDirectoryBestEffort(hub, user) {
  if (!hub?.id || !user?.id || user.role !== "member") {
    return null;
  }

  try {
    return await rebuildMemberDirectoryForUser(hub.id, user.id, user.id, {
      maintainDashboardProjections: false,
    });
  } catch (error) {
    console.warn("Unable to refresh member directory after member sign-in.", {
      hubId: normalizeString(hub.id),
      userId: normalizeString(user.id),
      error: String(error?.message || "Unable to refresh member directory."),
    });
    return null;
  }
}

export async function createMemberSessionFromIdToken(hubSlug, idToken) {
  const session = await createHubUserSessionFromIdToken(hubSlug, idToken);

  if (session.user.role !== "member") {
    throw new Error("No member account exists for this hub.");
  }

  return session;
}
