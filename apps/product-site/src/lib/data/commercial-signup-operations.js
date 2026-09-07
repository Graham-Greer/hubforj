import "server-only";
import { randomUUID } from "node:crypto";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";

function refs(db, accountId) {
  if (!accountId || String(accountId).includes("/")) throw new Error("Account is required.");
  const account = db.collection("commercialAccounts").doc(accountId);
  return { account, operation: account.collection("signupOperations").doc("initial") };
}
function assertAccount(snapshot, uid) {
  const account = snapshot.data();
  if (!snapshot.exists || !uid || account.authUid !== uid || account.status !== "active") {
    throw new Error("Sign in to the active account that started this setup.");
  }
  return account;
}
function assertOperation(operation, uid) {
  if (!operation || operation.version !== 1 || operation.authUid !== uid || !["pending", "complete"].includes(operation.status)) {
    throw new Error("No recoverable setup is available for this account. Return to your account for help.");
  }
  if (!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(String(operation.operationId || "")) ||
      !/^[a-z0-9]{1,63}$/.test(String(operation.payload?.slug || "")) ||
      operation.payload?.packageTier !== "free" || operation.payload?.packageStatus !== "active" ||
      operation.payload?.packageSource !== "product_site" || operation.payload?.customDomain ||
      !["free", "starter", "growth"].includes(operation.tier) || operation.currency !== "GBP" ||
      (operation.status === "complete" && (!/^hub_[A-Za-z0-9_-]+$/.test(String(operation.hub?.id || "")) || operation.hub?.slug !== operation.payload.slug))) {
    throw new Error("The saved setup needs review. Please contact support before retrying.");
  }
  return operation;
}

export async function createCommercialSignupOperation({ accountId, authUid, payload, tier, currency }) {
  // Store only the canonical non-secret provisioning fields, never caller credentials.
  const fields = ["name", "slug", "contactEmail", "customDomain", "template", "theme", "country", "timezone", "locale", "defaultCurrency", "description", "packageTier", "packageStatus", "packageSource"];
  const safePayload = Object.fromEntries(fields.map((field) => [field, String(payload?.[field] || "")]));
  if (!safePayload.name || !/^[a-z0-9]{1,63}$/.test(safePayload.slug) || safePayload.packageTier !== "free" || safePayload.packageStatus !== "active" || safePayload.packageSource !== "product_site" || safePayload.customDomain || !["free", "starter", "growth"].includes(tier) || currency !== "GBP") {
    throw new Error("The saved setup details are not valid.");
  }
  const db = getFirebaseAdminDb();
  const ref = refs(db, accountId);
  const now = new Date().toISOString();
  const next = { version: 1, operationId: randomUUID(), authUid, payload: safePayload, tier, currency, status: "pending", createdAt: now, updatedAt: now };
  return db.runTransaction(async (transaction) => {
    const account = assertAccount(await transaction.get(ref.account), authUid);
    if (safePayload.contactEmail !== account.ownerEmail) throw new Error("The saved setup email does not match this account.");
    const existing = await transaction.get(ref.operation);
    if (existing.exists) {
      const operation = assertOperation(existing.data(), authUid);
      if (fields.some((field) => operation.payload?.[field] !== safePayload[field]) || operation.tier !== tier || operation.currency !== currency) throw new Error("Setup is already saved with different details. Recover the existing setup first.");
      return operation;
    }
    const owned = await transaction.get(ref.account.collection("ownedHubs").limit(1));
    if (!owned.empty || account.primaryHubId || account.lastHubId || Number(account.hubCount || 0)) throw new Error("This account already has a workspace.");
    transaction.create(ref.operation, next);
    return next;
  });
}

export async function readCommercialSignupOperation({ accountId, authUid }) {
  const db = getFirebaseAdminDb();
  const ref = refs(db, accountId);
  return db.runTransaction(async (transaction) => {
    assertAccount(await transaction.get(ref.account), authUid);
    const operation = assertOperation((await transaction.get(ref.operation)).data(), authUid);
    if (operation.status === "complete") {
      const owned = await transaction.get(ref.account.collection("ownedHubs").doc(operation.hub.id));
      if (!owned.exists || owned.data().relationship !== "owner") throw new Error("Workspace ownership changed. Please contact support.");
    }
    return operation;
  });
}

export async function completeCommercialSignupOperation({ accountId, authUid, operationId, hub }) {
  const db = getFirebaseAdminDb();
  const ref = refs(db, accountId);
  return db.runTransaction(async (transaction) => {
    const account = assertAccount(await transaction.get(ref.account), authUid);
    const operation = assertOperation((await transaction.get(ref.operation)).data(), authUid);
    if (operation.operationId !== operationId) throw new Error("Setup operation changed. Sign in again.");
    if (operation.status === "complete") {
      const owned = await transaction.get(ref.account.collection("ownedHubs").doc(operation.hub.id));
      if (!owned.exists || owned.data().relationship !== "owner") throw new Error("Workspace ownership changed. Please contact support.");
      return operation.hub;
    }
    if (!/^hub_[A-Za-z0-9_-]+$/.test(String(hub?.id || "")) || hub.slug !== operation.payload.slug || hub.packageTier !== "free" || hub.packageStatus !== "active" || hub.packageSource !== "product_site") throw new Error("The workspace response does not match the saved setup. Please contact support.");
    const owned = await transaction.get(ref.account.collection("ownedHubs").limit(2));
    if (owned.docs.some((doc) => doc.id !== hub.id || doc.data().relationship !== "owner") || (account.primaryHubId && account.primaryHubId !== hub.id) || (account.lastHubId && account.lastHubId !== hub.id) || Number(account.hubCount || 0) > 1) throw new Error("Workspace ownership changed. Please contact support before retrying.");
    const now = new Date().toISOString();
    const summary = { id: hub.id, slug: hub.slug, name: operation.payload.name, packageTier: "free", packageStatus: "active", packageSource: "product_site" };
    const ownedRef = ref.account.collection("ownedHubs").doc(hub.id);
    transaction.set(ownedRef, { hubId: hub.id, hubSlug: hub.slug, communityName: summary.name, relationship: "owner", isPrimary: true, packageTier: "free", packageStatus: "active", createdAt: owned.docs[0]?.data()?.createdAt || now, updatedAt: now });
    transaction.update(ref.account, { primaryHubId: hub.id, lastHubId: hub.id, hubCount: 1, updatedAt: now, ...(operation.tier === "free" ? {} : { pendingPackageTier: operation.tier, pendingPackageCurrency: operation.currency, pendingPackageStatus: "checkout_required", pendingPackageEffectiveAt: "", pendingPackageUpdatedAt: now }) });
    transaction.update(ref.operation, { status: "complete", hub: summary, completedAt: now, updatedAt: now });
    return summary;
  });
}
