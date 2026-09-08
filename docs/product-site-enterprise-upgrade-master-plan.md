# Hubforj Product Site Enterprise Upgrade — Master Implementation Plan

## 1. Purpose and authority

**Created:** 2026-09-07  
**Status:** Bounded account-access implementation locally verified and committed as `615000d`; production rollout checks pending. Wider enterprise programme paused at the agreed stopping point.

Rollout update: founder reports push and Vercel deployment, but live `/signup/recover` returns 404 on both public domain variants. Verify deployed revision/environment/domain assignment before enabling signup; details are in the [release record](product-site-enterprise-release-and-operations-record.md).

Hub rollout correction: founder-supplied runtime log exposed HTML being parsed as JSON in custom-domain middleware. Local response validation, redirect blocking and bounded error handling implemented; 15 focused regression checks pass. Commit/redeployment and hosted verification remain pending; the wider programme remains paused.

Follow-up: HEAD is now `67d46a9`; founder reports the new hub deployment loads successfully after the correction. Independent access remains Vercel-login protected. Public product-site recovery still returns 404; product-site deployment association is the next unresolved rollout check. Wider programme remains paused.

Latest follow-up: founder identifies the product-site deployment as Preview and confirms its recovery page loads. The production-domain 404 does not demonstrate a preview regression. Next verify Preview cross-app URL configuration and protected receiver access before testing account creation; retain the disabled signup gate.
**Scope:** `apps/product-site`, dependent controls in `apps/hub-platform`, production operations, commercial policy, legal documentation, customer experience and go-to-market execution.  
**Objective:** Upgrade Hubforj's public product site and the complete client lifecycle to an evidenced enterprise standard.

This is the working record for the audit, subsequent brainstorming, decisions, implementation, quality-control findings and remediation. Every finding from the 2026-09-07 audit is accounted for in the coverage register below. New findings must be added rather than held only in conversation.

Enterprise standard means demonstrable security, privacy, accessibility, reliable billing, customer control, recoverability, maintainability, supportability and truthful commercial promises. A polished interface, passing build or published policy is not sufficient evidence.

The user requires staged strategic implementation and a mandatory cycle of implementation, assessment for gaps and tradeoffs, quality-control audit, corrective updates and re-audit. These requirements apply to every stage and release.

Creating this document does not mark its proposed policies as decided, certify compliance or establish production readiness. Legal, financial, service-level and market decisions remain recorded decisions with named accountable owners. Do not claim capabilities or certifications before evidence exists.

### Confirmed founder context — 2026-09-07

- The user is Hubforj's sole developer and entrepreneur. There is no existing team, committed support staffing or established operating budget.
- Hubforj is in development. All current hubs, clients and data are mock; there are no existing customer contracts to preserve or renegotiate.
- Hubforj has not been incorporated as a company. The future contracting identity, tax status and business operating details remain undecided. Do not invent a company name with a legal suffix, registration number, VAT status or address.
- The user authorises clearly labelled `[Placeholder content]` for undecided business facts during development, and requests researched commercial recommendations from Codex.
- These facts supersede earlier assumptions that legacy customer commitments might currently need investigation. Use mock fixtures to exercise future migration scenarios; do not spend time seeking nonexistent contracts or customer approvals.
- The founder is the accountable product/business decision-maker. Codex can perform engineering planning, implementation and review, but cannot be counted as a staffed support service, external legal adviser or independent assurance provider.

### Development placeholders and launch boundary

Implement complete document structures, flows and polished surrounding copy now. Use specific, searchable tokens such as `[Placeholder content: contracting legal name]`, `[Placeholder content: business address]`, `[Placeholder content: tax status]`, `[Placeholder content: support hours]` and `[Placeholder content: privacy contact]` only for genuinely unresolved facts.

Maintain a placeholder register with location, fact needed, founder ownership and replacement gate. Centralise repeated facts where appropriate. Do not use fabricated realistic details, broken contact links or a fake company identity as substitutes. Use explicit test scenarios for tax calculations; never treat an unknown tax status as a real-world exemption.

Private development/preview environments may contain these placeholders and use test-mode payments. Public development demonstrations must clearly identify their status and mock data, avoid presenting illustrative endorsements as real customer proof, and must not invite real paid transactions or real customer-data onboarding with unfinished business prerequisites. The founder's mock-data statement does not itself prove public forms are technically restricted; verify that boundary.

Before commercial launch or real customer-data onboarding, replace required placeholders, verify actual seller/contact/tax/provider details, complete applicable legal review and run the normal release audit. Add a release check for unresolved placeholder tokens in customer-facing content and configuration, including hosted checkout/email settings. A noindex directive alone is not access control.

This is an explicit development exception to the no-placeholder editorial criterion. It does not lower the quality standard for surrounding copy or permit placeholders in a completed commercial release. Development completion and launch readiness must be reported separately.

## 2. Audit baseline and evidence limits

The initial audit used public web content, read-only live HTTP checks and source inspection. No authenticated production walkthrough, transactions, deletion exercise, penetration test, browser accessibility assessment or performance measurement was performed. Production configuration was not inspected and secrets were not read.

Observed on 2026-09-07:

- Product-site `/terms` and `/privacy` returned 404. No equivalent product-site legal routes were found in the inspected source.
- `/robots.txt` and `/sitemap.xml` returned 404. Root metadata used `Product Site`.
- The product-site footer and signup lacked adequate commercial legal navigation and a terms-acceptance implementation.
- Subscription cancellation, period-end downgrade, reversing scheduled changes, Stripe Billing Portal and billing audit events already exist in code.
- Plan changes appear under `Upgrade`; cancellation is described as moving to Free; reversing cancellation uses potentially confusing wording.
- Complete personal erasure, workspace deletion and commercial export workflows were not found. Operational CSV exports and individual content deletion do exist.
- Hub legal editing, owner acknowledgement, revision-related infrastructure and data-use guidance exist. Missing owner content can produce public fallback notices.
- Operational ownership transfer changes hub user roles, without transferring commercial ownership in that function.
- Product-site signed sessions last 30 days; the inspected account-context path did not show password-change/disablement-linked revocation checks. MFA and global session logout were not found.
- Product-site rate limiting defaults to memory in production unless configured otherwise; a shared provider is supported.
- Homepage headers included HSTS, content-type, referrer and permissions protections; CSP and framing protection were not observed in that response.
- Member CSV escaping did not visibly neutralise spreadsheet formula values.
- Testimonials and brand assets contain named endorsements; authenticity and permission were not established. Their presence in source is not proof they are fabricated.
- Marketing previews use SVG assets; their fidelity to the current product requires review.
- Hubforj SaaS checkout uses recurring subscriptions. The inspected community membership-upgrade checkout uses a one-off Stripe payment.
- Native community payment implementation exists despite older documentation describing it as future work.
- Courses inspected emphasise scheduling, registration, capacity, attendance/completion and payments. A full lesson-authoring LMS was not established.
- Marketing responses were private/no-store and the marketing shell reads session state. No performance conclusion follows without measurement.
- Onboarding analytics hooks exist; a durable reporting pipeline was not established.

Revalidate observations before implementation. Distinguish **observed live**, **implemented in source**, **verified in staging**, **verified in production**, **proposed**, and **unknown** in all updates.

## 3. Preserve and integrate existing foundations

### Architectural and product constraints

- Keep product-site frontend code and styling local to that application.
- Product-site owns Hubforj SaaS subscriptions and commercial accounts; hub-platform owns tenant operations and community commerce.
- Preserve GBP-only SaaS billing unless a separately recorded decision changes it. Hub operating currency, locale and timezone remain separate.
- Preserve the Free operational baseline until verified paid activation succeeds.
- Reuse webhook verification, billing audit records, entitlement authority, exports, legal settings, admin access and support infrastructure where appropriate.
- Never infer production readiness from a README or historical closeout document.
- Existing hub legal pages follow save-and-accept with immediate live updates. Do not introduce a second draft/publish system accidentally.
- A proposed registration/payment readiness gate must work with the existing immediately available public site and must be explicitly designed before implementation.
- Current one-owner-email/one-commercial-workspace behaviour remains until identity and multi-workspace design is deliberately changed.
- Cancellation, security, privacy rights and access to one's data are baseline protections across plans. Do not use them as premium upsells.

### Related workstreams

Use these as implementation inputs, inspecting current code and status before reusing conclusions:

- [SaaS billing and onboarding](saas-billing-and-hub-onboarding-launch-implementation-plan.md)
- [Security remediation](security-remediation-production-implementation-plan.md)
- [Hub legal pages](hub-legal-pages-production-implementation-plan.md)
- [Firebase deployment readiness](firebase-deployment-prelaunch-runbook.md)
- [Shared rate-limiting launch guide](upstash-rate-limit-prelaunch-guide.md)
- [Enterprise performance and scalability](hub-platform-enterprise-performance-scalability-master-plan.md)
- [Enterprise performance execution checklist](hub-platform-enterprise-performance-execution-checklist.md)
- [Product-to-hub handoff](product-to-hub-admin-handoff-performance-ux-implementation-plan.md)
- [Product-site loading experience](product-site-skeleton-loading-performance-implementation-plan.md)
- [Booking notification production plan](booking-email-notifications-production-implementation-plan.md)
- [Custom-domain self-service](hub-platform-custom-domain-self-service-implementation-plan.md)
- [Regionalisation remediation](regionalization-final-remediation-checklist.md)

This document coordinates enterprise readiness. It does not silently overwrite established decisions in these documents. Record conflicts, the chosen resolution and affected documentation in the decision log.

## 4. Delivery governance and mandatory quality control

### Status model

`Not started → Specifying → Ready → Implementing → Verification → QC audit → Remediation → Re-audit → Complete`

`Blocked` requires the blocker, accountable owner and next action. `Deferred` requires rationale, residual risk, owner, review date and scope impact; it never means complete. Advanced procurement work may be conditional, but must remain tracked until implemented and verified or explicitly removed from scope by the user.

### Definition of ready

- [ ] Problem, affected user, scope and related finding IDs recorded.
- [ ] Accountable delivery owner and reviewer assigned; an independent review is preferred for high-risk boundaries.
- [ ] Behaviour, permissions, error states and acceptance criteria specified.
- [ ] Legal/commercial decisions required for implementation resolved or dependent work held.
- [ ] Cross-app contracts, data changes and migration/rollback strategy documented.
- [ ] Test data, environment and production verification method identified.
- [ ] Tradeoffs assessed, including customer impact and operational cost.
- [ ] The per-change repo assessment and integration contract below are complete against the current working tree, not only the original audit.
- [ ] Existing affected behaviour has a recorded baseline and executable regression checks before mutation; planned intentional changes are distinguished from regressions.

### Required cycle for every stage

1. Implement the scoped behaviour and documentation.
2. Perform appropriate functional, integration, security, accessibility and operational verification.
3. Conduct a quality-control audit against the original finding, user journey and acceptance criteria.
4. Explicitly assess missing states, gaps, tradeoffs, regressions, privacy, support implications and failure recovery.
5. Record every finding with severity, reproduction/evidence, affected requirement, owner and remediation.
6. Make corrective updates based on the audit. An audit report alone is not completion.
7. Re-test affected behaviour and re-audit the findings, including regressions introduced by fixes.
8. Repeat until the release gate is satisfied. Update evidence, runbooks and the coverage register.

No stage can be completed immediately after implementation without this cycle. Do not reduce the standard to fit a target launch date.

### Severity and release rules

| Severity | Examples | Gate |
| --- | --- | --- |
| Critical | Cross-tenant disclosure, unauthorised destructive access, uncontrolled duplicate charging | Stop affected release; remediate and verify |
| High | Broken cancellation, unusable erasure process, missing legal prerequisites, unrecoverable data loss, material misleading claim | Blocks the affected launch scope |
| Medium | Important friction, incomplete noncritical support visibility, bounded performance issue | Fix or record accountable acceptance with deadline and compensating control |
| Low | Minor presentation or documentation issue | Track with owner and deadline; do not silently discard |

Acceptance of residual risk does not waive applicable legal duties or the user's enterprise objective. A temporary manual control needs capacity, evidence and a replacement milestone.

### Definition of complete

- [ ] Behaviour and negative/failure paths pass meaningful tests.
- [ ] Permissions are verified at the action/API boundary, including cross-tenant attempts.
- [ ] Relevant keyboard, mobile, assistive-technology and loading/error states are assessed.
- [ ] Migration, observability, recovery and support procedures are verified where relevant.
- [ ] QC audit completed; corrective updates made; findings re-audited.
- [ ] No unresolved critical/high issue affects released scope.
- [ ] Remaining risks are explicitly tracked, with no unapproved scope reduction.
- [ ] Public claims, help, terms, privacy and implementation agree.
- [ ] All affected customer-facing copy passes the editorial acceptance gate below, is implemented in the actual interface/email/document and has been rechecked after rendering. Draft copy alone does not satisfy delivery.
- [ ] Staging and production evidence are recorded separately; deployment is not inferred from a merged change.
- [ ] The affected cross-app regression matrix has passed after the final change; old/new deployment compatibility, caches, scheduled work and external side effects have been verified where relevant.

