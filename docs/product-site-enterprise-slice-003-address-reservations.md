# Slice 003 — bounded, transactional hub address reservations

Date: 2026-09-07. Status: implemented locally; 25 focused tests and targeted lint pass. Provider migration applied and independently verified; deployment and full assurance remain pending.
Parent: [master](product-site-enterprise-upgrade-master-plan.md), S2-14 provisioning recovery, DOC-01/02. Supersedes slice 002's full-scan compatibility workaround.

## Repo audit and implementation contract

Both known creation callers (platform hub-create action and internal provisioning route) use `createHub`. Repo searches found no other persisted platform-label writer, hub rename flow or seed/import script. Site settings update other fields; read normalization in `hubs.js` is not a writer. Out-of-repo administrative writes remain an operational constraint.

Replace keyed and unkeyed address checks with the same reservation transaction. Reserve normalized slug and hosted label in `hubAddressClaims/{label}`; these can differ on legacy hubs, so reserve both without renaming either route. Claim conflicts fail closed even if the referenced hub was deleted. Claims are retained across deletion/restoration; address reuse and renaming require a future audited lifecycle, never automatic expiry.

Creation must atomically commit address claims, hub, default membership plan and optional provisioning operation. Preserve custom-domain claim writes and post-commit mapping behavior for unkeyed callers; custom domains remain excluded from keyed provisioning. No full collection query in the creation transaction. Custom-domain uniqueness checks are a distinct existing contract, not replaced by hosted-address claims.

A schema marker (`platformMigrations/hubAddressClaimsV1`, version 1, status ready) gates creation. Missing/migrating/blocked markers fail closed with a temporary-unavailability response, never assume a database is empty. Existing idempotent replays may still return their hub without creating anything. This intentionally requires migration before deploying/resuming creation; it does not silently abandon legacy protection.

## Migration and release

Provide a default read-only, paginated audit and explicit apply mode. Require target project and operator acknowledgement that all old writers, seed/import jobs and direct address edits are stopped. Dry-run reports invalid addresses, reserved names, cross-hub collisions and conflicting existing claims using hub IDs/labels only. Never reset data or silently select a winner.

Apply holds a migration marker, repeats the audit, backfills each hub's canonical hosted label and claims transactionally, re-verifies coverage, then marks ready. Partial failures keep creation disabled and permit a safe rerun; a crashed active migration needs operator review before clearing its lock. Do not run against a provider in this coding slice. Deployed client rules must deny writes to hubs' address fields, claims and marker, and deny public reads of administrative records.

Deploy during a creation maintenance window: stop old writers, audit, apply/verify, deploy only reservation-aware writers, resume creation. Never roll back to an unguarded writer after cutover. Export/backup before provider mutation; preserve all mock data unless separately authorized. Deletion/erasure planning must include minimal address tombstones and operation records.

## Verification and QC

Focused checks must cover keyed replay, unkeyed versus keyed collisions, different addresses, legacy slug/label aliases, missing migration marker, abort atomicity, retained claims, and migration invalid/collision/idempotent rerun behavior. Full browser/provider/emulator/build regression remains deferred by the founder, but is a release gate. Record findings, corrections and re-audit here and in the master plan. No full enterprise-stage completion claimed.

## Operator runbook

Run from `apps/hub-platform` using Node v24.13.1 (verified locally). The existing repository alias loader resolves server imports; it does not load environment files. Supply the intended platform-root/reserved-host environment configuration consistently with the deployed app. The tool uses Application Default Credentials for the explicit project, or `FIRESTORE_EMULATOR_HOST` for an isolated emulator. Never put credential values in commands, output or this document.

```sh
# Read-only preflight: reports collisions/invalid records; does not require complete claims.
node --import ./tests/unit/register-aliases.mjs scripts/backfill-hub-address-claims.mjs --project YOUR_PROJECT_ID

# Only in the documented maintenance window, after backup and stopping every old writer.
node --import ./tests/unit/register-aliases.mjs scripts/backfill-hub-address-claims.mjs --project YOUR_PROJECT_ID --apply --writers-stopped

# Read-only coverage check after apply.
node --import ./tests/unit/register-aliases.mjs scripts/backfill-hub-address-claims.mjs --project YOUR_PROJECT_ID --verify
```

Before opening creation, confirm marker version 1/status ready, zero coverage issues and exclusive use of new writers. The verify command checks data coverage; also inspect the marker separately. The flag acknowledges an operational maintenance window; it cannot stop old processes or prevent privileged console writes. The marker gates new application writers only. No provider command above was executed during implementation.

On a reported apply failure, creation remains blocked. Resolve reported invalid/colliding addresses explicitly, then rerun apply; completed claims are preserved. If a process crashes leaving status migrating, first confirm that no migration process or old writer is active, inspect its runId and records, then have an authorized operator change that marker to blocked before rerunning. Never manually set ready or delete conflicting claims to bypass the audit. Unsupported marker versions are rejected.

Audit/backfill use pages of 200 hubs outside request transactions. Audit retains a label-to-hub map to detect cross-page collisions: memory grows with address count. Apply performs an initial audit, bounded per-hub transactions and a final coverage audit. This deliberate one-time maintenance cost replaces recurring whole-hub scans; very large migrations may need an external collision index/resumable checkpoint tool. New-hub creation reads a static migration marker and one address claim (two if slug and hosted label differ), plus the optional operation record; it never queries the hubs collection for hosted-address uniqueness.

