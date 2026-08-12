# Hub Platform Custom Domain Account UI/UX Implementation Plan

## Objective

Upgrade the `/admin/settings/account` custom-domain experience to an enterprise-grade admin UI that is clearer, calmer, more responsive, and easier for a hub owner to act on.

The target experience is based on the latest reference screenshots in:

- `apps/hub-platform/public/images/ChatGPT Image Aug 12, 2026, 09_33_43 AM (1).png`
- `apps/hub-platform/public/images/ChatGPT Image Aug 12, 2026, 09_33_43 AM (2).png`
- `apps/hub-platform/public/images/ChatGPT Image Aug 12, 2026, 09_33_44 AM (3).png`

The implementation must preserve existing custom-domain business logic, security rules, entitlement checks, Vercel automation behavior, verification flow, disconnect behavior, and fallback-subdomain behavior.

This is a UI/view-model refactor, not a custom-domain lifecycle rewrite.

## Non-Negotiables

- Use only existing design-system tokens.
- Do not introduce a new color system, font system, shadow system, or spacing scale.
- Preserve owner/superadmin-only custom-domain actions.
- Preserve existing server actions.
- Preserve existing custom-domain data model.
- Preserve exact-confirmation requirement before disconnect.
- Preserve immediate manual disconnect processing and redirect to the HubForJ-hosted subdomain.
- Do not show state labels that the system cannot truthfully support.
- Do not show `Complete`, `In progress`, `Pending`, or `Needs attention` for admin actions the system cannot observe.
- Mobile and tablet behavior must be planned and implemented deliberately, not left to incidental wrapping.

## Current Code Audit

### Current Files

The current account custom-domain UI lives in:

- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/account/page.jsx`
- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/account/page.module.css`
- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/account/AccountDomainTools.jsx`
- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/account/AccountDomainRegistrarGuide.jsx`
- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/account/AccountDomainCopyButton.jsx`
- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/account/AccountDomainDisconnectForm.jsx`
- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/account/AccountDomainVerificationCheckForm.jsx`
- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/account/AccountDomainSetupForm.jsx`
- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/actions.js`

### Current Logic That Must Be Preserved

`page.jsx` currently derives:

- `domainStatus`
- `isConnected`
- `isDisconnectScheduled`
- `isDisconnected`
- `isPendingVerification`
- `isActivationReady`
- `isVerifying`
- `isVerificationFailed`
- `showVerificationPanel`
- `showDnsInstructionPanel`
- `showSetupForm`
- `showDisconnectForm`
- `domainStatusDescription`
- `lifecycleSteps`
- `dnsRecords`

The UI refactor should keep this decision surface, but may move the presentational mapping into smaller local helper functions or components.

### Current Lifecycle Data

The hub custom-domain record already provides enough data for a reliable connection-health panel:

- `hostname`
- `status`
- `verificationMethod`
- `verificationHost`
- `verificationTarget`
- `verifiedAt`
- `activationReadyAt`
- `connectedAt`
- `lastCheckedAt`
- `dnsRoutingStatus`
- `dnsRoutingLastCheckedAt`
- `dnsRoutingFailureReason`
- `dnsRoutingRecordType`
- `dnsRoutingRecordName`
- `dnsRoutingRecordValue`
- `dnsRoutingRecordValues`
- `dnsRoutingRecordTtl`
- `vercelVerificationStatus`
- `certificateStatus`
- `certificateLastCheckedAt`
- `failureReason`
- `activationBlockedReason`
- `lastLifecycleError`

The normalized client-facing shape is built in:

- `apps/hub-platform/src/lib/domain/hub-domains.js`

The external readiness and lifecycle processing are implemented in:

- `apps/hub-platform/src/lib/domain/custom-domain-vercel.js`
- `apps/hub-platform/src/lib/data/custom-domain-verification.js`

### Current Action Logic

`disconnectCustomDomainAction` already:

- requires hub owner action access
- checks a custom domain exists
- checks confirmation exactly matches the hostname
- schedules disconnect
- immediately processes the disconnect
- revalidates settings paths and hub caches
- redirects to `https://{hubSlug}.hubforj.com/admin/settings/account?customDomain=disconnected`