### Mandatory per-change repo assessment and integration contract

This protocol applies to every implementation slice, including copy changes that rename actions or alter promises. A Stage 0 audit alone becomes stale as the repo evolves. No implementation may proceed solely from this document's description of the code.

1. Record the current revision, relevant uncommitted changes, applicable repository instructions and current sibling-plan decisions. Preserve the founder's work. Do not reset mock data or rewrite unrelated modules to simplify the task.
2. Trace the actual entry point through authentication/authorisation, domain decisions, persistence, provider calls, internal APIs, caches/projections, workers, notifications and every consuming UI. Include indirect callers and existing tests. Use file/symbol evidence and record unknown boundaries.
3. Classify each observed behaviour as preserve, intentionally change, or defect to fix. Preserve supported functionality, not a known security or financial defect. Document the precise before/after result for intentional changes and update its affected callers/tests/copy together.
4. Identify the authoritative owner of each field and operation. Define request/response schemas, states, idempotency keys, tenant identity, timestamps, provider identifiers and failure outcomes. Reuse existing contracts; do not introduce a competing billing, identity, legal or entitlement authority.
5. Record migration, backward compatibility, deployment order and rollback/compensation. Treat the two apps and provider configuration as separately deployed consumers/producers; avoid assuming an atomic release.
6. Add or adapt meaningful behaviour/contract tests for the affected boundary before or alongside implementation. Record baseline failures and their impact. Never remove a failing assertion merely to obtain a pass without establishing the intended behaviour.
7. Deliver a small complete vertical slice and its observable failure/recovery paths. Flag incomplete functionality off; do not expose a working button backed by an unfinished lifecycle.
8. Run targeted checks, the affected regression matrix, then stage QC and remediation/re-audit. Review the final diff for collateral changes, information leaks and claims that exceed implemented behaviour.

The change record must state **what was inspected, what must remain true, what changes intentionally, how both apps agree, how failure recovers, and what evidence proves it**. Uninspectable material dependencies block that affected slice, not independent work. Do not present a missing production check as a pass.

### Cross-app regression and invariant matrix

Instantiate the applicable rows as executable tests with realistic isolated mock fixtures. Cover additional combinations based on impact; do not run an indiscriminate full Cartesian product for each cosmetic edit. High-risk changes require integration/behaviour tests, not only source-string assertions.

| Boundary | Invariants / required cases |
| --- | --- |
| Signup and provisioning | Free remains usable without checkout; paid intent does not grant entitlement before verified success; duplicate/concurrent submissions and partial provisioning recover without duplicate accounts, hubs or subscriptions |
| Identity and handoff | Same intended identity survives product-to-hub handoff; MFA/revocation is enforced at every session issuance/consumption path; expired/replayed handoffs, invites and reset links fail safely; member-only identities gain no admin authority |
| Hosting and navigation | Local path routing, platform subdomain and custom domain resolve the correct tenant; absolute links, return URLs, cookies, query parameters and recovery paths work without open redirects or cross-tenant leakage |
| Billing authority | Stripe state, commercial account, ownership links, hub package state, overrides and UI agree; cancellation actually produces the approved operational state; duplicate/stale provider events cannot restore obsolete authority |
| Existing commerce | Free/Starter external/Growth native flows retain registration, booking, attendance, waitlist/capacity, group-attendee cancellation/refund and member membership-change behaviour; historical transaction handling survives subsequent plan changes |
| Downgrade/recovery | Permit history, required fulfilment/refunds and export while restricting new activity; grace/past-due and operator/seed overrides are explicit; custom-domain cutover does not strand access or old email links |
| Legal readiness | Signup/booking restrictions cover actions/APIs, not only buttons; existing sign-in, fulfilment and privacy controls remain available; save-and-accept stays immediate and account-role limitations hold |
| Data lifecycle | Top-level and nested records, auth relationships, files, projections, queues and caches are handled; closure, transfer, export and erasure races are controlled; old jobs/webhooks cannot resurrect a closed tenant |
| Timing and money | GBP SaaS is separate from hub currency/locale; minor units, tax, discounts, refunds and rounding reconcile; timestamps and date labels handle timezones, daylight-saving changes, month boundaries and expiry races |
| Performance and security | No public cache contains private data; source mutations invalidate relevant public/private projections; auth and quota checks are safe under concurrency; no unbounded export/deletion request or silent truncation |
| Recovery and deployment | New/old app revisions and schema versions behave according to the release contract; rollback does not replay refunds or undo completed erasure; worker interruption, outages and delayed emails produce truthful recoverable states |

Use deterministic time/provider fixtures for edge cases, isolated integration environments for side effects and actual browser tests for representative end-to-end journeys. Add a reproducible verification entry point that covers both apps; product-site tests currently also live under hub-platform. Establish baseline test/build/lint results early. Pre-existing failures require an explicit risk decision and repair when they prevent assurance of the changed boundary.

### State-machine and release requirements

Before billing, entitlement, ownership, session or deletion changes, write a transition table covering current state, event/actor, guard, writes, external effects, resulting state, retry and compensation. Keep invoice/payment status, commercial subscription status, effective hub entitlements and tenant closure state distinct. Define which authority wins and how stale revisions are rejected.

Use compatible schema expansion/backfill/consumer rollout before retiring old fields where needed. Design atomic claims or equivalent concurrency protection for quota enforcement, transfer and jobs. Persist durable work before acknowledging acceptance; use bounded batches, leases/retries, operator-visible failure states and reconciliation. A request-time side effect is not a reliable scheduler.

New acquisition, checkout, deletion processing and optional provider integration need scoped disable/recovery controls where risk warrants them. A disabled acquisition path must not block existing sign-in, cancellation, refund handling or privacy requests. Test controls before release. Code rollback cannot reverse an external refund, consumed token, deleted data or DNS change: record the appropriate compensation/recovery rather than claiming universal rollback.

### Development delivery versus external assurance

Legal templates and policy mechanisms may reach **development verified** with registered business placeholders and mock provider scenarios. They do not reach **launch verified** until required facts/review are complete. This explicitly allows stages 2–6 to progress on stable contracts while external facts remain pending; record the evidence level per item and do not mark the whole stage complete prematurely.

The founder is accountable for delivery; specialist legal review, actual user comprehension work and independent security assessment require real evidence from suitable people. A second Codex review is useful but is not independent certification or a substitute for those activities. Record provider, scope, capacity/budget decision and milestone early, so a missing reviewer does not appear only at the release gate. Conditional enterprise features remain separately tracked and unadvertised until delivered.

### Evidence record template

For each work item record: ID; stage; finding IDs; owner; reviewer; status; specification link; decision IDs; changed files/PR; environment and deployed revision; verification date; test results; audit findings; corrective changes; re-audit result; production evidence; rollback/recovery; residual risks; next action.

Never place secrets, raw customer exports, payment details or unnecessary personal information in this plan or evidence attachments.

### Enterprise copy standard — mandatory across all stages

The user explicitly requires enterprise-quality copy to be implemented, not merely recommended. Copy is a first-class deliverable with an accountable editorial owner, a reviewer and recorded evidence. Enterprise copy is precise, useful, credible and accessible; it does not mean verbose, formal or filled with corporate language.

Scope includes marketing pages, pricing tables, navigation, forms, labels, hints, validation, confirmations, empty/loading/error/success states, account and member journeys, billing and deletion disclosures, transactional emails, help, support messages, legal documents, search metadata and accessibility text.

Required work, tracked alongside the relevant stage:

- [ ] COPY-01 (Stages 0–1) Inventory all copy surfaces and states. Give each a user/task, owner, source location, status and review evidence. Identify omissions, duplicated terminology, placeholders and unsupported claims.
- [ ] COPY-02 (Stage 1) Establish the messaging and editorial guide: audience, positioning, voice, UK English, terminology, date/currency conventions, accessibility rules and claim substantiation. Distinguish Hubforj plan, community membership, booking, cancellation, closure and deletion consistently.
- [ ] COPY-03 (Stages 1–6) Write final copy specifications for complete journeys, including alternative/error states and emails. Link factual claims to the capability register and commercial/legal decisions. Unknown fees, deadlines and commitments cannot be filled with invented wording.
- [ ] COPY-04 (Stages 1–6) Implement the reviewed copy in the actual surfaces. Review in context on desktop/mobile and with realistic long names, amounts and dates; check truncation, button labels, reading order and screen-reader announcements.
- [ ] COPY-05 (Stages 3–7) Test comprehension of pricing, payment behaviour, cancellation, ownership and deletion with representative readers. Record whether they can explain the charge, action, timing, consequence and recovery path; revise misunderstood wording and repeat the check.
- [ ] COPY-06 (Stages 6–9) Audit the full journey for factual accuracy, specificity, terminology, tone, accessibility and consistency. Correct findings, re-audit and record the approved copy revision against the deployed release. Reopen review when behaviour, policy or pricing changes.

Editorial acceptance gate — every applicable criterion must pass; an average score cannot hide a material failure:

| Criterion | Required evidence |
| --- | --- |
| Accurate | Every material capability, price, timing and trust claim matches verified behaviour or explicitly disclosed limitations |
| Specific | Copy explains a concrete task or benefit; generic claims such as “seamless”, “premium capability” or “enterprise-grade” cannot replace an explanation |
| Clear | Plain language, consistent nouns, meaningful headings and action labels; no internal architecture or jargon unless it helps the customer's decision |
| Complete | Critical actions explain what changes, when, applicable charges/data consequences and what the customer can do next |
| Fair | No fabricated proof, hidden conditions, compulsory retention friction, misleading urgency or ambiguous destructive actions |
| Consistent | Website, signup, checkout, account, emails, help and legal disclosures agree; approved terminology is used throughout |
| Accessible | Useful labels, understandable errors and recovery, accessible announcements, readable layout and no meaning dependent only on colour or icons |
| Editorially finished | No lorem ipsum, speculative promises, repetitive filler, careless grammar or inconsistent spelling/punctuation; registered business-fact placeholders are permitted only under section 1's development exception and block commercial release |
| Implemented | Reviewed wording appears in the rendered release, including dynamic and provider-hosted copy under Hubforj's control |

Material inaccuracies, missing charge/destructive-action consequences and misleading claims block the affected release. Other editorial failures must be corrected before the associated copy is accepted; copy may not be declared complete because the functional tests pass. Specialist legal review remains separate from editorial review. If qualified review or comprehension evidence is missing, record that limitation rather than claiming it happened.

## 5. Strategic stages and dependencies

### Required supporting documents — create progressively

Supporting specifications and evidence records are mandatory execution deliverables, not optional follow-up work. Create them at the points below, before dependent implementation starts; update them during implementation, QC, remediation and re-audit. Do not create empty documents solely to tick a box or delay Stage 0 to write every later-stage specification upfront.

The founder is accountable for the programme; Codex creates and maintains engineering documentation as work proceeds. Record the actual reviewer and specialist dependencies in each document. The master plan remains the authority for scope, decisions and progress; supporting documents provide detailed contracts and evidence without silently changing that scope.

The filenames below are planned destinations under `docs/`, not existing documents or completed deliverables. Replace each plain filename with a working relative link when created. Rows without an execution update below remain **Not created**; linked documents have the scope/status recorded in their headers.

