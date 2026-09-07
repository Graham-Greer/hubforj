import test from "node:test";
import assert from "node:assert/strict";
import {
  buildHubProvisioningOperation,
  readHubProvisioningReplay,
  commitHubProvisioningOperation,
} from "../../src/lib/data/hub-provisioning-operations.js";

import { fixture } from "../helpers/address-firestore.mjs";

const key = "operation_1234567890";
const payload = { name: "Community", slug: "northshore", customDomain: null, customDomains: [], features: { b: true, a: false } };
function candidate(db, id = "hub_candidate") {
  const hub = { id, slug: "northshore", platformSubdomainLabel: "northshore", createdAt: "2026-09-07" };
  return { hub, writes: [[db.collection("hubs").doc(id), hub], [db.collection(`hubs/${id}/membershipPlans`).doc("default"), { hubId: id }]] };
}

test("unkeyed requests opt out; malformed keys and domain side effects are rejected", () => {
  const { db } = fixture();
  assert.equal(buildHubProvisioningOperation(db, undefined, payload, "actor"), null);
  for (const invalid of ["", "short", "a".repeat(129), "operation/1234567890", 123]) {
    assert.throws(() => buildHubProvisioningOperation(db, invalid, payload, "actor"), { provisioningStatus: 400 });
  }
  assert.throws(() => buildHubProvisioningOperation(db, key, { ...payload, customDomains: ["example.test"] }, "actor"), { provisioningStatus: 400 });
});

test("canonical payload order is stable and operation keys are actor scoped", () => {
  const { db } = fixture();
  const first = buildHubProvisioningOperation(db, key, payload, "actor");
  const reordered = buildHubProvisioningOperation(db, key, { ...payload, features: { a: false, b: true } }, "actor");
  assert.equal(first.fingerprint, reordered.fingerprint);
  assert.notEqual(first.ref.path, buildHubProvisioningOperation(db, key, payload, "another").ref.path);
  assert.equal(first.ref.path.includes(key), false);
});

test("concurrent same-key requests commit one hub and membership plan; replay survives caller restart", async () => {
  const { db, records } = fixture();
  const operation = buildHubProvisioningOperation(db, key, payload, "actor");
  const one = candidate(db, "hub_one");
  const two = candidate(db, "hub_two");
  const results = await Promise.all([one, two].map(({ hub, writes }) => commitHubProvisioningOperation(db, operation, writes, hub)));
  assert.equal(results[0].id, results[1].id);
  assert.equal(records.size, 5);
  assert.equal((await readHubProvisioningReplay(db, buildHubProvisioningOperation(db, key, payload, "actor"))).id, "hub_one");
});

test("changed payload conflicts and deleted hubs cannot be resurrected", async () => {
  const { db, records } = fixture();
  const operation = buildHubProvisioningOperation(db, key, payload, "actor");
  const { hub, writes } = candidate(db);
  await commitHubProvisioningOperation(db, operation, writes, hub);
  await assert.rejects(readHubProvisioningReplay(db, buildHubProvisioningOperation(db, key, { ...payload, name: "Other" }, "actor")), { provisioningStatus: 409 });
  records.delete(`hubs/${hub.id}`);
  await assert.rejects(commitHubProvisioningOperation(db, operation, writes, hub), { provisioningStatus: 410 });
  assert.equal(records.has(`hubs/${hub.id}`), false);
});

test("failed commits leave no partial records and can be retried", async () => {
  const { db, records } = fixture();
  const operation = buildHubProvisioningOperation(db, key, payload, "actor");
  const { hub, writes } = candidate(db);
  db.failCommit = true;
  await assert.rejects(commitHubProvisioningOperation(db, operation, writes, hub), /commit failed/);
  assert.equal(records.size, 1);
  db.failCommit = false;
  assert.equal((await commitHubProvisioningOperation(db, operation, writes, hub)).id, hub.id);
});

for (const existing of [{ slug: "northshore" }, { slug: "other", platformSubdomainLabel: "northshore" }]) {
  test(`different operations cannot claim an existing address: ${JSON.stringify(existing)}`, async () => {
    const { db, records } = fixture();
    records.set("hubs/hub_existing", existing);
    records.set("hubAddressClaims/northshore", { version: 1, hubId: "hub_existing", label: "northshore" });
    const operation = buildHubProvisioningOperation(db, key, payload, "actor");
    const { hub, writes } = candidate(db);
    await assert.rejects(commitHubProvisioningOperation(db, operation, writes, hub), { provisioningStatus: 409 });
    assert.equal(records.size, 3);
  });
}


test("keyed and unkeyed creators contend on the same address claim", async () => {
  const { db, records } = fixture();
  const operation = buildHubProvisioningOperation(db, key, payload, "actor");
  const one = candidate(db, "hub_one");
  const two = candidate(db, "hub_two");
  const results = await Promise.allSettled([
    commitHubProvisioningOperation(db, null, one.writes, one.hub),
    commitHubProvisioningOperation(db, operation, two.writes, two.hub),
  ]);
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  assert.equal(results.find((result) => result.status === "rejected").reason.provisioningStatus, 409);
  assert.equal(records.get("hubAddressClaims/northshore").hubId, "hub_one");
});

test("missing migration marker fails closed without partial creation", async () => {
  const { db, records } = fixture({ ready: false });
  const { hub, writes } = candidate(db);
  await assert.rejects(commitHubProvisioningOperation(db, null, writes, hub), { provisioningStatus: 503 });
  assert.equal(records.size, 0);
});

test("creation reads remain bounded even with many unrelated hubs", async () => {
  const { db, records } = fixture();
  for (let i = 0; i < 1000; i += 1) records.set(`hubs/hub_existing${i}`, { slug: `existing${i}` });
  const { hub, writes } = candidate(db);
  await commitHubProvisioningOperation(db, null, writes, hub);
  assert.deepEqual(db.transactionReads, ["platformMigrations/hubAddressClaimsV1", "hubAddressClaims/northshore"]);
});

test("a retained address claim blocks reuse after hub deletion", async () => {
  const { db, records } = fixture();
  records.set("hubAddressClaims/northshore", { version: 1, hubId: "hub_deleted", label: "northshore" });
  const { hub, writes } = candidate(db);
  await assert.rejects(commitHubProvisioningOperation(db, null, writes, hub), { provisioningStatus: 409 });
  assert.equal(records.has(`hubs/${hub.id}`), false);
});


test("different addresses provision independently", async () => {
  const { db, records } = fixture();
  const first = candidate(db, "hub_one");
  const second = candidate(db, "hub_two");
  second.hub.slug = "southshore";
  second.hub.platformSubdomainLabel = "southshore";
  await Promise.all([first, second].map(({ hub, writes }) => commitHubProvisioningOperation(db, null, writes, hub)));
  assert.equal(records.get("hubAddressClaims/northshore").hubId, "hub_one");
  assert.equal(records.get("hubAddressClaims/southshore").hubId, "hub_two");
});
