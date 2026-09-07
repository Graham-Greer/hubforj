import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { SourceTextModule, SyntheticModule, createContext } from "node:vm";

async function fixture(data = { id: "hub_one", provisioningProtocol: "idempotency-v1" }, ok = true) {
  const calls = [];
  const context = createContext({ fetch: async (...args) => {
    calls.push(args);
    return { ok, json: async () => data };
  } });
  const subject = new SourceTextModule(await readFile(new URL("../../src/lib/server/provision-hub.js", import.meta.url), "utf8"), { context });
  await subject.link((specifier) => {
    assert.ok(["server-only", "@/lib/config/env"].includes(specifier));
    if (specifier === "server-only") return new SyntheticModule([], function () {}, { context });
    return new SyntheticModule(["getServerEnv"], function () {
      this.setExport("getServerEnv", () => ({ hubPlatformBaseUrl: "https://hub.example.test", internalAutomationSecret: "test-only-secret" }));
    }, { context });
  });
  await subject.evaluate();
  return { provision: subject.namespace.provisionHubFromProductSite, calls };
}

test("keyed provisioning sends the supplied key and checks receiver acknowledgement", async () => {
  const { provision, calls } = await fixture();
  assert.equal((await provision({ slug: "community" }, { idempotencyKey: "operation_1234567890" })).id, "hub_one");
  assert.equal(calls.length, 1);
  assert.equal(calls[0][1].headers["idempotency-key"], "operation_1234567890");
  assert.equal(calls[0][1].headers.authorization, "Bearer test-only-secret");
  assert.equal(calls[0][1].body, '{"slug":"community"}');
});

test("old receiver response is rejected without an automatic retry", async () => {
  const { provision, calls } = await fixture({ id: "hub_one" });
  await assert.rejects(provision({}, { idempotencyKey: "operation_1234567890" }), /not supported/);
  assert.equal(calls.length, 1);
});

test("existing unkeyed callers retain their response contract", async () => {
  const { provision, calls } = await fixture({ id: "hub_one" });
  assert.equal((await provision({})).id, "hub_one");
  assert.equal(Object.hasOwn(calls[0][1].headers, "idempotency-key"), false);
});

test("invalid keys are rejected before any request", async () => {
  const { provision, calls } = await fixture();
  await assert.rejects(provision({}, { idempotencyKey: "bad" }), /Invalid/);
  assert.equal(calls.length, 0);
});

test("receiver conflicts propagate without retries", async () => {
  const { provision, calls } = await fixture({ error: "Key conflict" }, false);
  await assert.rejects(provision({}, { idempotencyKey: "operation_1234567890" }), /Key conflict/);
  assert.equal(calls.length, 1);
});
