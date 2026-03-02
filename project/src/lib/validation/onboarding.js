function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function assertEmail(value) {
  const email = normalizeEmail(value);
  if (!email) throw new Error("email is required.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("email is invalid.");
  }
  return email;
}

export function validateJoinInput(input) {
  const payload = input || {};
  const email = assertEmail(payload.email);
  const name = String(payload.name || "").trim();
  const planId = String(payload.planId || "").trim();

  if (!name) throw new Error("name is required.");
  if (!planId) throw new Error("planId is required.");

  return { email, name, planId };
}

export function validateMemberSignInInput(input) {
  const payload = input || {};
  const email = assertEmail(payload.email);
  return { email };
}
