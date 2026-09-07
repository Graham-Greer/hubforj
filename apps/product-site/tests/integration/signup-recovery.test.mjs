import test, { before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { getAuth } from 'firebase-admin/auth';
import { getFirebaseAdminDb, getFirebaseAdminApp, projectId } from './firebase-boundary.mjs';
import { effects } from './framework-boundary.mjs';
import { POST as provision } from '../../../hub-platform/src/app/api/internal/provision-hub/route.js';
import { backfillHubAddressClaims } from '../../../hub-platform/src/lib/data/hub-address-backfill.js';
import { createProductSiteSignupAction } from '../../src/app/(marketing)/signup/actions.js';
import { POST as signIn } from '../../src/app/api/auth/commercial/session/route.js';
import { getCommercialAccountByEmail, createOrResolveCommercialAccount } from '../../src/lib/data/commercial-accounts.js';
import { reconcileCommercialSignup } from '../../src/lib/server/commercial-signup-reconciliation.js';
import { normalizeProductSignupPayload, resolveInitialProvisioningPayloadForSignup } from '../../src/lib/domain/signup.js';
import { resumeCommercialSignup } from '../../src/lib/server/commercial-signup-recovery.js';
import { completeCommercialSignupOperation } from '../../src/lib/data/commercial-signup-operations.js';

const db = getFirebaseAdminDb();
const auth = getAuth(getFirebaseAdminApp());
let dropResponse = false;
let requests = 0;
const server = createServer(async (request, response) => {
  try {
    let body = '';
    for await (const chunk of request) body += chunk;
    requests++;
    const result = await provision(new Request('http://127.0.0.1:18997/api/internal/provision-hub', { method: 'POST', headers: request.headers, body }));
    if (dropResponse) { dropResponse = false; response.destroy(); return; }
    response.writeHead(result.status, { 'content-type': 'application/json' });
    response.end(await result.text());
  } catch (error) { response.writeHead(500); response.end(JSON.stringify({ error: error.message })); }
});
const values = tier => new Map(Object.entries({ ownerFullName: 'Test Owner', ownerEmail: 'owner@example.test', communityName: 'North Shore', hubSlug: 'northshore', packageTier: tier, packageCurrency: 'GBP', password: 'integration-password-123', passwordConfirm: 'integration-password-123' }));

test('operator reconciliation restores a pre-operation failure without replacing identity or creating a hub', async () => {
  const account = await createOrResolveCommercialAccount({ ownerFullName: 'Test Owner', ownerEmail: 'owner@example.test' });
  const user = await auth.createUser({ email: 'owner@example.test', password: 'integration-password-123' });
  const normalized = normalizeProductSignupPayload(Object.fromEntries(values('free')));
  const input = { accountId: account.id, authUid: user.uid, payload: resolveInitialProvisioningPayloadForSignup(normalized.payload), tier: 'free', currency: 'GBP' };
  await assert.rejects(reconcileCommercialSignup(input), /Verified identity/);
  await auth.updateUser(user.uid, { emailVerified: true });
  assert.equal((await reconcileCommercialSignup(input)).status, 'reviewed');
  assert.equal((await state()).operation, undefined); assert.equal((await state()).account.authUid, '');
  assert.equal((await reconcileCommercialSignup({ ...input, apply: true })).status, 'saved');
  assert.equal((await state()).hubs.size, 0);
  await assert.rejects(reconcileCommercialSignup({ ...input, apply: true }), /normal recovery/);
  const response = await recover(await token()); assert.equal(response.status, 200, JSON.stringify(response.body));
  const saved = await state(); assert.equal(saved.hubs.size, 1); assert.equal(saved.owned.size, 1); assert.equal(saved.account.authUid, user.uid);
});
async function signup(tier = 'free') {
  try { return await createProductSiteSignupAction({}, values(tier)); }
  catch (error) { if (error.redirectTo) return { redirectTo: error.redirectTo }; throw error; }
}
async function token() {
  const response = await fetch('http://127.0.0.1:19099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'owner@example.test', password: 'integration-password-123', returnSecureToken: true }) });
  const body = await response.json();
  assert.ok(response.ok, JSON.stringify(body));
  return body.idToken;
}
async function recover(idToken) {
  const result = await signIn(new Request('http://127.0.0.1/api/auth/commercial/session', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ idToken, recoverSignup: true }) }));
  return { status: result.status, body: await result.json() };
}
async function state() {
  const account = await getCommercialAccountByEmail('owner@example.test');
  const hubs = await db.collection('hubs').get();
  const owned = account ? await db.collection('commercialAccounts').doc(account.id).collection('ownedHubs').get() : null;
  const operation = account ? await db.collection('commercialAccounts').doc(account.id).collection('signupOperations').doc('initial').get() : null;
  return { account, hubs, owned, operation: operation?.data() };
}
before(async () => { await new Promise(resolve => server.listen(18997, '127.0.0.1', resolve)); });
beforeEach(async () => {
  // The imported boundary rejects all non-demo/non-loopback targets before this can run.
  for (const url of [`http://127.0.0.1:18089/emulator/v1/projects/${projectId}/databases/(default)/documents`, `http://127.0.0.1:19099/emulator/v1/projects/${projectId}/accounts`]) {
    const response = await fetch(url, { method: 'DELETE' }); assert.ok(response.ok);
  }
  dropResponse = false; requests = 0;
  for (const key of Object.keys(effects)) effects[key].length = 0;
  await backfillHubAddressClaims(db, { writersStopped: true });
});
after(async () => { await new Promise(resolve => server.close(resolve)); await db.terminate(); });

