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

function normalizeInviteTokenPayload(payload) {
  return {
    inviteId: normalizeString(payload?.inviteId || payload?.id),
    hubId: normalizeString(payload?.hubId),
    email: normalizeString(payload?.email).toLowerCase(),
    role: normalizeString(payload?.role) || "admin",
    expiresAt: normalizeString(payload?.expiresAt),
    createdAt: normalizeString(payload?.createdAt),
  };
}

export function createAdminInviteToken(payload, secret) {
  const normalizedPayload = normalizeInviteTokenPayload(payload);
  const payloadSegment = encodeBase64Url(JSON.stringify(normalizedPayload));
  const signature = createSignature(payloadSegment, normalizeString(secret));
  return `${payloadSegment}.${signature}`;
}

export function verifyAdminInviteToken(value, secret) {
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
    return normalizeInviteTokenPayload(JSON.parse(decodeBase64Url(payloadSegment)));
  } catch {
    return null;
  }
}

export function buildAdminInviteAcceptPath(hubSlug, token) {
  const normalizedHubSlug = normalizeString(hubSlug);
  const normalizedToken = normalizeString(token);

  if (!normalizedHubSlug || !normalizedToken) {
    return "";
  }

  return `/${normalizedHubSlug}/join?invite=${encodeURIComponent(normalizedToken)}`;
}
