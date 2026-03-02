export function validateInviteInput(input) {
  const payload = input || {};
  const email = String(payload.email || "").trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Valid invite email is required.");
  }

  return { email, role: "admin" };
}

export function validateInviteRouteInput(input) {
  const payload = input || {};
  const hubId = String(payload.hubId || "").trim();
  const inviteId = payload.inviteId !== undefined ? String(payload.inviteId || "").trim() : null;

  if (!hubId) {
    throw new Error("hubId is required.");
  }

  if (payload.inviteId !== undefined && !inviteId) {
    throw new Error("inviteId is required.");
  }

  return {
    hubId,
    inviteId,
  };
}
