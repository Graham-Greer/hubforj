# Enterprise upgrade plan — final planning audit

**Date:** 2026-09-07  
**Scope:** [Master implementation plan](product-site-enterprise-upgrade-master-plan.md), targeted current source/route/configuration/test inspection and consistency with the founder's decisions.  
**Outcome:** 16 plan-level gaps or ambiguities found and addressed in the master plan. No application code or provider settings changed. No application regression suite, authenticated production test or external assurance review was performed during this audit.

## Assessment

The prior plan covered the right outcomes, but general requirements to audit and test were insufficient protection against implementing each outcome in isolation. Important implementation contracts were missing: how current behaviour is established before each change, how separately deployed applications remain compatible, and how historical commerce survives entitlement changes.

The revised plan is a stronger execution framework, not a guarantee that no defect will occur. Each implementation slice must prove its behaviour against the current repo, and each release must supply evidence. No high-risk implementation is authorised to skip that work because the plan was reviewed.

## Findings and corrective requirements

Severity here is the potential consequence if the planning gap were left unresolved. **Addressed in plan** is not **fixed in application**. All 16 implementation controls below remain to be delivered/verified.

| ID | Severity | Gap / tradeoff | Corrective requirement in master plan | Plan re-audit |
| --- | --- | --- | --- | --- |
| PA01 | High | Stage 0 audit could be treated as permanent despite later repo changes | Mandatory per-change revision/working-tree audit, caller/dependency trace and preserve/change/defect classification; S0-10 | Addressed in plan |
| PA02 | High | Cross-app work lacked concrete compatibility and source-of-truth contract | Field/operation authority, schemas, consumer map, transition tables and staggered-release/backfill checks; S0-10, S7-13 | Addressed in plan |
| PA03 | High | Testing infrastructure deferred until Stage 7; product-site has no test script and some tests reside in sibling app | Establish a reproducible cross-app harness and behaviour/browser baseline before mutations; classify baseline failures; S0-10 | Addressed in plan |
| PA04 | High | Cancellation/grace copy could be implemented without correct effective entitlements | Separate subscription status, price tier, effective capabilities and tenant lifecycle; verify terminal states and override precedence; S3-14 | Addressed in plan |
| PA05 | High | Downgrade preservation promise conflicts with capability-dependent historical operations | Audit historical native-payment transactions, member/course/event access and refund paths; implement fulfilment-only access where appropriate; S3-14, S3-16 | Addressed in plan |
| PA06 | High | MFA/revocation could cover normal sign-in but miss handoff-created sessions | Audit every session issuer/consumer, assurance, UID/tenant-user relationships and host/token handling; S2-13 | Addressed in plan |
| PA07 | High | Introductory refund guarantee was a policy without an explicit end-to-end SaaS refund implementation task | Eligibility, status, Stripe refund, subscription end, entitlements, invoices, emails, failure/retry and guarantee-window edge cases; S3-15 | Addressed in plan |
| PA08 | High | Domain disconnection and cookie/return-link consequences under-specified | Host-mode regression matrix and package-to-domain dependency trace; verify links/session recovery on fallback domain; S3-14, S7-13 | Addressed in plan |
| PA09 | High | Export download success could conceal missing/capped/inconsistent records | Snapshot strategy, paginated/resumable export, manifest/schema/attachment counts and reconciliation; S4-18 | Addressed in plan |
| PA10 | High | Deletion durability did not explicitly define global tenant shutdown, top-level records and competing commands | Tenant lifecycle barrier, stale-work rejection, top-level data inventory, transaction/export/transfer races and domain/slug reuse; S4-19 | Addressed in plan |
| PA11 | High | Rollback was generic although refunds/deletions/DNS effects cannot be undone by code rollback | Per-side-effect compensation, rollout sequencing, feature/disable controls and recovery rehearsal; S7-13 | Addressed in plan |
| PA12 | Medium | Visual quality lacked a concrete design-system specification and acceptance work item | Public/account/legal visual specification, real browser review, responsive/interactions and accessibility together; S6-21 | Addressed in plan |
| PA13 | Medium | Measurement begins after controlled pilot; operational budgets not explicitly established before scale claims | Baseline telemetry early, workload/recovery thresholds before release, delivered-alert evidence; S0-11, S7-13 | Addressed in plan |
| PA14 | High | Legal-review gate could block development despite authorised placeholders; sole founder could be treated as imaginary review staff | Separate development-verified/launch-verified evidence; plan actual specialist/user review and capacity early; S0-11, section 4 | Addressed in plan |
| PA15 | High | Time/currency/concurrency regressions lacked a concrete cross-cutting matrix | Minor-unit/tax/timezone/DST/month-boundary cases, simultaneous quota/transfer requests and stale provider revisions; section 4 matrix/state requirements | Addressed in plan |
| PA16 | Medium | Traceability could imply plan remediation equals implemented enterprise readiness | Explicit R51 mapping, unchecked added work items, linked audit report and separate plan/implementation status | Addressed in plan |

