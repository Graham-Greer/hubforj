import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { SourceTextModule, SyntheticModule, createContext } from "node:vm";

async function fixture({ denyAuth = false, denyRecovery = false, denyRate = false, enabled = true } = {}) {
  const events = [];
  const context = createContext({});
  const account = { id: "acct_one", authUid: "uid-one", ownerEmail: "owner@example.test" };
  const hub = { id: "hub_one" };
  const dependencies = {
    "@/lib/config/env": { getServerEnv: () => ({ productSiteSignupProvisioningEnabled: enabled }) },
    "next/server": { NextResponse: { json: (body, options = {}) => ({ body, status: options.status || 200 }) } },
    "@/lib/server/public-abuse-controls": { assertPublicAbuseAllowed: async (scope, args) => {
      assert.equal(scope, "productSignupRecovery"); assert.equal(args.email, account.ownerEmail);
      events.push("rate"); if (denyRate) throw new Error("Please wait");
    } },
    "@/lib/auth/commercial-auth": { resolveCommercialAccountFromIdToken: async (token, options) => {
      assert.equal(token, "signed-token"); events.push(["auth", options.requireRecentAuthentication]);
      if (denyAuth) throw new Error("Sign in again"); return account;
    } },
    "@/lib/data/commercial-accounts": { listCommercialAccountHubs: async () => [] },
    "@/lib/server/account-session": { clearCommercialAccountSession: async () => {}, writeCommercialAccountSessionFromAccount: async (args) => {
      assert.equal(args.account, account); events.push("session");
    } },
    "@/lib/server/commercial-signup-recovery": { resumeCommercialSignup: async (args) => {
      assert.equal(args, account); events.push("recover"); if (denyRecovery) throw new Error("Saved setup unavailable"); return hub;
    } },
  };
  const subject = new SourceTextModule(await readFile(new URL("../../src/app/api/auth/commercial/session/route.js", import.meta.url), "utf8"), { context });
  await subject.link((name) => {
    const exports = dependencies[name]; assert.ok(exports, name);
    return new SyntheticModule(Object.keys(exports), function () { for (const [key, value] of Object.entries(exports)) this.setExport(key, value); }, { context });
  });
  await subject.evaluate();
  return { post: (body) => subject.namespace.POST({ json: async () => ({ idToken: "signed-token", ...body }) }), events };
}

test("explicit recovery verifies fresh auth and throttles before mutation/session", async () => {
  const { post, events } = await fixture();
  const result = await post({ recoverSignup: true, accountId: "attacker", hubId: "attacker", nextPath: "//evil.test" });
  assert.equal(result.body.redirectTo, "/account");
  assert.deepEqual(events, [["auth", true], "rate", "recover", "session"]);
});
for (const options of [{ denyAuth: true }, { denyRecovery: true }, { denyRate: true }]) {
  test(`failed recovery never creates a session: ${JSON.stringify(options)}`, async () => {
    const { post, events } = await fixture(options);
    assert.equal((await post({ recoverSignup: true })).status, 400);
    assert.equal(events.includes("session"), false);
  });
}
for (const target of ["//evil.test", "/\\evil.test", "https://evil.test", "/account\n/evil"]) {
  test(`unsafe sign-in return path is rejected: ${JSON.stringify(target)}`, async () => {
    const { post, events } = await fixture();
    assert.equal((await post({ nextPath: target })).body.redirectTo, "/account");
    assert.deepEqual(events, [["auth", false], "session"]);
  });
}
test("ordinary sign-in preserves internal return path and performs no recovery", async () => {
  const { post, events } = await fixture();
  assert.equal((await post({ nextPath: "/account/billing?tab=history" })).body.redirectTo, "/account/billing?tab=history");
  assert.deepEqual(events, [["auth", false], "session"]);
});


test("disabled acquisition blocks recovery but leaves ordinary sign-in available", async () => {
  const { post, events } = await fixture({ enabled: false });
  assert.equal((await post({ recoverSignup: true })).status, 503);
  assert.equal(events.length, 0);
  assert.equal((await post({})).status, 200);
  assert.deepEqual(events, [["auth", false], "session"]);
});
