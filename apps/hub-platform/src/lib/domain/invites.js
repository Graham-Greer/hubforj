import { assertValidEmail, normalizeEmail } from "./hubs.js";

function normalizeString(value) {
  return String(value || "").trim();
}

export function normalizeInviteRole(value) {
  return normalizeString(value) || "admin";
}

export function normalizeCreateAdminInvitePayload(payload) {
  const email = normalizeEmail(payload.email);
  const role = normalizeInviteRole(payload.role);

  if (!email) {
    throw new Error("Email is required.");
  }

  assertValidEmail(email, "Email");

  if (role !== "admin") {
    throw new Error("Only admin invites are supported.");
  }

  return {
    email,
    role,
  };
}

export function normalizeAcceptAdminInvitePayload(payload) {
  const name = normalizeString(payload.name);

  if (!name) {
    throw new Error("Full name is required.");
  }

  return { name };
}

export function deriveInviteStatus(status, expiresAt) {
  const normalizedStatus = normalizeString(status) || "pending";

  if (normalizedStatus === "revoked" || normalizedStatus === "accepted") {
    return normalizedStatus;
  }

  if (!normalizeString(expiresAt)) {
    return normalizedStatus;
  }

  const expiry = new Date(expiresAt);
  if (Number.isNaN(expiry.getTime())) {
    return normalizedStatus;
  }

  return expiry.getTime() < Date.now() ? "expired" : normalizedStatus;
}

export function getInviteStatusLabel(status) {
  const normalizedStatus = deriveInviteStatus(status);

  return {
    pending: "Pending",
    accepted: "Accepted",
    revoked: "Revoked",
    expired: "Expired",
  }[normalizedStatus] || "Pending";
}

export function getInviteStatusTone(status) {
  const normalizedStatus = deriveInviteStatus(status);

  return {
    pending: "warning",
    accepted: "success",
    revoked: "neutral",
    expired: "danger",
  }[normalizedStatus] || "warning";
}

export function canRevokeInvite(status, expiresAt) {
  const derivedStatus = deriveInviteStatus(status, expiresAt);
  return derivedStatus === "pending" || derivedStatus === "expired";
}

export function canResendInvite(status, expiresAt) {
  const derivedStatus = deriveInviteStatus(status, expiresAt);
  return derivedStatus === "pending" || derivedStatus === "expired";
}
