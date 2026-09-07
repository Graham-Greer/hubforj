import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { SourceTextModule, SyntheticModule, createContext } from 'node:vm';
import { createHmac, timingSafeEqual } from 'node:crypto';

async function load(file, dependencies, globals = {}) {
  const context = createContext({ Buffer, Date, process: { env: { NODE_ENV: 'production' } }, ...globals });
  const mod = new SourceTextModule(await readFile(new URL(`../../src/${file}`, import.meta.url), 'utf8'), { context });
  await mod.link(name => {
    assert.ok(Object.hasOwn(dependencies, name), name);
    return new SyntheticModule(Object.keys(dependencies[name]), function () { for (const [key, value] of Object.entries(dependencies[name])) this.setExport(key, value); }, { context });
  });
  await mod.evaluate(); return mod.namespace;
}

test('session authority rejects closed, deleted, rebound, disabled and revoked access without email lookup', async () => {
  const session = { accountId: 'acct_one', authUid: 'uid_one', authTime: Date.now() - 10_000 };
  let raw = { status: 'active', authUid: 'uid_one' };
  let exists = true;
  let user = { uid: 'uid_one', disabled: false, tokensValidAfterTime: new Date(session.authTime - 1000).toISOString() };
  let failure;
  const subject = await load('lib/server/commercial-session-authority.js', {
    'server-only': {}, 'firebase-admin/auth': { getAuth: () => ({ getUser: async uid => { assert.equal(uid, 'uid_one'); if (failure) throw failure; return user; } }) },
    '@/lib/firebase/admin': { getFirebaseAdminApp: () => ({}), getFirebaseAdminDb: () => ({ collection: () => ({ doc: id => { assert.equal(id, 'acct_one'); return { get: async () => ({ exists, id, data: () => raw }) }; } }) }) },
    '@/lib/domain/commercial-accounts': { normalizeCommercialAccountRecord: value => value },
  });
  const read = () => subject.resolveCommercialSessionAuthority(session);
  assert.ok(await read());
  for (const status of ['closed', 'suspended', '']) { raw.status = status; assert.equal(await read(), null); }
  raw.status = 'active'; exists = false; assert.equal(await read(), null); exists = true;
  raw.authUid = 'replacement'; assert.equal(await read(), null); raw.authUid = 'uid_one';
  user.disabled = true; assert.equal(await read(), null); user.disabled = false;
  user.tokensValidAfterTime = new Date().toISOString(); assert.equal(await read(), null);
  failure = Object.assign(new Error('deleted'), { code: 'auth/user-not-found' }); assert.equal(await read(), null);
  failure = new Error('provider outage'); await assert.rejects(read(), /outage/);
});

