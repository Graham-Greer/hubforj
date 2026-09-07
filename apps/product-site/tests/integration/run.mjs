import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

const cache = path.resolve('../hub-platform/node_modules/.cache');
const cli = process.env.HUBFORJ_TEST_FIREBASE_CLI || path.join(cache, 'enterprise-emulator-tools/node_modules/firebase-tools/lib/bin/firebase.js');
const javaRoot = path.join(cache, 'enterprise-java');
const portableJava = process.platform === 'win32' && existsSync(javaRoot) ? readdirSync(javaRoot).find(name => name.startsWith('jdk-')) : '';
const javaHome = process.env.HUBFORJ_TEST_JAVA_HOME || process.env.JAVA_HOME || (portableJava ? path.join(javaRoot, portableJava) : '');
if (!existsSync(cli)) throw new Error('Install the isolated Firebase CLI described in the integration README first.');
const osVariables = new Set(['path', 'systemroot', 'windir', 'temp', 'tmp', 'comspec', 'pathext', 'userprofile', 'appdata', 'localappdata', 'systemdrive', 'number_of_processors', 'processor_architecture']);
const env = Object.fromEntries(Object.entries(process.env).filter(([name]) => osVariables.has(name.toLowerCase())));
const pathKey = Object.keys(env).find(name => name.toLowerCase() === 'path') || 'PATH';
if (javaHome) {
  env.JAVA_HOME = javaHome;
  env[pathKey] = `${path.join(javaHome, 'bin')}${path.delimiter}${env[pathKey] || ''}`;
}
Object.assign(env, {
  GCLOUD_PROJECT: 'demo-hubforj-recovery',
  FIRESTORE_EMULATOR_HOST: '127.0.0.1:18089',
  FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:19099',
  HUB_PLATFORM_BASE_URL: 'http://127.0.0.1:18997',
  INTERNAL_AUTOMATION_SECRET: 'integration-only-not-a-production-secret',
  SESSION_HMAC_SECRET: 'integration-only-hub-session-secret',
  HUB_PLATFORM_PUBLIC_CACHE_DISABLED: 'true',
  PRODUCT_SITE_SIGNUP_PROVISIONING_ENABLED: 'true',
  PRODUCT_SITE_ABUSE_RATE_LIMIT_PROVIDER: 'disabled',
  NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN: 'hubforj.test',
  FIREBASE_CLI_DISABLE_UPDATE_CHECK: 'true', CI: 'true',
});
const browserMode = process.argv.includes('--browser');
if (browserMode) {
  for (const name of ['HUBFORJ_BROWSER_NODE', 'HUBFORJ_BROWSER_EXECUTABLE']) {
    if (process.env[name]) env[name] = process.env[name];
  }
}
const command = browserMode
  ? `"${process.execPath}" --import ./tests/integration/register.mjs ./tests/browser/service.mjs`
  : `"${process.execPath}" --import ./tests/integration/register.mjs --test --test-concurrency=1 tests/integration/*.test.mjs`;
const child = spawn(process.execPath, [cli, 'emulators:exec', '--config', 'tests/integration/firebase.json', '--project', env.GCLOUD_PROJECT, '--only', 'auth,firestore', command], { env, stdio: 'inherit' });
child.on('error', error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
