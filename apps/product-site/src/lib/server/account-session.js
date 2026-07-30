import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerEnv } from "@/lib/config/env";

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
  const [encodedPayload = "", signature = ""] = String(token || "").split(".");

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

    if (!expiresAt || Date.now() > expiresAt) {
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
    accountId: normalizeString(values.accountId),
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
    ownerFullName: account?.ownerFullName,
    ownerEmail: account?.ownerEmail,
    communityName: currentHub?.name,
    hubId: currentHub?.id,
    hubSlug: currentHub?.slug,
    packageTier: currentHub?.packageTier,
  });
}

export async function readCommercialAccountSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCOUNT_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

export async function clearCommercialAccountSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCOUNT_SESSION_COOKIE);
}

export async function requireCommercialAccountSession() {
  const session = await readCommercialAccountSession();

  if (!session) {
    redirect("/signup");
  }

  return session;
}