## Repo evidence that shaped this audit

These are inspected implementation facts or boundary risks, not results of executing the flows. Follow the full call graph again when implementing.

1. **Package state and side effects.** [Commercial subscription sync](../apps/product-site/src/lib/server/commercial-billing.js) writes commercial records and calls the hub authority boundary. The [hub internal route](../apps/hub-platform/src/app/api/internal/update-package-authority/route.js) updates authority and invalidates public caches. [Hub mutations](../apps/hub-platform/src/lib/data/hub-mutations.js) can initiate custom-domain disconnection when entitlement is lost. A billing-only or UI-only patch can therefore change routing and cached public content.
2. **Effective capabilities.** [Package entitlements](../apps/hub-platform/src/lib/domain/package-entitlements.js) builds capabilities from tier, with overrides and legacy feature handling; it normalises and returns package status without itself deriving a separate grace/fulfilment state. [Package guards](../apps/hub-platform/src/lib/domain/package-guards.js) consume those capabilities. The cancellation-to-Free and grace promises require explicit transition verification; this inspection does not establish every terminal production outcome.
3. **Historical refunds.** [Event booking cancellation](../apps/hub-platform/src/lib/server/event-booking-cancellation.js) evaluates internal-payment handling using hub/event context as well as transaction data. Its full payment-mode helper chain must be checked before assuming refunds remain available after downgrade. Existing records' original payment provenance must remain usable without granting new paid-selling privileges.
4. **Session issuance outside normal sign-in.** [Owner admin handoff](../apps/hub-platform/src/lib/auth/owner-admin-handoff.js) atomically consumes a token and creates a signed hub session. [The handoff route](../apps/hub-platform/src/app/api/auth/owner-handoff/route.js) sets its cookie and redirects. MFA/assurance and revocation work must cover this path, not only Firebase sign-in forms.
5. **Host routing.** [Middleware](../apps/hub-platform/src/middleware.js) handles platform/local subdomains and custom-domain resolution. Cookie scope and generated verification, billing-return, invitation and navigation URLs require host-mode fixtures.
6. **Top-level user records.** [User queries](../apps/hub-platform/src/lib/data/user-queries.js) queries a top-level `users` collection by `hubId`; [user normalisation](../apps/hub-platform/src/lib/data/user-shared.js) distinguishes `id`, `uid` and `hubId`. Deleting only a hub document/subcollections would not establish erasure. Do not assume a new multi-hub identity model exists without inspecting creation and uniqueness rules.
7. **Export caps.** [Member directory data](../apps/hub-platform/src/lib/data/member-directory.js) limits report exports to a default 5,000 and maximum 10,000 rows. This is not automatically a defect in a report, but reusing it as a complete workspace export could silently omit data.
8. **Test placement.** [Product-site package](../apps/product-site/package.json) defines dev/build/start/lint without a test script. [Hub-platform package](../apps/hub-platform/package.json) defines a Node unit-test runner; [a product-site package-change test](../apps/hub-platform/tests/unit/product-site-package-scheduled-change-source.test.js) reads sibling-app source strings. Keep useful existing checks, but establish behavioural/integration proof for financial/security changes.
9. **Worker deployment.** [Hub Vercel configuration](../apps/hub-platform/vercel.json) declares the custom-domain cron. Other internal routes handle membership scheduling, notifications and projection reconciliation. Their existence does not prove an external scheduler is absent or present; verify actual invocation/configuration and delivered alerts before relying on retention or deletion deadlines.
10. **SaaS refunds.** A search of the product-site commercial billing module did not find a refund implementation. The new first-payment guarantee therefore needs an explicit implementation slice; it is not fulfilled by existing community booking refunds.

