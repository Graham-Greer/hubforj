import { registerHooks } from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const framework = new URL('./framework-boundary.mjs', import.meta.url).href;
const firebase = new URL('./firebase-boundary.mjs', import.meta.url).href;
registerHooks({ resolve(specifier, context, nextResolve) {
  // Both app trees share one emulator Admin instance in this harness. Resolve
  // Admin types from that same installation (not two incompatible Timestamps).
  if (specifier.startsWith('firebase-admin/')) return nextResolve(specifier, { ...context, parentURL: new URL('../../src/lib/firebase/admin.js', import.meta.url).href });
  if (specifier === 'server-only') return { url: 'data:text/javascript,export {};', shortCircuit: true };
  if (['next/headers', 'next/navigation'].includes(specifier)) return { url: framework, shortCircuit: true };
  if (['next/server', 'next/cache'].includes(specifier)) return nextResolve(`${specifier}.js`, context);
  if (specifier.startsWith('@/')) {
    const match = context.parentURL?.match(/^(.*\/apps\/(?:product-site|hub-platform)\/)src\//);
    if (!match) throw new Error(`No app root for ${specifier}`);
    let url = new URL(`src/${specifier.slice(2)}`, match[1]).href;
    if (existsSync(fileURLToPath(`${url}.js`))) url += '.js';
    if (url.endsWith('/lib/firebase/admin.js')) return { url: firebase, shortCircuit: true };
    if (url.includes('/product-site/') && ['/lib/server/stripe.js', '/lib/server/commercial-billing.js', '/lib/server/commercial-account-email.js', '/lib/server/account-session.js'].some(suffix => url.endsWith(suffix))) return { url: framework, shortCircuit: true };
    return nextResolve(url, context);
  }
  return nextResolve(specifier, context);
} });
// Limit app-level HTTP to this machine. Firebase Admin SDK uses the asserted emulator endpoints.
const originalFetch = globalThis.fetch;
globalThis.fetch = (input, options) => {
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
  if (url.hostname !== '127.0.0.1' || url.protocol !== 'http:') throw new Error('External HTTP is forbidden in recovery integration tests.');
  return originalFetch(input, options);
};
