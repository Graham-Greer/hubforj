// Explicit opt-in: real email transport, disposable emulator identity only.
import { readFile, writeFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';
import { randomUUID } from 'node:crypto';
import { SourceTextModule, SyntheticModule, createContext } from 'node:vm';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { Resend } from 'resend';

const recipient = process.argv[2];
if (process.argv[3] !== '--send' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient || '')) throw new Error('Supply an authorized recipient and --send. Sends two real emails; never run unattended.');
const settings = parseEnv(await readFile(new URL('../../.env.local', import.meta.url), 'utf8'));
if (!settings.RESEND_API_KEY || !settings.RESEND_FROM_EMAIL) throw new Error('Email transport configuration is required.');
process.env.GCLOUD_PROJECT = 'demo-hubforj-recovery';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:19099';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:18089';
const app = initializeApp({ projectId: 'demo-hubforj-recovery' }, 'delivery-check');
const auth = getAuth(app); const db = getFirestore(app);
const password = randomUUID(); const newPassword = randomUUID();
let user;
const accountRef = db.collection('commercialAccounts').doc(`acct_delivery_${randomUUID()}`);
try {
  // createUser refuses an existing identity even in the disposable emulator dataset.
  user = await auth.createUser({ email: recipient, password });
  const account = { id: accountRef.id, ownerEmail: recipient, ownerFullName: 'Hubforj delivery test', authUid: user.uid, status: 'active' };
  await accountRef.create(account);
  const context = createContext({ URL, Date });
  const subject = new SourceTextModule(await readFile(new URL('../../src/lib/server/commercial-account-email.js', import.meta.url), 'utf8'), { context });
  const dependencies = {
    'server-only': {}, 'firebase-admin/auth': { getAuth }, resend: { Resend },
    '@/lib/config/env': { getServerEnv: () => ({ resendApiKey: settings.RESEND_API_KEY, resendFromEmail: settings.RESEND_FROM_EMAIL, productSiteBaseUrl: 'http://127.0.0.1:13007' }) },
    '@/lib/firebase/admin': { getFirebaseAdminApp: () => app },
    '@/lib/data/commercial-accounts': { markCommercialAccountVerificationEmailSent: async (id, at) => { if (id !== accountRef.id) throw new Error('Wrong fixture account'); await accountRef.update({ verificationEmailSentAt: at }); } },
  };
  await subject.link(name => new SyntheticModule(Object.keys(dependencies[name]), function () { for (const [key, value] of Object.entries(dependencies[name])) this.setExport(key, value); }, { context }));
  await subject.evaluate();
  const verification = await subject.namespace.sendCommercialAccountVerificationEmail({ account, communityName: 'Hubforj delivery test' });
  const codes = async type => {
    const response = await fetch('http://127.0.0.1:19099/emulator/v1/projects/demo-hubforj-recovery/oobCodes');
    const data = await response.json(); return data.oobCodes.find(code => code.email === recipient && code.requestType === type)?.oobCode;
  };
  const request = async (method, body) => {
    const response = await fetch(`http://127.0.0.1:19099/identitytoolkit.googleapis.com/v1/accounts:${method}?key=demo-api-key`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    return response.ok;
  };
  if (!(await request('update', { oobCode: await codes('VERIFY_EMAIL') })) || !(await auth.getUser(user.uid)).emailVerified) throw new Error('Verification action failed.');
  const reset = await subject.namespace.sendCommercialAccountPasswordResetEmail({ email: recipient });
  if (!(await request('resetPassword', { oobCode: await codes('PASSWORD_RESET'), newPassword }))) throw new Error('Reset action failed.');
  if (await request('signInWithPassword', { email: recipient, password, returnSecureToken: true })) throw new Error('Old password still works.');
  if (!(await request('signInWithPassword', { email: recipient, password: newPassword, returnSecureToken: true }))) throw new Error('New password failed.');
  const evidence = { verificationEmailId: verification.emailId, resetEmailId: reset.emailId, providerAcceptedBoth: true, emulatorVerificationApplied: true, emulatorPasswordResetApplied: true, oldPasswordRejected: true, newPasswordAccepted: true, realIdentityChanged: false };
  await writeFile(new URL('../../.browser-test/email-results.json', import.meta.url), JSON.stringify(evidence, null, 2));
  process.stdout.write(`${JSON.stringify(evidence)}\n`);
} finally {
  if (user) { await auth.deleteUser(user.uid); await accountRef.delete(); }
  await db.terminate();
}