| ID | Required document / planned filename | Create by | Minimum content and completion gate |
| --- | --- | --- | --- |
| DOC-01 | Current-state map and regression baseline — [product-site-enterprise-current-state-and-regression-baseline.md](product-site-enterprise-current-state-and-regression-baseline.md) | Stage 0, before the first application change | Current revision and working-tree context; entry points and cross-app dependencies; field/operation authority; capability evidence; behaviours to preserve; runtime and reproducible test commands; actual results and known failures. Refresh affected sections before each slice. |
| DOC-02 | Implementation-slice specification — `product-site-enterprise-slice-<id>-<topic>.md` | Before each bounded implementation slice in any stage | Scope and parent task/finding IDs; current code evidence; intended before/after behaviour; affected files/contracts/providers/jobs; permission and state tables as needed; copy/UI states; acceptance tests; migration/deployment/recovery; QC findings, corrective changes and re-audit evidence. One specification per slice; the slice cannot enter implementation without it or complete without its evidence. |
| DOC-03 | Identity and access specification — [product-site-enterprise-identity-and-access-spec.md](product-site-enterprise-identity-and-access-spec.md) | Stage 2 specification work, before identity/authentication changes | Identity reuse/linking, UID versus tenant user, roles and commercial authority, ownership transfer, session issuance/revocation, MFA/recovery and handoff contracts; abuse/failure cases; migration and behavioural verification. |
| DOC-04 | Billing and entitlement specification — `product-site-enterprise-billing-and-entitlement-spec.md` | Stages 1–3, before billing/entitlement changes | Commercial policy versions; price/status/effective-entitlement authorities; transition tables for checkout, upgrades, refunds, cancellation, delinquency and downgrades; existing commerce/domain effects; webhook/retry/concurrency handling; invoices, emails and reconciliation evidence. |
| DOC-05 | Data inventory and lifecycle specification — `product-site-enterprise-data-lifecycle-spec.md` | Start in Stage 1; complete affected contracts before Stage 4 mutations | Data locations and relationships, providers, purposes and retention decisions/placeholders; personal/workspace export coverage; permissions; deletion/closure transitions; durable jobs; retained records; backups/restoration and verification of completeness/non-resurrection. |
| DOC-06 | Copy and design specification — [product-site-enterprise-copy-and-design-spec.md](product-site-enterprise-copy-and-design-spec.md) | Start in Stages 0–1; complete affected copy/design before each customer-facing slice | Audience and messaging; terminology/style; claim sources; business placeholder register; existing tokens/components; representative layouts; final copy for normal/error/empty/confirmation/email states; accessibility and responsive expectations; editorial/visual/comprehension review evidence. |
| DOC-07 | Release and operational assurance record — [product-site-enterprise-release-and-operations-record.md](product-site-enterprise-release-and-operations-record.md) | Start with the first deployable slice; complete before Stage 7 release | App/schema/provider deployment order, scoped release controls, environment checks, observability and delivered alerts, rollback/compensation, restore/privacy drills, support capacity, launch prerequisites and dated go/no-go evidence. Link and update existing runbooks rather than duplicating them. |
| DOC-08 | Pilot validation and acquisition record — `product-site-enterprise-pilot-validation-record.md` | Measurement design in Stage 0; ready before Stage 8 pilot onboarding | Segment hypothesis, cohort/capacity limits, event definitions, baseline/targets, onboarding observations, retention/support/cost evidence, permissioned proof and decisions to improve or scale. |

Execution update (2026-09-07): DOC-01, DOC-03 and DOC-06 have been created with focused slice-001 coverage. DOC-02 instances: [slice 001 — identity reuse](product-site-enterprise-slice-001-identity-reuse.md), [slice 002 — provisioning idempotency](product-site-enterprise-slice-002-provisioning-idempotency.md), [slice 003 — address reservations](product-site-enterprise-slice-003-address-reservations.md) [slice 004 — signup recovery](product-site-enterprise-slice-004-signup-recovery.md) and [slice 005 — isolated recovery verification](product-site-enterprise-slice-005-recovery-integration-tests.md). DOC-07 now exists for the bounded closure rollout; [slice 006](product-site-enterprise-slice-006-browser-session-assurance.md) records browser/session closure. They do not yet cover the whole programme. Slice 001 is a bounded remediation of an existing security defect under S2-14, with stable existing contracts and no dependency on new business policy; it does not imply completion of Stage 0, Stage 1 or Stage 2.

Before creating a new document, inspect the related workstreams in section 3. An existing document may fulfil a row if it is explicitly designated here, brought up to date, contains all required material and links back to the master tasks. Do not maintain competing versions of the same contract. Split an oversized specification when useful and register its child documents here.

Each supporting document must record status, accountable owner, reviewer, creation/update dates, applicable repo revision, parent stage/task/finding/decision IDs, dependencies, unresolved questions and the next action. Distinguish **draft**, **ready for implementation**, **implementation in progress**, **QC/remediation**, **development verified** and **launch verified**. A written specification is not implementation evidence.

**Execution gates:**

- [ ] DOC-G1 Before a slice starts, its DOC-02 specification and relevant shared specifications exist, are linked here and satisfy section 4's definition of ready.
- [ ] DOC-G2 After code, schema, policy or scope changes, update the affected specifications, decision register and baseline; resolve contradictions before continuing dependent work.
- [ ] DOC-G3 Before a slice/stage completes, record actual verification, QC findings, corrective updates, re-audit and remaining risks in its supporting documents and link the outcome from the master plan.
- [ ] DOC-G4 Before programme completion, verify every applicable document is current and every slice has traceable completion evidence. Missing required documentation/evidence prevents complete status; conditional work stays explicitly tracked.

Documentation should be concise enough to use during implementation and detailed enough to reproduce the decision and checks. No secrets or raw customer data belong in these files. These requirements add traceability; they do not replace implementation, testing or the mandatory audit/remediation cycle.

| Stage | Outcome | Depends on | Status |
| --- | --- | --- | --- |
| 0 | Verified baseline, ownership, decisions and delivery controls | None | In progress — focused runtime/regression baseline established |
| 1 | Legal, commercial and data-governance specification | 0 | Not started |
| 2 | Secure identity, commercial authority and technical foundations | 0; relevant stage 1 decisions | Bounded signup/session foundations development verified; wider scope paused |
| 3 | Clear and reliable subscriptions, billing and exit consequences | 1, 2 | Not started |
| 4 | Export, privacy requests, erasure and workspace closure | 1–3 | Not started |
| 5 | Complete client account and activation experience | 1–4 contracts | Not started |
| 6 | Truthful positioning, public site, pricing and acquisition foundations | 0, 1, 3; verified capability evidence | Not started |
| 7 | Operational assurance and controlled-launch release audit | 1–6 | Not started |
| 8 | Supported market validation and repeatable acquisition | 7 controlled-launch gate | Not started |
| 9 | Enterprise procurement capabilities and sustained assurance | Baseline controls; validated demand and architecture | Not started |

Research, design and document preparation can overlap once their inputs are available. Dependent behaviour must not be implemented using invented policy decisions. Do not assign calendar promises before effort, staffing and dependencies are assessed.

## 6. Stage 0 — Baseline, capability register and decisions

### Work

- [ ] S0-01 Recheck every audit observation against current source and deployed behaviour. Capture dated evidence without customer data.
- [ ] S0-02 Inventory public, commercial-account, hub-admin, member and platform-support journeys, including email, checkout and custom-domain handoffs.
- [ ] S0-03 Create the capability register: feature, tier, source authority, public claim, implementation state, production verification, support scope, limits, dependencies and accountable owner.
- [ ] S0-04 Update stale documentation about native payments; distinguish implementation from operational verification.
- [ ] S0-05 Assign product, engineering, design/accessibility, security/privacy, legal, finance, operations/support and commercial owners. One person may hold multiple roles; no critical responsibility may be unassigned.
- [ ] S0-06 Establish staging fixtures for Free/Starter/Growth, delinquent and cancelling accounts, transferred owners, multi-attendee bookings, domains and privacy requests.
- [ ] S0-07 Baseline signup, cancellation, activation, performance, accessibility and support outcomes before setting targets.
- [ ] S0-08 Review conflicts with existing plans, especially immediate public-site availability, legal save-and-accept and GBP billing.
- [ ] S0-09 Record mock-only founder context, inventory permitted placeholders and verify public development/demo boundaries. Define the check that prevents unresolved business placeholders and test credentials from entering commercial launch.
- [ ] S0-10 Establish the reproducible cross-app test harness, baseline failures, representative browser journeys and regression matrix before implementation. Inventory the authoritative schemas, API consumers and provider configuration; record compatibility contracts for each high-risk slice.
- [ ] S0-11 Capture baseline visual/design-system quality and measurement events before UI changes/pilot onboarding. Plan specialist/user-review evidence and practical founder capacity for release gates; do not defer all verification infrastructure to Stage 7 or all measurement until after the pilot.
- [ ] S0-12 Establish a usable documented Node/package-manager runtime and the correct app working directories before claiming test evidence. The current hub alias loader resolves `@/` from `process.cwd()`; run its alias-dependent tests from `apps/hub-platform`. Record runtime versions and reproducible commands. If tooling is missing, report verification blocked rather than inventing a pass or treating static inspection as equivalent.

### Gate and QC focus

All audit findings have an owner, requirement and planned stage. Unknowns are explicit. Current behaviour has not been confused with a proposal. Audit baseline coverage, repair omissions and re-audit before completing this stage.

## 7. Stage 1 — Legal, commercial and data-governance foundation

### Commercial decisions and documents

- [ ] S1-01 Establish legal entity, address, jurisdiction, contact routes, intended markets and business/consumer customer classification with appropriate legal advice.
- [ ] S1-02 Specify SaaS terms covering contracting authority; package inclusions; limits; billing currency/frequency/taxes; renewal; cancellation; refunds; proration; delinquency; suspension; content ownership/licence; acceptable use; community-commerce responsibilities; support; termination; export/deletion; liability; disputes; price and terms changes.
- [ ] S1-03 Define upgrade/downgrade consequences before writing customer-facing policy. Include over-limit members/events, courses, historical reports, paid bookings, refunds, domains and branding.
- [ ] S1-04 Draft and obtain appropriate review of Hubforj's privacy notice: data categories, purposes, lawful bases, recipients, international transfers, retention, rights, complaints and contact routes.
- [ ] S1-05 Create the customer data-processing agreement: instructions, confidentiality, security, subprocessors, rights assistance, incidents, return/deletion and assurance.
- [ ] S1-06 Inventory actual service providers, including Google/Firebase, Stripe, Resend, Vercel and deployed monitoring/rate-limiting systems. Verify roles, processing locations, contractual safeguards and subprocessor-change notifications.
- [ ] S1-07 Create a retention schedule by data class and purpose, including billing, identity, operational tenant records, support, logs, exports and backups. Give each rule a legal/product basis, owner and executable disposition.
- [ ] S1-08 Publish versioned terms/privacy/DPA/subprocessor and relevant cookie/support pages, with legal entity/contact details, accessible navigation and effective dates.
- [ ] S1-09 Add clear signup terms acceptance with immutable document revision, actor, account and timestamp evidence. Apply server-side enforcement and migration treatment for existing clients. Separate optional marketing consent from contract acceptance and privacy notice delivery.
- [ ] S1-10 Specify material-change notification and, where required, re-acceptance. Keep previous accepted versions available for evidence.

### Tenant legal readiness and cookies

- [ ] S1-11 Preserve owner save-and-accept and immediate live document updates. Audit existing validation, revisions, acknowledgement and platform data-use summary.
- [ ] S1-12 Design readiness checks for enabling registration/paid bookings while allowing appropriate setup/preview and existing immediate public availability. Define existing-tenant migration, overrides, customer explanation and recovery; do not invent a global publish switch.
- [ ] S1-13 Require meaningful contact/legal readiness and flag incomplete or placeholder content. State that non-empty content and owner acceptance do not establish legal adequacy.
- [ ] S1-14 Detect capability/data-use changes requiring renewed owner review. Align platform processing facts with tenant guidance without presenting generated text as legal advice.
- [ ] S1-15 Inventory cookies, local storage and embedded technologies across domains. Publish accurate information; implement prior consent/preferences/withdrawal where applicable. Verify actual network behaviour, including third-party embeds, before making essential-only claims.
- [ ] S1-16 Review sensitive-data and children's-data implications for intended customer segments; define supported use and necessary safeguards based on actual processing.
- [ ] S1-17 Recheck legal requirements before release. The audit's UK subscription-regime timing is a dated observation, not a permanent implementation rule.
- [ ] S1-18 Extend existing immediate save-and-accept with immutable accepted document snapshots and concurrency-safe revision handling where historical evidence is required. Current code stores the latest body/revision, not a historical archive. Support re-acknowledging changed platform data use even when legal text is unchanged; distinguish document revision from feature-snapshot acknowledgement. Test same-content re-acceptance, competing saves, owner/support permissions and public cache freshness without adding a draft/publish workflow.

### Gate and QC focus

Legal documents reflect implemented or explicitly scheduled behaviour, and required review is complete. Test document discovery before signup, acceptance tampering, revision evidence, policy updates, cookie behaviour and tenant readiness. Remediate contradictions, missing disclosures and inaccessible flows, then re-audit.

## 8. Stage 2 — Identity, authority and security foundations

### Work

