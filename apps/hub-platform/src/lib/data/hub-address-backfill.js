import { randomUUID } from "node:crypto";
import { getHubAddressLabels, hubAddressMigrationRef } from "./hub-address-claims.js";

async function* hubPages(db) {
  let cursor;
  while (true) {
    let query = db.collection("hubs").orderBy("__name__").limit(200);
    if (cursor) query = query.startAfter(cursor);
    const page = await query.get();
    if (page.empty) return;
    yield page.docs;
    cursor = page.docs.at(-1);
  }
}

export async function auditHubAddressClaims(db, { requireCoverage = false } = {}) {
  const issues = [];
  const owners = new Map();
  let hubCount = 0;
  for await (const docs of hubPages(db)) {
    for (const doc of docs) {
      hubCount += 1;
      let addresses;
      try { addresses = getHubAddressLabels(doc.data()); }
      catch { issues.push({ hubId: doc.id, reason: "invalid_or_reserved_address" }); continue; }
      if (requireCoverage && doc.data().platformSubdomainLabel !== addresses.label) {
        issues.push({ hubId: doc.id, reason: "label_not_backfilled" });
      }
      for (const label of addresses.labels) {
        if (owners.has(label) && owners.get(label) !== doc.id) {
          issues.push({ hubId: doc.id, otherHubId: owners.get(label), label, reason: "address_collision" });
        }
        owners.set(label, doc.id);
        const claim = await db.collection("hubAddressClaims").doc(label).get();
        if (claim.exists && (claim.data().hubId !== doc.id || claim.data().version !== 1 || claim.data().label !== label)) {
          issues.push({ hubId: doc.id, label, reason: "conflicting_claim" });
        } else if (requireCoverage && !claim.exists) {
          issues.push({ hubId: doc.id, label, reason: "missing_claim" });
        }
      }
    }
  }
  return { hubCount, addressCount: owners.size, issues };
}

export async function backfillHubAddressClaims(db, { writersStopped = false } = {}) {
  if (!writersStopped) throw new Error("Stop all address writers before applying the backfill.");
  const markerRef = hubAddressMigrationRef(db);
  const runId = randomUUID();
  await db.runTransaction(async (transaction) => {
    const marker = await transaction.get(markerRef);
    if (marker.exists && marker.data()?.version !== 1) throw new Error("Unsupported address migration version; review before proceeding.");
    if (marker.data()?.status === "migrating") throw new Error("An address migration is already active; review its runId before recovery.");
    transaction.set(markerRef, { version: 1, status: "migrating", runId, startedAt: new Date().toISOString() });
  });
  try {
    const audit = await auditHubAddressClaims(db);
    if (audit.issues.length) {
      throw Object.assign(new Error("Address audit failed; resolve reported conflicts before retrying."), { issues: audit.issues });
    }
    for await (const docs of hubPages(db)) {
      for (const doc of docs) {
        await db.runTransaction(async (transaction) => {
          const marker = await transaction.get(markerRef);
          if (marker.data()?.runId !== runId || marker.data()?.status !== "migrating") throw new Error("Migration ownership changed.");
          const current = await transaction.get(doc.ref);
          if (!current.exists) throw new Error("A hub changed during migration; stop all writers and retry.");
          const { label, labels } = getHubAddressLabels(current.data());
          const pending = [];
          for (const address of labels) {
            const ref = db.collection("hubAddressClaims").doc(address);
            const claim = await transaction.get(ref);
            if (claim.exists) {
              if (claim.data().hubId !== doc.id || claim.data().version !== 1 || claim.data().label !== address) throw new Error("An address claim conflicts with this hub.");
            } else {
              pending.push([ref, { version: 1, hubId: doc.id, label: address, createdAt: new Date().toISOString() }]);
            }
          }
          for (const [ref, value] of pending) transaction.create(ref, value);
          if (current.data().platformSubdomainLabel !== label) transaction.update(doc.ref, { platformSubdomainLabel: label });
        });
      }
    }
    const verified = await auditHubAddressClaims(db, { requireCoverage: true });
    if (verified.issues.length || verified.hubCount !== audit.hubCount || verified.addressCount !== audit.addressCount) {
      throw Object.assign(new Error("Post-backfill coverage verification failed."), { issues: verified.issues });
    }
    await db.runTransaction(async (transaction) => {
      const marker = await transaction.get(markerRef);
      if (marker.data()?.runId !== runId || marker.data()?.status !== "migrating") throw new Error("Migration ownership changed.");
      transaction.update(markerRef, { status: "ready", completedAt: new Date().toISOString(), hubCount: verified.hubCount, addressCount: verified.addressCount });
    });
    return verified;
  } catch (error) {
    await db.runTransaction(async (transaction) => {
      const marker = await transaction.get(markerRef);
      if (marker.data()?.runId === runId) transaction.update(markerRef, { status: "blocked" });
    });
    throw error;
  }
}
