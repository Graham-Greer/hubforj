import test from "node:test";
import assert from "node:assert/strict";
import { fixture } from "../helpers/address-firestore.mjs";
import { auditHubAddressClaims, backfillHubAddressClaims } from "../../src/lib/data/hub-address-backfill.js";
const marker = "platformMigrations/hubAddressClaimsV1";

test("audit is read-only and reports cross-hub alias collisions and invalid addresses", async () => {
  const { db, records } = fixture({ ready: false });
  records.set("hubs/hub_one", { slug: "one", platformSubdomainLabel: "T W O" });
  records.set("hubs/hub_two", { slug: "two" });
  records.set("hubs/hub_bad", { slug: "Bad/Slug" });
  const before = [...records];
  const audit = await auditHubAddressClaims(db);
  assert.ok(audit.issues.some((issue) => issue.reason === "address_collision"));
  assert.ok(audit.issues.some((issue) => issue.reason === "invalid_or_reserved_address"));
  assert.deepEqual([...records], before);
});

test("backfill preserves routing aliases and other fields and can be rerun", async () => {
  const { db, records } = fixture({ ready: false });
  records.set("hubs/hub_one", { slug: "one", platformSubdomainLabel: "T W O", name: "Keep me" });
  records.set("hubs/hub_two", { slug: "three" });
  const result = await backfillHubAddressClaims(db, { writersStopped: true });
  assert.equal(result.issues.length, 0);
  assert.equal(result.addressCount, 3);
  assert.equal(records.get(marker).status, "ready");
  assert.deepEqual(records.get("hubs/hub_one"), { slug: "one", platformSubdomainLabel: "two", name: "Keep me" });
  assert.equal(records.get("hubAddressClaims/one").hubId, "hub_one");
  assert.equal(records.get("hubAddressClaims/two").hubId, "hub_one");
  const claim = records.get("hubAddressClaims/one");
  await backfillHubAddressClaims(db, { writersStopped: true });
  assert.deepEqual(records.get("hubAddressClaims/one"), claim);
});

test("conflicting claims block migration without modifying hub records", async () => {
  const { db, records } = fixture({ ready: false });
  records.set("hubs/hub_one", { slug: "one" });
  records.set("hubAddressClaims/one", { version: 1, hubId: "hub_other", label: "one" });
  await assert.rejects(backfillHubAddressClaims(db, { writersStopped: true }), /audit failed/);
  assert.equal(records.get(marker).status, "blocked");
  assert.deepEqual(records.get("hubs/hub_one"), { slug: "one" });
});

test("apply requires writer shutdown and cannot steal an active migration", async () => {
  const { db, records } = fixture({ ready: false });
  await assert.rejects(backfillHubAddressClaims(db), /Stop all/);
  assert.equal(records.size, 0);
  records.set(marker, { version: 1, status: "migrating", runId: "other" });
  await assert.rejects(backfillHubAddressClaims(db, { writersStopped: true }), /already active/);
  assert.equal(records.get(marker).runId, "other");
});

test("empty database requires and supports explicit initialization", async () => {
  const { db, records } = fixture({ ready: false });
  const result = await backfillHubAddressClaims(db, { writersStopped: true });
  assert.equal(result.hubCount, 0);
  assert.equal(records.get(marker).status, "ready");
});

test("backfill traverses multiple pages before reporting coverage", async () => {
  const { db, records } = fixture({ ready: false });
  for (let i = 0; i < 205; i += 1) records.set(`hubs/hub_${String(i).padStart(3, "0")}`, { slug: `community${i}` });
  assert.equal((await backfillHubAddressClaims(db, { writersStopped: true })).hubCount, 205);
  assert.equal((await auditHubAddressClaims(db, { requireCoverage: true })).issues.length, 0);
});


test("partial backfill failure stays blocked and resumes without replacing completed claims", async () => {
  const { db, records } = fixture({ ready: false });
  records.set("hubs/hub_one", { slug: "one" });
  records.set("hubs/hub_two", { slug: "two" });
  db.failCommitAt = 3;
  await assert.rejects(backfillHubAddressClaims(db, { writersStopped: true }), /commit failed/);
  assert.equal(records.get(marker).status, "blocked");
  const firstClaim = records.get("hubAddressClaims/one");
  assert.ok(firstClaim);
  assert.equal(records.has("hubAddressClaims/two"), false);
  await backfillHubAddressClaims(db, { writersStopped: true });
  assert.equal(records.get(marker).status, "ready");
  assert.deepEqual(records.get("hubAddressClaims/one"), firstClaim);
});