- [ ] S2-01 Specify and implement revocable session lifecycle across product-site, hub and platform/support sessions. Cover password reset/change, account disablement, role change, ownership transfer, logout everywhere and identity deletion.
- [ ] S2-02 Add recent-authentication/step-up checks for deletion, commercial ownership transfer, sensitive profile changes and other high-impact actions. Design recovery paths that do not bypass authority checks.
- [ ] S2-03 Implement MFA for privileged accounts with enrolment, recovery, factor replacement and auditable support recovery. Set policy for owners/admins and platform staff; record member policy separately.
- [ ] S2-04 Define operational owner, commercial owner, billing contact and delegate permissions. Implement explicit handover with recipient acceptance, contract authority, billing contact, Stripe ownership implications, departing-user access and recovery.
- [ ] S2-05 Ensure transfer cannot strand or silently duplicate commercial ownership. Use durable cross-app state, idempotency and reconciliation; define rollback/compensation where atomic transactions are unavailable.
- [ ] S2-06 Verify action/API-level authorisation on reads, writes, downloads and exports, including role-specific and cross-tenant negative cases. Never trust a hidden form's tenant or actor IDs.
- [ ] S2-07 Configure and verify distributed production abuse controls. Cover signup/reset and other exposed abuse paths; define proxy/IP trust, fail behaviour, monitoring and customer recovery from false positives.
- [ ] S2-08 Implement compatible CSP and framing protection and verify deployed headers across route types. Use report-only rollout where useful, then enforce after remediation. Preserve existing protections.
- [ ] S2-09 Harden CSV exports against formula injection and test spreadsheet interpretation as well as delimiter correctness. Review all related export paths.
- [ ] S2-10 Audit staff support access for scope, reason, duration, privilege, immutable event evidence and customer disclosure. Verify privileged operations cannot be performed through ordinary admin contexts.
- [ ] S2-11 Review secret handling, environment separation, Firebase/storage access, dependency maintenance and vulnerability response using the existing security workstream. No secret values in documentation.
- [ ] S2-12 Document threat model for tenant boundaries, shared identity, cross-app trust, payments, exports and destructive lifecycle actions.
- [ ] S2-13 Enforce consistent authentication assurance at commercial, member, platform, invite and owner-handoff session entry points. Audit host binding, token redaction, expiry/replay, UID versus tenant-user identity, email changes and cross-role recovery. Model sessions by server-verified assurance, not just UI completion of MFA.
- [ ] S2-14 Review and harden existing-identity reuse during commercial signup and retry. New signup must not reset an existing Firebase identity's password, enable a disabled identity or rebind a commercial account merely because an email matches. Require verified authority through sign-in/recovery/linking before reuse; preserve unrelated member/admin relationships. Test existing member-only identities, disabled users, partial signups, stale UID links and concurrent submissions. Firebase token revocation checking already exists at commercial sign-in and must be retained; extend custom-session invalidation separately.

- [ ] S2-15 Enforce shared transactional hosted-address reservations for every hub creator; audit/backfill existing slug/label aliases, reject collisions, gate creation until coverage is ready, and retain claims during deletion/restoration. Remove per-request full-hub scans. Define any future rename/reuse lifecycle explicitly. Local implementation: [slice 003](product-site-enterprise-slice-003-address-reservations.md); provider backfill applied and read-back verified on 2026-09-07; deployment, access-control review and full concurrency verification remain outstanding.

### Gate and QC focus

Verify session replay after revocation, unauthorised transfers, repeated/concurrent requests, expired MFA/recovery paths, export abuse and support privilege boundaries. Security-sensitive source checks are not a substitute for behavioural verification. Correct findings and repeat the affected security audit.

## 9. Stage 3 — Subscription and billing lifecycle

### Customer experience

- [ ] S3-01 Replace upgrade-only account framing with Plan & usage and Billing & subscription. Keep direct plan-change paths and consistent navigation.
- [ ] S3-02 Show actual current price, currency, tax treatment, renewal date, payment status, invoices and payment-method access. Keep portal access available while cancellation or downgrade is scheduled.
- [ ] S3-03 Provide an obvious Cancel paid subscription action, clear period-end consequences, confirmation and email receipt. Feedback is optional; no compulsory retention/support obstacle.
- [ ] S3-04 Rename reversing cancellation to the resulting action, such as Keep my paid subscription. Distinguish it from cancelling renewal and cancelling a pending checkout.
- [ ] S3-05 Implement the approved downgrade policy. Preserve eligible records, fulfilment/refund administration and export access; explain effects on member/event limits, courses, domains, reporting and branding.
- [ ] S3-06 Show a reliable upgrade charge/credit preview where available. Revalidate before confirmation and clearly handle changed estimates; do not rely only on vague proration wording.
- [ ] S3-07 Explain billing recovery, grace/access rules and support routes during failed payments or unavailable billing services.

### Reliability and commercial consistency

- [ ] S3-08 Reuse and harden existing cancellation, schedules, portal, checkout, audit and entitlement authority. Verify idempotency, concurrent requests and subscription selection rather than replacing working foundations unnecessarily.
- [ ] S3-09 Reconcile checkout, invoice, subscription and entitlement states, including delayed/duplicate/out-of-order events, failed sync and partial cross-app writes. Define scheduled monitoring and repair responsibility.
- [ ] S3-10 Verify portal configuration matches in-app policy, including cancellation, discounts, downgrades, tax and permitted plan changes.
- [ ] S3-11 Specify supported membership payment behaviour separately from Hubforj subscription billing. Verify one-off payments, durations, renewal and any external-payment follow-up. Do not imply recurring member charging unless delivered.
- [ ] S3-12 Verify Stripe Connect readiness, supported markets and currencies, platform/provider fees, payout/refund/dispute responsibility and customer-facing failure handling.
- [ ] S3-13 Test price display against live billing authority, including historical/grandfathered/discounted accounts if supported. Catalogue price must not misrepresent the actual contracted charge.
- [ ] S3-14 Specify and implement effective-entitlement transitions independently of raw Stripe price/status, with explicit operator/seed override precedence. Prove terminal cancellation moves to the intended Free/recovery state and that legacy obligations remain operable. Audit every tier/capability check before adding fulfilment-only access.
- [ ] S3-15 Implement the introductory SaaS refund guarantee as a complete authorised workflow: eligibility, request status, idempotent refund, subscription termination, entitlement sync, invoice/credit-note treatment, email and operator recovery. Test pending/failed refunds, partial prior refunds, disputes, an upgrade during the guarantee window and refund/cancellation races; keep community refunds separate. Define exact promise coverage for such edge cases before publishing.
- [ ] S3-16 Make historical transaction references and payment mode authoritative for resolving existing bookings/refunds, subject to valid permissions, rather than relying solely on today's package. Audit related member/event/course/attendee flows and reporting for tier-change regressions.

Repo alignment note from the second audit: `usesInternalEventPayments` explicitly checks the hub's current `packagePaymentProcessingMode`. Commercial subscription sync derives tier from Stripe price/metadata and separately maps status; the common capability resolver does not turn a cancelled paid tier into Free. Custom-domain enforcement does separately disable a cancelled package. Therefore consistent terminal entitlements and historical refund behaviour are implementation changes to prove, not existing guarantees to assume. Preserve deliberate security restrictions while removing inconsistent customer outcomes.

### Gate and QC focus

Exercise Free activation, paid activation, abandoned/expired checkout, upgrade, downgrade, cancellation, reversal, delinquency, authentication challenges and renewal. Confirm no further recurring charge after cancellation takes effect, entitlement continuity until the agreed date, and retained financial resolution access. Verify both portal and native flows, correct findings and re-audit with recorded payment evidence from appropriate test environments.

## 10. Stage 4 — Data access, erasure and workspace closure

### Policies, permissions and user controls

- [ ] S4-01 Define separate operations for cancelling SaaS billing, deleting personal identity, erasing tenant-member data and closing a workspace. Publish scope and consequences for each.
- [ ] S4-02 Implement Data & privacy in commercial accounts and appropriate personal controls in member accounts. Provide privacy contact and request submission outside login for inaccessible accounts.
- [ ] S4-03 Provide tracked requests with reference, identity/authority checks, scope, acknowledgement, due date, processing status, exception explanation, completion evidence and complaints route.
- [ ] S4-04 Implement personal access/export and a usable owner-authorised workspace migration export. Document schemas and coverage; operational CSV reports are not a complete rights response or migration package.
- [ ] S4-05 Protect exports with tenant/role checks, appropriate step-up authentication, short-lived download access, expiry, audit events and automated cleanup. Ensure no other person's data is included without authority.
- [ ] S4-06 Handle owner departure through transfer where the organisation continues. Prevent deletion of shared authentication identity while other authorised relationships still require it; design explicit relationship checks.
- [ ] S4-07 Separate booker and attendee rights in group bookings and preserve other people's legitimate records.
- [ ] S4-08 Design workspace closure to stop new activity appropriately, resolve billing and outstanding obligations, offer export without making export compulsory, apply approved retention and then delete eligible data.
- [ ] S4-09 Any grace/recovery period must be an explicit policy, disclosed and compatible with applicable deadlines; elapsed time is not consent to unrelated retention.

### Deletion execution

- [ ] S4-10 Build an executable data inventory covering commercial records, ownership links, auth identities, tenant users/profiles/media, memberships, bookings/attendees, registration/attendance/completion, payment references, files/derivatives, projections, notifications, support, logs, caches, exports and backups.
- [ ] S4-11 Implement durable deletion jobs with state, scope, per-system steps, idempotency, retries/backoff, checkpoints, protected operator recovery and completion verification.
- [ ] S4-12 Stop scheduled reminders and other processing for deleted identities/data. Prevent webhooks, reconciliation and projection rebuilds from recreating erased personal information.
- [ ] S4-13 Execute vendor-side handling according to each provider's actual role. Record unresolved external actions, required retained financial records and the basis for exceptions.
- [ ] S4-14 Apply retention by class, minimisation and appropriate anonymisation where justified. Keep only necessary deletion audit evidence; avoid retaining the erased profile in audit payloads.
- [ ] S4-15 Define backup expiry/beyond-use treatment and a restoration procedure that reapplies completed erasures before data becomes operational.
- [ ] S4-16 Verify deletion at source, derived stores, files, caches and downstream services. Do not mark complete based on a single deleted document.
- [ ] S4-17 Establish alerts and escalation for overdue requests and stuck jobs, including continuity when the responsible support operator is absent.
- [ ] S4-18 Specify consistent export snapshots, manifest/schema version, pagination/resumption, attachment coverage and count/checksum reconciliation. Exercise datasets exceeding current report caps; no silent truncation. Verify export usefulness independently from whether download succeeds.
- [ ] S4-19 Implement explicit tenant lifecycle state and safe authority checks for all mutation/background entry points. Coordinate pending checkout, transfer, refunds, export and deletion; reject stale work, retain minimal suppression evidence and define restricted retained-record access. Include top-level collections, handoffs/invites, domain mappings/claims and search/slug reuse policy. Privacy fulfilment must not be held hostage to unrelated debt or export completion.

### Temporary control and gate

A staffed manual fulfilment process may support a narrowly controlled launch only if the process is secure, end-to-end tested, capacity-assessed, tracked and consistent with legal deadlines. Assign its automation replacement milestone. It does not complete this stage's self-service and durable-processing requirements.

QC must cover mixed-tenant identities, departing owners, other attendees, ongoing disputes, retained invoices, interrupted jobs, repeated requests, backup restore and attempted data resurrection. Apply corrective updates and repeat erasure verification before closure is accepted.

## 11. Stage 5 — Complete logged-in experience and activation

### Target commercial information architecture

| Area | Required experience |
| --- | --- |
| Overview | Setup progress, workspace health, next useful action and direct hub access |
| Plan & usage | Verified entitlements, definitions, current usage and change consequences |
| Billing & subscription | Renewal, invoices, payment methods, cancellation and recovery |
| Account & security | Identity changes, MFA, session management and recovery |
| Ownership & access | Commercial roles, handover and billing responsibility |
| Data & privacy | Export, requests, deletion, closure and status |
| Help | Searchable guidance, support contact and service status |

### Work

- [ ] S5-01 Implement this structure with consistent language, accessible navigation, mobile behaviour and redirects from existing routes.
- [ ] S5-02 Keep hub operations in hub-platform while making product-site/hub navigation understandable. Preserve intended destinations through sign-in, verification and recovery; avoid sending returning clients into signup unnecessarily.
- [ ] S5-03 Build an outcome-led onboarding checklist: verified identity, hub regional setup, branding/content, legal/contact readiness, first offer, payment readiness where needed, domain status and first real registration.
- [ ] S5-04 Distinguish required from optional steps by tier and chosen workflow. Allow safe resumption after checkout abandonment, provisioning failure, email failure and interrupted handoff.
- [ ] S5-05 Expose customer-appropriate status and support reference for asynchronous setup and billing. Do not expose internal secrets or diagnostic implementation language.
- [ ] S5-06 Add organisation and billing-contact editing with appropriate verification, audit history and cross-app consistency.
- [ ] S5-07 Make usage definitions and approaching limits visible before blocking activity. Show an actionable explanation at the point of restriction.
- [ ] S5-08 Keep member personal controls coherent with bookings, membership changes and billing; distinguish membership cancellation, booking cancellation and privacy deletion.
- [ ] S5-09 Produce help for setup, payments, migration, cancellation, downgrade, privacy, ownership and recovery. Route support with relevant non-sensitive context.

### Gate and QC focus

Walk complete new and returning client journeys on mobile and desktop, including signed-out/expired sessions, unverified owners, unavailable providers and partial setup. Test keyboard/focus and clear errors. Audit whether clients can complete tasks without understanding application boundaries, remediate and re-audit.

## 12. Stage 6 — Public product site, pricing and market positioning

### Positioning and evidence

