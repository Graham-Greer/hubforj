try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

export function normalizeString(value) {
  return String(value || "").trim();
}

export function normalizeUserRecord(user) {
  if (!user) {
    return null;
  }

  return {
    id: normalizeString(user.id || user.uid),
    uid: normalizeString(user.uid || user.id),
    hubId: normalizeString(user.hubId),
    role: normalizeString(user.role) || "member",
    status: normalizeString(user.status) || "active",
    email: normalizeString(user.email).toLowerCase(),
    name: normalizeString(user.name),
    avatarAssetId: normalizeString(user.avatarAssetId),
    avatarAlt: normalizeString(user.avatarAlt),
    avatarAsset: user.avatarAsset || null,
    createdAt: normalizeString(user.createdAt),
    lastSignedInAt: normalizeString(user.lastSignedInAt),
    updatedAt: normalizeString(user.updatedAt),
  };
}

export function sortUsers(rows) {
  return [...rows].sort((left, right) => {
    const leftName = String(left.name || left.email || "").toLowerCase();
    const rightName = String(right.name || right.email || "").toLowerCase();
    return leftName.localeCompare(rightName);
  });
}
