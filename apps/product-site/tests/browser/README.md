# Bounded account-journey checks

Run from `apps/product-site`. Install the isolated CLI/runtime prerequisites in [integration setup](../integration/README.md), plus `playwright-core@1.58.2` under `node_modules/.cache/enterprise-browser-tools` with `npm install --prefix node_modules/.cache/enterprise-browser-tools --no-save --package-lock=false --ignore-scripts playwright-core@1.58.2`.

For the current WSL/Windows setup, run the integration launcher with native Linux Node/Java and explicitly select Windows Node for Next/Edge:

```sh
HUBFORJ_TEST_JAVA_HOME=/path/to/linux-java-21 \
HUBFORJ_BROWSER_NODE='/mnt/c/Program Files/nodejs/node.exe' \
node tests/integration/run.mjs --browser
```

The browser executable defaults to installed Windows Edge. The harness creates `.browser-test/app` with its own ignore file and dependency junction. It copies current application source, **no environment files**, and replaces only the Firebase adapters and email transport in that generated copy. It runs actual Next pages/actions/session cookies and actual Firebase SDKs. A loopback TCP relay at 18090 passes Firestore traffic to the emulator at 18089 because Windows did not reach the Java listener directly in this environment. No database calls are mocked by this relay. Ports 13007, 18090 and the integration ports must be free.

The internal receiver executes actual hub provisioning, owner activation and one-time handoff handlers. The browser checks the owner cookie and destination, not the entire hub admin interface or deployed cross-domain routing. Both app trees share one Firebase Admin package inside this test process to avoid mismatched Timestamp classes. The browser fixture sends no real email/payment requests and blocks external browser requests. After a successful browser run, the same emulators run the handler/transaction regression suite; all fixtures are disposable.

Results and logs go in ignored `.browser-test/app`. The runner closes Next, Edge, local receiver and relay; the CLI stops emulators. Run one instance at a time. The full deployment config must still be checked separately. Secure cookies are checked by production-mode focused tests; this browser run uses local development HTTP.

## Explicit real-email check

`provider-email-check.mjs` is **not** run by the normal suite. Only after explicit authorization of both provider credentials and recipient, with the dedicated emulators already running, use:

```sh
node --experimental-vm-modules tests/browser/provider-email-check.mjs authorized-recipient@example.com --send
```

This reads the local Resend key/sender, sends two real emails through the actual production email module and applies their action codes against a newly created **demo-emulator-only** identity. It refuses an existing identity in that demo dataset; it never modifies a real Firebase account. It removes its fixture identity/account afterwards and prints only message IDs/results. The sent links use the local app origin and are consumed by the test; do not represent them as live customer links. The account sent-at write is a direct emulator fixture update in this module-level check. Actual email templates, Firebase action-link generation, Resend transport and Auth actions are exercised. Record recipient confirmation separately; API acceptance alone is not proof of inbox delivery.