- [ ] S6-01 Validate the initial segment hypothesis: organisations running repeat programmes, memberships and events using disconnected websites, spreadsheets, forms and payment links.
- [ ] S6-02 Establish a precise positioning statement around connected website, membership, booking and operational workflows. Do not imply a discussion-first network or full LMS without evidence.
- [ ] S6-03 Validate course scope against implemented scheduling, capacity, registration and attendance/completion. Specify explicitly any unsupported lesson authoring, video curriculum, assessments or certification.
- [ ] S6-04 Substantiate each testimonial/logo with source, permission, accurate attribution and permission scope. Remove illustrative material from customer-proof sections; clearly label demonstrations.
- [ ] S6-05 Replace or validate preview assets against current, representative screens with safe demonstration data. Provide a useful walkthrough before account creation.
- [ ] S6-06 Rebuild homepage around specific customer/problem, actual workflow, concrete features, verified proof, plan comparison, onboarding/migration, trust/exit information and relevant calls to action.
- [ ] S6-07 Offer Start free, See the platform and a genuinely staffed setup-enquiry route. Do not promise response times without capacity.

### Pricing and commercial clarity

- [ ] S6-08 Publish a comparison tied to the capability register: member limits, Free's three active upcoming events, recurring events, courses, RSVP/reminders, group bookings, external/native payments, custom domain, branding and reporting.
- [ ] S6-09 Define active members/events, cap enforcement and existing-data behaviour. Reconcile the comparison with backend guards and actual production enablement.
- [ ] S6-10 Disclose GBP SaaS charges, VAT/tax treatment, billing period, automatic renewal, refunds, upgrades/proration, downgrades and cancellation timing.
- [ ] S6-11 Explain connected-account requirements, supported payment markets, actual platform fees and separate provider fees; distinguish member and SaaS payment models.
- [ ] S6-12 Define storage, email, processing and support allowances plus fair-use terms. Validate the economic and capacity basis of unlimited-member wording.
- [ ] S6-13 Specify custom-domain inclusions, setup responsibility, branding removal, reporting scope and support levels concretely.

### Information architecture and technical delivery

- [ ] S6-14 Deliver substantive pages for how it works, memberships, events/bookings, scheduled courses, payments, pricing, migration/onboarding, help/contact, security/data handling and legal/subprocessors. Prioritise depth over thin feature pages.
- [ ] S6-15 Add unique metadata, canonical URLs, share previews, sitemap, deliberate robots rules and appropriate noindex for account/action-link routes. Keep authentication as the actual access boundary.
- [ ] S6-16 Provide branded error/recovery pages, useful internal linking and meaningful content aligned to validated buyer questions.
- [ ] S6-17 Measure public performance before changing architecture. Assess session-aware marketing navigation versus cacheable public content; never cache personalised account data publicly.
- [ ] S6-18 Set performance budgets from baseline and representative mobile/network conditions; verify Core Web Vitals, loading, layout stability and conversion impact after changes.
- [ ] S6-19 Audit against WCAG 2.2 AA: keyboard, focus, contrast, zoom/reflow, labels/errors, custom selects, mobile drawer, dialogs, motion and assistive-technology usage. Include authenticated routes and email-linked flows.
- [ ] S6-20 Publish only substantiated security, residency, availability, recovery and certification claims. Align trust pages with actual contracts and operations.
- [ ] S6-21 Establish and implement a coherent visual specification using the existing product-site tokens/components: hierarchy, type, spacing, colour/contrast, imagery, responsive layouts and interaction states. Keep hub-platform frontend ownership separate. Review representative public, account and legal pages in real browsers; require both visual and functional/accessible quality rather than accepting copy-only or screenshot-only completion.

### Gate and QC focus

Every material claim maps to verified product evidence and a current commercial policy. Audit content fidelity, pricing-to-checkout consistency, mobile/browser rendering, accessibility, indexing and performance. Correct findings and re-audit; do not equate screenshot polish with buyer readiness.

## 13. Stage 7 — Operations, assurance and controlled-launch gate

### Work

- [ ] S7-01 Establish monitored production checks for public routes, signup/verification, account access, billing sync, provisioning, hub handoff, native payments, domains, notifications, exports and deletion jobs.
- [ ] S7-02 Verify scheduler deployment and execution evidence for reconciliation, reminders, retention and maintenance; code or a runbook alone does not prove a job runs.
- [ ] S7-03 Set internal service/recovery objectives from requirements and demonstrated capability. Exercise database and file restore, tenant recovery, deletion replay and service-provider outages.
- [ ] S7-04 Publish support scope/hours/contact and establish incident triage, named responsibility, escalation, customer communications, privacy incident handling and post-incident corrective actions.
- [ ] S7-05 Provide an appropriately independent status channel, incident history and support guidance. Avoid misleading all-green indicators when upstream customer workflows are failing.
- [ ] S7-06 Complete provisioning/billing/payment/domain/notification recovery runbooks and operator training, reusing existing tooling.
- [ ] S7-07 Verify transactional email delivery, branded links, cancellation/closure receipts, retries, bounce handling and separation from optional marketing preferences.
- [ ] S7-08 Establish CI/release checks, relevant behavioural and integration suites, dependency review, staging migration rehearsal, release notes and rollback procedures. Do not rely only on tests that mirror source structure.
- [ ] S7-09 Obtain an appropriately scoped independent security assessment for the customer-data/payment surface; remediate material findings and retest before stronger enterprise assurances.
- [ ] S7-10 Check production DNS, wildcard/custom hosts, Firebase allowed domains, email sender configuration, Stripe prices/portal/webhooks, cross-app trust and shared rate limiter without exposing secrets.
- [ ] S7-11 Run a whole-product QC audit across stages, focusing on inconsistencies between individually passing components. Update implementation from findings and repeat the release audit.
- [ ] S7-12 Replace required business placeholders and verify the actual contracting party, contact routes, tax configuration, payment-provider identity and founder support capacity. Confirm the commercial policy baseline below against demonstrated operations before publishing its promises.
- [ ] S7-13 Rehearse separately deployed app/schema/provider changes with release flags, migration/backfill, rollback/compensation and scoped disable controls. Confirm metrics/alerts have actionable thresholds and demonstrate a failed-job alert reaching the actual operator. Set measured workload/recovery budgets before signing off capacity claims.

### Controlled-launch gate

- [ ] Required legal material is published, reviewed and accessible before signup.
- [ ] Buyers can understand actual charges, limits and supported payment behaviour.
- [ ] Verified purchase, activation, cancellation and entitlement flows work.
- [ ] Export, erasure and closure fulfilment is verified; any interim manual operation meets stage 4's conditions and remains tracked.
- [ ] Ownership and billing handover has a verified safe process.
- [ ] Critical/high security, privacy, billing and access findings are closed.
- [ ] Support, alerting and restoration are exercised, with accountable coverage.
- [ ] Public proof and claims are substantiated.
- [ ] The enterprise copy gate has passed for all released customer journeys; audit findings have been corrected and the implemented wording re-audited.
- [ ] Relevant accessibility blockers are corrected.
- [ ] A defined pilot scope, capacity limit and incident/rollback plan are recorded.

Passing this gate permits a controlled release; it does not complete the enterprise programme or its outstanding automation/procurement work.

## 14. Stage 8 — Market validation and repeatable acquisition

### Work

- [ ] S8-01 Recruit a manageable cohort in the selected segment. Record selection criteria, assisted onboarding capacity and supported use cases.
- [ ] S8-02 Observe first setup and repeated operating cycles. Measure time to first published offer and real registration, payment readiness, assistance, repeated use and cancellation reasons.
- [ ] S8-03 Implement a durable, privacy-aware event/reporting pipeline from qualified visit through signup, verification, configured hub, first offer, first registration, repeat use and paid retention. Existing browser hooks alone are insufficient.
- [ ] S8-04 Define event schemas, deduplication, stage ownership, retention and consent treatment. Prevent sensitive account/payment information from entering analytics.
- [ ] S8-05 Establish baseline conversion, cohort retention and support burden before setting numeric targets. Segment assisted versus self-service results.
- [ ] S8-06 Calculate unit economics using actual hosting, storage, email, payment-support, onboarding and acquisition costs. Stress-test unlimited-member and high-usage cases.
- [ ] S8-07 Test migration guidance and usable exports with real-shaped data. Offer clearly priced assisted setup/migration where viable; define scope and customer responsibilities.
- [ ] S8-08 Produce permissioned case studies with measurable outcomes. Test segment-specific outreach and partnerships before expanding paid acquisition.
- [ ] S8-09 Feed observed friction and churn back into the requirement and audit registers. Implement improvements, assess tradeoffs and re-audit affected journeys before scaling.

### Gate and QC focus

Demonstrate repeated customer value, viable support load and an evidence-backed acquisition proposition. Define scale-up criteria using actual cohort data. Do not treat signup counts alone as product-market validation.

## 15. Stage 9 — Enterprise procurement and sustained assurance

These requirements remain in scope for the enterprise objective. Sequence expensive capabilities against verified procurement needs; do not sell them until delivered. If the user chooses to defer them, record the scope restriction and review milestone explicitly.

- [ ] S9-01 Complete an enterprise procurement pack: legal entity, SaaS terms, DPA, subprocessors, security overview, incident process, support responsibilities, retention/deletion and evidence-backed recovery/availability information.
- [ ] S9-02 Specify and implement SSO for required providers/protocols, tenant policy, provisioning/deprovisioning requirements, recovery and session revocation. Test tenant isolation and account-linking risks.
- [ ] S9-03 Extend granular commercial/administrative roles, delegated billing and customer-visible audit history with privacy-aware access and retention.
- [ ] S9-04 Design multi-workspace ownership and administration deliberately, including identity uniqueness, billing allocation, legal authority, tenant switching and migration from the current account model.
- [ ] S9-05 Deliver procurement invoicing and contracted service levels only where finance/support operations can fulfil them; define exclusions, measurement and remedies.
- [ ] S9-06 Validate data-residency options end to end, including auth, billing, support, logs and backups. Do not infer residency from one database region.
- [ ] S9-07 Establish recurring independent assessment and an evidence programme for relevant certification if justified. Record certification scope and status accurately.
- [ ] S9-08 Run periodic entitlement/claim reviews, access reviews, restore/deletion drills, incident exercises, dependency reviews and privacy/legal updates at documented cadences.
- [ ] S9-09 Complete a final enterprise-readiness audit against the full coverage register; implement corrective work and re-audit. Report remaining limitations openly.

### Gate and QC focus

Enterprise capabilities are verified in their promised deployment scope, contracts match demonstrated operations and no mandatory requirement is labelled complete through a deferral. Preserve routine assurance after the programme closes.

## 16. Audit finding coverage register

All rows start **Not started**. Update status and evidence here as work proceeds; implemented-in-source baseline findings still require the verification specified above.

| ID | Original finding or recommendation | Accountable implementation items |
| --- | --- | --- |
| F01 | Missing Hubforj terms/privacy routes and legal navigation | S1-02, S1-04, S1-08 |
| F02 | Legal entity, contacts, customer classification and commercial terms unclear | S1-01, S1-02 |
| F03 | Missing product-site acceptance/version evidence and change process | S1-09, S1-10 |
| F04 | Separate Hubforj/customer/member legal relationships and DPA | S1-04, S1-05, S1-11 |
| F05 | Data flows, vendors, transfers, retention and rights disclosures | S1-04–S1-07, S4-10–S4-17 |
| F06 | Tenant legal fallback, readiness, owner responsibility and capability changes | S1-11–S1-14 |
| F07 | Cookie inventory, actual optional technology and appropriate consent | S1-15, S8-04 |
| F08 | Cancellation already implemented but obscured by Upgrade/Move to Free | S3-01, S3-03, S3-04 |
| F09 | Ambiguous reversal and portal access during scheduled changes | S3-02, S3-04 |
| F10 | Downgrade effects on limits, domains, courses, records and financial obligations | S1-03, S3-05, S6-09 |
| F11 | Cancellation receipts, renewal, retries, portal and webhook verification | S3-03, S3-08–S3-10, S7-07 |
| F12 | Actual charges, tax, refunds, proration and failed-payment clarity | S1-02, S3-02, S3-06, S3-07, S3-13, S6-10 |
| F13 | Distinguish cancellation, identity deletion, member erasure and workspace closure | S4-01–S4-09 |
| F14 | Missing full personal/workspace export and tracked privacy requests | S4-02–S4-05, S4-17 |
| F15 | Erasure across derived data, vendors, jobs, logs, files and backups | S4-10–S4-16 |
| F16 | Owner/shared identity and multi-attendee deletion consequences | S2-04, S2-05, S4-06, S4-07 |
| F17 | Manual fulfilment tradeoff and automation completion | Stage 4 temporary-control gate, S7 controlled-launch gate |
| F18 | Operational transfer does not itself transfer commercial authority | S2-04, S2-05, S5-06 |
| F19 | Account navigation, security/data/help controls and cross-app continuity | S5-01, S5-02, S5-06–S5-09 |
| F20 | Outcome-based activation, partial failure and useful account overview | S5-03–S5-05 |
| F21 | Stale native-payment documentation and missing capability authority | S0-03, S0-04 |
| F22 | Free event limit and full tier matrix omitted from pricing | S6-08, S6-09 |
| F23 | Active-member definition, supported caps and approaching-limit experience | S5-07, S6-09 |
| F24 | External/native payments, Stripe readiness, fees and market support | S3-12, S6-11 |
| F25 | Recurring SaaS versus one-off member checkout expectations | S3-11, S6-11 |
| F26 | Course-management versus full LMS expectations | S6-02, S6-03 |
| F27 | Unlimited members versus storage/email/support economics | S6-12, S8-06 |
| F28 | Custom-domain, branding, reporting and support inclusions vague | S6-13 |
| F29 | Generic positioning, customer segment and operational differentiation | S6-01, S6-02, S8-01 |
| F30 | Demonstrable workflows, homepage sequence and appropriate CTAs | S6-05–S6-07 |
| F31 | Testimonial/logo substantiation and preview fidelity | S6-04, S6-05, S8-08 |
| F32 | Missing substantial feature, payment, migration, help and trust pages | S5-09, S6-14, S6-20 |
| F33 | Revocation, MFA, global logout and sensitive-action protection | S2-01–S2-03 |
| F34 | Distributed rate limiting and failure behaviour | S2-07 |
| F35 | CSP/framing protection and deployed security headers | S2-08 |
| F36 | CSV spreadsheet formula handling | S2-09 |
| F37 | Support access, tenant security and technical trust | S2-06, S2-10–S2-12, S7-09 |
| F38 | Restore, reconciliation, provisioning/domain/email recovery and runbooks | S7-01–S7-08 |
| F39 | Unsupported uptime, residency, recovery or certification claims | S6-20, S7-03, S9-01, S9-05–S9-07 |
| F40 | Generic metadata, missing sitemap/robots, indexing and errors | S6-15, S6-16 |
| F41 | Dynamic marketing caching tradeoff and unmeasured performance | S6-17, S6-18 |
| F42 | Unmeasured rendered accessibility/mobile usability | S5-01, S6-19 |
| F43 | Analytics hooks versus durable, privacy-aware lifecycle reporting | S8-02–S8-05 |
| F44 | Controlled launch, retention/value validation and support capacity | S7 launch gate, S8-01, S8-02, S8-05 |
| F45 | Migration services, evidence-led acquisition and unit economics | S8-06–S8-09 |
| F46 | Advanced enterprise identity, roles, audit, multi-workspace and procurement | S9-01–S9-09 |
| F47 | Baseline rights/security must apply across plans | Section 3, S3-05, S4-02, S9-05 |
| F48 | Audit evidence limitations and need for whole-lifecycle assurance | S0-01, S0-07, S7-11, S9-09 |

