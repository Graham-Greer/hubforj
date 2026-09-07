import "server-only";
import { getAuth } from "firebase-admin/auth";
import { getFirebaseAdminApp, getFirebaseAdminDb } from "@/lib/firebase/admin";
import { updateCommercialAccountAuthUid } from "@/lib/data/commercial-accounts";
import { createCommercialSignupOperation } from "@/lib/data/commercial-signup-operations";

// Operator-only library: never expose as an anonymous endpoint. Dry-run by default.
// The owner must first verify their existing Firebase email; never reset credentials here.
export async function reconcileCommercialSignup({ accountId, authUid, payload, tier, currency, apply = false }) {
  if (!accountId || accountId.includes("/") || !authUid) throw new Error("Explicit account ID and identity are required.");
  const db = getFirebaseAdminDb();
  const ref = db.collection("commercialAccounts").doc(accountId);
  const account = (await ref.get()).data();
  const user = await getAuth(getFirebaseAdminApp()).getUser(authUid);
  if (!account || account.status !== "active" || user.disabled || !user.emailVerified ||
      user.email?.toLowerCase() !== account.ownerEmail || (account.authUid && account.authUid !== authUid) ||
      payload?.contactEmail !== account.ownerEmail) throw new Error("Verified identity and active account must match; do not overwrite existing identity.");
  const [owned, operation, legacyHubs] = await Promise.all([ref.collection("ownedHubs").limit(1).get(), ref.collection("signupOperations").doc("initial").get(), db.collection("hubs").where("contactEmail", "==", account.ownerEmail).limit(1).get()]);
  if (!owned.empty || !legacyHubs.empty || account.primaryHubId || account.lastHubId || Number(account.hubCount || 0) || operation.exists) throw new Error("Existing workspace or setup requires review; use normal recovery for saved operations.");
  if (!apply) return { status: "reviewed", accountId, authUid, identityBindingRequired: !account.authUid };
  // Binding refuses replacement transactionally; operation creation rechecks active status,
  // UID, owned hubs and canonical intent in its own transaction. A partial binding is retryable.
  await updateCommercialAccountAuthUid(accountId, authUid);
  const saved = await createCommercialSignupOperation({ accountId, authUid, payload, tier, currency });
  return { status: "saved", accountId, operationId: saved.operationId };
}
