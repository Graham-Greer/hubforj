import { createHash } from "node:crypto";
import { prepareHubAddressClaims } from "./hub-address-claims.js";

function operationError(message, status) {
  return Object.assign(new Error(message), { provisioningStatus: status });
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

export function buildHubProvisioningOperation(db, key, payload, actorId) {
  if (key === undefined || key === null) return null;
  if (typeof key !== "string" || !/^[A-Za-z0-9_-]{16,128}$/.test(key)) {
    throw operationError("Invalid provisioning idempotency key.", 400);
  }
  // Domain mapping has external side effects outside the hub creation commit.
  if (payload.customDomain || payload.customDomains?.length) {
    throw operationError("Idempotent provisioning does not support custom domains yet.", 400);
  }
  const digest = (value) => createHash("sha256").update(value).digest("hex");
  return {
    ref: db.collection("hubProvisioningOperations").doc(digest(JSON.stringify([actorId, key]))),
    fingerprint: digest(JSON.stringify(canonicalize(payload))),
  };
}

export async function readHubProvisioningReplay(db, operation, transaction = null) {
  if (!operation) return null;
  const read = (ref) => transaction ? transaction.get(ref) : ref.get();
  const snapshot = await read(operation.ref);
  if (!snapshot.exists) return null;
  const stored = snapshot.data();
  if (stored.version !== 1 || stored.fingerprint !== operation.fingerprint) {
    throw operationError("This provisioning key is already bound to a different request.", 409);
  }
  if (typeof stored.hubId !== "string" || !/^hub_[A-Za-z0-9_-]+$/.test(stored.hubId)) {
    throw operationError("The provisioning record requires review.", 409);
  }
  const hub = await read(db.collection("hubs").doc(stored.hubId));
  if (!hub.exists) {
    throw operationError("The previously provisioned hub is no longer available.", 410);
  }
  return { ...hub.data(), id: hub.id };
}

export async function commitHubProvisioningOperation(db, operation, writes, hub) {
  return db.runTransaction(async (transaction) => {
    const replay = await readHubProvisioningReplay(db, operation, transaction);
    if (replay) return replay;
    const addressWrites = await prepareHubAddressClaims(db, transaction, hub);
    for (const [ref, value] of addressWrites) transaction.create(ref, value);
    for (const [ref, value, mode = "create"] of writes) {
      if (mode === "set") transaction.set(ref, value);
      else transaction.create(ref, value);
    }
    if (operation) transaction.create(operation.ref, {
      version: 1,
      fingerprint: operation.fingerprint,
      hubId: hub.id,
      createdAt: hub.createdAt,
    });
    return hub;
  });
}