Additional user requirement R49: enterprise-quality copy must be implemented throughout the customer experience. Coverage: COPY-01–COPY-06 and the mandatory editorial acceptance gate in section 4.

Additional user clarification R50: development contains mock data only; no company or existing customer contracts; founder is the sole operator; business-fact placeholders are authorised during development and commercial recommendations should be researched. Coverage: section 1, S0-09, S7-12 and the commercial policy baseline below.

Additional user requirement R51: no isolated implementation without assessing the current repo and preserving supported behaviour. Coverage: section 4's mandatory repo assessment, regression/state/deployment gates, S0-10–S0-11, S2-13, S3-14–S3-16, S4-18–S4-19, S6-21 and S7-13. The final plan audit and its evidence are recorded in [the plan audit report](product-site-enterprise-upgrade-plan-audit-2026-09-07.md).

Second repo-alignment pass: RA01–RA06 in the same report clarify historical legal storage, unchanged-content acknowledgement, current-tier refund handling, cancelled-package inconsistencies, existing-identity reuse and runtime/test execution. Coverage: S0-12, S1-18, S2-14, S3-14 and S3-16. These remain implementation/verification requirements, not completed fixes.

## 17. Decision and tradeoff register

The following dispositions were recorded on 2026-09-07 in response to the user's request for senior engineering judgement. **Engineering baseline** establishes the technical direction for planning and implementation, subject to evidence and QC. **Recommended default** is a reversible product recommendation, not a validated market fact. **Facts required** identifies a limited business/legal input; it does not block independent technical work. No disposition implies that implementation has occurred or that the user has approved a new commercial commitment.

Codex should resolve routine engineering, security, UX and editorial choices autonomously, document tradeoffs and revisit them when evidence warrants it. Do not repeatedly ask the user to choose implementation mechanisms. Do not invent the legal entity, tax status, staffing, existing customer commitments or testimonial permission.

| ID | Decision | Recommended direction / tradeoff to assess | Needed by |
| --- | --- | --- | --- |
| D01 | Legal entity, markets and B2B/consumer scope | Reflect actual contracting activity; obtain appropriate advice | Stage 1 |
| D02 | Initial customer segment | Validate repeat-programme/membership/event operators; avoid overly broad positioning | Stages 6, 8 |
| D03 | Tax, refund, cancellation and price-change policy | Clear monthly terms; straightforward exit; applicable rights preserved | Stages 1, 3 |
| D04 | Downgrade and over-limit treatment | Preserve records and financial resolution; define restricted new activity | Stages 1, 3 |
| D05 | Operational/commercial owner and billing roles | Explicit separation with verified transfer; assess complexity versus continuity | Stage 2 |
| D06 | Retention, closure recovery and backup windows | Data-class-specific, legally justified and technically enforceable | Stages 1, 4 |
| D07 | Interim manual privacy fulfilment | Only staffed/tested for controlled launch; automation remains required | Stages 4, 7 |
| D08 | MFA policy and account recovery | Prioritise privileged accounts; avoid insecure support bypass | Stage 2 |
| D09 | Member payment/renewal scope | State one-off behaviour accurately; recurring billing requires its own specification if added | Stages 3, 6 |
| D10 | Fees, allowances and unlimited usage | Publish actual economics and fair-use limits without hidden material restrictions | Stages 3, 6 |
| D11 | Legal readiness with immediate public availability | Gate relevant registration/commerce safely; preserve existing save-and-accept model | Stage 1 |
| D12 | Marketing personalisation versus caching | Measure benefit/cost; public caching must never leak account content | Stage 6 |
| D13 | Analytics, consent and measurement | Durable minimal events; lawful use, documented retention and no sensitive payloads | Stage 8 |
| D14 | Support hours, recovery objectives and service levels | Match staffing and demonstrated recovery; distinguish internal targets from promises | Stage 7 |
| D15 | Enterprise SSO/multi-workspace/residency/certification sequence | Verify procurement need and dependencies; do not quietly remove requirements | Stage 9 |
| D16 | Proof authenticity and permissions | Substantiate or remove from proof sections; label demos | Stage 6 |
| D17 | Existing-account and tenant migration | Grandfathering, notifications, legal acceptance, roles and retention migration need explicit treatment | Stages 1–5 |

For each resolution append date, accountable decision-maker, alternatives, rationale, user impact, security/privacy implications, cost, mitigation, review trigger and affected requirements. Record rejected alternatives where they explain a material tradeoff.

### Decision dispositions and implementation direction

| ID | Disposition | Senior engineering direction | Remaining input / verification |
| --- | --- | --- | --- |
| D01 | Development facts resolved; launch facts pending | No company exists yet. Build organisational accounts, legal templates and tax-capable flows with registered business-fact placeholders. Recommend an initial UK organisational customer focus, retaining GBP SaaS billing. Do not classify every hub buyer as legally B2B automatically. | Actual contracting identity, trading details, tax status and market applicability are launch prerequisites, not blockers to placeholder-based development |
| D02 | Recommended default | Start with small organisations running repeat events, scheduled courses and memberships. Lead with operational workflows and validate with a supported cohort before narrowing the vertical. | Customer interviews and usage evidence; user need only steer if an existing committed market differs |
| D03 | Research-backed development baseline | Use the commercial policy baseline below for monthly renewal, cancellation, first-purchase refunds, upgrades, downgrades and price notices. Preserve applicable rights. There are no existing contracts to review. | Verify legal applicability and actual tax status before live publication; recommended policy numbers are business choices, not statutory claims |
| D04 | Engineering baseline | Never automatically delete records to meet a lower plan cap. Preserve member access, fulfilment of existing commitments, refund administration and export; restrict new activity that exceeds entitlement. Retain access to existing paid courses/bookings. Preflight domain loss, offer a working Hubforj address and disclose cutover timing. | Validate domain routing and entitlement details in the downgrade specification; test above-limit and ongoing-booking cases |
| D05 | Engineering baseline | Separate operational owner, commercial owner and billing contact. Require recipient acceptance and recent authentication for commercial handover, audit the transition and reconcile cross-app state. Do not silently reassign an external Stripe merchant account. | Verify provider-supported merchant ownership handling and any existing contractual transfer restrictions |
| D06 | Engineering baseline + facts required | Use a data-class retention registry, durable erasure jobs, short-lived exports, minimal audit evidence and backup deletion replay. Explicit closure and personal erasure are separate. Do not use an arbitrary universal retention period. | Legal retention bases and actual provider backup capabilities determine final durations; document and test these before making deletion promises |
| D07 | Engineering baseline | Prefer automated export and durable deletion for general launch. A secure staffed process is only a controlled-pilot fallback, with due-date alerts, capacity evidence and a dated automation milestone. | Identify the real fulfilment operator and capacity before enabling the fallback; if unstaffed, do not rely on it |
| D08 | Engineering baseline | Require MFA for platform staff and privileged customer owner/admin access; provide secure enrolment, recovery codes, all-device logout and recent authentication for high-impact changes. Keep member MFA availability/policy distinct. | Verify identity-provider capabilities/cost and rehearse loss-of-factor recovery; use staged enrolment for existing accounts |
| D09 | Engineering baseline | Describe current member payments as one-off where implemented; do not imply automatic renewal. Keep recurring member billing as a separately specified capability, not an accidental expansion of this upgrade. | Validate all payment paths and publish supported durations/renewal behaviour from evidence |
| D10 | Research-backed development baseline | Retain Free/£19 Starter/£49 Growth monthly for initial validation; recommend 0% additional Hubforj transaction fee for a bounded pilot, subject to payment-model cost verification. Provider fees remain separate. No automatic overage charging. | Validate actual Connect liability/configuration and unit costs before live pricing; allowances and tax presentation remain explicit prelaunch decisions, not existing contracts |
| D11 | Engineering baseline | Preserve immediate public availability and save-and-accept legal editing. Allow setup/preview; gate new member registration and new paid sales on defined legal/contact readiness. Protect existing account access and fulfilment during migration. | Define non-empty/content-readiness checks and carefully scoped, audited exceptions; legal adequacy still requires appropriate review |
| D12 | Engineering baseline | Prefer cacheable anonymous marketing content with a small isolated account-aware navigation element. Keep protected data private and out of shared caches; measure before and after changing rendering. | Confirm hydration/accessibility behaviour and performance benefit; retain current rendering if the change adds complexity without benefit |
| D13 | Engineering baseline | Use a minimal first-party event contract, server-confirmed business milestones, pseudonymous identifiers, deduplication and documented retention. Exclude raw emails, billing data and sensitive text. Avoid advertising trackers by default. | Verify legal treatment of actual technologies; server-side collection is not automatically exempt from privacy/consent requirements |
| D14 | Founder context resolved; capacity pending | Design asynchronous founder-led support and documented incident triage. Use placeholders for uncommitted hours/contact details. Recommend an internal two-UK-business-day normal-response target for a bounded pilot; promise no 24/7 coverage or contractual SLA. | Founder must demonstrate capacity and set actual availability before public support promises; there are no existing service commitments |
| D15 | Engineering baseline | Sequence baseline security/MFA and auditability first, then procurement materials and demand-led SSO/delegated access. Design multi-workspace, residency and certification against concrete requirements; keep conditional items tracked and accurately described. | Buyer requirements, delivery budget and independently established certification/residency evidence; no silent scope removal |
| D16 | Mock-only context resolved | Current clients are mock. Treat their names/logos/quotes as demonstrations, not endorsements. Public proof should use real product workflows until genuine pilot evidence and permission exist. | Future case studies require genuine source evidence and permission; no current customer permission exercise is needed |
| D17 | No legacy contracts; engineering safeguards retained | Use mock fixtures to test versioned/resumable schema and lifecycle migrations, dry runs and rollback/compensation. No current grandfathering or contract-renegotiation project is required. Do not delete/reset mock hubs without an explicit task requiring it. | Reassess migration/notification duties when the first real customer is onboarded; never fabricate historical legal acceptance |

### Rationale, tradeoffs and review triggers

- **Customer continuity (D03–D05, D11, D17):** preservation and staged transitions require more explicit entitlement states and migration work, but avoid data loss, stranded members and surprise commercial changes. Review when real migration fixtures expose contradictions or contractual restrictions.
- **Privacy and security (D06–D08, D13):** revocation, MFA, durable deletion and minimal telemetry increase initial engineering work. Recovery procedures, tested vendor capabilities and scoped operational access mitigate lockout and fulfilment risks. Review after security assessments, restore drills and provider changes.
- **Focus and maintainability (D02, D09, D12, D15):** focused positioning and incremental architecture reduce unsupported promises and unnecessary complexity. They delay speculative features; validate that tradeoff with customers, performance evidence and procurement demand rather than feature-count targets.
- **Commercial truth (D01, D03, D10, D14, D16):** engineering can build the controls and recommend defaults, but cannot create legal facts, economic capacity or endorsement permission. Keep affected public claims pending while proceeding with specifications and implementation that do not depend on those facts.

