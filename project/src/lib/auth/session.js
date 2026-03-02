import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import { getUserById } from "@/lib/data/users/user-repository";
import { getHubById } from "@/lib/data/hubs/hub-repository";

export const SESSION_COOKIE_NAME = "community_session";
export const SUPPORT_CONTEXT_COOKIE_NAME = "community_support_context";
const SESSION_MAX_AGE = 60 * 60 * 8;

function getSignatureSecret() {
  return (
    process.env.SESSION_HMAC_SECRET ||
    process.env.FIREBASE_ADMIN_PRIVATE_KEY ||
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    "community-dev-secret"
  );
}

function toBase64Url(value) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signValue(value) {
  return crypto.createHmac("sha256", getSignatureSecret()).update(value).digest("base64url");
}

function encodeSignedPayload(payload) {
  const json = JSON.stringify(payload);
  const encoded = toBase64Url(json);
  const signature = signValue(encoded);
  return `${encoded}.${signature}`;
}

function decodeSignedPayload(value) {
  if (!value || !String(value).includes(".")) return null;
  const [encoded, signature] = String(value).split(".");
  if (!encoded || !signature) return null;

  const expected = signValue(encoded);
  const provided = Buffer.from(signature, "utf8");
  const required = Buffer.from(expected, "utf8");
  if (provided.length !== required.length || !crypto.timingSafeEqual(provided, required)) {
    return null;
  }

  try {
    return JSON.parse(fromBase64Url(encoded));
  } catch {
    return null;
  }
}

async function readSupportContext() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SUPPORT_CONTEXT_COOKIE_NAME)?.value;
  const context = decodeSignedPayload(raw);
  if (!context) return null;

  return {
    supportHubId: context.supportHubId || null,
    supportHubSlug: context.supportHubSlug || null,
    supportModeEnteredAt: context.supportModeEnteredAt || null,
  };
}

export async function createSessionCookieFromIdToken(idToken, maxAge = SESSION_MAX_AGE) {
  if (!idToken) {
    throw new Error("ID token is required.");
  }

  const auth = getFirebaseAdminAuth();
  await auth.verifyIdToken(idToken, true);
  const expiresIn = maxAge * 1000;
  return auth.createSessionCookie(idToken, { expiresIn });
}

export async function setSessionCookie(sessionCookie, maxAge = SESSION_MAX_AGE) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function setSupportModeContext(payload, maxAge = SESSION_MAX_AGE) {
  const supportPayload = {
    supportHubId: payload?.supportHubId || null,
    supportHubSlug: payload?.supportHubSlug || null,
    supportModeEnteredAt: payload?.supportModeEnteredAt || new Date().toISOString(),
  };

  const cookieStore = await cookies();
  cookieStore.set(SUPPORT_CONTEXT_COOKIE_NAME, encodeSignedPayload(supportPayload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
}

export async function clearSupportModeContext() {
  const cookieStore = await cookies();
  cookieStore.set(SUPPORT_CONTEXT_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function clearSession() {
  await clearSessionCookie();
  await clearSupportModeContext();
}

async function resolveHubSlug({ user, decoded }) {
  if (decoded?.hubSlug && decoded?.hubId && decoded.hubId === user?.hubId) {
    return decoded.hubSlug;
  }

  if (!user?.hubId) {
    return decoded?.hubSlug || null;
  }

  const hub = await getHubById(user.hubId);
  return hub?.slug || decoded?.hubSlug || null;
}

export async function getSession() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!raw) return null;

  try {
    const decoded = await getFirebaseAdminAuth().verifySessionCookie(raw, true);
    const user = await getUserById(decoded.uid);

    const role = user?.role || decoded.role || null;
    const hubId = user?.hubId || decoded.hubId || null;
    const hubSlug = await resolveHubSlug({ user, decoded: { ...decoded, hubId } });

    if (!role) return null;

    const supportContext = await readSupportContext();

    return {
      uid: decoded.uid,
      email: user?.email || decoded.email || null,
      role,
      hubId,
      hubSlug,
      supportHubId: supportContext?.supportHubId || null,
      supportHubSlug: supportContext?.supportHubSlug || null,
      supportModeEnteredAt: supportContext?.supportModeEnteredAt || null,
    };
  } catch {
    return null;
  }
}
