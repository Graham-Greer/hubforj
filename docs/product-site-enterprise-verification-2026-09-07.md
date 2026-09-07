# Enterprise verification evidence — 2026-09-07

Scope: slice 004 signup recovery and cross-app regression baseline. Reviewer: Codex self-review; no independent certification or launch sign-off.

## Full hub-platform unit comparison

Isolated tracked-HEAD baseline copied without environment files into an ignored dependency-cache directory. Restored supporting docs/config files required by the tests; an initial incomplete snapshot produced six missing-fixture failures which were excluded only after restoring those fixtures and rerunning.

- Baseline: {"tests":554,"failed":27,"passed":521,"cancelled":0,"skipped":0,"todo":6,"topLevel":554,"suites":0}.
- Current: {"tests":577,"failed":27,"passed":544,"cancelled":0,"skipped":0,"todo":6,"topLevel":577,"suites":0}.
- The same 27 named failures occur in both; no additional failure names remain after correcting the two changed-boundary source assertions. Six TODO cases remain non-passing assurance work. Added address-reservation tests account for the 23 additional passes.
- Initial current run had 29 failures. Corrected the membership-plan source assertion to recognize the atomic provisioning commit and the signup rate-limit assertion to recognize the recovery runner. Behavioral tests continue to cover these boundaries. No unrelated assertions were removed or weakened.

The failures below remain unresolved; baseline classification does not make them acceptable for launch. Triage behavioral defects versus outdated assertions, implement corrections, and rerun before accepting the affected stage.

| Evidence ID | Existing failing test | Test file | Status |
| --- | --- | --- | --- |
| BASE-01 | hub admin invite links use tenant hostnames with the configured production protocol | admin-invite-links.test.js | Reproduced at HEAD; remediation open |
| BASE-02 | member detail activity section consolidates event and course history and hides free-payment noise | admin-member-detail-ux.test.js | Reproduced at HEAD; remediation open |
| BASE-03 | members page loads the lightweight operational signals for triage | admin-members-workspace-ux.test.js | Reproduced at HEAD; remediation open |
| BASE-04 | admin offering detail workspaces use the shared summary panel pattern | admin-offering-detail-ux.test.js | Reproduced at HEAD; remediation open |
| BASE-05 | event and course admin list pages use the shared offering admin list workspace | admin-offering-list-ux.test.js | Reproduced at HEAD; remediation open |
| BASE-06 | admin overview page uses a flatter page-header layout without the legacy lead copy | admin-overview-ux.test.js | Reproduced at HEAD; remediation open |
| BASE-07 | admin overview data groups recurring events into recent-event rows with series registration totals | admin-overview-ux.test.js | Reproduced at HEAD; remediation open |
| BASE-08 | event admin detail and attendance export use attendee-based booking operations | admin-registration-workspace-ux.test.js | Reproduced at HEAD; remediation open |
| BASE-09 | custom-domain tools use a task segmented control instead of constant panels | custom-domain-account-settings-ux-source.test.js | Reproduced at HEAD; remediation open |
| BASE-10 | custom-domain account styles keep admin typography and surface hierarchy tokenized | custom-domain-account-settings-ux-source.test.js | Reproduced at HEAD; remediation open |
| BASE-11 | hub admin overview attention sources include incomplete Stripe setup for Growth hubs | hub-admin-attention-source.test.js | Reproduced at HEAD; remediation open |
| BASE-12 | payment setup workspace exposes create, refresh, and embedded onboarding states | hub-payments-setup-route.test.js | Reproduced at HEAD; remediation open |
| BASE-13 | normalizeHubCustomDomain keeps hosted hubs on the tenant subdomain | hubs-domain.test.js | Reproduced at HEAD; remediation open |
| BASE-14 | owner-admin automation payload normalizes the owner activation request | internal-automation-owner-admin.test.js | Reproduced at HEAD; remediation open |
| BASE-15 | normalizeProvisionHubAutomationRequestBody trims and preserves provisioning fields | internal-automation-provisioning.test.js | Reproduced at HEAD; remediation open |
| BASE-16 | member join page and form default redirects stay on the public site | member-join-membership-contracts.test.js | Reproduced at HEAD; remediation open |
| BASE-17 | admin payments page source loads pending membership upgrade requests into the plans workspace | membership-upgrade-admin-queue.test.js | Reproduced at HEAD; remediation open |
| BASE-18 | hub payments workspace source applies shared pagination controls to the filtered payment queue | membership-upgrade-admin-queue.test.js | Reproduced at HEAD; remediation open |
| BASE-19 | event booking action redirects to the event next-steps page | offering-next-steps-routing.test.js | Reproduced at HEAD; remediation open |
| BASE-20 | course enrolment action redirects to the course next-steps page | offering-next-steps-routing.test.js | Reproduced at HEAD; remediation open |
| BASE-21 | product-site marketing chrome avoids mixed anonymous navigation for signed-in users | product-site-auth-routing-source.test.js | Reproduced at HEAD; remediation open |
| BASE-22 | product-site commercial display models stay on en-GB instead of inheriting hub locale | product-site-regional-checkout-source.test.js | Reproduced at HEAD; remediation open |
| BASE-23 | hub admin routes and Stripe setup are gated behind regional onboarding | regional-setup-onboarding-source.test.js | Reproduced at HEAD; remediation open |
| BASE-24 | site settings overview keeps only site configuration panels with task-specific actions | settings-overview-ux.test.js | Reproduced at HEAD; remediation open |
| BASE-25 | branding settings fall back for unsupported theme and template values but reject invalid brand colors | site-settings-domain.test.js | Reproduced at HEAD; remediation open |
| BASE-26 | what we do admin list source uses a compact menu for edit and delete actions | what-we-do-admin-list.test.js | Reproduced at HEAD; remediation open |
| BASE-27 | what we do edit form source includes a dirty-aware cancel action back to the list | what-we-do-edit-form.test.js | Reproduced at HEAD; remediation open |