Record implementation evidence and named accountable business owners as they become available. These engineering dispositions do not bypass the stage-specific QC cycle or specialist legal/financial review.

### Researched commercial policy baseline — 2026-09-07

The following recommendations are selected for implementation planning for a founder-operated prelaunch SaaS. They are concrete defaults for development, not claims that a universal “best” policy has been proven. The founder can steer them; routine development need not wait for repeated approval. Public contractual promises require S7-12 verification. Existing GBP pricing is retained; no code, live Stripe settings or published policy is changed by this document.

| Topic | Recommended baseline | Rationale and implementation/QA requirements |
| --- | --- | --- |
| Initial sales scope | UK-focused organisational pilot; monthly GBP billing | Reduce initial support/tax/market complexity while validating demand. Do not assume geography or B2B status solely from currency or email; verify applicable selling obligations. |
| Plans | Free £0, Starter £19/month, Growth £49/month as initial price hypotheses | Preserve current catalogue while measuring willingness to pay and support costs. Show the actual tax-inclusive total wherever required. No claim that these prices are permanently optimal. |
| Trial model | Useful Free tier; no card required for Free; no automatic conversion from Free to paid | Existing Free architecture already supports evaluation. Avoid a second time-limited paid-trial lifecycle until there is evidence it improves activation. Use guided demos for premium features. |
| Renewal and cancellation | Monthly advance billing; cancellation at any time stops the next renewal, with paid access through the confirmed period end | No cancellation fee or support requirement. A request racing renewal must produce a clear invoice/cancellation outcome. Keep proof, invoices and export available after downgrade. |
| First paid purchase guarantee | Offer a full first-subscription-payment refund when requested within 14 calendar days of that payment, once per commercial account | Reduces buyer risk without annual lock-in. Treat this as an additional commercial promise, not the statement of statutory cooling-off rules. End the paid subscription promptly on a confirmed guarantee refund, explain the timing, preserve data on Free and confirm no next renewal. Define eligibility and repeated-account abuse handling without obstructing applicable rights. |
| Later cancellations/refunds | No automatic prorated refund for ordinary mid-cycle cancellation after the introductory guarantee; access continues to period end. Correct duplicate/erroneous charges and apply legally required remedies separately. | Avoid subjective refund handling while retaining fairness. A disputed non-delivery/outage claim needs review and cannot be rejected solely under the ordinary-cancellation policy. No blanket “no refunds” wording. |
| Upgrades | Show the incremental prorated amount; apply paid entitlement only after successful payment; preserve the original renewal date where supported | Preview and commit must use consistent Stripe calculations. Test unpaid invoices, payment authentication, concurrent changes and failed upgrades. Do not credit unpaid service as if it were paid. |
| Downgrades | Effective at next renewal, including move to Free | No retroactive price changes or automatic deletion to meet limits. Preserve existing obligations and provide a preflight summary of disabled/new-activity restrictions. |
| Failed renewals | Proposed seven-calendar-day grace period for an existing paid customer's first failed renewal, with provider retries and clear notifications; then restrict new paid activity and move to the disclosed recovery state | This is a product choice, not Stripe's mandated schedule. Reconcile dunning, outstanding invoice treatment, retries and entitlements so customers cannot be charged later for an undisclosed service period. Never delete data for a failed payment. Verify the complete schedule before enabling it. |
| Price increases | At least 30 calendar days' direct notice; increases take effect at a renewal after the notice window, with a clear cancellation route | No silent immediate price changes, lifetime-price guarantee or open-ended grandfathering promise. Record notification delivery and exact effective invoice. Recheck any stricter applicable requirements. |
| Annual/lifetime offers | Do not launch with annual prepayment, lifetime deals or complex discount stacking | Monthly contracts simplify refunds, support and learning about retention. Reconsider annual pricing only after reliable cohorts and refund/revenue processes exist. |
| Hubforj transaction fee | Recommend 0% additional Hubforj application fee during a capacity-bounded pilot; Stripe/provider fees remain payable under the verified model | Simple positioning and easy cost comparison. Confirm Connect configuration before promising it: different models allocate account, payout and processing costs differently. No “free payments” or permanent zero-fee promise. Track costs per active hub and payment volume. |
| Payment responsibility | Communities handle their offers, fulfilment and member-facing policies; Hubforj provides the verified platform/payment integration | Describe actual refund/dispute/payout responsibilities and provider contractual roles. Do not advertise Hubforj as merchant of record without adopting and verifying that model. |
| Usage and overages | No automatic overage invoices at launch; publish clear included limits before sale, meter resource use and warn before enforcement | Keep safety/rate limits distinct from commercial quotas. Do not select arbitrary storage/email numbers without load and cost measurements. Treat usage ceilings as required prelaunch decisions; offer a clear upgrade or reviewed exception rather than surprise charges. |
| Support | Founder-led asynchronous email support and useful self-service help; internally aim to respond to ordinary requests within two UK business days during the controlled pilot | Target is not a guarantee and needs capacity evidence before public use. Prioritise access, payment, privacy and security incidents. Use placeholders for actual hours/address; do not imply a staffed team, instant chat, 24/7 support or contractual uptime SLA. |
| Onboarding/migration | Guided self-service included; bounded assisted pilot sessions; later quote separately for substantial migration work | Track founder time. Do not promise unlimited free implementation or custom development within £19/£49 plans. |
| Tax | Implement configurable tax treatment and explicit test scenarios; keep real registration and tax wording as placeholders until established | Do not add VAT merely because an incorporation is planned, infer exemption from development status, or assume Stripe calculates/remits all tax automatically. Verify the actual seller, registration and cross-border obligations before real sales. |

Research basis and limits:

