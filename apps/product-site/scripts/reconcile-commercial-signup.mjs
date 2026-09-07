import { registerHooks } from 'node:module';
import { readFile } from 'node:fs/promises';

const args = process.argv.slice(2);
if (!args[0] || args.slice(1).some(arg => arg !== '--apply')) throw new Error('Usage: node --env-file=.env.local scripts/reconcile-commercial-signup.mjs input.json [--apply]');
registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier === 'server-only') return { url: 'data:text/javascript,export {};', shortCircuit: true };
  if (specifier.startsWith('@/')) return nextResolve(new URL(`../src/${specifier.slice(2)}.js`, import.meta.url).href, context);
  return nextResolve(specifier, context);
} });
const input = JSON.parse(await readFile(args[0], 'utf8'));
const { reconcileCommercialSignup } = await import('../src/lib/server/commercial-signup-reconciliation.js');
const { getFirebaseAdminDb } = await import('../src/lib/firebase/admin.js');
try {
  const result = await reconcileCommercialSignup({ accountId: input.accountId, authUid: input.authUid, payload: input.payload, tier: input.tier, currency: input.currency, apply: args.includes('--apply') });
  process.stdout.write(`${JSON.stringify(result)}\n`);
} finally { await getFirebaseAdminDb().terminate(); }
