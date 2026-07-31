try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { NextResponse } from "next/server";
import { getCurrentHubOperatorAccess } from "@/lib/auth/hub-access";
import { requireCurrentSuperadminSession } from "@/lib/auth/platform-session";
import { requireHubBySlug, requireHubCoreBySlug } from "@/lib/data/hubs";
import { canAccessHubAdmin, canManageHubAdmins } from "@/lib/domain/users";

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeAllowedRoles(allowedRoles) {
  return Array.isArray(allowedRoles)
    ? allowedRoles.map((role) => normalizeString(role)).filter(Boolean)
    : [];
}

function canUseHubOperatorBoundary(access) {
  return canAccessHubAdmin(access?.actorRole) || normalizeString(access?.actorRole) === "superadmin";
}

export async function requireHubOperatorActionAccess(hubSlug, options = {}) {
  const normalizedHubSlug = normalizeString(hubSlug);
  const allowedRoles = normalizeAllowedRoles(options.allowedRoles);

  if (!normalizedHubSlug) {
    throw new Error("Hub context is required.");
  }

  const hub = options.coreHub ? await requireHubCoreBySlug(normalizedHubSlug) : await requireHubBySlug(normalizedHubSlug);
  const access = await getCurrentHubOperatorAccess(hub);

  if (!access || !canUseHubOperatorBoundary(access)) {
    throw new Error(options.unauthorizedMessage || "You are not authorized to manage this hub.");
  }

  if (allowedRoles.length && !allowedRoles.includes(normalizeString(access.actorRole))) {
    throw new Error(options.forbiddenMessage || "You are not authorized to perform this action.");
  }

  return {
    hub,
    access,
    actorId: normalizeString(access.actorId),
  };
}

export async function requireHubOperatorAccessForHub(hub, options = {}) {
  const allowedRoles = normalizeAllowedRoles(options.allowedRoles);
  const access = await getCurrentHubOperatorAccess(hub);

  if (!access || !canUseHubOperatorBoundary(access)) {
    throw new Error(options.unauthorizedMessage || "You are not authorized to manage this hub.");
  }

  if (allowedRoles.length && !allowedRoles.includes(normalizeString(access.actorRole))) {
    throw new Error(options.forbiddenMessage || "You are not authorized to perform this action.");
  }

  return {
    hub,
    access,
    actorId: normalizeString(access.actorId),
  };
}

export async function requireHubAdminActionAccess(hubSlug, options = {}) {
  return requireHubOperatorActionAccess(hubSlug, {
    ...options,
    allowedRoles: options.allowedRoles || ["owner", "admin", "superadmin"],
  });
}

export async function requireHubOwnerActionAccess(hubSlug, options = {}) {
  return requireHubOperatorActionAccess(hubSlug, {
    ...options,
    allowedRoles: options.allowedRoles || ["owner", "superadmin"],
  });
}

export async function requireHubAdminManagerActionAccess(hubSlug, options = {}) {
  const result = await requireHubOperatorActionAccess(hubSlug, options);

  if (!canManageHubAdmins(result.access.actorRole)) {
    throw new Error(options.forbiddenMessage || "Only the owner can manage admin access.");
  }

  return result;
}

export function assertActionHubIdMatches(hub, submittedHubId, options = {}) {
  const normalizedSubmittedHubId = normalizeString(submittedHubId);
  const normalizedHubId = normalizeString(hub?.id);

  if (!normalizedHubId) {
    throw new Error("Authorized hub context is required.");
  }

  if (!normalizedSubmittedHubId) {
    if (options.allowEmpty === false) {
      throw new Error(options.message || "Hub id is required.");
    }

    return;
  }

  if (normalizedSubmittedHubId !== normalizedHubId) {
    throw new Error(options.message || "Submitted hub context does not match the authorized hub.");
  }
}

export async function requirePlatformOperatorActionAccess(nextPath = "/platform") {
  const operatorSession = await requireCurrentSuperadminSession(nextPath);

  return {
    operatorSession,
    actorId: normalizeString(operatorSession?.user?.id || operatorSession?.userId),
  };
}

export async function requireHubOperatorRouteAccess(_request, hubSlug, options = {}) {
  try {
    return await requireHubOperatorActionAccess(hubSlug, options);
  } catch (error) {
    const status = /not found/i.test(String(error?.message || "")) ? 404 : 403;
    return {
      errorResponse: NextResponse.json(
        { error: String(error?.message || "Unauthorized.") },
        { status }
      ),
    };
  }
}

export async function requireHubOperatorRouteAccessForHub(_request, hub, options = {}) {
  try {
    return await requireHubOperatorAccessForHub(hub, options);
  } catch (error) {
    return {
      errorResponse: NextResponse.json(
        { error: String(error?.message || "Unauthorized.") },
        { status: 403 }
      ),
    };
  }
}

export async function requirePlatformOperatorRouteAccess(_request, nextPath = "/platform") {
  try {
    return await requirePlatformOperatorActionAccess(nextPath);
  } catch (error) {
    return {
      errorResponse: NextResponse.json(
        { error: String(error?.message || "Unauthorized.") },
        { status: 403 }
      ),
    };
  }
}
