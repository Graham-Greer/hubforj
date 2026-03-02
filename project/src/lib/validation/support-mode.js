export function validateSupportModeInput(input) {
  const payload = input || {};
  const hubId = String(payload.hubId || "").trim();
  const hubSlug = String(payload.hubSlug || "").trim();

  if (!hubId) {
    throw new Error("hubId is required.");
  }

  if (!hubSlug) {
    throw new Error("hubSlug is required.");
  }

  return { hubId, hubSlug };
}
