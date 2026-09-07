import "server-only";
import { getAuth } from "firebase-admin/auth";
import { getFirebaseAdminApp, getFirebaseAdminDb } from "@/lib/firebase/admin";
import { normalizeCommercialAccountRecord } from "@/lib/domain/commercial-accounts";

// Never resolve an established session by email. Provider failures fail closed.
export async function resolveCommercialSessionAuthority(session) {
  if (!Number.isFinite(session?.authTime) || session.authTime <= 0 || session.authTime > Date.now()) return null;
  if (!session?.accountId || session.accountId.includes("/") || !session.authUid) return null;
  const snapshot = await getFirebaseAdminDb().collection("commercialAccounts").doc(session.accountId).get();
  const raw = snapshot.data();
  if (!snapshot.exists || raw.status !== "active" || raw.authUid !== session.authUid) return null;
  let user;
  try { user = await getAuth(getFirebaseAdminApp()).getUser(session.authUid); }
  catch (error) {
    if (error?.code === "auth/user-not-found") return null;
    throw error;
  }
  const validAfter = Date.parse(user.tokensValidAfterTime);
  if (user.disabled || !Number.isFinite(validAfter) || session.authTime < validAfter) return null;
  return { account: normalizeCommercialAccountRecord({ ...raw, id: snapshot.id }), authUser: user };
}