## Requirements to preserve existing functionality

- Use a current-state assessment for every slice, with source and test evidence. Do not treat old roadmap prose or this audit as executable truth.
- Preserve supported outcomes, including GBP SaaS billing, Free baseline provisioning, native/external community payments, admin handoff, regional setup, immediate legal save-and-accept, routing and operations.
- Fix discovered defects deliberately; do not encode accidental behaviour as a permanent compatibility requirement.
- Compare before/after results for each impacted row in the master regression matrix, including failure and concurrency cases. Update both application contracts and provider configuration together where required.
- Do not weaken coverage to make a refactor pass. Record test changes against intentional behaviour changes.
- Prefer small vertical changes over simultaneous architecture replacement. Maintain clear field ownership and local frontend boundaries without duplicating lifecycle authorities.
- Keep a release disabled until its dependent API, migration, job, email and support recovery are ready. Verify observability before enabling real usage.

## Tradeoffs that remain deliberate

- **Quality versus solo-founder capacity:** the plan requires real review, recovery and support evidence; it does not assume a large staff. Development may proceed using mock fixtures and registered business placeholders. Launch assurance cannot be fabricated to compensate for budget or availability.
- **Entitlement simplicity versus customer continuity:** a simple tier flag is easier to maintain, but existing paid obligations and historical refunds need explicit handling after downgrade. Add only the required operational state, with tests and one authoritative resolver.
- **Pilot speed versus full automation:** a properly staffed and tested manual privacy process can support a restricted pilot, while automated lifecycle requirements remain open. An unstaffed mailbox does not satisfy the gate.
- **Advanced features versus actual enterprise claims:** SSO, multi-workspace, residency and certification need scoped implementation and evidence. Sequence them deliberately; do not advertise them while deferred or call the full programme complete.
- **No regression versus intentional correction:** no plan can guarantee zero defects. Baselines, behaviour tests, bounded rollout and recovery reduce risk, while change records make deliberate policy/security corrections reviewable.

## Re-audit and remaining status

- All PA01–PA16 findings now map to explicit master-plan controls or implementation work items.
- The mandatory per-change protocol is in both readiness and completion criteria.
- New implementation work remains unchecked; no execution stage was marked complete.
- Original audit coverage, founder context, commercial recommendations and copy gates remain in scope.
- Document validation passed after remediation: 137 unique stage task IDs, 48 original audit findings, 16 plan-audit findings, valid local links and work-item references. All implementation tasks remain unchecked. Scoped `git diff --check` also passed; this is not an application test pass.

**Next action:** execute Stage 0's current-state dependency inventory and reproducible regression baseline, then deliver the first bounded implementation slice. Re-audit each affected boundary as the repo changes.

## Second repo-alignment pass — 2026-09-07

This follow-up traced lower-level helpers and persistence paths instead of relying on the first pass's interface descriptions. It confirms the architectural direction but narrows several statements about what is already implemented. These additions do not retroactively turn the earlier audit into runtime verification.

