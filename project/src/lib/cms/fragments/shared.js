export function normalizeText(value) {
  return String(value || "").trim();
}

export function clampText(value, maxLength) {
  const normalized = normalizeText(value);
  if (!Number.isFinite(maxLength) || maxLength <= 0) return normalized;
  return normalized.slice(0, maxLength);
}

export function pickFirstText(values = []) {
  for (const value of values) {
    const normalized = normalizeText(value);
    if (normalized) return normalized;
  }
  return "";
}

export function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