test('real cookie writer uses secure attributes; strict parser rejects tampering, legacy and expired cookies', async () => {
  let token; let options; let allowed = true;
  const clock = Date.now();
  const subject = await load('lib/server/account-session.js', {
    'server-only': {}, 'node:crypto': { createHmac, timingSafeEqual },
    'next/headers': { cookies: async () => ({ get: () => ({ value: token }), set: (_name, value, settings) => { token = value; options = settings; }, delete: () => { token = ''; } }) },
    'next/navigation': { redirect: path => { throw new Error(`redirect:${path}`); } },
    '@/lib/config/env': { getServerEnv: () => ({ productSiteSessionSecret: 'fixture-secret' }) },
    '@/lib/server/commercial-session-authority': { resolveCommercialSessionAuthority: async () => allowed ? { account: { id: 'acct_one' } } : null },
  }, { Date: class extends Date { static now() { return clock; } } });
  await subject.writeCommercialAccountSessionFromAccount({ account: { id: 'acct_one', authUid: 'uid_one', sessionAuthTime: Date.now() - 1000 } });
  assert.equal(options.secure, true); assert.equal(options.httpOnly, true); assert.equal(options.sameSite, 'lax'); assert.equal(options.path, '/');
  const valid = token; assert.equal((await subject.readCommercialAccountSession()).authUid, 'uid_one');
  for (const invalid of [`${valid}.extra`, `${valid}x`, 'bad', '']) { token = invalid; assert.equal(await subject.readCommercialAccountSession(), null); }
  const sign = payload => { const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url'); return `${encoded}.${createHmac('sha256', 'fixture-secret').update(encoded).digest('base64url')}`; };
  const payload = JSON.parse(Buffer.from(valid.split('.')[0], 'base64url'));
  for (const update of [{ expiresAt: clock }, { version: 1 }, { authUid: '' }, { authTime: clock + 10_000 }]) { token = sign({ ...payload, ...update }); assert.equal(await subject.readCommercialAccountSession(), null); }
  token = valid; allowed = false; assert.equal(await subject.readCommercialAccountSession(), null);
  await assert.rejects(subject.requireCommercialAccountSessionContext(), /redirect:\/sign-in/);
  allowed = true; await subject.clearCommercialAccountSession(); assert.equal(await subject.readCommercialAccountSession(), null);
});

test('account context uses verified authority and never supplies stale or non-owned hub access', async () => {
  let links = [{ hubId: 'hub_old', relationship: 'member' }]; let hub = null;
  const subject = await load('lib/server/commercial-account-context.js', {
    'server-only': {},
    '@/lib/server/account-session': { requireCommercialAccountSessionContext: async () => ({ session: { hubId: 'hub_old', hubSlug: 'stale' }, account: { id: 'acct_one' }, authUser: { emailVerified: false } }) },
    '@/lib/auth/commercial-auth': { syncCommercialAccountVerificationState: async ({ account, authUser }) => ({ ...account, emailVerified: authUser.emailVerified }) },
    '@/lib/data/commercial-accounts': { listCommercialAccountHubs: async () => links },
    '@/lib/data/hubs': { getProductHubSummaryById: async () => hub },
    '@/lib/server/commercial-billing': { refreshCommercialAccountSubscriptionState: async account => account },
  });
  assert.equal((await subject.requireCommercialAccountContext()).currentHub.id, '');
  links = [{ hubId: 'hub_old', relationship: 'owner' }];
  assert.equal((await subject.requireCommercialAccountContext()).currentHub.slug, '');
  hub = { id: 'hub_old', slug: 'current', packageTier: 'free' };
  assert.equal((await subject.requireCommercialAccountContext()).currentHub.slug, 'current');
});

test('missing email delivery config emits no action links, sent timestamps or secret logs', async () => {
  const subject = await load('lib/server/commercial-account-email.js', {
    'server-only': {},
    'firebase-admin/auth': { getAuth: () => { throw new Error('No link generation without delivery'); } },
    resend: { Resend: class { constructor() { throw new Error('No provider without config'); } } },
    '@/lib/config/env': { getServerEnv: () => ({}) },
    '@/lib/data/commercial-accounts': { markCommercialAccountVerificationEmailSent: () => { throw new Error('Not sent'); } },
    '@/lib/firebase/admin': { getFirebaseAdminApp: () => ({}) },
  }, { URL, console: { warn: () => { throw new Error('No secret logs'); } } });
  assert.equal((await subject.sendCommercialAccountVerificationEmail({ account: { id: 'acct_one', ownerEmail: 'test@example.test' } })).status, 'unavailable');
  assert.equal((await subject.sendCommercialAccountPasswordResetEmail({ email: 'test@example.test' })).status, 'unavailable');
  assert.equal((await subject.sendCommercialAccountPasswordResetEmail({ email: 'unknown@example.test' })).status, 'unavailable');
});

test('email transport records success only after provider acceptance and preserves branded action links', async () => {
  const sent = []; const stamps = []; let response = { data: { id: 'mail_one' }, error: null };
  const subject = await load('lib/server/commercial-account-email.js', {
    'server-only': {},
    'firebase-admin/auth': { getAuth: () => ({ generateEmailVerificationLink: async () => 'https://auth.example/action?mode=verifyEmail&oobCode=fixture-code', generatePasswordResetLink: async () => 'https://auth.example/action?mode=resetPassword&oobCode=fixture-reset' }) },
    resend: { Resend: class { emails = { send: async value => { sent.push(value); return response; } }; } },
    '@/lib/config/env': { getServerEnv: () => ({ resendApiKey: 'fixture-key', resendFromEmail: 'test@example.test', productSiteBaseUrl: 'https://product.example.test' }) },
    '@/lib/data/commercial-accounts': { markCommercialAccountVerificationEmailSent: async (...args) => stamps.push(args) },
    '@/lib/firebase/admin': { getFirebaseAdminApp: () => ({}) },
  }, { URL });
  const input = { account: { id: 'acct_one', ownerEmail: 'owner@example.test', ownerFullName: '<Owner>' } };
  response = { error: { message: 'provider unavailable' } };
  await assert.rejects(subject.sendCommercialAccountVerificationEmail(input), /provider unavailable/); assert.equal(stamps.length, 0);
  response = { data: {} }; await assert.rejects(subject.sendCommercialAccountVerificationEmail(input), /confirm acceptance/); assert.equal(stamps.length, 0);
  response = { data: { id: 'mail_one' } };
  assert.equal((await subject.sendCommercialAccountVerificationEmail(input)).emailId, 'mail_one'); assert.equal(stamps.length, 1);
  assert.ok(sent.at(-1).text.includes('https://product.example.test/verify-email?mode=verifyEmail&oobCode=fixture-code'));
  assert.ok(sent.at(-1).html.includes('&lt;Owner&gt;'));
  await subject.sendCommercialAccountPasswordResetEmail({ email: 'owner@example.test' });
  assert.ok(sent.at(-1).text.includes('/reset-password?mode=resetPassword&oobCode=fixture-reset'));
});
