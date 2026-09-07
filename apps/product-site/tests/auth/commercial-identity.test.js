import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { SourceTextModule, SyntheticModule, createContext } from "node:vm";

// Execute production modules unchanged, replacing only their imported boundaries.
// No Firebase credentials, network, environment files or application boot required.
async function loadModule(path, dependencies) {
  const context = createContext({ console, URLSearchParams });
  const source = await readFile(new URL(`../../src/${path}`, import.meta.url), "utf8");
  const subject = new SourceTextModule(source, { context });
  await subject.link((specifier) => {
    assert.ok(Object.hasOwn(dependencies, specifier), `Unexpected dependency: ${specifier}`);
    const exports = dependencies[specifier];
    return new SyntheticModule(Object.keys(exports), function () {
      for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
    }, { context });
  });
  await subject.evaluate();
  return subject.namespace;
}

const notFound = () => Object.assign(new Error("missing"), { code: "auth/user-not-found" });
const baseAccount = { id: "account-1", ownerEmail: "owner@example.test", ownerFullName: "Owner", authUid: "" };

async function authFixture({ auth = {}, data = {} } = {}) {
  const calls = [];
  const record = (name, result) => async (...args) => { calls.push([name, ...args]); return result; };
  const api = {
    getUser: async () => { throw notFound(); },
    getUserByEmail: async () => { throw notFound(); },
    createUser: record("createUser", { uid: "new-uid", emailVerified: false }),
    updateUser: record("updateUser"),
    verifyIdToken: record("verifyIdToken", { uid: "new-uid", email: baseAccount.ownerEmail, email_verified: true }),
    ...auth,
  };
  const subject = await loadModule("lib/auth/commercial-auth.js", {
    "server-only": {},
    "firebase-admin/auth": { getAuth: () => api },
    "@/lib/firebase/admin": { getFirebaseAdminApp: () => ({}) },
    "@/lib/data/commercial-accounts": {
      getCommercialAccountByAuthUid: record("byUid", null),
      getCommercialAccountByEmail: record("byEmail", baseAccount),
      updateCommercialAccountAuthUid: record("attach", { ...baseAccount, authUid: "new-uid" }),
      updateCommercialAccountVerificationState: record("verification", baseAccount),
      ...data,
    },
  });
  return { subject, calls };
}

for (const disabled of [false, true]) {
  test(`anonymous signup cannot alter an existing identity (disabled=${disabled})`, async () => {
    const { subject, calls } = await authFixture({ auth: {
      getUserByEmail: async () => ({ uid: "existing", disabled }),
    } });
    await assert.rejects(subject.ensureCommercialAccountAuthUser({ account: baseAccount, password: "test-password" }));
    assert.equal(calls.length, 0, "No mutation, binding or verification update allowed");
  });
}

test("stale account UID cannot be replaced during signup", async () => {
  const { subject, calls } = await authFixture();
  await assert.rejects(subject.ensureCommercialAccountAuthUser({ account: { ...baseAccount, authUid: "stale" }, password: "test-password" }));
  assert.equal(calls.length, 0);
});

test("lookup outage does not become permission to create an identity", async () => {
  const { subject, calls } = await authFixture({ auth: {
    getUserByEmail: async () => { throw Object.assign(new Error("provider offline"), { code: "auth/internal-error" }); },
  } });
  await assert.rejects(subject.ensureCommercialAccountAuthUser({ account: baseAccount, password: "test-password" }));
  assert.equal(calls.length, 0);
});

test("fresh signup creates an unverified identity and binds it", async () => {
  const { subject, calls } = await authFixture();
  await subject.ensureCommercialAccountAuthUser({ account: baseAccount, password: "test-password" });
  assert.equal(calls[0][0], "createUser");
  assert.equal(calls[0][1].emailVerified, false);
  assert.equal(calls[0][1].password, "test-password");
  assert.equal(calls[1][0], "attach");
  assert.equal(calls[1][2], "new-uid");
  assert.equal(calls.some(([name]) => name === "updateUser"), false);
});

