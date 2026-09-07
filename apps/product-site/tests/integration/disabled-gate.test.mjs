import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { getFirebaseAdminDb, getFirebaseAdminAuth } from './firebase-boundary.mjs';
import { effects } from './framework-boundary.mjs';

// App configuration is captured on import, just as it is at server startup.
process.env.PRODUCT_SITE_SIGNUP_PROVISIONING_ENABLED = 'false';
const { POST } = await import('../../src/app/api/auth/commercial/session/route.js');
const { createProductSiteSignupAction } = await import('../../src/app/(marketing)/signup/actions.js');
const db = getFirebaseAdminDb();
after(() => db.terminate());

test('disabled startup gate blocks signup/recovery and preserves ordinary sign-in', async () => {
  const email = 'gate@example.test';
  const password = 'integration-password-123';
  const user = await getFirebaseAdminAuth().createUser({ email, password });
  await db.collection('commercialAccounts').doc('acct_gate').set({ authUid: user.uid, ownerEmail: email, status: 'active', hubCount: 0 });
  const signup = await createProductSiteSignupAction({}, new Map());
  assert.ok(signup.error); assert.equal(effects.sessions.length, 0);
  const blocked = await POST(new Request('http://127.0.0.1/api/auth/commercial/session', { method: 'POST', body: JSON.stringify({ recoverSignup: true, idToken: 'invalid' }) }));
  assert.equal(blocked.status, 503); assert.equal(effects.sessions.length, 0);
  const response = await fetch('http://127.0.0.1:19099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }) });
  assert.ok(response.ok);
  const { idToken } = await response.json();
  const ordinary = await POST(new Request('http://127.0.0.1/api/auth/commercial/session', { method: 'POST', body: JSON.stringify({ idToken }) }));
  assert.equal(ordinary.status, 200, await ordinary.text()); assert.equal(effects.sessions.length, 1);
  assert.equal((await db.collection('hubs').get()).size, 0);
});
