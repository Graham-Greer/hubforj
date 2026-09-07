import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerEnv } from "@/lib/config/env";
import { resolveCommercialSessionAuthority } from "@/lib/server/commercial-session-authority";

const ACCOUNT_SESSION_COOKIE = "product_site_account_session";
const ACCOUNT_SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeEmail(value) {
  return normalizeString(value).toLowerCase();
}

function normalizeSlug(value) {
  return normalizeString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function resolveSessionSecret() {
  const { productSiteSessionSecret, internalAutomationSecret } = getServerEnv();

  if (productSiteSessionSecret) {
    return productSiteSessionSecret;
  }

  if (process.env.NODE_ENV !== "production") {
    return internalAutomationSecret || "product-site-dev-session-secret";
  }

  throw new Error("PRODUCT_SITE_SESSION_SECRET is required in production.");
}

function signValue(value) {
  return createHmac("sha256", resolveSessionSecret()).update(value).digest("base64url");
}

function encodePayload(payload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodePayload(value) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
}

function buildToken(payload) {
  const encodedPayload = encodePayload(payload);
  const signature = signValue(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function verifyToken(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 2) return null;
  const [encodedPayload = "", signature = ""] = parts;

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signValue(encodedPayload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = decodePayload(encodedPayload);
    const expiresAt = Number(payload?.expiresAt || 0);

    if (payload?.version !== 2 || !payload.accountId || !payload.authUid ||
        !Number.isFinite(payload.authTime) || payload.authTime <= 0 || payload.authTime > Date.now() ||
        !Number.isFinite(expiresAt) || Date.now() >= expiresAt) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function normalizeSessionPayload(values = {}) {
  const now = Date.now();

  return {
    version: 2,
    accountId: normalizeString(values.accountId),
    authUid: normalizeString(values.authUid),
    authTime: Number(values.authTime ?? now),
    ownerFullName: normalizeString(values.ownerFullName),
    ownerEmail: normalizeEmail(values.ownerEmail),
    communityName: normalizeString(values.communityName),
    hubId: normalizeString(values.hubId),
    hubSlug: normalizeSlug(values.hubSlug),
    packageTier: normalizeString(values.packageTier).toLowerCase() || "starter",
    createdAt: Number(values.createdAt || now),
    expiresAt: now + ACCOUNT_SESSION_MAX_AGE * 1000,
  };
}

export async function writeCommercialAccountSession(values = {}) {
  const payload = normalizeSessionPayload(values);
  if (!(await resolveCommercialSessionAuthority(payload))) throw new Error("Sign in again to the active account.");
  const token = buildToken(payload);
  const cookieStore = await cookies();

  cookieStore.set(ACCOUNT_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ACCOUNT_SESSION_MAX_AGE,
  });

  return payload;
}

export async function writeCommercialAccountSessionFromAccount({ account, currentHub } = {}) {
  return writeCommercialAccountSession({
    accountId: account?.id,
    authUid: account?.authUid,
    authTime: account?.sessionAuthTime,
    ownerFullName: account?.ownerFullName,
    ownerEmail: account?.ownerEmail,
    communityName: currentHub?.name,
    hubId: currentHub?.id,
    hubSlug: currentHub?.slug,
    packageTier: currentHub?.packageTier,
  });
}

export async function readCommercialAccountSession() {
  return (await readCommercialAccountSessionContext())?.session || null;
}

export async function readCommercialAccountSessionContext() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCOUNT_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const session = verifyToken(token);
  if (!session) return null;
  const authority = await resolveCommercialSessionAuthority(session);
  return authority ? { session, ...authority } : null;
}

export async function requireCommercialAccountSessionContext() {
  const context = await readCommercialAccountSessionContext();
  if (!context) redirect("/sign-in");
  return context;
}

export async function clearCommercialAccountSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCOUNT_SESSION_COOKIE);
}

export async function requireCommercialAccountSession() {
  const session = await readCommercialAccountSession();

  if (!session) {
    redirect("/sign-in");
  }

  return session;
}
