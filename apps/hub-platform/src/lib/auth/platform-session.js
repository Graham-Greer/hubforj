try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerEnv } from "@/lib/config/env";
import { getSuperadminById } from "@/lib/data/users";
import { isSessionExpired, sessionCookieName, verifySignedSessionValue } from "@/lib/auth/session";

function normalizeString(value) {
  return String(value || "").trim();
}

export async function getCurrentPlatformSession() {
  const store = await cookies();
  const rawValue = store.get(sessionCookieName)?.value || "";
  const session = verifySignedSessionValue(rawValue, getServerEnv().sessionHmacSecret);

  if (!session || isSessionExpired(session)) {
    return null;
  }

  return session;
}

export async function getCurrentSuperadminSession() {
  const session = await getCurrentPlatformSession();
  if (!session || normalizeString(session.role) !== "superadmin") {
    return null;
  }

  const user = await getSuperadminById(session.userId);
  if (!user || normalizeString(user.role) !== "superadmin" || normalizeString(user.status) !== "active") {
    return null;
  }

  return {
    ...session,
    user,
  };
}

export async function requireCurrentSuperadminSession(nextPath = "/platform") {
  const session = await getCurrentSuperadminSession();

  if (!session) {
    redirect(`/platform/sign-in?next=${encodeURIComponent(nextPath)}`);
  }

  return session;
}