test("concurrent email creation is rejected, never converted into credential update", async () => {
  const { subject, calls } = await authFixture({ auth: {
    createUser: async () => { throw Object.assign(new Error("duplicate"), { code: "auth/email-already-exists" }); },
  } });
  await assert.rejects(subject.ensureCommercialAccountAuthUser({ account: baseAccount, password: "test-password" }));
  assert.equal(calls.length, 0);
});

test("email fallback requires verified email ownership", async () => {
  const { subject, calls } = await authFixture({ auth: {
    verifyIdToken: async () => ({ uid: "new-uid", email: baseAccount.ownerEmail, email_verified: false }),
  } });
  await assert.rejects(subject.resolveCommercialAccountFromIdToken("token"));
  assert.equal(calls.some(([name]) => name === "attach"), false);
});

test("verified email cannot replace a different bound UID", async () => {
  const { subject, calls } = await authFixture({ data: {
    getCommercialAccountByEmail: async () => ({ ...baseAccount, authUid: "original-uid" }),
  } });
  await assert.rejects(subject.resolveCommercialAccountFromIdToken("token"));
  assert.equal(calls.some(([name]) => name === "attach"), false);
});

test("verified unbound email can recover an incomplete account with revoked-token checking", async () => {
  const { subject, calls } = await authFixture();
  await subject.resolveCommercialAccountFromIdToken("token");
  assert.equal(calls[0][0], "verifyIdToken");
  assert.equal(calls[0][2], true);
  assert.equal(calls.some(([name]) => name === "attach"), true);
});

test("existing UID can sign in to finish verification without email rebinding", async () => {
  const { subject, calls } = await authFixture({
    auth: { verifyIdToken: async () => ({ uid: "linked", email_verified: false }) },
    data: { getCommercialAccountByAuthUid: async () => ({ ...baseAccount, authUid: "linked" }) },
  });
  await subject.resolveCommercialAccountFromIdToken("token");
  assert.equal(calls.some(([name]) => name === "byEmail" || name === "attach"), false);
});

test("revoked tokens cannot reach account lookup or binding", async () => {
  const { subject, calls } = await authFixture({ auth: {
    verifyIdToken: async () => { throw new Error("Token revoked"); },
  } });
  await assert.rejects(subject.resolveCommercialAccountFromIdToken("revoked"), /Token revoked/);
  assert.equal(calls.length, 0);
});

for (const existingUid of ["", "new-uid", "other-uid", null]) {
  test(`UID persistence rechecks current binding transactionally (${existingUid ?? "missing account"})`, async () => {
    const writes = [];
    let transactions = 0;
    const snapshot = { exists: existingUid !== null, data: () => ({ ...baseAccount, authUid: existingUid }) };
    const ref = { get: async () => snapshot, set: async (value) => writes.push(value) };
    const db = {
      collection: () => ({ doc: () => ref }),
      runTransaction: async (callback) => {
        transactions++;
        return callback({ get: async () => snapshot, update: (_ref, value) => writes.push(value) });
      },
    };
    const subject = await loadModule("lib/data/commercial-accounts.js", {
      "server-only": {}, "node:crypto": { default: {} },
      "firebase-admin/firestore": { FieldValue: {} },
      "@/lib/firebase/admin": { getFirebaseAdminDb: () => db },
      "@/lib/domain/commercial-accounts": {
        normalizeCommercialAccountHubRecord: (v) => v,
        normalizeCommercialAccountInput: (v) => v,
        normalizeCommercialAccountRecord: (v) => v,
      },
    });
    if (existingUid === null || existingUid === "other-uid") {
      await assert.rejects(subject.updateCommercialAccountAuthUid("account-1", "new-uid"));
      assert.equal(writes.length, 0);
    } else {
      await subject.updateCommercialAccountAuthUid("account-1", "new-uid");
      assert.equal(writes.length, existingUid === "new-uid" ? 0 : 1);
    }
    assert.equal(transactions, 1);
  });
}

