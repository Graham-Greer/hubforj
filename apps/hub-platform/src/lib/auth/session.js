import crypto from "node:crypto";

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

function normalizeSessionPayload(payload) {
  return {
    userId: normalizeString(payload?.userId),
    hubId: normalizeString(payload?.hubId),
    role: normalizeString(payload?.role),
    email: normalizeString(payload?.email).toLowerCase(),
    name: normalizeString(payload?.name),
    expiresAt: Number.parseInt(String(payload?.expiresAt || ""), 10) || 0,
  };
}

export const sessionCookieName = "hub_platform_session";
export const sessionDurationSeconds = 60 * 60 * 24 * 7;

export function createSignedSessionValue(payload, secret) {
  const normalizedPayload = normalizeSessionPayload(payload);
  const payloadSegment = encodeBase64Url(JSON.stringify(normalizedPayload));
  const signature = createSignature(payloadSegment, secret);
  return `${payloadSegment}.${signature}`;
}

export function verifySignedSessionValue(value, secret) {
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
    return normalizeSessionPayload(JSON.parse(decodeBase64Url(payloadSegment)));
  } catch {
    return null;
  }
}

export function isSessionExpired(session, now = Date.now()) {
  const expiresAt = Number.parseInt(String(session?.expiresAt || ""), 10);
  if (!Number.isFinite(expiresAt) || expiresAt <= 0) {
    return true;
  }

  return expiresAt <= Math.floor(now / 1000);
}

export function buildSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionDurationSeconds,
  };
}