This behavior is correct and should not be rewritten during the UI pass.

## Component Audit And Decisions

### Existing `SegmentedToggle`

File:

- `apps/hub-platform/src/components/ui/segmented-toggle/SegmentedToggle.jsx`

Strengths:

- Uses existing field-control styling.
- Has accessible `radiogroup` semantics.
- Already used by member bookings and offering list workflows.
- Good fit for compact binary/small option selection.

Limitations for this screen:

- It currently supports text labels only.
- The target design uses icon + label segmented actions.
- The target design has a toolbar/task-navigation feel rather than a form-control feel.
- The target design needs active state to fill the available width and collapse elegantly on mobile.

Decision:

- Do not alter `SegmentedToggle` globally for this pass.
- Create a local or reusable `TaskSegmentedControl` component only if it can be kept generic and token-based.
- Preferred location if reusable:
  - `apps/hub-platform/src/components/ui/task-segmented-control/TaskSegmentedControl.jsx`
  - `apps/hub-platform/src/components/ui/task-segmented-control/TaskSegmentedControl.module.css`
- If implementation risk is lower, begin as a local `AccountDomainTaskTabs.jsx`; promote later only if another route needs it.

Recommended component API:

```jsx
<TaskSegmentedControl
  ariaLabel="Custom domain tasks"
  value={selectedTool}
  onChange={setSelectedTool}
  options={[
    { value: "dns", label: "DNS records", icon: "layers" },
    { value: "setup", label: "Setup guide", icon: "menu_book" },
    { value: "disconnect", label: "Disconnect", icon: "cancel" },
  ]}
/>
```

Required behavior:

- `role="tablist"` or `role="radiogroup"` can be used.
- Because it switches visible panels in-place, `tablist` semantics are preferred:
  - each button: `role="tab"`
  - active button: `aria-selected="true"`
  - each panel: `role="tabpanel"`
- Keyboard behavior:
  - `ArrowLeft` / `ArrowRight` moves between task tabs.
  - `Home` / `End` moves to first/last.
- Desktop:
  - options display in one row.
  - equal-width segments.
- Tablet/mobile:
  - options may remain horizontally scrollable or become stacked.
  - Preferred: horizontal scroll rail if width is tight, because stacked tabs make the right panel too tall.

### Existing `OperationalRecordsTable`

File:

- `apps/hub-platform/src/components/patterns/operational-records-table/OperationalRecordsTable.jsx`

Strengths:

- Solid responsive row pattern.
- Supports mobile labels.
- Uses admin row surfaces.
- Already suitable for large operational datasets.

Limitations for DNS records:

- Includes search/filter/pagination concepts that do not belong in a two-record DNS setup task.
- Heavier component than needed.
- The DNS records table needs copy controls, compact technical values, and no toolbar.

Decision:

- Do not use `OperationalRecordsTable` directly for DNS records.
- Create a lighter reusable `KeyValueRecordsTable` or local `DnsRecordsTable`.
- Preferred first implementation:
  - local `AccountDomainDnsRecordsTable.jsx`
  - CSS in `page.module.css` or a colocated module if the account CSS becomes too large
- Future reusable extraction is valid if DNS-like record displays recur elsewhere.

Recommended local component responsibilities:

- Render compact desktop grid/table:
  - Type
  - Host
  - Value
  - TTL
- Render stacked card rows below tablet breakpoint.
- Use `AccountDomainCopyButton` for host/value copy.
- Use `Badge` or a small tokenized type pill for `TXT`, `A`, `CNAME`.
- Never hide host/value text behind copy-only interactions.
- Ensure long DNS values wrap or truncate safely without horizontal overflow.

