function normalizeString(value) {
  return String(value || "").trim();
}

const allowedUserStatuses = new Set(["active", "suspended"]);
const hubOperatorRoles = new Set(["owner", "admin"]);

export function normalizeMemberProfilePayload(payload) {
  const name = normalizeString(payload.name);

  if (!name) {
    throw new Error("Full name is required.");
  }

  return {
    name,
  };
}

export const userRoleLabels = {
  member: "Member",
  owner: "Owner",
  admin: "Admin",
  superadmin: "Superadmin",
};

export const userRoleTones = {
  member: "neutral",
  owner: "warning",
  admin: "accent",
  superadmin: "warning",
};

export const userStatusLabels = {
  active: "Active",
  invited: "Invited",
  suspended: "Suspended",
};

export const userStatusTones = {
  active: "success",
  invited: "warning",
  suspended: "danger",
};

export function getUserRoleLabel(role) {
  return userRoleLabels[normalizeString(role)] || "Unknown";
}

export function getUserRoleTone(role) {
  return userRoleTones[normalizeString(role)] || "neutral";
}

export function getUserStatusLabel(status) {
  return userStatusLabels[normalizeString(status)] || "Unknown";
}

export function getUserStatusTone(status) {
  return userStatusTones[normalizeString(status)] || "neutral";
}

export function isHubOperatorRole(role) {
  return hubOperatorRoles.has(normalizeString(role));
}

export function canAccessHubAdmin(role) {
  return isHubOperatorRole(role);
}

export function canManageHubAdmins(role) {
  const normalizedRole = normalizeString(role);
  return normalizedRole === "owner" || normalizedRole === "superadmin";
}

export function canTransferHubOwnership(role) {
  return normalizeString(role) === "owner";
}

export function normalizeHubUserStatusPayload(payload) {
  const status = normalizeString(payload.status).toLowerCase();

  if (!allowedUserStatuses.has(status)) {
    throw new Error("A valid user status is required.");
  }

  return { status };
}
