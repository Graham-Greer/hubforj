# Isolated signup and recovery checks

Run from `apps/product-site`, with both applications' dependencies installed. Requires Node 24 (synchronous module hooks), Java 21+ and Firebase CLI 15.29.0. Install the test CLI without changing product dependencies:

```sh
npm install --prefix ../hub-platform/node_modules/.cache/enterprise-emulator-tools --no-save --package-lock=false --ignore-scripts firebase-tools@15.29.0
npm run test:integration
```

Java must be on PATH or identified by `JAVA_HOME` / `HUBFORJ_TEST_JAVA_HOME`. Use a runtime built for the same OS as Node. An alternative CLI entry point can be supplied through `HUBFORJ_TEST_FIREBASE_CLI` (absolute path to `firebase-tools/lib/bin/firebase.js`). First execution downloads the Firestore emulator; later runs can use its cache. Allow several minutes for cold dependency loading on a Windows-mounted WSL workspace.

## Safety and scope

The runner builds a fresh environment from OS variables only and supplies fixed demo-project and loopback settings. It does not load `.env.local` or forward cloud, Stripe or email credentials. It enables signup only inside the disposable test process. Tests fail before database access if the demo project or either emulator endpoint differs. App-level fetch refuses external URLs. The CLI may access the network to download tooling.

Use a dedicated run with ports 18089 (Firestore), 19099 (Auth), 18997 (internal receiver), 14409 (hub), 14509 (logging) and 9150 (Firestore websocket) available. Do not attach other applications to these emulators: signup tests clear the entire `demo-hubforj-recovery` Auth/Firestore dataset between cases. No emulator data is imported/exported, and the CLI shuts down services when tests finish. The blanket-deny rules are test-only; these Admin SDK tests do not validate deployed client rules.

Production code under test: signup action, Firebase identity creation and token verification, commercial account storage, immutable signup operations, recovery/session API handler, internal HTTP client and receiver, hub/address provisioning and real Firestore transactions. The HTTP server can deliberately discard a response after the hub commits. Disabled startup configuration runs in a separate test process because application config is captured at import time.

Explicit substitutes: Next headers/redirect and session-cookie writer, verification email delivery, Stripe price lookup and checkout creation. Checkout calls are recorded without contacting Stripe. Therefore a passing run does not prove browser form submission, real cookies, verification-link delivery, Stripe billing/webhooks or cross-domain hub handoff. Throttling is disabled inside this suite; focused unit tests exercise its denial behavior, and distributed-provider assurance remains outstanding.

Run the focused suite separately with `npm test`. Record failures, corrections, rerun counts and residual gaps in [slice 005](../../../../docs/product-site-enterprise-slice-005-recovery-integration-tests.md) and the master plan. Never use emulator success as permission to enable production signup automatically.