| ID | Finding / precise source alignment | Required outcome | Status |
| --- | --- | --- | --- |
| RA01 | `saveLegalDocumentForHub` in `legalRepository.js` increments a revision and merges the latest body into the current legal settings document. This path does not archive previous bodies. | S1-18 must add historical accepted snapshots and safe concurrent saves where evidence requires them. Keep immediate save-and-accept. | Plan corrected; implementation open |
| RA02 | The same save function returns early for identical rich text, before rebuilding or acknowledging the feature snapshot. | S1-18 must support fresh data-use acknowledgement without forcing meaningless text edits; test revision/acknowledgement semantics separately. | Plan corrected; implementation open |
| RA03 | `usesInternalEventPayments` explicitly requires current hub payment mode `internal` and a paid event. The booking cancellation path uses this predicate before refund eligibility/creation. | S3-16 must test native historical transactions after Growth → Starter/Free, including attendee refunds. The predicate risk is now confirmed in source; the entire runtime outcome remains untested. | Existing task made explicit; verification open |
| RA04 | Commercial sync retains price-derived tier while mapping cancelled status; the general tier resolver returns tier-derived capabilities. `resolveEffectiveCustomDomainEntitlement` separately excludes cancelled status. | S3-14 must unify intended effective outcomes without indiscriminately denying historical access. Explicitly test paid-tier/cancelled-status combinations and actual transition to Free. | Existing task made explicit; verification open |
| RA05 | `ensureCommercialAccountAuthUser` can find an existing Firebase user by UID/email, then call `updateUser` with a submitted password and `disabled: false`. Signup calls this helper after account/hub preparation. `resolveCommercialAccountFromIdToken` already verifies revocation using `verifyIdToken(..., true)` but also has email-based UID attachment. | S2-14 must verify authority for reuse/linking/retry and prevent unauthorised password replacement, re-enablement or rebinding. Test member-only existing identities and disabled users. Retain existing token verification; do not mistakenly describe all Firebase sign-in as lacking revocation checks. | High-priority boundary review specified; no exploit attempt or live test performed |
| RA06 | Hub alias loader resolves application source from `process.cwd()`. The attempted targeted test command could not execute because this shell has no `node` command. | S0-12 must establish runtime and correct test directories. Do not report passed, failed assertions or full repo readiness from an unstarted test suite. | Environment prerequisite recorded; tests unexecuted |

### Additional inspected evidence

- [Legal repository](../apps/hub-platform/src/lib/legal/legalRepository.js): latest-document storage, revision counter, unchanged-body early return and feature-snapshot metadata.
- [Legal save action](../apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/legal/actions.js): existing server mutation and revalidation of admin, terms and privacy paths.
- [Commercial auth](../apps/product-site/src/lib/auth/commercial-auth.js): identity reuse, password/disabled mutation, revoked-token verification and email-link fallback.
- [Signup action](../apps/product-site/src/app/(marketing)/signup/actions.js): account/hub preparation and identity helper invocation; duplicate-workspace check does not itself prove ownership of every existing Firebase identity.
- [Hub package resolution](../apps/hub-platform/src/lib/domain/hub-package.js), [package tiers](../apps/hub-platform/src/lib/domain/package-tiers.js), [billing status mapping](../apps/product-site/src/lib/domain/commercial-billing.js) and [hub mutations](../apps/hub-platform/src/lib/data/hub-mutations.js): status/tier and custom-domain treatment.
- [Test alias loader](../apps/hub-platform/tests/unit/alias-loader.mjs): working-directory dependency.

### Attempted verification

Attempted the existing `package-entitlements-domain.test.js`, `hub-package-contracts.test.js` and `product-site-package-scheduled-change-source.test.js` using `node --test`. Result: shell exit 127, `node: command not found`; **zero tests executed**. No dependencies were installed and no application fixtures/provider records were mutated. Once the runtime is available, execute alias-dependent checks from the hub-platform app directory using its documented loader, and establish the broader S0-10 baseline.

The plan is aligned with these inspected code paths after amendment. Production behaviour, exploitability, full regression coverage and external provider configuration are not established by this re-audit. Original PA01–PA16 requirements remain open for implementation; RA01–RA06 refine rather than replace them.