test("signup preflight rejects existing identities before any provisioning/session/checkout", async () => {
  const effects = [];
  const effect = async () => { effects.push("side effect"); throw new Error("Unexpected write"); };
  const values = { ownerEmail: baseAccount.ownerEmail, packageTier: "free" };
  const subject = await loadModule("app/(marketing)/signup/actions.js", {
    "@/lib/config/env": { getServerEnv: () => ({ productSiteSignupProvisioningEnabled: true }) },
    "next/navigation": { redirect: effect, unstable_rethrow: effect },
    "@/lib/auth/commercial-auth": {
      ensureCommercialAccountAuthUser: effect,
      assertCommercialSignupEmailAvailable: async () => { throw new Error("Use sign-in or recovery"); },
    },
    "@/lib/domain/signup": { normalizeProductSignupPayload: () => ({ values, payload: {} }), resolveInitialProvisioningPayloadForSignup: (v) => v },
    "@/lib/data/commercial-accounts": {
      createOrResolveCommercialAccount: effect, getCommercialAccountByEmail: async () => null,
      listCommercialAccountHubs: async () => [], provisionCommercialAccountForSignup: effect, updateCommercialAccountPackageIntent: effect,
    },
    "@/lib/server/account-session": { writeCommercialAccountSessionFromAccount: effect },
    "@/lib/server/commercial-account-email": { sendCommercialAccountVerificationEmail: effect },
    "@/lib/server/commercial-billing": { createStripeCheckoutForPackageChange: effect },
    "@/lib/server/public-abuse-controls": { assertProductSignupAllowed: async () => {}, isPublicAbuseRateLimitError: () => false },
    "@/lib/data/commercial-signup-operations": { createCommercialSignupOperation: effect },
    "@/lib/server/commercial-signup-recovery": { resumeCommercialSignup: effect },
    "@/lib/server/stripe": { assertStripePriceMatchesSelection: effect, resolveStripePriceSelection: effect },
  });
  const result = await subject.createProductSiteSignupAction({}, { get: () => "" });
  assert.match(result.error, /sign-in or recovery/);
  assert.equal(effects.length, 0);
});

for (const tier of ["free", "starter", "growth"]) {
  test(`fresh ${tier} signup preserves Free provisioning, session and checkout order`, async () => {
    const effects = [];
    const account = { ...baseAccount, authUid: "new-uid" };
    const hub = { id: "hub-1", slug: "test-hub", packageTier: "free" };
    const values = { ownerEmail: baseAccount.ownerEmail, packageTier: tier, packageCurrency: "GBP" };
    const redirect = (url) => { throw Object.assign(new Error("redirect"), { redirectTo: url }); };
    const subject = await loadModule("app/(marketing)/signup/actions.js", {
      "@/lib/config/env": { getServerEnv: () => ({ productSiteSignupProvisioningEnabled: true }) },
    "next/navigation": { redirect, unstable_rethrow: (error) => { if (error.redirectTo) throw error; } },
      "@/lib/auth/commercial-auth": {
        assertCommercialSignupEmailAvailable: async () => { effects.push("preflight"); },
        ensureCommercialAccountAuthUser: async () => { effects.push("auth"); return account; },
      },
      "@/lib/domain/signup": {
        normalizeProductSignupPayload: () => ({ values, payload: { packageTier: tier } }),
        resolveInitialProvisioningPayloadForSignup: () => ({ packageTier: "free" }),
      },
      "@/lib/data/commercial-accounts": {
        getCommercialAccountByEmail: async () => null, listCommercialAccountHubs: async () => [],
        createOrResolveCommercialAccount: async () => { effects.push("account"); return baseAccount; },
        provisionCommercialAccountForSignup: async () => { effects.push("ownership"); return { account: baseAccount }; },
        updateCommercialAccountPackageIntent: async () => assert.fail("Unexpected checkout failure"),
      },
      "@/lib/server/account-session": { writeCommercialAccountSessionFromAccount: async ({ currentHub }) => {
        assert.equal(currentHub.packageTier, "free"); effects.push("session");
      } },
      "@/lib/server/commercial-account-email": { sendCommercialAccountVerificationEmail: async () => {
        effects.push("email"); return { status: "sent" };
      } },
      "@/lib/server/commercial-billing": { createStripeCheckoutForPackageChange: async ({ targetTier, currentHub }) => {
        assert.equal(targetTier, tier); assert.equal(currentHub.packageTier, "free");
        effects.push("checkout"); return { url: "https://checkout.example.test" };
      } },
      "@/lib/server/public-abuse-controls": { assertProductSignupAllowed: async () => {}, isPublicAbuseRateLimitError: () => false },
      "@/lib/data/commercial-signup-operations": { createCommercialSignupOperation: async ({ payload }) => {
        assert.equal(payload.packageTier, "free"); effects.push("operation");
      } },
      "@/lib/server/commercial-signup-recovery": { resumeCommercialSignup: async () => { effects.push("hub"); return hub; } },
      "@/lib/server/stripe": { resolveStripePriceSelection: () => ({ priceId: "price-gbp" }), assertStripePriceMatchesSelection: async () => {} },
    });
    await assert.rejects(subject.createProductSiteSignupAction({}, { get: () => "" }), (error) => {
      assert.ok(tier === "free" ? error.redirectTo.startsWith("/signup/success?") : error.redirectTo === "https://checkout.example.test");
      return true;
    });
    assert.deepEqual(effects, ["preflight", "account", "auth", "operation", "email", "hub", "session", ...(tier === "free" ? [] : ["checkout"])]);
  });
}


