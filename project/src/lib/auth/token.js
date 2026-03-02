import "server-only";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";

export async function createCustomTokenForSession(uid, claims = {}) {
  const normalizedUid = String(uid || "").trim();
  if (!normalizedUid) {
    throw new Error("uid is required.");
  }

  return getFirebaseAdminAuth().createCustomToken(normalizedUid, claims);
}
