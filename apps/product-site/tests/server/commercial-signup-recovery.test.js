import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { SourceTextModule, SyntheticModule, createContext } from "node:vm";
import { fixture } from "../../../hub-platform/tests/helpers/address-firestore.mjs";

async function load(path, dependencies) {
  const context = createContext({ console });
  const subject = new SourceTextModule(await readFile(new URL(`../../src/${path}`, import.meta.url), "utf8"), { context });
  await subject.link((name) => {
    assert.ok(Object.hasOwn(dependencies, name), name);
    const exports = dependencies[name];
    return new SyntheticModule(Object.keys(exports), function () {
      for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
    }, { context });
  });
  await subject.evaluate();
  return subject.namespace;
}
async function dataFixture() {
  const { db, records } = fixture({ ready: false, allowQuery: true });
  records.set("commercialAccounts/acct_one", { authUid: "uid-one", ownerEmail: "owner@example.test", status: "active", hubCount: 0 });
  const subject = await load("lib/data/commercial-signup-operations.js", {
    "server-only": {}, "node:crypto": { randomUUID }, "@/lib/firebase/admin": { getFirebaseAdminDb: () => db },
  });
  return { subject, db, records };
}
const identity = { accountId: "acct_one", authUid: "uid-one" };
const intent = { ...identity, payload: { name: "North Shore", slug: "northshore", contactEmail: "owner@example.test", packageTier: "free", packageStatus: "active", packageSource: "product_site" }, tier: "starter", currency: "GBP" };
const hub = { id: "hub_one", slug: "northshore", packageTier: "free", packageStatus: "active", packageSource: "product_site" };

test("saved intent is immutable, UID bound and excludes credentials", async () => {
  const { subject, records } = await dataFixture();
  const one = await subject.createCommercialSignupOperation({ ...intent, payload: { ...intent.payload, password: "never-store" } });
  const two = await subject.createCommercialSignupOperation(intent);
  assert.equal(one.operationId, two.operationId);
  assert.equal(JSON.stringify([...records]).includes("never-store"), false);
  await assert.rejects(subject.createCommercialSignupOperation({ ...intent, tier: "growth" }), /different details/);
  await assert.rejects(subject.readCommercialSignupOperation({ ...identity, authUid: "other" }), /Sign in/);
  assert.equal(records.size, 2);
});

test("concurrent completion creates one owner link and does not increment twice", async () => {
  const { subject, records } = await dataFixture();
  const operation = await subject.createCommercialSignupOperation(intent);
  const finish = { ...identity, operationId: operation.operationId, hub };
  await Promise.all([subject.completeCommercialSignupOperation(finish), subject.completeCommercialSignupOperation(finish)]);
  assert.equal(records.get("commercialAccounts/acct_one").hubCount, 1);
  assert.equal(records.get("commercialAccounts/acct_one").pendingPackageTier, "starter");
  assert.equal(records.get("commercialAccounts/acct_one/ownedHubs/hub_one").relationship, "owner");
  assert.equal(records.get("commercialAccounts/acct_one/signupOperations/initial").status, "complete");
});

test("failed ownership commit leaves pending operation retryable", async () => {
  const { subject, records, db } = await dataFixture();
  const operation = await subject.createCommercialSignupOperation(intent);
  db.failCommit = true;
  await assert.rejects(subject.completeCommercialSignupOperation({ ...identity, operationId: operation.operationId, hub }), /commit failed/);
  assert.equal(records.has("commercialAccounts/acct_one/ownedHubs/hub_one"), false);
  assert.equal(records.get("commercialAccounts/acct_one/signupOperations/initial").status, "pending");
  db.failCommit = false;
  await subject.completeCommercialSignupOperation({ ...identity, operationId: operation.operationId, hub });
});