### Notice / Callout Component

Current repository state:

- Multiple route-specific notice styles exist.
- `PackageUpgradeNotice` is too specific to package upgrades.
- Legal settings and cookie preference routes have local notice patterns.
- There is no obvious generic admin `Notice` or `Callout` primitive.

Decision:

- Create a reusable admin notice/callout primitive if this can be done cleanly.
- Preferred location:
  - `apps/hub-platform/src/components/ui/notice/Notice.jsx`
  - `apps/hub-platform/src/components/ui/notice/Notice.module.css`

Recommended API:

```jsx
<Notice
  tone="warning"
  icon="warning"
  title="Disconnecting will make your domain inactive"
>
  <p>Your domain will no longer work with this hub.</p>
</Notice>
```

Supported tones:

- `neutral`
- `info`
- `success`
- `warning`
- `danger`

Token rules:

- Use existing badge/accent/text/surface/border semantic tokens.
- Do not hardcode red, blue, green, yellow, or opacity values.
- Tone should affect border, icon color, and subtle background only.
- Typography should use existing body/label/heading tokens.

Initial usages:

- DNS propagation note.
- Registrar instructions note.
- Disconnect warning.
- Disconnect irreversible-action warning.

Enterprise benefit:

- Reduces custom notice CSS in account route.
- Gives future routes a consistent warning/info panel pattern.

### Status Step / Timeline Component

Current state:

- Account page has local lifecycle rendering.
- Invite lifecycle and onboarding checklist have related patterns, but neither maps exactly to a compact operational status/timeline.

Decision:

- Keep the custom-domain connection health timeline local for the first pass.
- Create local components:
  - `ConnectionHealthPanel`
  - `ConnectionHealthStep`
  - `SetupGuideStep`
- Do not create a global timeline primitive until at least one other route needs the same behavior.

Reason:

- Step-state semantics are custom-domain specific.
- Over-generalizing now risks a vague component that still needs custom CSS in every route.

## Desired UI Architecture

### Top-Level Custom Domain Section

The current `Surface` card remains the outer frame for the account custom-domain area.

Inside it:

- Header:
  - `Custom domain`
  - `Manage the website address people use to visit this hub.`
- Content grid:
  - left: `Domain overview`
  - right: `Domain tools`

Desktop:

- Two-column layout.
- Left column slightly wider than right.
- Both panels align at the top.

Tablet and mobile:

- `Domain tools` stacks underneath `Domain overview`.
- No side-by-side layout under the established admin breakpoint.
- Tools panel should not appear before overview because overview gives the current domain truth.

Recommended breakpoints:

- Keep current `72rem` breakpoint for the two-column stack.
- Consider an additional `44rem` or `40rem` breakpoint for DNS table/card switch.

### Domain Overview Panel

Replace current status presentation with:

- Panel title: `Domain overview`
- Status chips aligned to the right on desktop:
  - `Connected`
  - `Growth feature`
- Status message row:
  - status icon
  - description text

Status row tone mapping:

- connected: success icon and success tone
- verification/pending/provisioning: warning/info tone
- failed: danger tone
- disconnected/not configured: neutral/warning tone depending context

Domain identity cards:

- `HubForJ fallback`
- `Custom domain`

Each card:

- icon tile
- label
- value
- helper description

Recommended helper text:

- HubForJ fallback:
  - connected: `Fallback address used if the custom domain is unavailable.`
  - not connected: `Default HubForJ-hosted address for this hub.`
- Custom domain:
  - connected: `Primary domain visitors use to access your hub.`
  - pending: `Becomes active after verification and routing checks pass.`
  - disconnected/not configured: `No custom domain is currently connected.`

Timeline metadata strip:

- `Connected`
- `Last checked`

This should be a compact horizontal strip on desktop and stack on mobile.

### Connection Health Panel

