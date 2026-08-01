import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { buildHubAuthHref } from "@/lib/auth/hub-auth-redirects";
import {
  getInternalAutomationAuthorizationState,
  normalizeProvisionOwnerAdminAutomationRequestBody,
} from "@/lib/domain/internal-automation";
import { getHubById } from "@/lib/data/hubs";
import { normalizeUserRecord } from "@/lib/data/user-shared";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";

function normalizeString(value) {
  return String(value || "").trim();
}

async function getExistingHubUser(hubId, authUid, ownerEmail) {
  const db = getFirebaseAdminDb();
  const [byUidSnapshot, byEmailSnapshot] = await Promise.all([
    db.collection("users").doc(authUid).get(),
    db.collection("users").where("email", "==", ownerEmail).limit(10).get(),
  ]);

  const byUid = byUidSnapshot.exists ? normalizeUserRecord({ id: byUidSnapshot.id, ...byUidSnapshot.data() }) : null;
  const byEmail = byEmailSnapshot.docs
    .map((doc) => normalizeUserRecord({ id: doc.id, ...doc.data() }))
    .find((user) => user?.hubId === hubId) || null;

  if (byUid?.hubId === hubId) {
    return byUid;
  }

  return byEmail;
}

function buildAdminSignInHref(hubSlug, ownerEmail) {
  const nextPath = `/${hubSlug}/admin`;
  const signInHref = buildHubAuthHref(hubSlug, "sign-in", nextPath);
  const separator = signInHref.includes("?") ? "&" : "?";

  return `${signInHref}${separator}email=${encodeURIComponent(ownerEmail)}&activated=1`;
}

export async function POST(request) {
  const auth = getInternalAutomationAuthorizationState(request);

  if (!auth.authorized) {
    console.warn("Owner admin provisioning rejected authorization", {
      status: auth.status,
      configured: auth.configured,
      error: auth.error,
    });

    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  try {
    const payload = normalizeProvisionOwnerAdminAutomationRequestBody(body);
    const hub = await getHubById(payload.hubId);

    if (!hub) {
      throw new Error("Hub not found.");
    }

    if (payload.hubSlug && hub.slug !== payload.hubSlug) {
      throw new Error("Hub slug does not match the requested hub.");
    }

    const existingUser = await getExistingHubUser(hub.id, payload.authUid, payload.ownerEmail);

    if (existingUser) {
      if (existingUser.role !== "owner") {
        throw new Error("A hub user already exists for this owner email, but it is not the owner account.");
      }

      if (existingUser.status !== "active") {
        throw new Error("The existing admin account is not active.");
      }

      return NextResponse.json({
        status: "existing",
        hubId: hub.id,
        hubSlug: hub.slug,
        signInPath: buildAdminSignInHref(hub.slug, payload.ownerEmail),
      });
    }

    const now = new Date().toISOString();
    const userRef = getFirebaseAdminDb().collection("users").doc();
    const userRecord = {
      uid: payload.authUid,
      hubId: hub.id,
      role: "owner",
      status: "active",
      email: payload.ownerEmail,
      name: payload.ownerFullName,
      createdAt: now,
      updatedAt: now,
      authProvider: "password",
      profileRevision: crypto.randomUUID().slice(0, 12),
    };

    await userRef.create(userRecord);

    console.info("Owner admin provisioned", {
      hubId: hub.id,
      hubSlug: hub.slug,
      userId: userRef.id,
      authUid: payload.authUid,
      ownerEmail: payload.ownerEmail,
    });

    return NextResponse.json({
      status: "provisioned",
      hubId: hub.id,
      hubSlug: hub.slug,
      userId: userRef.id,
      signInPath: buildAdminSignInHref(hub.slug, payload.ownerEmail),
    });
  } catch (error) {
    console.error("Owner admin provisioning failed", {
      hubId: normalizeString(body?.hubId),
      hubSlug: normalizeString(body?.hubSlug),
      ownerEmail: normalizeString(body?.ownerEmail),
      authUid: normalizeString(body?.authUid),
      error: String(error?.message || error || "Unknown owner admin provisioning error"),
    });

    return NextResponse.json(
      {
        error: String(error?.message || "Unable to provision the owner admin account."),
      },
      { status: 400 }
    );
  }
}
