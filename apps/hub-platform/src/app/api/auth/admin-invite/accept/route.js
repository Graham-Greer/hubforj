import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import { buildSessionCookieOptions, createSignedSessionValue, sessionCookieName, sessionDurationSeconds } from "@/lib/auth/session";
import { verifyAdminInviteToken } from "@/lib/auth/admin-invite-token";
import { getServerEnv } from "@/lib/config/env";
import { getHubBySlug } from "@/lib/data/hubs";
import { acceptAdminInvite, getInviteById } from "@/lib/data/invites";
import { deriveInviteStatus, normalizeAcceptAdminInvitePayload } from "@/lib/domain/invites";

function normalizeString(value) {
  return String(value || "").trim();
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
  const inviteToken = normalizeString(body?.inviteToken);

  try {
    if (!hubSlug) {
      throw new Error("Hub slug is required.");
    }

    if (!idToken) {
      throw new Error("Invite acceptance token is required.");
    }

    if (!inviteToken) {
      throw new Error("Invite link is required.");
    }

    const invitePayload = verifyAdminInviteToken(inviteToken, getServerEnv().sessionHmacSecret);
    if (!invitePayload?.inviteId || !invitePayload?.hubId || !invitePayload?.email) {
      throw new Error("Invite link is invalid.");
    }

    const { name } = normalizeAcceptAdminInvitePayload(body);
    const hub = await getHubBySlug(hubSlug);

    if (!hub || hub.id !== invitePayload.hubId) {
      throw new Error("Invite hub could not be resolved.");
    }

    const invite = await getInviteById(hub.id, invitePayload.inviteId);
    if (!invite) {
      throw new Error("Invite not found.");
    }

    if (deriveInviteStatus(invite.status, invite.expiresAt) !== "pending") {
      throw new Error("This invite can no longer be accepted.");
    }

    const decodedToken = await getFirebaseAdminAuth().verifyIdToken(idToken, true);
    const email = normalizeString(decodedToken.email).toLowerCase();

    if (!email) {
      throw new Error("Authenticated account must include an email.");
    }

    if (invite.email !== email || invitePayload.email !== email) {
      throw new Error("Invite email does not match the authenticated account.");
    }

    const result = await acceptAdminInvite(hub.id, invite.id, {
      authUid: decodedToken.uid,
      email,
      name,
    });
    revalidatePath(`/${hub.slug}/admin`);
    revalidatePath(`/${hub.slug}/admin/admins`);

    const expiresAt = Math.floor(Date.now() / 1000) + sessionDurationSeconds;
    const sessionValue = createSignedSessionValue(
      {
        userId: result.user.id,
        hubId: hub.id,
        role: result.user.role,
        email: result.user.email,
        name: result.user.name,
        expiresAt,
      },
      getServerEnv().sessionHmacSecret
    );

    const response = NextResponse.json({
      ok: true,
      redirectTo: `/${hub.slug}/admin?success=inviteAccepted`,
    });

    response.cookies.set(sessionCookieName, sessionValue, buildSessionCookieOptions());
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error: String(error?.message || "Unable to complete admin invite acceptance."),
      },
      { status: 400 }
    );
  }
}