for (const tier of ['free', 'starter', 'growth']) {
  test(`fresh ${tier} signup creates one Free hub and preserves paid checkout intent`, async () => {
    const result = await signup(tier);
    assert.ok(result.redirectTo, JSON.stringify(result));
    const saved = await state();
    assert.equal(saved.hubs.size, 1); assert.equal(saved.owned.size, 1); assert.equal(saved.account.hubCount, 1);
    assert.equal(saved.hubs.docs[0].data().packageTier, 'free');
    assert.equal((await saved.hubs.docs[0].ref.collection('membershipPlans').get()).size, 1);
    assert.equal(saved.operation.status, 'complete');
    assert.equal(effects.checkouts.length, tier === 'free' ? 0 : 1);
    const replay = await recover(await token());
    assert.equal(replay.status, 200, JSON.stringify(replay.body));
    assert.equal(requests, 1); assert.equal(effects.checkouts.length, tier === 'free' ? 0 : 1);
  });
}
test('lost HTTP response after hub commit recovers the same hub with one ownership link', async () => {
  dropResponse = true;
  const result = await signup('growth');
  assert.equal(result.recoverable, true);
  const interrupted = await state();
  assert.equal(interrupted.hubs.size, 1); assert.equal(interrupted.owned.size, 0); assert.equal(interrupted.operation.status, 'pending');
  assert.equal(effects.sessions.length, 0); assert.equal(effects.checkouts.length, 0);
  const recovered = await recover(await token());
  assert.equal(recovered.status, 200, JSON.stringify(recovered.body));
  const saved = await state();
  assert.equal(saved.hubs.docs[0].id, interrupted.hubs.docs[0].id); assert.equal(saved.owned.size, 1); assert.equal(saved.account.hubCount, 1);
  assert.equal(saved.account.pendingPackageTier, 'growth'); assert.equal(effects.checkouts.length, 0);
});
test('concurrent recovery uses Firestore transactions to converge on one hub and owner link', async () => {
  dropResponse = true; await signup();
  const account = (await state()).account;
  const hubs = await Promise.all(Array.from({ length: 4 }, () => resumeCommercialSignup(account)));
  assert.equal(new Set(hubs.map(hub => hub.id)).size, 1);
  const saved = await state();
  assert.equal(saved.hubs.size, 1); assert.equal(saved.owned.size, 1); assert.equal(saved.account.hubCount, 1);
});
test('disabled identity cannot recover or create a session', async () => {
  dropResponse = true; await signup(); const idToken = await token();
  await auth.updateUser((await state()).account.authUid, { disabled: true });
  const result = await recover(idToken);
  assert.equal(result.status, 400); assert.equal(effects.sessions.length, 0);
  assert.equal((await state()).operation.status, 'pending');
});
test('deleted completed workspace is never recreated on recovery', async () => {
  await signup(); const saved = await state(); await saved.hubs.docs[0].ref.delete();
  const result = await recover(await token());
  assert.equal(result.status, 400); assert.equal((await state()).hubs.size, 0); assert.equal(requests, 1);
});
test('existing Firebase identity is not modified by duplicate anonymous signup', async () => {
  await auth.createUser({ email: 'owner@example.test', password: 'original-password', disabled: true });
  const result = await signup();
  assert.ok(result.error); assert.equal((await state()).hubs.size, 0); assert.equal((await db.collection('commercialAccounts').get()).size, 0);
  assert.equal((await auth.getUserByEmail('owner@example.test')).disabled, true);
});
test('completed finalization rejects a removed owner link instead of accepting stale recovery', async () => {
  await signup(); const saved = await state();
  await saved.owned.docs[0].ref.delete();
  await assert.rejects(completeCommercialSignupOperation({ accountId: saved.account.id, authUid: saved.account.authUid, operationId: saved.operation.operationId, hub: saved.operation.hub }), /ownership changed/i);
});

test('corrupt saved operation cannot issue another provisioning request', async () => {
  dropResponse = true; await signup(); const saved = await state();
  await db.collection('commercialAccounts').doc(saved.account.id).collection('signupOperations').doc('initial').update({ operationId: '' });
  assert.equal((await recover(await token())).status, 400);
  assert.equal(requests, 1); assert.equal(effects.sessions.length, 0);
  assert.equal((await state()).owned.size, 0);
});

test('conflicting ownership leaves pending completion unchanged', async () => {
  dropResponse = true; await signup(); const saved = await state();
  const conflict = { hubId: 'hub_other', relationship: 'owner', communityName: 'Unrelated' };
  const ref = db.collection('commercialAccounts').doc(saved.account.id).collection('ownedHubs').doc('hub_other');
  await ref.set(conflict);
  assert.equal((await recover(await token())).status, 400);
  const current = await state();
  assert.equal(current.operation.status, 'pending'); assert.equal(current.owned.size, 1);
  assert.deepEqual((await ref.get()).data(), conflict); assert.equal(effects.sessions.length, 0);
});

test('pending recovery does not promote an existing member relationship to owner', async () => {
  dropResponse = true; await signup(); const saved = await state();
  const ref = db.collection('commercialAccounts').doc(saved.account.id).collection('ownedHubs').doc(saved.hubs.docs[0].id);
  await ref.set({ relationship: 'member' });
  assert.equal((await recover(await token())).status, 400);
  assert.equal((await ref.get()).data().relationship, 'member');
  assert.equal((await state()).operation.status, 'pending'); assert.equal(effects.sessions.length, 0);
});