Reproduce from each hub-platform checkout:

```sh
node --experimental-vm-modules --import ./tests/unit/register-aliases.mjs --test --test-reporter=./tests/helpers/concise-reporter.mjs tests/unit/*.test.js
```

## Product-site checks

- 45 focused tests pass: identity invariants, fresh Free/Starter/Growth orchestration, immutable operation binding, ownership finalization/abort, same-key retries, recent-auth rejection, safe redirects, disable controls and password redaction.
- Full source/test lint: 87 files at the recorded run, zero errors, one existing no-console warning in Stripe webhook route (console.info). Final changed-file lint also passed after the additional tests and stored-operation integrity guard.
- Production compilation passed with webpack. Full production build also passed (19 static-generation entries) with provider credentials explicitly disabled. The last stored-operation integrity guard was verified afterward by focused tests.
- Local Edge rendering checks: explicit mobile 390×844 and desktop 1440×1100, recovery heading/fields/actions present; measured document widths 390 and 1425 respectively, with no overflow. Initial window-size-only screenshot cropped content because viewport emulation was not explicit; CDP viewport checks replaced that unreliable visual setup.
- Local disabled recovery POST returned 503 before provider authentication. No real signup, checkout, email or provider mutation performed for these checks.

## Required next assurance

Slice 005 now supplies actual isolated Auth/Firestore and receiver evidence: **13 integration tests pass**, including lost response, concurrent transactions, disabled identity, ownership conflicts and disabled acquisition with ordinary sign-in. Updated product auth/server suite: **47 pass**. Two ownership regressions failed before correction and pass after correction; see [full slice evidence and boundaries](product-site-enterprise-slice-005-recovery-integration-tests.md). This supersedes the earlier absence of emulator evidence, not the historical build/browser results or hub baseline failure list.

Real browser/session-cookie behavior, revoked-identity integration, cross-app handoff, paid checkout continuation, email delivery, deployed access controls, distributed limiter behavior and reservation-aware deployment still require evidence. New signup/recovery provisioning stays disabled by default until these gates are met. No actual customer credentials or provider secrets are stored here.

## Bounded closure update

Final bounded closure: 52 focused tests; 12 actual Next/Edge browser checks; 14 emulator integrations; 23 hub dependency tests; related cross-app source selection 22 passes/six pre-existing TODOs; no failures in these executed selections. Production-copy build passes; lint zero errors/one existing webhook warning. Both actual verification/reset emails confirmed in the authorized inbox, with emulator actions applied. Historical 27 full-hub failures are not silently cleared by these targeted passes. See [final handover](product-site-closure-handoff.md) for exact boundaries and deployment prerequisites.
