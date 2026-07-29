function normalizeString(value) {
  return String(value || "").trim();
}

export function normalizeMemberJoinPayload(payload) {
  const name = normalizeString(payload.name);

  if (!name) {
    throw new Error("Full name is required.");
  }

  return {
    name,
  };
}