for (const age of [301, -60, null]) {
  test(`recovery rejects old, future or missing auth time (${age}) before account access`, async () => {
    const { subject, calls } = await authFixture({ auth: {
      verifyIdToken: async () => ({ uid: "new-uid", ...(age === null ? {} : { auth_time: Math.floor(Date.now() / 1000) - age }) }),
    } });
    await assert.rejects(subject.resolveCommercialAccountFromIdToken("token", { requireRecentAuthentication: true }), /Sign in again/);
    assert.equal(calls.length, 0);
  });
}

for (const invalid of [false, true]) {
  test(`signup disabled/invalid requests return no credentials or provisioning effects (invalid=${invalid})`, async () => {
    const effect = async () => assert.fail("No provider or account side effect expected");
    const subject = await loadModule("app/(marketing)/signup/actions.js", {
      "@/lib/config/env": { getServerEnv: () => ({ productSiteSignupProvisioningEnabled: false }) },
      "next/navigation": { redirect: effect, unstable_rethrow: effect },
      "@/lib/auth/commercial-auth": { ensureCommercialAccountAuthUser: effect, assertCommercialSignupEmailAvailable: effect },
      "@/lib/domain/signup": {
        normalizeProductSignupPayload: () => { if (invalid) throw new Error("Invalid email"); return { values: { password: "", passwordConfirm: "" }, payload: {} }; },
        resolveInitialProvisioningPayloadForSignup: effect,
      },
      "@/lib/data/commercial-accounts": { createOrResolveCommercialAccount: effect, getCommercialAccountByEmail: effect, listCommercialAccountHubs: effect, updateCommercialAccountPackageIntent: effect },
      "@/lib/data/commercial-signup-operations": { createCommercialSignupOperation: effect },
      "@/lib/server/commercial-signup-recovery": { resumeCommercialSignup: effect },
      "@/lib/server/account-session": { writeCommercialAccountSessionFromAccount: effect },
      "@/lib/server/commercial-account-email": { sendCommercialAccountVerificationEmail: effect },
      "@/lib/server/commercial-billing": { createStripeCheckoutForPackageChange: effect },
      "@/lib/server/public-abuse-controls": { assertProductSignupAllowed: effect, isPublicAbuseRateLimitError: () => false },
      "@/lib/server/stripe": { assertStripePriceMatchesSelection: effect, resolveStripePriceSelection: effect },
    });
    const result = await subject.createProductSiteSignupAction({}, { get: () => "never-return-password" });
    assert.equal(result.values.password, "");
    assert.equal(result.values.passwordConfirm, "");
    assert.match(result.error, invalid ? /Invalid email/ : /temporarily unavailable/);
  });
}
