# Slice 002 — durable internal hub provisioning idempotency

Date: 2026-09-07. Owner: founder. Engineering and QC: Codex self-review.
Status: implemented locally; focused checks passed; full verification deferred. Not deployed. Parent: [master plan](product-site-enterprise-upgrade-master-plan.md), DOC-02 and S2-14 signup recovery.

Follow-up: [slice 003](product-site-enterprise-slice-003-address-reservations.md) supersedes the legacy address scan and unkeyed uniqueness limitation described below. Historical slice-002 evidence is retained. Current creation requires migrated address claims and a ready schema marker; provider migration is pending.

## Repo assessment and boundary

Signup currently creates the commercial account, hub, ownership and Firebase identity in separate steps. `createHub` performs uniqueness reads followed by a batch containing the hub, default membership plan and optional domain claim. A lost response cannot safely be retried. Neither email nor slug is proof of ownership. Slice 001 identity guards must remain intact.

This slice adds an opt-in idempotency contract to the authenticated internal provisioning endpoint and its server client. It does not enable anonymous form resumption or automatic network retries. Those require a durable signup operation bound to an authenticated identity or a verified recovery credential. Existing callers without a key retain their contract. This is a recovery foundation, not completion of resumable signup.

## Acceptance contract

- Only an authorized internal request can use an idempotency key. Validate key length/characters and scope the stored key digest to the actor; never use email or slug as the key.
- Bind each key to the canonical normalized provisioning payload. Reject changed payloads with conflict; never return a different hub based only on matching email/slug.
- Commit operation, hub and default membership plan in one Firestore transaction. Concurrent uses of one key converge on one hub; aborted transactions publish no partial operation. Read slug/subdomain conflicts inside the transaction.
- Return the existing hub on replay. Missing referenced hubs fail closed without recreating deleted data. Version the persisted operation contract.
- Keyed provisioning excludes custom domains until external mapping recovery is specified. Preserve the existing unkeyed domain provisioning path.
- The server client accepts an optional caller-supplied operation key and requires the endpoint to acknowledge the protocol. Do not enable signup retries against an older receiver that ignores keys.
- No credentials, raw operation keys or full payloads are stored in the operation record. No existing-data migration, package change, ownership change or live provider action.

## Deployment, QC and outstanding work

Deploy the hub receiver before enabling a keyed caller. Keep operation records until an explicit retention/deletion policy is implemented; deleting them removes the replay guarantee. Roll back callers before receivers. Mixed receiver versions must not receive keyed recovery traffic. Automated expiry is out of scope.

Run focused offline behavioural checks and scoped lint/diff review. Full browser, emulator contention, provider, build and cross-app regression testing is deferred at the user's request and remains a release gate. Audit findings must be corrected and re-audited before this slice is represented as locally verified.

Follow-up: specify durable signup states, identity/credential binding, ownership attachment, abandoned operation reconciliation, checkout recovery, deletion integration and customer-facing recovery copy before wiring this into signup. Manual/unkeyed hub creation retains its existing uniqueness race; a universal slug reservation design remains outstanding.

## Implementation and QC evidence

Changed files: hub-platform `hub-provisioning-operations.js`, `hub-mutations.js`, internal `provision-hub/route.js`; product-site server `provision-hub.js`; focused tests in both apps. The endpoint accepts an optional `Idempotency-Key` header, reports `provisioningProtocol: idempotency-v1` on keyed success, and returns 400/409/410 for operation validation/conflict/missing-hub failures. Unkeyed response shape remains unchanged. No public signup caller supplies a key yet.

Persisted collection: `hubProvisioningOperations/{sha256([actorId,key])}` with `version`, `fingerprint`, `hubId`, `createdAt`. Fingerprints cover canonical normalized provisioning input, including regional/package defaults. Future normalization changes need compatibility review; version mismatch fails closed. A key is an internal deduplication handle, not an end-user authorization credential. Replay returns the current hub state and performs no ownership/session mutation.

| Finding / tradeoff | Correction or required follow-up | Re-audit result |
| --- | --- | --- |
| Pre-transaction uniqueness checks could reject a concurrent same-key replay | Keyed creation checks replay and address conflicts inside the atomic write transaction | Offline serialized contention model converges to one hub and one plan |
| Custom-domain mapping occurs after the original batch | Reject domains for keyed calls; retain unkeyed domain behavior | Rejection covered by focused test; real domain regression deferred |
| Legacy hubs may lack a normalized subdomain label | Preserve the legacy normalized fallback in transaction reads | Source review passed; whole-hub scan adds cost/contention and requires future backfill/reservation design |
| Older receivers ignore unknown headers | Require protocol acknowledgement in keyed client; do not retry automatically | Old-receiver and unkeyed compatibility tests pass; acknowledgement failure cannot undo a hub already created on an older receiver |
| Partial commits, changed inputs and deleted targets | Atomic operation/hub/plan writes, fingerprint binding, fail-closed replay | Focused abort/retry, conflict and missing-hub cases pass |
| First test invocation lacked repository alias loader | Re-run with existing `register-aliases.mjs` | Hub selection 9/9 passed |
| New operation collection access controls are not defined in checked-in rules | `firebase.json` references indexes only; verify deployed rules deny client reads/writes before enabling keyed traffic | Deployment prerequisite remains open; no claim of deployed rules assurance |

Verification commands (Node v24.13.1, Windows runtime from WSL):

```sh
# apps/hub-platform
node --import ./tests/unit/register-aliases.mjs --test tests/unit/hub-provisioning-operations.test.js tests/unit/hub-package-mutations.test.js
# apps/product-site
node --experimental-vm-modules --test tests/server/provision-hub.test.js tests/auth/commercial-identity.test.js
```

Results: hub 9/9; product-site 24/24; targeted ESLint on all changed JavaScript/test files passed. The hub tests exercise production operation helpers against an atomic in-memory transaction boundary. They do not prove Firestore query locking or whole-application integration. Client tests execute the actual server client with simulated HTTP responses. Full receiver/createHub integration, browser, emulator contention, provider, build and broad regression checks remain queued for the later full test pass requested by the founder. Earlier unrelated baseline failure remains open.

No launch/stage completion is claimed. Remaining signup workflow is unchanged: an anonymous form retry can still leave an orphan or be blocked after partial provisioning. The next slice must establish trusted resumable signup state before adopting this optional transport contract. This slice exposes no new customer copy or commercial promises.
