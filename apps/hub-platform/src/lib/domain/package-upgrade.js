function normalizeString(value) {
  return String(value || "").trim();
}

export function createPackageLimitError({
  code,
  message,
  title,
  description,
  currentUsage,
  limit,
  unlocks = [],
}) {
  const error = new Error(message);
  error.code = normalizeString(code);
  error.packageUpgradeNotice = {
    type: "limit",
    title: normalizeString(title),
    description: normalizeString(description),
    currentUsage: Number.isFinite(Number(currentUsage)) ? Number(currentUsage) : 0,
    limit: Number.isFinite(Number(limit)) ? Number(limit) : 0,
    unlocks: Array.isArray(unlocks) ? unlocks.map((item) => normalizeString(item)).filter(Boolean) : [],
  };
  return error;
}

export function getPackageUpgradeNotice(error) {
  if (!error?.packageUpgradeNotice) {
    return null;
  }

  const notice = error.packageUpgradeNotice;

  return {
    type: notice.type === "limit" ? "limit" : "capability",
    title: normalizeString(notice.title),
    description: normalizeString(notice.description),
    currentUsage: Number.isFinite(Number(notice.currentUsage)) ? Number(notice.currentUsage) : 0,
    limit: Number.isFinite(Number(notice.limit)) ? Number(notice.limit) : 0,
    unlocks: Array.isArray(notice.unlocks) ? notice.unlocks.map((item) => normalizeString(item)).filter(Boolean) : [],
  };
}
