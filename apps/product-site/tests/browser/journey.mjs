import assert from 'node:assert/strict';
import { cp, mkdir, readFile, writeFile, symlink } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '../../node_modules/.cache/enterprise-browser-tools/node_modules/playwright-core/index.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const app = path.join(root, '.browser-test/app');
const base = 'http://127.0.0.1:13007';
await mkdir(app, { recursive: true });
await writeFile(path.join(root, '.browser-test/.gitignore'), '*\n');
try { await symlink(path.join(root, 'node_modules'), path.join(app, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir'); } catch (error) { if (error.code !== 'EEXIST') throw error; }
for (const name of ['src', 'public', 'package.json', 'jsconfig.json', 'next.config.mjs']) await cp(path.join(root, name), path.join(app, name), { recursive: true });
const adminFixture = (await readFile(new URL('../integration/firebase-boundary.mjs', import.meta.url), 'utf8'))
  .replace("import { initializeApp }", "import { initializeApp, getApps, getApp }")
  .replace("process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:18089'", "process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:18090'")
  .replace("if (process.env[key])", "if (process.env[key] && !(key === 'RESEND_API_KEY' && process.env[key] === 're_local_fixture'))")
  .replace("const app = initializeApp({ projectId });", "const app = getApps().length ? getApp() : initializeApp({ projectId });");
await writeFile(path.join(app, 'src/lib/firebase/admin.js'), adminFixture);
await writeFile(path.join(app, 'src/lib/firebase/client.js'), `
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
export function getFirebaseClientApp() { return getApps().length ? getApp() : initializeApp({ apiKey: 'demo-api-key', projectId: 'demo-hubforj-recovery', authDomain: 'localhost' }); }
export function getFirebaseClientAuth() { const auth = getAuth(getFirebaseClientApp()); if (!auth.emulatorConfig) connectAuthEmulator(auth, 'http://127.0.0.1:19099', { disableWarnings: true }); return auth; }
`);
await writeFile(path.join(app, 'resend-fixture.js'), `export class Resend { emails = { send: async () => ({ data: { id: 'fixture' }, error: null }) }; }`);
await writeFile(path.join(app, 'next.config.mjs'), (await readFile(path.join(root, 'next.config.mjs'), 'utf8')) + `\nnextConfig.webpack = (config) => { config.resolve.alias['resend$'] = new URL('./resend-fixture.js', import.meta.url).pathname.replace(/^\\/([A-Z]:)/i, '$1'); return config; };\n`);
const osNames = new Set(['path', 'systemroot', 'windir', 'temp', 'tmp', 'comspec', 'pathext', 'userprofile', 'appdata', 'localappdata', 'systemdrive']);
const env = { ...Object.fromEntries(Object.entries(process.env).filter(([name]) => osNames.has(name.toLowerCase()))), GCLOUD_PROJECT: 'demo-hubforj-recovery', FIRESTORE_EMULATOR_HOST: '127.0.0.1:18090', FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:19099', HUB_PLATFORM_BASE_URL: 'http://127.0.0.1:18997', INTERNAL_AUTOMATION_SECRET: 'integration-only-not-a-production-secret', PRODUCT_SITE_SIGNUP_PROVISIONING_ENABLED: 'true', PRODUCT_SITE_ABUSE_RATE_LIMIT_PROVIDER: 'disabled', RESEND_API_KEY: 're_local_fixture', RESEND_FROM_EMAIL: 'test@example.test', NODE_ENV: 'development', NEXT_TELEMETRY_DISABLED: '1', PRODUCT_SITE_BASE_URL: base, PRODUCT_SITE_SESSION_SECRET: 'isolated-browser-session-secret-not-for-production' };
const log = createWriteStream(path.join(app, 'next-test.log'));
const next = spawn(process.execPath, [path.join(root, 'node_modules/next/dist/bin/next'), 'dev', '--webpack', '--hostname', '127.0.0.1', '--port', '13007'], { cwd: app, env, stdio: ['ignore', 'pipe', 'pipe'] });
next.stdout.pipe(log); next.stderr.pipe(log);
let browser;
const report = [];
function pass(name) { report.push(name); process.stdout.write(`PASS ${name}\n`); }
try {
  const deadline = Date.now() + 180_000;
  while (true) {
    if (next.exitCode !== null) throw new Error('Isolated Next server exited; inspect ignored next-test.log.');
    try { if ((await fetch(`${base}/signup?tier=free`)).ok) break; } catch { /* Startup. */ }
    if (Date.now() > deadline) throw new Error('Isolated Next startup timeout; inspect ignored next-test.log.');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  browser = await chromium.launch({ executablePath: process.env.HUBFORJ_BROWSER_EXECUTABLE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    return ['127.0.0.1', 'localhost'].includes(url.hostname) ? route.continue() : route.abort();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(90_000);
  const password = 'browser-test-password-123';
  async function signup(email, name) {
    await page.goto(`${base}/signup?tier=free`);
    for (const [field, value] of Object.entries({ ownerFullName: 'Browser Owner', ownerEmail: email, password, passwordConfirm: password, communityName: name })) await page.locator(`[name="${field}"]`).fill(value);
    await page.locator('button[type="submit"]').click();
  }
  await signup('browser@example.test', 'Browser Hub');
  try { await page.waitForURL(/\/signup\/success/); } catch (error) { process.stderr.write(`Signup error: ${await page.locator('.form-message').allTextContents()}\n`); throw error; }
  const cookie = (await context.cookies()).find(item => item.name === 'product_site_account_session');
  assert.ok(cookie?.httpOnly); assert.equal(cookie.sameSite, 'Lax'); assert.equal(cookie.path, '/');
  assert.equal(await page.evaluate(() => document.cookie.includes('product_site_account_session')), false);
  await page.goto(`${base}/account`); await page.reload(); assert.equal(new URL(page.url()).pathname, '/account');
  pass('Free form signup, real HttpOnly cookie and account reload');
  const blocked = await page.evaluate(async () => { const r = await fetch('/account/admin/handoff', { method: 'POST' }); return { status: r.status, body: await r.json() }; });
  assert.equal(blocked.body.state, 'verification-required'); pass('Unverified account cannot activate hub admin');
  const codes = await (await fetch('http://127.0.0.1:19099/emulator/v1/projects/demo-hubforj-recovery/oobCodes')).json();
  const verification = codes.oobCodes.find(code => code.email === 'browser@example.test' && code.requestType === 'VERIFY_EMAIL');
  assert.ok(verification);
  await page.goto(`${base}/verify-email?mode=verifyEmail&oobCode=${encodeURIComponent(verification.oobCode)}`);
  await page.getByText(/email verified/i).first().waitFor(); pass('Verification page consumes real emulator action code');
  await page.goto(`${base}/account`);
  const handoff = await page.evaluate(async () => { const r = await fetch('/account/admin/handoff', { method: 'POST' }); return r.json(); });
  assert.equal(handoff.ok, true);
  const opened = await context.request.get(handoff.redirectTo, { maxRedirects: 0 });
  assert.ok(opened.headers()['location'].includes('/browserhub/admin'));
  const hubCookie = (await context.cookies()).find(item => item.name === 'hub_platform_session');
  assert.ok(hubCookie?.httpOnly);
  const hubSession = JSON.parse(Buffer.from(hubCookie.value.split('.')[0], 'base64url').toString());
  assert.equal(hubSession.role, 'owner');
  const firstState = await (await fetch('http://127.0.0.1:18997/test/state')).json();
  assert.equal(hubSession.hubId, firstState.hubs[0].id);
  const replay = await context.request.get(handoff.redirectTo, { maxRedirects: 0 });
  assert.ok(replay.headers()['location'].includes('handoff=expired')); pass('Verified owner handoff issues correct hub session and rejects reuse');
  await page.getByRole('button', { name: 'Sign out', exact: true }).filter({ visible: true }).first().click();
  await page.waitForURL(`${base}/`);
  assert.equal((await context.cookies()).some(item => item.name === cookie.name), false); pass('Browser sign-out removes account cookie');
  await page.goto(`${base}/sign-in`);
  await page.locator('[name="email"]').fill('browser@example.test'); await page.locator('[name="password"]').fill('wrong-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.getByText('Email or password is incorrect.').waitFor(); pass('Wrong password fails without a session');
  await page.locator('[name="password"]').fill(password); await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(`${base}/account`); pass('Verified identity signs back in');
  const beforeResetCookie = (await context.cookies()).find(item => item.name === cookie.name);
  await page.goto(`${base}/forgot-password`);
  await page.locator('[name="email"]').fill('browser@example.test');
  await page.locator('button[type="submit"]').click();
  await page.getByText('If that account exists, a password reset email has been sent.').waitFor();
  const resetCodes = await (await fetch('http://127.0.0.1:19099/emulator/v1/projects/demo-hubforj-recovery/oobCodes')).json();
  const resetCode = resetCodes.oobCodes.find(code => code.email === 'browser@example.test' && code.requestType === 'PASSWORD_RESET');
  assert.ok(resetCode);
  // Auth revocation is second-granularity; move beyond the previous authentication second.
  await page.waitForTimeout(1100);
  await page.goto(`${base}/reset-password?mode=resetPassword&oobCode=${encodeURIComponent(resetCode.oobCode)}`);
  await page.locator('[name="password"]').fill('new-browser-password-456');
  await page.locator('[name="passwordConfirm"]').fill('new-browser-password-456');
  await page.getByRole('button', { name: 'Save new password' }).click();
  await page.getByText('Your password has been reset.').waitFor();
  await context.clearCookies(); await context.addCookies([beforeResetCookie]);
  await page.goto(`${base}/account`); await page.waitForURL(/\/sign-in/);
  await page.locator('[name="email"]').fill('browser@example.test'); await page.locator('[name="password"]').fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.getByText('Email or password is incorrect.').waitFor();
  await page.locator('[name="password"]').fill('new-browser-password-456'); await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(`${base}/account`); pass('Password reset invalidates old cookie/password and accepts new password');
  await context.clearCookies();
  await page.goto(`${base}/reset-password?mode=resetPassword&oobCode=${encodeURIComponent(resetCode.oobCode)}`);
  await page.getByText(/no longer valid|invalid|expired/i).first().waitFor(); pass('Used password-reset link is rejected');
  await context.clearCookies();
  await context.addCookies([{ ...cookie, value: `${cookie.value}x` }]);
  await page.goto(`${base}/account`); await page.waitForURL(/\/signup|\/sign-in/); pass('Tampered cookie cannot open account');
  await context.clearCookies();
  await fetch('http://127.0.0.1:18997/test/drop-next', { method: 'POST' });
  await signup('recovery@example.test', 'Recovery Hub');
  await page.locator('a[href="/signup/recover"]').waitFor();
  await page.goto(`${base}/signup/recover`);
  await page.locator('[name="email"]').fill('recovery@example.test'); await page.locator('[name="password"]').fill(password);
  await page.getByRole('button', { name: 'Sign in and continue setup' }).click();
  await page.waitForURL(`${base}/account`);
  const state = await (await fetch('http://127.0.0.1:18997/test/state')).json();
  assert.equal(state.hubs.length, 2); pass('Browser recovers lost response without a duplicate hub');
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto(`${base}/account`);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); pass('Mobile account has no horizontal overflow');
  await writeFile(path.join(app, 'results.json'), JSON.stringify({ passed: report, limitations: ['Development cookie Secure=false; production flag separately tested', 'Email delivery and Stripe not contacted', 'Full hub admin UI and deployed cross-domain routing not exercised'] }, null, 2));
} finally {
  await browser?.close();
  next.kill(); log.end();
}
