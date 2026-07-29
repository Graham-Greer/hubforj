import crypto from "node:crypto";
import { getServerEnv } from "../config/env.js";

function normalizeString(value) {
  return String(value || "").trim();
}

function encodeBase64Url(value) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function createSignature(payloadSegment, secret) {
  return crypto.createHmac("sha256", secret).update(payloadSegment).digest("base64url");
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left || ""));
  const rightBuffer = Buffer.from(String(right || ""));

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function normalizeSupportModePayload(payload) {
  return {
    userId: normalizeString(payload?.userId),
    hubId: normalizeString(payload?.hubId),
    hubSlug: normalizeString(payload?.hubSlug),
    hubName: normalizeString(payload?.hubName),
    startedAt: Number.parseInt(String(payload?.startedAt || ""), 10) || 0,
    expiresAt: Number.parseInt(String(payload?.expiresAt || ""), 10) || 0,
  };
}

export const supportModeCookieName = "hub_platform_support_mode";
export const supportModeDurationSeconds = 60 * 60 * 8;

export function buildSupportModeCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: supportModeDurationSeconds,
  };
}

export function createSupportModeValue(payload, secret) {
  const normalizedPayload = normalizeSupportModePayload(payload);
  const payloadSegment = encodeBase64Url(JSON.stringify(normalizedPayload));
  const signature = createSignature(payloadSegment, secret);
  return `${payloadSegment}.${signature}`;
}

export function verifySupportModeValue(value, secret) {
  const normalizedValue = normalizeString(value);
  const normalizedSecret = normalizeString(secret);

  if (!normalizedValue || !normalizedSecret || !normalizedValue.includes(".")) {
    return null;
  }

  const [payloadSegment, signature] = normalizedValue.split(".");
  const expectedSignature = createSignature(payloadSegment, normalizedSecret);

  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  try {
    return normalizeSupportModePayload(JSON.parse(decodeBase64Url(payloadSegment)));
  } catch {
    return null;
  }
}

export function isSupportModeExpired(session, now = Date.now()) {
  const expiresAt = Number.parseInt(String(session?.expiresAt || ""), 10);

  if (!Number.isFinite(expiresAt) || expiresAt <= 0) {
    return true;
  }

  return expiresAt <= Math.floor(now / 1000);
}

export async function getCurrentSupportModeSession() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(supportModeCookieName)?.value || "";
  const session = verifySupportModeValue(rawValue, getServerEnv().sessionHmacSecret);

  if (!session || isSupportModeExpired(session)) {
    return null;
  }

  return session;
}

export async function getSupportModeForHub(hub) {
  const session = await getCurrentSupportModeSession();

  if (!session) {
    return null;
  }

  if (normalizeString(session.hubId) !== normalizeString(hub?.id)) {
    return null;
  }

  return session;
}

export function buildSupportModeSession(operatorSession, hub) {
  const now = Math.floor(Date.now() / 1000);

  return {
    userId: normalizeString(operatorSession?.userId || operatorSession?.user?.id),
    hubId: normalizeString(hub?.id),
    hubSlug: normalizeString(hub?.slug),
    hubName: normalizeString(hub?.name),
    startedAt: now,
    expiresAt: now + supportModeDurationSeconds,
  };
}

export function buildSupportModeBanner(hub) {
  return `Support mode active for ${normalizeString(hub?.name) || "this hub"}`;
}
