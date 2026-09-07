import { normalizePlatformSubdomainLabel } from "../domain/hub-domains.js";
import { isReservedHubSlug } from "../domain/custom-domain-runtime-config.js";

export const HUB_ADDRESS_MIGRATION = "hubAddressClaimsV1";
export function hubAddressError(message, status = 409) {
  return Object.assign(new Error(message), { provisioningStatus: status });
}

export function getHubAddressLabels(hub) {
  const slug = String(hub.slug || "");
  const label = normalizePlatformSubdomainLabel(hub.platformSubdomainLabel || slug);
  const labels = [...new Set([slug, label])];
  for (const address of labels) {
    if (!/^[a-z0-9]{1,63}$/.test(address) || isReservedHubSlug(address)) {
      throw hubAddressError("A hub address is invalid or reserved; review it before provisioning.", 400);
    }
  }
  return { label, labels };
}

export function hubAddressMigrationRef(db) {
  return db.collection("platformMigrations").doc(HUB_ADDRESS_MIGRATION);
}

// Read all claims before staging any writes (Firestore transactions require this).
export async function prepareHubAddressClaims(db, transaction, hub) {
  const { labels } = getHubAddressLabels(hub);
  const marker = await transaction.get(hubAddressMigrationRef(db));
  if (marker.data()?.version !== 1 || marker.data()?.status !== "ready") {
    throw hubAddressError("Workspace creation is temporarily unavailable while address setup is completed. Please try again later.", 503);
  }
  const writes = [];
  for (const label of labels) {
    const ref = db.collection("hubAddressClaims").doc(label);
    const claim = await transaction.get(ref);
    if (claim.exists) throw hubAddressError("A hub with this address already exists.");
    writes.push([ref, { version: 1, hubId: hub.id, label, createdAt: hub.createdAt }]);
  }
  return writes;
}
