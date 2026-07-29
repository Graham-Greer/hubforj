import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/lib/firebase/admin";
import { resolveHubAuthRedirect } from "@/lib/auth/hub-auth-redirects";
import { getHubBySlug } from "@/lib/data/hubs";
import { assignDefaultMembershipToUser } from "@/lib/data/memberships";
import { countActiveMembersByHub } from "@/lib/data/users";
import { buildSessionCookieOptions, createSignedSessionValue, sessionCookieName, sessionDurationSeconds } from "@/lib/auth/session";
import { getServerEnv } from "@/lib/config/env";
import { resolveHubPackageEntitlements } from "@/lib/domain/hub-package";
import { normalizeMemberJoinPayload } from "@/lib/domain/members";
import { createPackageLimitError, getPackageUpgradeNotice } from "@/lib/domain/package-upgrade";
import { normalizeUserRecord } from "@/lib/data/user-shared";
import {
  assertHubMemberJoinAllowed,
  isPublicAbuseRateLimitError,
  resolveClientIpFromRequest,
} from "@/lib/server/public-abuse-controls";

function normalizeString(value) {
  return String(value || "").trim();
}

async function getExistingHubUser(hubId, uid, email) {
  const db = getFirebaseAdminDb();
  const [legacyById, byUid, byEmail] = await Promise.all([
    db.collection("users").doc(uid).get(),
    db.collection("users").where("hubId", "==", hubId).where("uid", "==", uid).limit(1).get(),
    db.collection("users").where("hubId", "==", hubId).where("email", "==", email).limit(1).get(),
  ]);

  if (legacyById.exists) {
    const user = normalizeUserRecord({ id: legacyById.id, ...legacyById.data() });

    if (user?.hubId === hubId) {
      return user;
    }
  }

  if (!byUid.empty) {
    return normalizeUserRecord({ id: byUid.docs[0].id, ...byUid.docs[0].data() });
  }

  if (!byEmail.empty) {
    return normalizeUserRecord({ id: byEmail.docs[0].id, ...byEmail.docs[0].data() });
  }

  return null;
}

function buildHubUserSessionResponse({ user, hub, email, name, nextPath, routeMode }) {
  const expiresAt = Math.floor(Date.now() / 1000) + sessionDurationSeconds;
  const sessionValue = createSignedSessionValue(
    {
      userId: user.id,
      hubId: hub.id,
      role: user.role,
      email,
      name,
      expiresAt,
    },
    getServerEnv().sessionHmacSecret
  );

  const response = NextResponse.json({
    ok: true,
    redirectTo: resolveHubAuthRedirect(hub.slug, user.role, nextPath, routeMode),
  });

  response.cookies.set(sessionCookieName, sessionValue, buildSessionCookieOptions());
  return response;
}

async function assertHubCanAddActiveMember(hub) {
  const entitlements = resolveHubPackageEntitlements(hub);
  const activeMembersLimit = entitlements.limits?.activeMembers;

  if (!Number.isFinite(activeMembersLimit)) {
    return;
  }

  const activeMembersCount = await countActiveMembersByHub(hub.id);

  if (activeMembersCount >= activeMembersLimit) {
    throw createPackageLimitError({
      code: "active_members_limit",
      message: `You've reached your limit of ${activeMembersLimit} active members. Upgrade to add more members.`,
      title: "Member limit reached",
      description:
        "This hub has filled its active-member allowance on the current package. Upgrade to keep growing the community without blocking new joins.",
      currentUsage: activeMembersCount,
      limit: activeMembersLimit,
      unlocks: [
        "Higher or unlimited active-member allowance",
        "Access to broader growth features",
        "A clearer path into monetisation when needed",
      ],
    });
  }
}

export async function POST(request) {
  let body;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const hubSlug = normalizeString(body?.hubSlug);
  const idToken = normalizeString(body?.idToken);
  const nextPath = normalizeString(body?.nextPath) || `/${hubSlug}`;
  const routeMode = normalizeString(body?.routeMode);
  const ipAddress = resolveClientIpFromRequest(request);

  try {
    if (!hubSlug) {
      throw new Error("Hub slug is required.");
    }

    await assertHubMemberJoinAllowed({ hubSlug, ipAddress });

    if (!idToken) {
      throw new Error("Join token is required.");
    }

    const { name } = normalizeMemberJoinPayload(body);
    const hub = await getHubBySlug(hubSlug);

    if (!hub) {
      throw new Error("Hub not found.");
    }

    const decodedToken = await getFirebaseAdminAuth().verifyIdToken(idToken, true);
    const email = normalizeString(decodedToken.email).toLowerCase();

    if (!email) {
      throw new Error("Authenticated account must include an email.");
    }

    await assertHubMemberJoinAllowed({ hubSlug, ipAddress, email });

    const existingUser = await getExistingHubUser(hub.id, decodedToken.uid, email);

    if (existingUser) {
      if (!["member", "admin"].includes(existingUser.role)) {
        throw new Error("A hub account already exists for this email.");
      }

      if (existingUser.status !== "active") {
        throw new Error("This hub account is not currently active.");
      }

      return buildHubUserSessionResponse({
        user: existingUser,
        hub,
        email: existingUser.email || email,
        name: existingUser.name || name,
        nextPath,
        routeMode,
      });
    }

    await assertHubCanAddActiveMember(hub);

    const now = new Date().toISOString();
    const userRef = getFirebaseAdminDb().collection("users").doc();
    const userRecord = {
      uid: decodedToken.uid,
      hubId: hub.id,
      role: "member",
      status: "active",
      email,
      name,
      createdAt: now,
      updatedAt: now,
      authProvider: "password",
      profileRevision: crypto.randomUUID().slice(0, 12),
    };

    await userRef.create(userRecord);
    await assignDefaultMembershipToUser(hub.id, userRef.id, decodedToken.uid);

    return buildHubUserSessionResponse({
      user: { id: userRef.id, role: "member" },
      hub,
      email,
      name,
      nextPath,
      routeMode,
    });
  } catch (error) {
    if (isPublicAbuseRateLimitError(error)) {
      return NextResponse.json(
        {
          error: error.userMessage,
        },
        {
          status: 429,
          headers: error.retryAfterSeconds
            ? {
                "Retry-After": String(error.retryAfterSeconds),
              }
            : undefined,
        }
      );
    }

    return NextResponse.json(
      {
        error: String(error?.message || "Unable to create your member account."),
        upgradeNotice: getPackageUpgradeNotice(error),
      },
      { status: 400 }
    );
  }
}