- GOV.UK lists seller identity/contact, price and cancellation information relevant to distance selling. This supports resolving truthful business facts before actual sales; it does not require incorporation as the only possible trading structure. [Distance selling guidance](https://www.gov.uk/online-and-distance-selling-for-businesses)
- Current UK VAT guidance sets a £90,000 taxable-turnover registration threshold in the stated circumstances and also describes voluntary registration and other triggers. This is a dated planning reference, not a determination of Hubforj's future liability. [VAT registration guidance](https://www.gov.uk/register-for-vat/when-register-for-vat)
- Stripe's Connect pricing distinguishes Stripe-handled pricing from platform-handled pricing; their cost allocations differ. Verify the actual configuration before fixing transaction-fee economics. [Connect pricing](https://stripe.com/gb/connect/pricing)
- Stripe's standard pricing states that original processing, Connect and currency-conversion fees are not returned on refunds. Budget for refund costs; do not automatically deduct them from the promised introductory full refund. [Stripe UK pricing](https://stripe.com/gb/pricing)
- Stripe documents prorations and payment-retry behaviour. Implement and test these against the chosen Hubforj policy rather than treating provider defaults as the customer contract. [Proration documentation](https://docs.stripe.com/billing/subscriptions/prorations), [Smart Retries documentation](https://docs.stripe.com/billing/revenue-recovery/smart-retries)

The 14-day introductory guarantee, 30-day price notice, seven-day renewal grace period and two-business-day internal support target are reasoned Hubforj policy recommendations. The cited sources do not establish that these numbers are legally mandated or commercially optimal. Reassess them after pilot evidence, legal review and cost measurement.

Implementation mapping: D03/S1-02/S3-03/S3-06–S3-10 implement refund, renewal, charge-preview, grace and notice behaviour; D10/S6-10–S6-13/S8-06 implement fee/allowance economics and copy; D14/S7-04/S8-01 implement founder support capacity; S7-12 verifies placeholders and all promises before release. Add policy-specific positive, negative and boundary tests, run QC, correct findings and re-audit.

## 18. Quality-control findings and remediation log

Slice 001 has undergone Codex implementation self-review, corrective test/lint updates and focused re-audit. See [slice 001 evidence](product-site-enterprise-slice-001-identity-reuse.md). Independent, browser and provider assurance remain outstanding.

A detailed **plan-level** audit was performed on 2026-09-07. It identified 16 gaps/ambiguities, amended the plan and rechecked coverage. See [the audit report](product-site-enterprise-upgrade-plan-audit-2026-09-07.md). These findings are addressed in the plan only; the associated implementation and production risks remain open until the new work items are implemented and verified.

| Finding ID | Stage / requirement | Severity | Evidence / reproduction | Gap or tradeoff | Corrective update | Owner | Re-audit result | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| QC-004 | Slice 004 / S2-14 | High identity/partial-state risk | Identity followed hub creation; no durable recovery | Provider recovery and lifecycle reconciliation remain open | Identity-first operation, atomic ownership, fresh-auth/throttle/disable controls; password and redirect fixes | Codex; founder accountable | 45 focused tests, build and local viewport/disable checks pass; full-suite baseline comparison recorded | Implemented locally; release gate disabled; provider assurance and baseline remediation open |
| QC-005 | Slice 005 / S2-14, S2-15 | High ownership/recovery risk | Completed replay accepted removed ownership; pending completion could promote a non-owner | Browser/session and provider/lifecycle assurance remain open | Transactional ownership recheck and non-owner rejection; repeatable isolated emulator harness | Codex self-review; founder accountable | Both unit regressions failed before fixes; 47 focused + 13 emulator tests pass; changed-file lint clean | Bounded recovery verification complete; no deployment/launch sign-off |
| QC-003 | Slice 003 / S2-15 | High scalability/uniqueness risk | Hosted-address scans and unkeyed check/write race | Migration and rules required; old writers cannot bypass reservations | Shared atomic claims, coverage gate and auditable backfill | Codex; founder accountable | 25 focused tests and targeted lint pass; see slice 003 | Local code and provider backfill verified; reservation-aware deployment/access controls and full assurance pending |
| QC-002 | Slice 002 / S2-14 recovery foundation | High duplicate/partial-state risk | Hub creation is a separate batch without a durable replay record | Anonymous recovery remains unsafe; legacy address scan adds contention; deployed rules unknown | Optional atomic internal operation contract, conflict/missing-hub rejection, receiver acknowledgement | Codex; founder accountable | 33 focused tests and targeted lint pass; see slice 002 evidence | Local foundation only; full integration/access-control verification and signup adoption open |
| QC-001 | Slice 001 / S2-14 | High boundary risk | Existing-identity and linking behaviour tests | Unsafe credential replacement and UID rebinding | Create-only signup, verified fallback, transactional attachment | Codex; founder accountable | 19/19 isolated tests; targeted lint and scoped diff check pass | Local guardrails verified; provider/browser verification open |

Every completed stage must link its audit and corrective updates here, including an explicit no-findings result if applicable. Reopened defects return to remediation. Do not delete historic findings to make a stage appear complete.

## 19. Progress, brainstorming and change control

### Current position

- Master plan created from the 2026-09-07 audit and the user's enterprise-upgrade requirements.
- Slice 001 identity-reuse guardrails are implemented with focused behavioural tests. No production verification/deployment or full stage completion is claimed.
- Stage owners and delivery estimates remain to be assigned. The 17 decisions now have engineering dispositions/recommended defaults above; identified business facts and specialist determinations remain outstanding.
- Enterprise copy is an explicit implemented deliverable with six cross-stage work items and a mandatory editorial acceptance gate.
- Founder confirmed mock-only development, no company or existing contracts and undecided operating details. Registered business-fact placeholders are permitted during development; commercial launch still requires verified replacements. Commercial policy recommendations are recorded above for implementation planning.
- Slice 002 durable internal provisioning idempotency is now used by public signup through slice 004. Focused and emulator evidence is recorded in the closure handover; no full enterprise stage is marked complete.
- Slice 003 replaces hosted-address scans with bounded claims for all createHub callers. Creation now requires the documented address backfill/ready marker. Provider backfill completed on `community-app-c2f67` at 2026-09-07 19:33:21 UTC; a separate read-back verified seven claims and the ready marker. Deployment/access-control and full contention checks remain open; see the slice 003 operator runbook.
- Next execution task: verify reservation-aware deployment and outstanding access-control/concurrency checks before resuming creation; complete isolated provider recovery/ownership/handoff/checkout-continuation checks for slice 004 and resolve the affected baseline failures before enabling its provisioning switch. Address pre-operation/legacy partial signup reconciliation and authenticated existing-member onboarding in subsequent slices. Broaden Stage 0 baseline and complete the queued browser/provider/emulator/build/regression checks before release.
- Final plan audit added per-change repo assessment, compatibility contracts, regression/state matrices and explicit lifecycle/refund/export/design tasks. Execution must start with current repo evidence; this planning review is not an application regression-test pass.
- Second repo-alignment audit traced additional helper/mutation paths and added explicit identity/legal requirements. Targeted Node test execution was attempted but blocked because `node` is not installed/available in the current shell; no test result is inferred.

### Latest execution update

- Commit selection reviewed: exact local manifest contains 75 implementation/test/tool/documentation files; three unrelated changes excluded. See [handover commit instructions](product-site-closure-handoff.md). No files staged, committed or deployed during selection review.

- **Agreed stopping point reached:** STOP-01–08 closed for local account-access development. [Final handover](product-site-closure-handoff.md): 52 focused tests, 12 browser checks, 14 emulator integrations and 23 hub dependency tests pass; related cross-app checks have 22 passes/six existing TODOs. Production-copy build passes; lint has no errors/one existing warning. Founder confirmed inbox delivery of both actual email templates and the disposable test action codes passed. No live app/database/flag changes or deployment. Pause the wider programme here; future features are not runtime prerequisites. Preserve untracked files when saving the checkpoint.


- Bounded closure resumed at founder request: implementing STOP-01–08 from the stopping-point audit only. Current-account/UID/revocation checks, strict cookies, stale-hub rejection and truthful email status implemented; operator-only pre-operation reconciliation added. First closure focused run: 51 pass. Actual browser and expanded emulator checks are in progress, not yet accepted. Old cookies will require sign-in again. No live environment, provider mutation or deployment is part of this work.

- Stopping-point audit completed: [audit and bounded closure list](product-site-stopping-point-audit.md). No runtime dependency on future policy/cancellation/deletion features found. Existing session-authority/email-status issues, a pre-operation recovery gap and unfinished browser verification prevent calling account access fully complete. Rechecked 47 product and 23 hub focused tests: all pass. Two isolated account-context probes reproduced closed-account acceptance and deleted-ID email fallback. No application code, environment or provider state changed. Historical statements that signup remains unkeyed or testing remains deferred are superseded by slices 004/005 and this audit; no deployment/current provider-state assurance is claimed.

- Scope reassessment: founder questioned whether the enterprise programme has become disproportionate to the prelaunch product. Pause further browser-harness expansion while clarifying initial-launch essentials versus later roadmap work. [Slice 006](product-site-enterprise-slice-006-browser-session-assurance.md) contains scaffolding and audit observations only; its initial test run was stopped and no browser pass is claimed. Slice 005 passing evidence remains valid. Security, working account recovery, truthful policies/copy, billing cancellation and usable privacy fulfilment remain launch concerns; advanced enterprise capabilities should not automatically block a suitably limited first release.

**Testing instruction update:** the founder superseded the earlier full-testing deferral and requested checks/audits during implementation. Required checks must now be attempted and findings tracked; historical entries describing deferral remain historical evidence only. Missing provider, browser-journey or release assurance is outstanding work, not a waiver.

- Slice 005 [isolated signup/recovery integration tests](product-site-enterprise-slice-005-recovery-integration-tests.md) has passed its bounded emulator verification: actual production signup/recovery/internal receiver code now runs against dedicated local Auth/Firestore emulators with no live credentials. Reproduced and corrected two ownership gaps in completed/pending finalization; 47 focused tests and 13 real emulator integration tests pass. Changed-file lint and scoped whitespace checks pass. No environment file, live record, deployment or acquisition switch changed. This evidence supplements slice 004; browser cookies, provider checkout/email, handoff and release controls remain outstanding.
- Slice 004 [identity-first signup recovery](product-site-enterprise-slice-004-signup-recovery.md) implemented locally: UID-bound immutable operation, idempotent hub request, atomic ownership completion and explicit recent-auth recovery. Added default-off `PRODUCT_SITE_SIGNUP_PROVISIONING_ENABLED` gate; no local/live flag enabled or application deployed. Existing normal sign-in remains available.
- Verification: 45 focused product tests pass; full product-site build and desktop/mobile recovery rendering checks pass. Full product lint has zero errors/one existing webhook logging warning. Hub suite: 544 pass/27 fail/6 TODO, with the same 27 failures reproduced at tracked HEAD; [verification register](product-site-enterprise-verification-2026-09-07.md) lists every failure. Local browser check verified disabled recovery returns 503 before provider work. Full authenticated provider recovery/checkout/handoff and deployment assurance remain open.
- Founder confirmed all writers stopped. Refreshed the scoped address snapshot, applied slice 003 to `community-app-c2f67` and independently verified coverage: 7 claims, 1 missing hosted label filled, no existing slugs/labels changed. Migration run `c5d858be-3eb5-4911-b038-f09f0d3595d6` completed at 19:33:21 UTC; read-back at 19:33:48 UTC returned zero issues and version 1/status ready. Temporary before/after snapshots are recorded in the slice runbook. No application deployment or end-to-end smoke test performed; old writers must remain stopped until reservation-aware rollout is verified.


### Session update checklist

**Standing execution requirement:** Codex must update this master plan during every implementation session, after each bounded slice and before handing work back to the founder. Update it again whenever scope, dependencies, verification or rollout status changes. This is mandatory without a further reminder; a chat summary or an offshoot document alone does not satisfy it.

Each update must identify the affected task/slice, what changed, its actual status, verification performed or deferred, QC findings and corrective actions, remaining gaps/tradeoffs, migration/deployment prerequisites and the next concrete action. Keep supporting documents synchronized and link their evidence here. Preserve historical results; explicitly supersede stale statements. Do not equate code implemented, focused checks passed, migration applied, deployment completed or launch verified. A slice with missing progress documentation is not ready for handoff.

- [ ] Create or update supporting documents required for the current slice under DOC-01–DOC-08; add working links and record their status, dependencies and evidence in this master plan.
- [ ] Add new brainstormed requirements with unique IDs and acceptance criteria.
- [ ] Mark suggestions as proposed until decided; preserve accepted decisions and constraints.
- [ ] Map each new requirement to a stage and dependencies.
- [ ] Update stage/work-item status and evidence without marking unverified work complete.
- [ ] Record gaps, tradeoffs, remediation and re-audit outcomes.
- [ ] Reconcile affected sibling plans, help, legal documents and public claims.
- [ ] Record next concrete action and any external dependency.

### Outstanding address-reservation rollout — S2-15 / slice 003

**Required before hub creation can succeed on the new code:** complete the address-claim backfill and verify `platformMigrations/hubAddressClaimsV1` has version 1 and status `ready`. Until then, new hub creation fails closed. This affects both signup provisioning and platform-admin creation. Existing hub access is not gated by this marker.

Current evidence: reservation code and migration tooling implemented locally; 25 focused tests and targeted lint passed. **Provider backfill applied and independently verified on `community-app-c2f67`, 2026-09-07: 7 hubs/7 claims, zero coverage issues, marker version 1/status ready.** One previously absent hosted label was filled; all existing slugs/labels were preserved. No application deployment has been performed. Historical testing deferral was superseded; completed targeted/emulator checks are recorded in the closure handover, while deployed assurance remains open. Follow the [slice 003 operator runbook](product-site-enterprise-slice-003-address-reservations.md); do not bypass the marker or restore the scan.

- [ ] Complete remaining isolated contention/failure-recovery verification; successful provider apply/read-back is recorded but does not establish concurrent failure behavior.
- [x] Confirm target and refresh scoped before-migration address snapshot; retain before/after evidence. This is not a full database backup.
- [ ] Verify deployed access controls for claims, address fields and migration records.
- [x] Obtain founder confirmation that all old writers are stopped; repeat read-only preflight with zero collisions/invalid addresses.
- [x] Apply backfill and independently verify complete coverage and ready marker: `community-app-c2f67`, run `c5d858be-3eb5-4911-b038-f09f0d3595d6`, completed 2026-09-07 19:33:21 UTC, verified 19:33:48 UTC.

- [ ] Deploy only reservation-aware writers, verify signup/platform-admin creation and retained-address protection, then resume creation; record deployment and smoke-check evidence.
- [ ] Complete the deferred full regression/QC pass before release and update S2-15 status from the actual evidence.

These are rollout prerequisites, not additional permission requests or claims that the provider work has already happened. Independent implementation may continue while they remain pending; dependent creation/recovery rollout must respect this gate.

### Change log

| Date | Change | Implementation effect |
| --- | --- | --- |
| 2026-09-07 | Implemented slice 004 and resumed required testing under founder instruction | 45 focused tests, product build and local browser checks pass; default-off acquisition switch; 27 unchanged full-suite failures enumerated for remediation; no new provider writes/deployment |
| 2026-09-07 | Applied slice 003 backfill after founder confirmed all writers stopped | Seven address claims created, one hosted label filled; independent provider read-back verified ready marker and unchanged existing addresses. Deployment and full assurance remain pending |
| 2026-09-07 | Drafted slice 004; prioritized slice 003 provider preflight following founder question | Read-only audit: 7 hubs/7 addresses, zero issues, marker absent; no migration applied; old-writer shutdown confirmation pending |
| 2026-09-07 | Made per-session/per-slice master-plan updates an explicit standing requirement; added S2-15 rollout checklist | Documentation only; backfill and deployment remain pending, and deferred verification must remain visible until completed |
| 2026-09-07 | Implemented slice 003 hosted-address reservations and controlled backfill tool | 25 focused tests and targeted lint pass; full scans removed from creation; migration required before resuming creation, no provider writes performed |
| 2026-09-07 | Implemented slice 002 internal provisioning idempotency foundation and optional client contract | 33 focused checks and scoped lint pass; full testing deferred by founder; public signup adoption and deployed rules verification remain open |
| 2026-09-07 | Began Stage 0; found Windows Node v24.13.1, recorded baseline failure, created DOC-01/02/03/06; implemented slice 001 identity guardrails | 19 focused tests pass; cross-app baseline unchanged at 14/15; no deployment or full-stage sign-off |
| 2026-09-07 | Made progressive supporting-document creation mandatory through DOC-01–DOC-08 and readiness/completion gates DOC-G1–DOC-G4 | Planning update; supporting documents must be created and maintained alongside execution |
| 2026-09-07 | Created master plan, ten strategic stages, original-audit coverage register, decision register and mandatory QC/remediation cycle | Planning only; no application code changed |
| 2026-09-07 | Added enterprise copy implementation/review gates and senior engineering dispositions for D01–D17, separating autonomous choices from missing business facts | Planning update; no commercial commitments or application changes made |
| 2026-09-07 | Recorded sole-founder/mock-only context, authorised development placeholders, removed current legacy-contract assumptions and added researched commercial defaults | Planning update; commercial release prerequisites remain; no live billing or application changes |
| 2026-09-07 | Audited plan against current repo; closed 16 plan gaps through per-change assessment, cross-app regression/compatibility gates and explicit integration requirements; added linked audit report | Documentation remediation only; application implementation/testing remains outstanding |
| 2026-09-07 | Second repo-alignment pass recorded RA01–RA06; clarified actual legal persistence and acknowledgement, identity reuse, historical refunds, cancelled entitlements and test-runtime requirements | Documentation only; targeted tests could not start because Node was unavailable |

## 20. Reference sources and verification policy

Initial audit sources; recheck current guidance and production facts before implementation or legal publication:

- [Hubforj public site](https://www.hubforj.com/)
- [Hubforj pricing](https://www.hubforj.com/pricing)
- [Hubforj signup](https://www.hubforj.com/signup)
- [ICO: privacy information to provide](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/the-right-to-be-informed/what-privacy-information-should-we-provide/)
- [ICO: controller–processor contracts](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/contracts-and-liabilities-between-controllers-and-processors-multi/)
- [ICO: erasure](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/individual-rights/right-to-erasure/)
- [ICO: data portability](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/individual-rights/right-to-data-portability/)
- [ICO: cookies and similar technologies](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/cookies-and-similar-technologies/)
- [UK government: subscription regime implementation response](https://www.gov.uk/government/consultations/consultation-on-the-implementation-of-the-new-subscription-contracts-regime/outcome/government-response-to-consultation-on-the-implementation-of-the-new-subscription-contracts-regime-web-accessible-version)

This programme is complete only when the applicable full-scope requirements are implemented, evidenced, audited, corrected and re-audited, with ongoing assurance assigned. A controlled launch is an intermediate milestone, not the enterprise finish line.


### Account-led setup continuation — 2026-09-08

Removed the general sign-in page recovery link. After ordinary sign-in, an account with no current workspace checks its own UID-bound saved setup. Pending setup displays “Continue setting up your workspace”; the action uses the existing explicit recovery route and recent-authentication checks. When provisioning is disabled, the account explains that setup is temporarily unavailable and offers no recovery action. Missing saved intent displays a help message rather than promising an available workspace or offering billing/admin actions. Completed workspace accounts retain their existing overview. No automatic provisioning on page load or recovery-email automation was added.

The optional operation lookup permits an absent record only after account/UID validation; malformed records and provider failures still fail closed. No database or environment changes were made. Existing direct recovery URLs remain supported. Validation: 53 account/auth/recovery tests pass, including absent saved intent, UID mismatch and malformed-record rejection. Targeted ESLint completed without errors or warnings; scoped whitespace checks pass. Browser journey selector updated for the renamed continuation button; the full browser journey has not been rerun for this refinement. Production behavior is not yet verified.
