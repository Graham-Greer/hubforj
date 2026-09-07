import { createServer } from 'node:http';
import { createServer as createTcpServer, connect } from 'node:net';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { getFirebaseAdminDb, projectId } from '../integration/firebase-boundary.mjs';
import { POST } from '../../../hub-platform/src/app/api/internal/provision-hub/route.js';
import { POST as provisionOwner } from '../../../hub-platform/src/app/api/internal/provision-owner-admin/route.js';
import { GET as consumeHandoff } from '../../../hub-platform/src/app/api/auth/owner-handoff/route.js';
import { backfillHubAddressClaims } from '../../../hub-platform/src/lib/data/hub-address-backfill.js';

const db = getFirebaseAdminDb();
// WSL forwards Node loopback listeners to Windows; the Java emulator listener
// is not consistently forwarded. This is a byte-for-byte local gRPC relay.
const firestoreRelay = createTcpServer(socket => {
  const upstream = connect(18089, '127.0.0.1');
  socket.pipe(upstream).pipe(socket);
  socket.on('error', () => upstream.destroy());
  upstream.on('error', () => socket.destroy());
  socket.on('close', () => upstream.destroy());
});
await new Promise(resolve => firestoreRelay.listen(18090, '127.0.0.1', resolve));
for (const url of [`http://127.0.0.1:18089/emulator/v1/projects/${projectId}/databases/(default)/documents`, `http://127.0.0.1:19099/emulator/v1/projects/${projectId}/accounts`]) {
  if (!(await fetch(url, { method: 'DELETE' })).ok) throw new Error('Could not reset dedicated demo emulators.');
}
await backfillHubAddressClaims(db, { writersStopped: true });
let dropNext = false;
const server = createServer(async (request, response) => {
  try {
    if (request.url.startsWith('/api/auth/owner-handoff?')) {
      const result = await consumeHandoff(new Request(`http://127.0.0.1:18997${request.url}`, { headers: request.headers }));
      response.writeHead(result.status, Object.fromEntries(result.headers)); response.end(await result.text()); return;
    }
    if (request.url === '/test/drop-next' && request.method === 'POST') {
      dropNext = true; response.end('{}'); return;
    }
    if (request.url === '/test/state') {
      const hubs = await db.collection('hubs').get();
      response.end(JSON.stringify({ hubs: hubs.docs.map(doc => ({ id: doc.id, slug: doc.data().slug })) })); return;
    }
    if (!['/api/internal/provision-hub', '/api/internal/provision-owner-admin'].includes(request.url)) { response.writeHead(404); response.end(); return; }
    let body = '';
    for await (const chunk of request) body += chunk;
    const handler = request.url.endsWith('provision-owner-admin') ? provisionOwner : POST;
    const result = await handler(new Request(`http://127.0.0.1:18997${request.url}`, { method: 'POST', headers: request.headers, body }));
    if (dropNext) { dropNext = false; response.destroy(); return; }
    response.writeHead(result.status, { 'content-type': 'application/json' }); response.end(await result.text());
  } catch { response.writeHead(500); response.end('{"error":"Local fixture failed"}'); }
});
await new Promise(resolve => server.listen(18997, '127.0.0.1', resolve));
const executable = process.env.HUBFORJ_BROWSER_NODE || process.execPath;
let script = path.resolve('tests/browser/journey.mjs');
if (executable.endsWith('.exe')) script = script.replace(/^\/mnt\/([a-z])\//, (_, drive) => `${drive.toUpperCase()}:/`);
try {
  const code = await new Promise((resolve, reject) => {
    const child = spawn(executable, [script], { env: process.env, stdio: 'inherit' });
    child.once('error', reject); child.once('exit', resolve);
  });
  if (code !== 0) process.exitCode = 1;
} finally { firestoreRelay.close(); await new Promise(resolve => server.close(resolve)); await db.terminate(); }

if (!process.exitCode) {
  // Reuse the running emulators for the handler/transaction regressions after
  // the browser server has released its receiver port.
  for (const url of [`http://127.0.0.1:18089/emulator/v1/projects/${projectId}/databases/(default)/documents`, `http://127.0.0.1:19099/emulator/v1/projects/${projectId}/accounts`]) {
    if (!(await fetch(url, { method: 'DELETE' })).ok) throw new Error('Could not reset test fixtures.');
  }
  const code = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['--import', './tests/integration/register.mjs', '--test', '--test-concurrency=1', 'tests/integration/disabled-gate.test.mjs', 'tests/integration/signup-recovery.test.mjs'], { env: process.env, stdio: 'inherit' });
    child.once('error', reject); child.once('exit', resolve);
  });
  if (code !== 0) process.exitCode = 1;
}
