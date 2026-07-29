try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getServerEnv } from "@/lib/config/env";
import { getUserById } from "@/lib/data/users";
import { isSessionExpired, sessionCookieName, verifySignedSessionValue } from "@/lib/auth/session";
import { buildHubAuthHref } from "@/lib/auth/hub-auth-redirects";
import { getRequestHostFromHeaders, resolveHubRuntimeRouteMode } from "@/lib/domain/hub-hosts";
import { canAccessHubAdmin } from "@/lib/domain/users";

function normalizeString(value) {
  return String(value || "").trim();
}

async function getCurrentHubRouteMode() {
  const requestHeaders = await headers();
  return resolveHubRuntimeRouteMode(getRequestHostFromHeaders(requestHeaders));
}

export async function getCurrentSession() {
  const store = await cookies();
  const rawValue = store.get(sessionCookieName)?.value || "";
  const session = verifySignedSessionValue(rawValue, getServerEnv().sessionHmacSecret);

  if (!session || isSessionExpired(session)) {
    return null;
  }

  return session;
}

export async function getCurrentMemberSessionForHub(hub) {
  const session = await getCurrentSession();
  if (!session) {
    return null;
  }

  if (normalizeString(session.role) !== "member") {
    return null;
  }

  if (normalizeString(session.hubId) !== normalizeString(hub.id)) {
    return null;
  }

  const user = await getUserById(hub.id, session.userId);
  if (!user || normalizeString(user.role) !== "member") {
    return null;
  }

  return {
    ...session,
    user,
  };
}

export async function getCurrentAdminSessionForHub(hub) {
  const session = await getCurrentSession();
  if (!session) {
    return null;
  }

  if (!canAccessHubAdmin(session.role)) {
    return null;
  }

  if (normalizeString(session.hubId) !== normalizeString(hub.id)) {
    return null;
  }

  const user = await getUserById(hub.id, session.userId);
  if (!user || !canAccessHubAdmin(user.role) || normalizeString(user.status) !== "active") {
    return null;
  }

  return {
    ...session,
    user,
  };
}

export async function requireCurrentMemberSessionForHub(hub, nextPath = `/${hub.slug}/account`) {
  const session = await getCurrentMemberSessionForHub(hub);

  if (!session) {
    const routeMode = await getCurrentHubRouteMode();
    const fallbackNextPath = routeMode === "host" ? "/account" : `/${hub.slug}/account`;
    redirect(buildHubAuthHref(hub.slug, "sign-in", nextPath || fallbackNextPath, routeMode));
  }

  return session;
}

export async function requireCurrentAdminSessionForHub(hub, nextPath = `/${hub.slug}/admin`) {
  const session = await getCurrentAdminSessionForHub(hub);

  if (!session) {
    const routeMode = await getCurrentHubRouteMode();
    const fallbackNextPath = routeMode === "host" ? "/admin" : `/${hub.slug}/admin`;
    redirect(buildHubAuthHref(hub.slug, "sign-in", nextPath || fallbackNextPath, routeMode));
  }

  return session;
}