test("completed finalization rejects removed or downgraded ownership", async () => {
  const { subject, records } = await dataFixture();
  const operation = await subject.createCommercialSignupOperation(intent);
  const finish = { ...identity, operationId: operation.operationId, hub };
  await subject.completeCommercialSignupOperation(finish);
  const path = "commercialAccounts/acct_one/ownedHubs/hub_one";
  records.set(path, { relationship: "member" });
  await assert.rejects(subject.completeCommercialSignupOperation(finish), /ownership changed/);
  records.delete(path);
  await assert.rejects(subject.completeCommercialSignupOperation(finish), /ownership changed/);
  assert.equal(records.has(path), false);
});

test("pending completion cannot promote an existing non-owner relationship", async () => {
  const { subject, records } = await dataFixture();
  const operation = await subject.createCommercialSignupOperation(intent);
  const path = "commercialAccounts/acct_one/ownedHubs/hub_one";
  records.set(path, { relationship: "member" });
  await assert.rejects(subject.completeCommercialSignupOperation({ ...identity, operationId: operation.operationId, hub }), /ownership changed/);
  assert.equal(records.get(path).relationship, "member");
  assert.equal(records.get("commercialAccounts/acct_one/signupOperations/initial").status, "pending");
});

test("conflicting workspace, mismatched response, inactive and deleted accounts fail closed", async () => {
  const { subject, records } = await dataFixture();
  const operation = await subject.createCommercialSignupOperation(intent);
  const finish = { ...identity, operationId: operation.operationId, hub };
  await assert.rejects(subject.completeCommercialSignupOperation({ ...finish, hub: { ...hub, slug: "other" } }), /does not match/);
  records.set("commercialAccounts/acct_one/ownedHubs/hub_other", {});
  await assert.rejects(subject.completeCommercialSignupOperation(finish), /ownership changed/);
  records.set("commercialAccounts/acct_one", { status: "closed", authUid: identity.authUid });
  await assert.rejects(subject.readCommercialSignupOperation(identity), /active account/);
  records.delete("commercialAccounts/acct_one");
  await assert.rejects(subject.completeCommercialSignupOperation(finish), /active account/);
});

test("server retries reuse saved payload/key and do not complete on provider failure", async () => {
  let fail = true;
  let completions = 0;
  const requests = [];
  const operation = { ...intent, operationId: "operation_1234567890", status: "pending" };
  const subject = await load("lib/server/commercial-signup-recovery.js", {
    "server-only": {},
    "@/lib/data/commercial-signup-operations": {
      readCommercialSignupOperation: async () => operation,
      completeCommercialSignupOperation: async (value) => { completions++; assert.equal(value.operationId, operation.operationId); return value.hub; },
    },
    "@/lib/data/hubs": { getProductHubSummaryById: async () => null },
    "@/lib/server/provision-hub": { provisionHubFromProductSite: async (...args) => { requests.push(args); if (fail) throw new Error("lost response"); return hub; } },
  });
  await assert.rejects(subject.resumeCommercialSignup({ id: identity.accountId, authUid: identity.authUid }), /lost response/);
  assert.equal(completions, 0);
  fail = false;
  await subject.resumeCommercialSignup({ id: identity.accountId, authUid: identity.authUid });
  assert.equal(requests[0][1].idempotencyKey, requests[1][1].idempotencyKey);
  assert.equal(requests[1][0], intent.payload);
  assert.equal(completions, 1);
  operation.status = "complete";
  operation.hub = hub;
  await assert.rejects(subject.resumeCommercialSignup({ id: identity.accountId, authUid: identity.authUid }), /no longer available/);
  assert.equal(requests.length, 2);
});


test("corrupt stored operation keys cannot fall back to unkeyed provisioning", async () => {
  const { subject, records } = await dataFixture();
  await subject.createCommercialSignupOperation(intent);
  const path = "commercialAccounts/acct_one/signupOperations/initial";
  records.set(path, { ...records.get(path), operationId: "" });
  await assert.rejects(subject.readCommercialSignupOperation(identity), /needs review/);
});