The latest concept shows this as always visible. That is a stronger enterprise choice than a collapsed disclosure because this panel answers the admin’s most important question: “Is this domain healthy?”

Render:

- title: `Connection health`
- badge: `{completeCount} of {totalCount} checks complete`
- list of five lifecycle checks

Lifecycle checks:

1. `Domain entered`
2. `Ownership verified`
3. `DNS routing`
4. `Secure connection`
5. `Connected`

Each row:

- status icon
- title
- short description
- status badge

Status values:

- `complete`
- `in_progress`
- `pending`
- `needs_attention`

Displayed labels:

- `Complete`
- `In progress`
- `Pending`
- `Needs attention`

Tone mapping:

- complete: success
- in_progress: info or warning
- pending: neutral
- needs_attention: danger

Accuracy rules:

- `Domain entered`
  - complete: hostname exists
  - in progress: Growth entitlement exists but no hostname
  - pending: no entitlement or not configured
- `Ownership verified`
  - complete: `verifiedAt` exists or status is `verifying`, `activation_ready`, `connected`
  - needs attention: status is `verification_failed`
  - in progress: hostname and TXT record exist but not verified
  - pending: no verification record exists
- `DNS routing`
  - complete: `dnsRoutingStatus === "ready"` or status is `connected`
  - needs attention: `dnsRoutingStatus === "misconfigured"`
  - in progress: ownership is verified and routing is pending/not checked
  - pending: ownership is not verified
- `Secure connection`
  - complete: `certificateStatus === "ready"` or status is `connected`
  - needs attention: `certificateStatus === "failed"`
  - in progress: DNS routing is complete but certificate is pending/not checked
  - pending: DNS routing is not complete
- `Connected`
  - complete: `status === "connected"`
  - needs attention: activation is blocked by `activationBlockedReason` or `lastLifecycleError`
  - in progress: status is `activation_ready` or `verifying` after readiness progress
  - pending: earlier checks are not complete

Important:

- Do not render `5 of 5 checks complete` unless all five lifecycle checks are actually `complete`.

### Domain Tools Panel

Replace the current select-based task switcher with a tab/segmented-control layout:

- `DNS records`
- `Setup guide`
- `Disconnect`

Only show `Disconnect` when a connected custom domain can be disconnected.

When setup is pending and disconnect is not available:

- show `DNS records`
- show `Setup guide`
- omit `Disconnect`

When no hostname exists yet:

- do not render Domain Tools.
- render existing setup form instead.

Header:

- title: `Domain tools`
- helper: `Choose domain task.`

Task switching should be client-side only and should not trigger route navigation or server fetches.

### DNS Records Tab

Display:

- intro: `These are the DNS records currently expected for this custom domain.`
- compact DNS records table
- DNS propagation notice
- optional verification action if `showVerification` is true
- error/blocked copy only when relevant

Table columns:

- Type
- Host
- Value
- TTL

Record type:

- Use a small type badge/pill.
- For TXT, display `TXT`.
- For A/CNAME, display actual type.

Host/value:

- Show full text.
- Long values wrap safely.
- Copy button sits next to host/value where appropriate.
- Copy button label may be `Copy`; icon optional only if icon rendering is known safe.

Mobile:

- Hide desktop header.
- Render each record as a stacked card:
  - Type
  - Host
  - Value
  - TTL
- Copy actions remain beside or below values depending width.
- No horizontal scrolling for DNS values.

### Setup Guide Tab

Purpose:

- Help admins update records in their registrar without making support-visible backend state look like manual task completion.

Display:

- heading: `Setup guide`
- intro: `Follow these steps with your domain registrar to connect your domain.`
- registrar selector
- info notice: `Instructions may vary slightly depending on your account and registrar interface.`
- evidence-backed setup checks
- detailed instructions CTA

Registrar selector:

- Reuse `AdminSelect`.
- Keep provider list from `AccountDomainRegistrarGuide`.
- Providers:
  - GoDaddy
  - Cloudflare
  - Namecheap
  - Squarespace
  - Other DNS provider

