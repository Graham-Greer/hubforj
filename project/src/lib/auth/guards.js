import "server-only";
import { redirect } from "next/navigation";
import { getSession } from "./session";

export async function requireSessionRole(roles, redirectTo = "/platform/sign-in") {
  const session = await getSession();
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  if (!session || !allowedRoles.includes(session.role)) {
    redirect(redirectTo);
  }

  return session;
}

export function canAccessHubAdmin(session, hubSlug) {
  if (!session || !hubSlug) return false;
  const requestedSlug = String(hubSlug).trim();

  if (session.role === "admin") {
    return session.hubSlug === requestedSlug;
  }

  if (session.role === "superadmin") {
    return Boolean(session.supportHubSlug && session.supportHubSlug === requestedSlug);
  }

  return false;
}

export function canAccessHubMember(session, hubSlug) {
  if (!session || !hubSlug) return false;
  const requestedSlug = String(hubSlug).trim();

  if (session.role === "member" || session.role === "admin") {
    return session.hubSlug === requestedSlug;
  }

  if (session.role === "superadmin") {
    return Boolean(session.supportHubSlug && session.supportHubSlug === requestedSlug);
  }

  return false;
}