## QC, corrective updates and evidence

| Finding | Corrective update | Re-audit evidence |
| --- | --- | --- |
| Slice 002 scanned every hub inside a transaction | Direct address claim reads and creates in both keyed/unkeyed paths | Test with 1,000 unrelated hubs records exactly two unkeyed transaction reads |
| Unkeyed preflight followed by batch allowed concurrent duplicate addresses | Shared claim/hub/plan transaction | Keyed/unkeyed collision and different-address tests pass |
| Removing fallback before migration could miss legacy addresses | Required ready marker; paginated audit/backfill; reserve both legacy routing aliases | Missing marker blocks; legacy aliases, collisions, 205-hub pagination and coverage verified offline |
| Partial migration or crash could permit incomplete coverage | Migration ownership marker, blocked-on-failure and post-apply verification | Injected second-hub commit failure leaves creation blocked; rerun preserves completed claims |
| Existing unit fixture used reserved `community` address | Use non-reserved `northshore`; retain production reserved-name enforcement | Initial 9 failures corrected; final selection passes |
| CLI normal stdout triggered repo no-console warning | Use stdout stream for machine-readable report | Targeted lint passes with no warnings |
| Changing batch structure might omit default plan/domain behavior | Execute actual createHub module and normalizers with simulated provider boundaries | Default plan, keyed replay, abort and Growth custom-domain claim/post-commit mapping tests pass |

Final test command from `apps/hub-platform`:

```sh
node --experimental-vm-modules --import ./tests/unit/register-aliases.mjs --test tests/unit/hub-provisioning-operations.test.js tests/unit/hub-address-backfill.test.js tests/unit/hub-address-creation.test.js tests/unit/hub-package-mutations.test.js
```

Result: **25/25 pass**. Targeted ESLint passed for changed implementation, CLI and tests. Tests use an atomic serialized in-memory Firestore boundary and VM-loaded createHub; they do not prove real Firestore concurrency, IAM/rules, deployed configuration, CLI provider authentication or browser behavior. Full provider/emulator/build/regression pass remains deferred, including the prior unrelated marketing-source baseline failure. Local source review confirms the two creation callers still use createHub and both hosted-address whole-collection scans are removed.

Residual scope: custom-domain preflight uniqueness and external mapping recovery retain their previous limitations; this hosted-address fix does not claim to solve those separate races. Public signup remains unkeyed and full authenticated recovery remains outstanding. No live data, schema marker or existing hub was changed by this implementation session. No automatic claim release, TTL, hub rename or deletion was introduced.

## Provider preflight follow-up

Both app configurations target `community-app-c2f67`; no local emulator is configured. A read-only audit using the existing hub-platform credentials returned 7 hubs, 7 unique addresses and zero issues. The migration marker is absent. Credentials were not printed and no provider writes were performed. Apply remains pending confirmation that all old address writers are stopped, pre-migration backup and the documented access-control/rollout checks. This provider preflight does not establish real transaction contention or full migration verification.

A read-only address snapshot was captured at `2026-09-07T19:28:43.429Z` and saved to `/tmp/hubforj-address-backfill-before-2026-09-07.json`. It contains the seven hubs' slug/hosted-label fields, zero claims and absent marker; one hub lacks `platformSubdomainLabel`. This is a temporary, scoped rollback snapshot, not a full database backup; preserve/refresh it before apply. Expected mutation is seven claims, one hosted-label backfill and migration marker transitions. Writer shutdown confirmation remains pending; no provider writes performed.

## Provider backfill completed — supersedes pending preflight status above

Founder explicitly confirmed all writers stopped. The refreshed preflight at `2026-09-07T19:32:44.877Z` found seven hubs/addresses, no issues, no claims and no marker. Scoped address snapshots are `/tmp/hubforj-address-backfill-confirmed-before-2026-09-07.json` and `/tmp/hubforj-address-backfill-after-2026-09-07.json`; these temporary files contain only migration-related records, not a full database backup.

Applied the existing `backfillHubAddressClaims` helper using the configured hub-platform service-account credential, loaded through Node's explicit `--env-file=.env.local` option. No credential values were printed. Project was asserted as `community-app-c2f67` with no emulator; apply additionally required the expected seven-hub preflight and absent marker. No provider configuration or application code changed during this operation.

- Run ID: `c5d858be-3eb5-4911-b038-f09f0d3595d6`.
- Started: `2026-09-07T19:33:19.492Z`; completed: `2026-09-07T19:33:21.005Z`.
- Created seven claims; filled `platformSubdomainLabel: teststarterhub` on `hub_7343cc18-10f`; marker reached version 1/status ready.
- Separate read-only provider verification at `2026-09-07T19:33:48.510Z`: seven hubs, seven claims, zero coverage issues. Compared all hub IDs, slugs and pre-existing labels with the refreshed snapshot; all preserved.
- No customer hub creation, deletion, billing action or deployment was performed. This verifies actual provider migration and read-back, not emulator contention, injected provider failures, IAM/rules or browser smoke tests.

Keep old writers stopped until only reservation-aware code can create hubs. Next rollout action is deployment/access-control verification and signup/platform-admin smoke testing. Full stage completion remains open. Earlier statements that no migration had run describe prior sessions and are superseded by this dated result.