Setup guide structure:

1. Provider guidance:
   - selected registrar
   - common location/path in that registrar
   - detailed instructions CTA
2. Evidence-backed setup checks:
   - `Add TXT record`
   - `Point traffic to HubForJ`
   - `Wait for verification`

Important accuracy note:

- The app cannot know whether the admin literally opened DNS manager.
- Therefore `Open DNS manager` must not be rendered as a stateful setup check with `Complete`, `In progress`, `Pending`, or `Needs attention`.
- The UI may still tell the admin where to go in their registrar, but that guidance should be plain instructional content, not a status row.
- If a design requires a numbered sequence, the first visual item should be phrased as an instruction without a status badge, or removed from the stateful list entirely.

Step state mapping:

- `Add TXT record`
  - complete: ownership verified
  - needs attention: `verification_failed`
  - in progress: verification record exists but ownership not verified
  - pending: no verification record exists
- `Point traffic to HubForJ`
  - complete: DNS routing complete
  - needs attention: DNS routing misconfigured
  - in progress: ownership verified and DNS routing not ready
  - pending: ownership not verified
- `Wait for verification`
  - complete: connected
  - needs attention: activation blocked, certificate failed, or lifecycle error
  - in progress: ownership verified but connection not complete
  - pending: ownership not verified

Connected-domain expectation:

- A connected custom domain should show all evidence-backed setup checks as complete.
- It must not show `Point traffic to HubForJ` as `In progress` once `status === "connected"`.
- It must not show `Open DNS manager` as complete, because that is not a system-observable fact.

Detailed instructions:

- Keep the existing modal behavior from `AccountDomainRegistrarGuide`.
- The CTA label can be `View instructions`.
- The modal should show:
  - provider-specific path
  - provider-specific field labels
  - exact DNS records

### Disconnect Tab

Display:

- intro: `Disconnecting your custom domain will stop it from working with your hub.`
- warning notice:
  - title: `Disconnecting will make your domain inactive`
  - body:
    - `Your domain ({hostname}) will no longer work with this hub.`
    - `Visitors will not be able to access your site using this domain.`
- confirmation panel:
  - prompt: `To confirm, type your domain below:`
  - input label: `Confirm custom domain`
  - hint: `Type the current custom domain exactly to confirm removal.`
  - danger notice: `This action cannot be undone.`
  - button: `Disconnect domain` or `Disconnect custom domain`

Action behavior:

- Continue using `AccountDomainDisconnectForm`.
- Do not change server-side confirmation or redirect.
- Button should use existing danger/destructive styling if available.
- If `Button`/`SubmitButton` does not support danger:
  - add a scoped class to the form submit area using existing danger tokens
  - do not hardcode color values

## Proposed New Components

### `Notice`

Recommended global reusable component.

Path:

- `apps/hub-platform/src/components/ui/notice/Notice.jsx`
- `apps/hub-platform/src/components/ui/notice/Notice.module.css`

Why:

- We need info, warning, and danger callouts here.
- Similar needs exist elsewhere in admin.
- Current notice patterns are route-specific.

Minimum props:

- `tone`
- `icon`
- `title`
- `children`
- `className`

Accessibility:

- `role="status"` only for passive status notices that should be announced.
- `role="alert"` only for urgent/danger form errors.
- Default should avoid noisy live-region behavior.

### `TaskSegmentedControl`

Recommended reusable component if kept generic.

Path:

- `apps/hub-platform/src/components/ui/task-segmented-control/TaskSegmentedControl.jsx`
- `apps/hub-platform/src/components/ui/task-segmented-control/TaskSegmentedControl.module.css`

Why:

- Domain tools need icon + label task switching.
- Existing `SegmentedToggle` is form-oriented and text-only.
- This control may be reused for future admin task panels.

Minimum props:

