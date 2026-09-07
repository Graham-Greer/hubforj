import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { readFile } from "node:fs/promises";
import { SourceTextModule, SyntheticModule, createContext } from "node:vm";
import { fixture } from "../helpers/address-firestore.mjs";
import { normalizeCreateHubPayload } from "../../src/lib/domain/hubs.js";
import { normalizePlatformSubdomainLabel } from "../../src/lib/domain/hub-domains.js";
import * as operations from "../../src/lib/data/hub-provisioning-operations.js";

async function creationFixture() {
  const { db, records } = fixture();
  const context = createContext({ console });
  const mappings = [];
  const source = await readFile(new URL("../../src/lib/data/hub-mutations.js", import.meta.url), "utf8");
  const provided = {
    ...operations,
    getFirebaseAdminDb: () => db,
    normalizeCreateHubPayload,
    normalizePlatformSubdomainLabel,
    assertNoConflictingCustomDomainClaim: async () => null,
    getCustomDomainMappingByHostname: async () => null,
    buildCustomDomainClaimId: (hostname) => hostname,
    writeCustomDomainMappingForHub: async (hub) => {
      assert.ok(records.has(`hubs/${hub.id}`), "Mapping must follow committed hub creation");
      mappings.push(hub);
    },
    buildDefaultMembershipPlanWriteModel: (hubId, actorId, now, currency) => ({ hubId, createdBy: actorId, createdAt: now, currency }),
  };
  const importedNames = new Map([...source.matchAll(/import\s+\{([^}]+)\}\s+from\s+"([^"]+)"/g)].map((match) => [match[2], match[1].split(",").map((name) => name.trim()).filter(Boolean)]));
  const subject = new SourceTextModule(source, { context });
  await subject.link((specifier) => {
    const names = specifier === "node:crypto" ? ["default"] : importedNames.get(specifier);
    assert.ok(names, `Unexpected import ${specifier}`);
    return new SyntheticModule(names, function () {
      for (const name of names) {
        this.setExport(name, name === "default" ? crypto : provided[name] || (() => { throw new Error(`Unexpected call ${name}`); }));
      }
    }, { context });
  });
  await subject.evaluate();
  return { createHub: subject.namespace.createHub, records, db, mappings };
}
const payload = { name: "North Shore", slug: "northshore", contactEmail: "owner@example.test", packageTier: "free", packageStatus: "active", packageSource: "product_site" };

test("actual createHub commits unkeyed hub, membership plan and claim together", async () => {
  const { createHub, records } = await creationFixture();
  const hub = await createHub(payload, "platform-admin");
  assert.equal(hub.slug, "northshore");
  assert.equal(hub.packageTier, "free");
  assert.equal(records.get("hubAddressClaims/northshore").hubId, hub.id);
  const plans = [...records].filter(([path]) => path.includes("/membershipPlans/"));
  assert.equal(plans.length, 1);
  assert.equal(plans[0][1].hubId, hub.id);
  assert.equal(records.size, 4);
  await assert.rejects(createHub(payload, "internal-product-site", { idempotencyKey: "operation_1234567890" }), { provisioningStatus: 409 });
  assert.equal(records.size, 4);
});

test("actual keyed creation replays without a second hub or membership plan", async () => {
  const { createHub, records } = await creationFixture();
  const first = await createHub(payload, "internal-product-site", { idempotencyKey: "operation_1234567890" });
  const second = await createHub(payload, "internal-product-site", { idempotencyKey: "operation_1234567890" });
  assert.equal(first.id, second.id);
  assert.equal(records.size, 5);
});

test("actual createHub leaves no hub or plan behind on an aborted transaction", async () => {
  const { createHub, records, db } = await creationFixture();
  db.failCommit = true;
  await assert.rejects(createHub(payload), /commit failed/);
  assert.equal(records.size, 1);
});


test("unkeyed Growth creation preserves custom-domain claim and post-commit mapping", async () => {
  const { createHub, records, mappings } = await creationFixture();
  const hub = await createHub({ ...payload, packageTier: "growth", customDomain: "northshore.example.com" }, "platform-admin");
  assert.equal(records.get("customDomainClaims/northshore.example.com").hubId, hub.id);
  assert.equal(records.get("hubAddressClaims/northshore").hubId, hub.id);
  assert.equal(mappings.length, 1);
  assert.equal(mappings[0].id, hub.id);
});