- `ariaLabel`
- `value`
- `onChange`
- `options`
- `className`

Options:

- `value`
- `label`
- `icon`
- `disabled`

Accessibility:

- Prefer `tablist` semantics when paired with panels.
- Implement arrow-key behavior.

Responsive behavior:

- Desktop: equal-width row.
- Mobile: horizontal scroll rail or stacked single-column. Preferred: horizontal scroll rail to preserve compactness.

### `AccountDomainDnsRecordsTable`

Recommended local component first.

Path:

- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/account/AccountDomainDnsRecordsTable.jsx`

Why local first:

- DNS records have specific fields and copy interactions.
- Existing operational table is too heavy.
- Future extraction can happen if another screen needs the same pattern.

### `AccountDomainConnectionHealth`

Recommended local component.

Path:

- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/account/AccountDomainConnectionHealth.jsx`

Responsibilities:

- render health title
- render complete-count badge
- render lifecycle rows
- choose status icons and badges

### `AccountDomainSetupGuide`

Recommended local component.

Path:

- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/account/AccountDomainSetupGuide.jsx`

Responsibilities:

- own registrar selected state
- render setup guide intro
- render provider selector
- render provider guidance separately from stateful checks
- render only evidence-backed setup checks with status labels
- open existing detailed instructions modal logic or use extracted modal helper from `AccountDomainRegistrarGuide`

Implementation note:

- Consider merging/replacing `AccountDomainRegistrarGuide.jsx` with this component so provider instructions live in one place.
- Avoid duplicate provider config.

## Implementation Phases

### Phase 0: Guardrails And View Model

1. Add source tests for:
   - `Domain overview`
   - `Connection health`
   - `DNS records`
   - `Setup guide`
   - `Disconnect`
   - absence of old select-only wording where appropriate
2. Extract or add helper functions:
   - `buildConnectionHealthSteps(domainState, domainStatus)`
   - `buildSetupGuideSteps({ domainState, domainStatus, records })`
   - `countCompleteSteps(steps)`
3. Confirm connected domain returns:
   - five connection health steps complete
   - three setup guide checks complete
   - no stateful `Open DNS manager` item
4. Confirm pending verification returns:
   - domain entered complete
   - ownership in progress or needs attention depending status
   - routing pending
   - secure connection pending
   - connected pending

### Phase 1: Reusable Notice Component

1. Create `Notice`.
2. Use only tokenized tone styling.
3. Add unit/source test to verify no hardcoded colors.
4. Use it in custom-domain DNS and disconnect panels.

### Phase 2: Task Segmented Control

1. Create `TaskSegmentedControl` or local `AccountDomainTaskTabs`.
2. Implement icon + label options.
3. Implement accessible semantics.
4. Implement keyboard navigation.
5. Implement responsive behavior.

Preferred first choice:

- Create reusable `TaskSegmentedControl` because the pattern is generic and likely useful later.

### Phase 3: Domain Overview Refactor

1. Replace current left status block with `Domain overview`.
2. Move status chips to panel header.
3. Add status message row with icon.
4. Rebuild domain fact cards with helper text.
5. Add compact connected/last-checked metadata strip.
6. Replace collapsed domain status with always-visible `Connection health`.

### Phase 4: DNS Records Tab

1. Replace DNS record card list with DNS records table.
2. Keep copy controls.
3. Add propagation `Notice`.
4. Keep verification CTA when `showVerification` is true.
5. Ensure mobile transforms table into stacked rows.

### Phase 5: Setup Guide Tab

1. Build setup guide checks from real custom-domain state.
2. Reuse provider instructions.
3. Render provider selector.
4. Render info notice.
5. Render registrar guidance without status labels for unobservable admin actions.
6. Render only evidence-backed checks with accurate complete/in-progress/pending/needs-attention states.
7. Keep detailed instructions modal.

### Phase 6: Disconnect Tab

1. Add warning `Notice`.
2. Add confirmation panel.
3. Keep `AccountDomainDisconnectForm`.
4. Apply danger/destructive styling with existing tokens.
5. Confirm redirect behavior remains unchanged.

### Phase 7: Responsive QA

Test viewports:

- desktop wide
- laptop
- tablet
- mobile portrait
- mobile landscape

Expected behavior:

- `Domain tools` stacks below `Domain overview` on tablet/mobile.
- Task segmented control remains usable without text clipping.
- DNS records do not overflow horizontally.
- Copy buttons remain reachable.
- Long hostnames wrap cleanly.
- Connection health rows remain readable.
- Disconnect form remains clear and not visually cramped.

### Phase 8: Documentation And Verification

1. Update this plan with completed items.
2. Update `docs/hub-platform-custom-domain-self-service-implementation-plan.md` progress notes if implementation changes the user journey materially.
3. Run focused tests.
4. Ask for screenshot verification in:
   - DNS records tab
   - Setup guide tab
   - Disconnect tab
   - expanded/pending/error states if available

## Testing Plan

Source/unit tests:

- `apps/hub-platform/tests/unit/custom-domain-account-settings-ux-source.test.js`

Add or update assertions for:

- task tabs exist
- setup guide exists
- connection health exists
- notice component used
- exact confirmation form preserved
- no hardcoded danger colors in local CSS
- connected state does not statically render inaccurate `In progress`
- no stateful `Open DNS manager` setup check

Manual tests:

1. Connected custom domain:
   - overview shows connected status
   - 5/5 health checks complete
   - DNS records tab displays records
   - setup guide shows evidence-backed checks complete
   - setup guide does not claim the admin opened DNS manager
   - disconnect tab works
2. Pending verification:
   - ownership step not complete unless TXT matched
   - DNS and secure connection not falsely complete
   - Check DNS action still appears
3. Misconfigured DNS:
   - routing step shows needs attention
   - error details shown without overwhelming the panel
4. Mobile:
   - no horizontal body overflow
   - DNS values wrap safely
   - task tabs remain usable

## Risks And Tradeoffs

### Creating New Components

Risk:

- Over-abstracting too early.

Mitigation:

- Create `Notice` globally because the pattern is broadly useful.
- Create `TaskSegmentedControl` globally only if it remains generic.
- Keep DNS table and connection-health components local initially.

### Setup Guide State Accuracy

Risk:

- UI implies the app can verify manual registrar actions that it cannot actually know.

Mitigation:

- Derive setup guide states only from downstream evidence.
- Do not render `Open DNS manager` as a stateful check.
- Avoid static demo states.

Tradeoff:

- Removing `Open DNS manager` from the stateful list slightly reduces the visual match with the reference screenshot, but it improves truthfulness and avoids false completion claims.

Decision:

- Enterprise accuracy takes priority over exact screenshot mimicry.
- Registrar location/path guidance remains visible, but it is instructional content rather than tracked status.

### Mobile Complexity

Risk:

- A desktop-style DNS table can overflow on mobile.

Mitigation:

- CSS must switch to stacked record cards.
- Host/value fields must use `overflow-wrap: anywhere`.
- Copy buttons must not force fixed-width overflow.

### Danger Styling

Risk:

- Creating one-off red styling outside tokens.

Mitigation:

- Reuse `accent-danger`, `badge-danger`, `button`, `surface`, and border tokens.
- If `Button` lacks `danger`, use scoped CSS variables/tokens, not raw colors.

## Definition Of Done

- The custom-domain account section visually matches the enterprise direction of the latest screenshots while staying inside existing tokens.
- Domain overview and domain tools have clear hierarchy.
- Domain tools use task tabs rather than a standard select as the primary desktop interaction.
- DNS records are readable, compact, copyable, and responsive.
- Setup guide states are accurate to actual backend state.
- Disconnect flow is visually clear and correctly destructive.
- Tablet/mobile layouts are deliberately implemented and verified.
- Existing custom-domain lifecycle logic and security boundaries remain intact.
- Focused tests pass.

## Implementation Progress

### Completed In Current Pass

- Created reusable `Notice`.
  - Path: `apps/hub-platform/src/components/ui/notice/Notice.jsx`
  - Path: `apps/hub-platform/src/components/ui/notice/Notice.module.css`
  - Uses existing semantic badge/surface/text tokens only.
  - Supports `neutral`, `info`, `success`, `warning`, and `danger`.
- Created reusable `TaskSegmentedControl`.
  - Path: `apps/hub-platform/src/components/ui/task-segmented-control/TaskSegmentedControl.jsx`
  - Path: `apps/hub-platform/src/components/ui/task-segmented-control/TaskSegmentedControl.module.css`
  - Uses `tablist` / `tab` semantics with arrow, Home, and End keyboard support.
  - Uses icon + label task switching and responsive horizontal overflow on small screens.
- Extracted custom-domain view-model helpers.
  - Path: `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/account/accountDomainViewModel.js`
  - Centralizes DNS records, connection health steps, setup guide checks, status tone/icon, and date formatting.
  - Locks setup-guide status to evidence-backed checks only:
    - `Add TXT record`
    - `Point traffic to HubForJ`
    - `Wait for verification`
  - Does not render `Open DNS manager` as a stateful setup item.
- Extracted registrar provider instructions into a shared local module.
  - Path: `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/account/accountDomainRegistrarProviders.js`
  - Avoids duplicate provider instructions between current/future setup-guide UI.
- Added local custom-domain presentation components.
  - `AccountDomainConnectionHealth.jsx`
  - `AccountDomainDnsRecordsTable.jsx`
  - `AccountDomainSetupGuide.jsx`
- Refactored `AccountDomainTools.jsx`.
  - Replaced the primary standard select with `TaskSegmentedControl`.
  - Keeps task switching client-side only.
  - Uses `Notice` for propagation, setup errors, routing errors, and activation blockers.
  - Renders DNS records, setup guide, and disconnect as mutually exclusive task panels.
- Refactored `page.jsx`.
  - Removed inline DNS/lifecycle helper logic.
  - Replaced collapsed domain-status disclosure with always-visible `AccountDomainConnectionHealth`.
  - Added a compact status summary row using real domain status tone/icon.
  - Kept existing entitlement, setup, verification, disconnect, and fallback-subdomain behavior intact.
- Upgraded disconnect presentation.
  - Keeps exact-confirmation requirement.
  - Keeps server action and redirect behavior.
  - Adds a tokenized warning notice.
  - Uses the shorter `Disconnect domain` CTA label.
- Updated focused source tests.
  - Path: `apps/hub-platform/tests/unit/custom-domain-account-settings-ux-source.test.js`
  - Tests now cover reusable primitives, evidence-backed setup checks, tokenized styling, no stateful `Open DNS manager`, and preserved disconnect copy/security shape.

### Still Required Verification

- Browser check connected custom-domain state:
  - overview hierarchy
  - `5 of 5 checks complete`
  - DNS records tab
  - setup guide tab
  - disconnect tab
- Browser check pending-verification state if available:
  - `Check DNS` still appears
  - ownership/routing/secure/connected states are not falsely complete
- Browser check tablet/mobile:
  - domain tools stacks below overview
  - segmented task control remains usable
  - DNS values wrap without horizontal overflow
  - copy buttons remain reachable

### Notes For Future Polish

- `AccountDomainRegistrarGuide.jsx` remains available for backwards compatibility, but the active task-panel experience uses `AccountDomainSetupGuide.jsx`.
- If another admin route needs compact task tabs, `TaskSegmentedControl` can be reused directly.
- If another route needs DNS/key-value records with copy actions, promote `AccountDomainDnsRecordsTable` into a generic component after a second usage appears.
