# Hub Legal Pages Production Implementation Plan

## Purpose

This document defines the production-grade implementation plan for hub-scoped legal pages and platform data-use guidance in `apps/hub-platform`.

It replaces the current `Useful links` legal implementation approach with a dedicated legal settings system that is:

- hub-scoped
- truthful about platform behaviour
- explicit about responsibility boundaries
- safe for public rendering
- operationally simple for hub owners
- production-oriented without becoming a full CMS

This plan is intentionally detailed so it can be followed directly during implementation.

---

## Implementation Decision

### Final workflow model

Use a **save-and-accept** model instead of a draft/publish model.

That means:

- there is no separate draft state
- there is no separate publish action
- the owner edits the current legal document directly
- saving a changed document updates the live public version
- saving is only allowed after the owner explicitly accepts responsibility
- saving must require a confirmation modal
- every accepted save stores revision and acceptance metadata

This is the approved simplification because it:

- avoids CMS/editorial complexity
- keeps the product understandable
- still provides strong auditability
- clearly assigns content responsibility to the hub owner

### Immediate-live product reality

The public site for a hub goes live immediately when the hub is set up.

That means:

- the legal experience cannot depend on a later publishing phase
- public legal routes must always resolve
- fallback legal pages are a required production behavior, not a temporary convenience
- owner-provided legal content replaces those fallbacks when saved with acceptance

### Legal responsibility model

The platform is responsible for:

- providing the editor
- providing a factual Data Use Summary
- accurately describing platform behaviour
- safely storing and rendering legal content
- recording who accepted and when
- detecting when platform capability changes should trigger owner review

The hub owner is responsible for:

- deciding the wording of their Terms of Service
- deciding the wording of their Privacy Policy
- deciding lawful basis, retention, refunds, cancellations, marketing, safeguarding, and external processing
- confirming the content is suitable before saving

### Editing responsibility model

Only the **hub owner** should be able to edit and save legal documents for the hub.

That means:

- hub owner: can edit, save, and accept responsibility
- other hub admins: read-only access to the legal settings route
- superadmin support mode: optional elevated access for support operations, clearly attributable in metadata

This is stricter than general admin settings access and must be enforced specifically for legal mutations.

### Platform boundary

This feature must never be positioned as:

- legal compliance automation
- a legal document generator
- legal advice

It must be positioned as:

- a legal page editor
- a platform data-use summary
- factual guidance for hub owners

---

## Scope

### In scope

- hub-level Terms of Service editor
- hub-level Privacy Policy editor
- public rendering of hub Terms of Service
- public rendering of hub Privacy Policy
- hub owner legal settings route
- server-generated Data Use Summary
- revision and acceptance metadata
- owner-only editing rules for legal content
- persistent legal attention states in `/admin`
- capability-change review prompts
- legal save confirmation modal
- hub-scoped server-side authorization
- legal rich text validation and sanitization
- migration from the current `Useful links` implementation
- platform-controlled cookie-management guidance

### Out of scope

- full CMS
- page builder
- drag-and-drop content composition
- AI legal drafting
- platform global Terms/Privacy
- version comparison UI
- legal template marketplace
- jurisdiction-specific compliance automation
- DPA/subprocessor pages
- retention configuration UI
- data export/delete workflows
- full consent management platform for optional cookies beyond current actual implementation

---

## Current Project Situation

## Existing legal implementation

The current implementation is not production-grade for this purpose.

Current state:

- admin editing is under:
  - `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/pages/useful-links/page.jsx`
- content is stored inside general site settings
- legal pages are treated like page-settings content, not a dedicated legal system
- there is one saved body per page, not a controlled acceptance/revision model
- the editable set currently includes:
  - terms
  - privacy
  - cookies
- legal editing is not currently restricted to owner-only
- there is no current persistent attention-required flow for legal refresh or completeness states
- there is no current confirmation modal protecting live legal-page updates

Current supporting files:

- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/pages/useful-links/UsefulLinksSettingsForm.jsx`
- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/actions.js`
- `apps/hub-platform/src/lib/data/site-settings.js`
- `apps/hub-platform/src/lib/domain/site-settings.js`
- `apps/hub-platform/src/lib/domain/public-legal.js`
- `apps/hub-platform/src/components/patterns/public-legal-page/PublicLegalPage.jsx`

## Existing cookie implementation

The platform already has a lightweight public cookie preferences layer:

- `apps/hub-platform/src/lib/domain/public-cookie-preferences.js`
- `apps/hub-platform/src/components/patterns/public-cookie-preferences/PublicCookiePreferencesProvider.jsx`
- `apps/hub-platform/src/components/patterns/public-site-footer/PublicSiteFooter.jsx`

Current reality:

- it models necessary cookies only
- it stores a public cookie-preferences cookie client-side
- it does not yet represent a full configurable consent system
- it should not be treated as a hub-authored legal page

## Existing rich text model

The project already has a restricted rich text model:

- `apps/hub-platform/src/lib/domain/section-rich-text.js`
- `apps/hub-platform/src/components/patterns/section-rich-text-field/SectionRichTextField.jsx`
- `apps/hub-platform/src/components/sections/primitives/section-rich-text/SectionRichText.jsx`

This is good groundwork, but the current normalizer is narrow.

Current supported structure:

- paragraphs
- unordered lists
- bold
- italic

It does not yet fully support all formatting listed in the original feature prompt.

## Existing auth/access pattern

Reusable access pattern exists in:

- `apps/hub-platform/src/lib/auth/hub-access.js`

This supports:

- hub admin access
- superadmin support mode

This should be reused for legal route access, but legal mutation access must be validated inside the legal data/mutation path itself and restricted to owner-only.

---

## Production Architecture

## 1. Dedicated legal settings route

Create a new dedicated admin route:

- `/{hubSlug}/admin/settings/legal`

This route replaces the legal editing responsibility currently carried by `Useful links`.

### Route purpose

It must contain exactly three top-level areas:

1. Data Use Summary
2. Terms of Service editor
3. Privacy Policy editor

It must also surface:

- legal completeness state
- legal review-required state
- clear owner-only editing boundaries
- the latest detected platform capability changes relevant to legal review

### Route copy

Header title:

- `Legal pages`

Header description:

- `Manage the legal pages shown on your public community website. The platform provides factual information about how data is used by this hub, but your organisation is responsible for the Terms of Service and Privacy Policy that you publish.`

### Admin navigation placement

This route should live under Settings and be treated as a first-class settings destination, not a page-settings subsection.

Recommended admin navigation link:

- `Legal pages`

It should sit alongside:

- Site details
- Branding
- Page settings
- Legal pages

Final exact ordering can be adjusted when wiring navigation, but it should not remain hidden under `Pages`.

### Relationship to `/admin` attention required

This route must integrate directly with the existing `/admin` attention-required model.

Legal states that must be able to raise attention items include:

- Terms of Service has not been completed by the owner
- Privacy Policy has not been completed by the owner
- Legal pages require owner review because platform capabilities changed
- Legal acceptance has not yet been recorded in the new system after migration

Where possible, review-required attention items should be document-targeted, for example:

- `Terms of Service should be reviewed because payment rules changed`
- `Privacy Policy should be reviewed because account or data-processing features changed`

These must not be treated as transient toasts.

They are persistent operational states until resolved.

---

## 2. Dedicated legal datastore

Do not keep legal content in general site settings.

Create a dedicated hub-scoped legal document.

Recommended path:

- `/hubs/{hubId}/legal/settings`

Alternative equivalent paths are acceptable if they remain:

- hub-scoped
- isolated from general site settings
- read/written through a dedicated legal repository

## Recommended legal settings shape

Use structured rich text content instead of raw editable HTML.

Recommended shape:

```js
{
  terms: {
    content: [],
    revision: 0,
    hasOwnerProvidedContent: false,
    acceptedFeatureSnapshotHash: "",
    updatedAt: null,
    updatedByUserId: null,
    updatedByUserName: "",
    acceptedResponsibilityAt: null,
    acceptedResponsibilityByUserId: null,
    acceptedResponsibilityByUserName: "",
    acceptanceVersion: "hub-legal-save-v1"
  },
  privacy: {
    content: [],
    revision: 0,
    hasOwnerProvidedContent: false,
    acceptedFeatureSnapshotHash: "",
    updatedAt: null,
    updatedByUserId: null,
    updatedByUserName: "",
    acceptedResponsibilityAt: null,
    acceptedResponsibilityByUserId: null,
    acceptedResponsibilityByUserName: "",
    acceptanceVersion: "hub-legal-save-v1"
  },
  dataUseSummary: {
    generatedAt: null,
    generatorVersion: "hub-data-use-v1",
    featureSnapshotHash: "",
    sourceFeatureSnapshot: {},
    sourceModelSnapshot: {},
    summary: {
      sections: [],
      hubOwnerMustComplete: [],
      disclaimers: []
    }
  },
  legalStatus: {
    requiresOwnerReview: false,
    requiresOwnerReviewSince: null,
    requiresOwnerReviewReason: "",
    capabilityChangesSinceLastAcceptance: [],
    reviewTargets: {
      terms: [],
      privacy: []
    },
    missingDocuments: [],
    attentionItems: []
  },
  updatedAt: null,
  updatedByUserId: null
}
```

### Why no draft/published split

Because the approved model is:

- edit current live legal page
- require explicit acknowledgement on each changed save
- store revision and acceptance metadata

This keeps the implementation simpler while still audit-safe enough for the product goal.

### What counts as live public content

This implementation must use an explicit rule for public rendering:

1. if owner-provided accepted content exists for the document, render it
2. otherwise render the system fallback page for that document

For this feature, owner-provided accepted content means:

- the document has non-empty sanitized content
- `hasOwnerProvidedContent` is `true`
- acceptance metadata exists for that saved revision
- the document has an `acceptedFeatureSnapshotHash` for that accepted revision

Do not use “stored content exists” by itself as the public rendering gate.

That avoids ambiguity during migration and ensures fallback behavior is always well-defined.

### Why a revision number still matters

Even without history UI, `revision` should increment on each accepted content change.

This supports:

- audit traceability
- future support tooling
- future version history if needed later

---

## 3. Public route model

Public routes required:

- `/{hubSlug}/terms`
- `/{hubSlug}/privacy`
- `/terms` on custom domains
- `/privacy` on custom domains

These routes must:

- resolve the correct hub using existing host/slug resolution
- render without login
- use the normal public site shell/header/footer
- use the hub’s public template/theme
- render the current owner-provided accepted content when it exists
- otherwise render the system fallback page for that legal document

### Fallback behaviour

If the hub has not yet saved accepted content:

- render a safe fallback page

Terms fallback:

- `Terms of Service have not yet been provided by this community.`

Privacy fallback:

- `Privacy Policy has not yet been provided by this community.`

Do not expose editor scaffolds or admin guidance publicly.

Do not 404 unless the hub itself cannot be resolved.

---

## 4. Cookie management model

Cookie handling should be platform-controlled, not part of the hub-editable legal editor in this first production-grade pass.

## Final product decision

- Keep hub-editable pages to:
  - Terms of Service
  - Privacy Policy
- Remove hub-authored `Cookies` editing from the legal page editor
- Keep or evolve the public cookie preferences mechanism as a platform-controlled system

## Why this is the safer decision

Cookie use is primarily a platform implementation concern.

Freeform hub-authored cookie policy text creates risk because it can drift away from:

- actual cookie behavior
- optional integrations in use
- future platform changes

## Recommended cookie outcome

### Keep

- footer control:
  - `Manage cookie preferences`
- system-managed cookie preferences state
- system-generated cookie explanation page if needed

### Do not do in this implementation

- do not keep a third editable hub legal body for cookies
- do not make hub admins write cookie platform behavior from scratch

### Public cookie route decision

For this implementation, keep the public cookie explanation as a **platform-controlled** route or equivalent public information surface.

If `/cookies` remains in the footer:

- it must be system-generated
- it must not be hub-authored
- it must describe actual current cookie behavior

Do not leave the final behavior of `/cookies` ambiguous during implementation.

### Recommended future-safe structure

Create a platform-controlled cookie capability description model that can later support:

- necessary cookies
- functional cookies
- analytics cookies
- third-party embeds

For now, keep it truthful to the current implementation.

---

## Service Layer

Create dedicated modules under:

- `apps/hub-platform/src/lib/legal/`

## Required files

### `legalRepository.js`

Responsibilities:

- read legal settings for a hub
- create default legal settings shape if missing
- save Terms content
- save Privacy content
- store metadata and revision updates
- read stored Data Use Summary
- save regenerated Data Use Summary
- compute and store legal status flags
- compute and store capability change deltas when needed
- store the accepted feature snapshot hash per document on accepted saves
- perform hub-scoped document writes only

### `legalValidation.js`

Responsibilities:

- validate document type (`terms` or `privacy`)
- validate rich text payload shape
- validate acknowledgement payload
- validate owner-only mutation access
- validate non-empty content on changed saves
- validate no-op save detection inputs if needed

### `legalSanitizer.js`

Responsibilities:

- normalize the legal rich text structure
- strip disallowed nodes/attributes/marks
- preserve supported formatting
- return render-safe structured content

### `buildHubDataUseSummary.js`

Responsibilities:

- inspect current product capabilities and hub-specific state
- generate structured factual summary JSON
- never generate legal advice
- never scan all member personal records unnecessarily

### `legalSnippets.js`

Responsibilities:

- provide conservative insertable text fragments
- distinguish Terms snippets from Privacy snippets
- include hub-owner placeholder guidance where appropriate
- keep wording factual and editable

---

## Rich Text Contract

## Reuse strategy

Reuse the existing rich text field and rendering system where possible.

That means implementation should build on:

- `SectionRichTextField`
- `SectionRichText`
- `section-rich-text.js`

## Non-negotiable scoping rule

Do **not** globally expand the existing rich text field behavior in a way that changes editing power for unrelated admin features.

This is a hard requirement.

The legal implementation must not accidentally give richer formatting controls to existing use cases that currently rely on the narrower rich text contract.

Examples of areas that must not be broadened by accident:

- homepage/supporting copy editors that currently use the basic model
- smaller settings fields
- informational body fields where headings or links are not currently intended
- any other admin form that currently relies on the restricted paragraph/list emphasis model

## Required implementation approach

Implement rich text capability as an **opt-in editor profile**, not a global upgrade.

Recommended model:

- existing uses remain on a default/basic profile
- legal editors opt into a richer legal profile

Conceptually:

- `profile="basic"` for current existing uses
- `profile="legal"` for Terms and Privacy

Exact prop naming can vary, but the capability split must be explicit.

## Profile separation requirements

The profile split must apply at all three layers:

### 1. Editor UI

Only the legal editor should expose the richer legal controls that are approved for this feature.

That means:

- existing rich text fields keep their current limited control set
- legal rich text fields may expose additional controls such as ordered list, links, and headings only if supported safely end-to-end

### 2. Validation and sanitization

Validation and sanitization must be profile-aware.

That means:

- the default/basic profile accepts only the currently allowed narrower structure unless explicitly changed elsewhere
- the legal profile can accept the additional approved legal nodes/marks

### 3. Rendering

Rendering must remain safe and predictable per profile.

That means:

- either the renderer itself understands both profiles safely
- or legal content uses an explicitly legal-safe rendering path

Do not silently broaden rendering expectations for all existing content consumers.

## Required enhancements

The current normalization contract is too limited for production legal documents.

Review and extend support so the legal editor can safely support:

- paragraphs
- bold
- italic
- underline only if already supported by the actual editor and renderer safely
- unordered lists
- ordered lists
- links
- headings if already supported by the existing editor stack

If some of these are not already supported safely end-to-end:

- do not partially fake support in the plan
- ship only the formatting modes that can be safely edited, normalized, saved, and rendered in this pass

## Basic profile compatibility requirement

The existing default/basic profile must preserve today’s behavior unless another feature explicitly chooses to migrate later.

That means this legal feature must not, by itself:

- change the editing controls shown in existing non-legal editors
- change what non-legal rich text fields are allowed to save
- change how existing non-legal structured content is interpreted

## Legal profile acceptance checkpoint

Before shipping legal editors, confirm exactly which capabilities are supported end-to-end for the legal profile:

- paragraphs
- unordered lists
- ordered lists
- bold
- italic
- links
- headings
- underline only if truly supported safely

This checkpoint must cover:

- editor controls
- structured content shape
- validation
- sanitization
- rendering

If any one of those layers is not ready for a formatting feature, that feature should not ship in the legal profile yet.

### Non-negotiable restrictions

Do not support:

- raw HTML authoring
- script tags
- inline JavaScript
- iframes
- arbitrary inline styles
- arbitrary embeds
- source mode

## Sanitization approach

Because this codebase already uses structured rich text JSON rather than free HTML, sanitization should be based on:

- allowed block types
- allowed inline marks
- allowed link attributes and destinations
- allowed text nodes only

This is better than sanitizing arbitrary HTML strings after the fact.

If HTML rendering is ever introduced later, it must be produced from sanitized structured content, not accepted directly from the user.

---

## Save-And-Accept Workflow

## Final behavior

Each legal editor has:

- rich text field
- helper text
- insert snippet actions
- save button
- owner-only edit gating
- legal status banner where relevant
- capability-change explanation list where relevant

There is no publish button.

## Confirmation modal requirement

Saving legal content must require a confirmation modal.

The checkbox alone is not sufficient because saving updates the live public legal page immediately.

Required flow:

1. owner edits content
2. owner clicks save
3. confirmation modal opens
4. modal explains that the public legal page will update immediately
5. modal shows relevant capability changes since the last accepted save, if any
6. modal requires acknowledgement checkbox
7. owner confirms and the save action runs

This confirmation modal is a required safety mechanism, not optional polish.

## Save action contract

Saving a changed legal document must:

1. validate current authenticated access server-side
2. validate the `hubSlug` / resolved hub
3. validate that the acting user is:
   - the hub owner for that hub
   - or a superadmin in support mode if support override is allowed
4. validate acknowledgement checkbox was checked
5. parse and sanitize legal rich text
6. compare normalized content with stored content
7. if unchanged:
   - do not increment revision
   - do not rewrite acceptance metadata
   - return stable success state
8. if changed:
   - reject empty or effectively empty content
   - increment revision
   - update content
   - mark `hasOwnerProvidedContent` true
   - store timestamps
   - store actor metadata
   - store acceptance metadata
   - clear document-level missing-content attention state

## Acknowledgement requirement

Use this exact copy unless implementation constraints require only minor formatting changes:

- `I confirm that I am authorised to update this legal page for this hub, and that the hub owner is responsible for the accuracy and suitability of this content.`

## Confirmation modal copy

Recommended modal title:

- `Confirm legal page update`

Recommended modal body must communicate:

- this update will immediately change the public legal page shown on the website
- the platform provides factual data-use guidance only
- the hub owner is responsible for the legal content

If platform capabilities changed since the last accepted save, the modal must also include:

- a `What changed since your last review` section

This section should list the relevant capability changes in plain English.

The changes shown in the modal should be document-aware where possible, so a Terms save does not force the owner to parse Privacy-only changes and vice versa.

## Save button label

Recommended:

- `Save legal page`

Alternative acceptable label:

- `Save and update public page`

The surrounding UI must make clear that saving updates the public page immediately.

## Metadata to display in the UI

For each document display:

- last updated timestamp
- last updated by
- current revision number
- last responsibility acceptance timestamp
- last responsibility acceptance by

This information is helpful both for normal admins and for support mode.

For non-owner admins:

- show the metadata
- show summary and status
- show the document content
- disable edit and save controls
- show explanatory copy that only the hub owner can update legal pages

---

## Data Use Summary

## Purpose

The Data Use Summary is a read-only admin-facing explanation of how the platform uses data for this hub.

It is:

- factual
- plain English
- capability-driven
- non-legal in tone

It must not be treated as public legal page content.

It must not be editable by the hub admin.

The summary is owned by the platform.

## UI copy

Intro copy:

- `This summary explains how the platform handles data for this hub based on enabled features and current system capabilities. It is provided to help you write accurate public legal pages. It is not legal advice.`

## Required admin actions

Provide a button:

- `Regenerate summary`

This must trigger a server-side regeneration, not a client-only recalculation.

## Summary freshness and staleness

Manual regeneration alone is not sufficient for a production-grade factual summary.

The platform must also detect when the stored summary is stale relative to current hub capabilities.

Required mechanism:

- store a capability snapshot hash with the summary
- compute the current capability snapshot hash on load or on relevant legal mutations
- if the hashes differ:
  - mark the summary stale
  - surface `requiresOwnerReview`
  - surface a human-readable list of what changed

The legal system must also store which capability snapshot each document was last accepted against.

That means:

- Terms can be accepted against one snapshot
- Privacy can be accepted against one snapshot
- review prompts can then be targeted per document when a later capability state differs materially

Recommended behavior:

- auto-generate when the summary is missing
- mark stale when the current capability snapshot differs
- allow manual regenerate from the UI when stale or when the owner wants a refreshed explanation
- do not silently rewrite owner-authored legal text when only the summary changes

The key requirement is that the owner must be told what changed, not just that “something changed.”

## Output shape

Recommended returned shape:

```js
{
  generatedAt: "2026-05-22T10:00:00.000Z",
  generatorVersion: "hub-data-use-v1",
  sections: [
    {
      key: "accounts",
      title: "Member and admin accounts",
      visibility: "admin-and-member",
      platformResponsibility: "",
      hubOwnerResponsibility: "",
      dataFields: [],
      plainEnglish: [],
      suggestedPrivacyTopics: [],
      suggestedTermsTopics: []
    }
  ],
  hubOwnerMustComplete: [],
  disclaimers: []
}
```

## Required section logic

The summary builder must include the following sections where applicable.

### 1. Hub website and public pages

Always include.

Explain:

- the hub has a public site
- some content is public by default
- member/admin areas are protected
- the site may run on slug routes or a custom domain

### 2. Member and admin accounts

Always include.

Based on actual code inspection, the platform stores and uses account/session information for:

- sign-in
- role-based access
- hub scoping
- member/admin area access

Conservatively describe fields such as:

- name
- email
- role
- hub association
- account creation date
- avatar reference if supported

### 3. Memberships

Include when memberships/plans are supported or enabled.

Explain:

- selected plan
- status
- payment status
- start date
- renewal date
- cancellation/expiry state
- admin-controlled status changes where implemented

### 4. Events and registrations

Include when events are supported or enabled.

Explain:

- event registrations
- waitlist status
- cancellation status
- payment status
- attendance status
- eligibility/visibility rules where relevant

### 5. Payments and payment status

Include when paid memberships, paid events, paid courses, or payment tracking are supported.

The wording must reflect actual code paths.

Current codebase facts already identified:

- native payment status tracking exists
- Stripe flows exist for some registrations/upgrades
- Stripe configuration readiness is capability-dependent

Summary must truthfully distinguish:

- admin-managed/manual status
- Stripe-native flows when enabled/configured

Must also state:

- internal payment status is not a complete accounting or tax record unless explicitly implemented

### 6. Media and public assets

Include when media library/upload functionality exists.

Explain:

- admins can upload website/media assets
- public assets may be publicly accessible by URL
- metadata may include:
  - filename
  - type
  - size
  - alt text
  - folder
  - public URL

Also warn:

- public media storage must not be used for sensitive private documents unless a secure document feature exists

### 7. Emails and notifications

Include based on actual feature capability.

Current implementation must be conservative here.

If automated notifications are not broadly implemented/enabled:

- say so clearly
- do not imply the hub never contacts members outside the platform

If implemented/enabled:

- describe transactional communication types accurately

### 8. Admin actions and operational records

Include when admin workflows exist.

Explain actions such as:

- updating member status
- marking payments paid/unpaid
- renewing memberships
- cancelling memberships
- promoting waitlisted registrations
- marking attendance

Only mention audit logging if it actually exists.

### 9. Hub owner decisions required

Always include.

Must include topics such as:

- organisation legal name
- contact details
- lawful basis
- retention periods
- refund policy
- cancellation policy
- membership rules
- event rules
- safeguarding/minors policy where relevant
- marketing/contact consent
- data collected outside the platform
- third-party tools used outside the platform

## Data sources for the builder

Do not scan all personal/member records.

Preferred inputs:

- hub document
- hub package entitlements/capabilities
- hub payment configuration
- existence/count checks for hub-scoped collections where necessary
- known route and module capabilities
- current public site features
- current legal summary capability snapshot

### Good existing inputs in this repo

- package entitlement resolution
- site settings capability resolution
- Stripe/native payment configuration modules
- public route/domain resolution
- membership/event/course/media subsystems

## Capability registry

Create a static capability registry inside the legal layer if helpful.

Example:

```js
export const HUB_DATA_CAPABILITIES = {
  accounts: {
    fields: ["name", "email", "role", "hub association"],
    visibility: "member/admin",
    purpose: "Sign-in, hub scoping, role-based access"
  },
  memberships: {
    fields: ["plan", "status", "payment status", "start date", "renewal date"],
    visibility: "member/admin",
    purpose: "Membership administration"
  }
};
```

Then combine:

- static truth
- hub-specific capabilities
- current known feature availability

## Capability change explanation model

In addition to summary sections, the legal system must produce a structured explanation of capability changes since the last accepted legal review context.

Recommended shape:

```js
[
  {
    key: "stripe_enabled",
    category: "payments",
    title: "Stripe payments are now enabled",
    description: "This hub can now use built-in Stripe payment flows for eligible purchases and registrations.",
    suggestedDocuments: ["privacy", "terms"]
  }
]
```

These change items must be used in:

- `/admin` attention required
- `/admin/settings/legal` status banner
- the save confirmation modal

They must also be usable as targeted review prompts so the UI can tell the owner whether the change affects:

- Terms only
- Privacy only
- both documents

---

## Insertable Snippets

Provide conservative, editable insert actions in the admin UI.

These are convenience helpers, not legal templates.

## Terms snippets

Implement at least:

- `Insert membership terms guidance`
- `Insert event registration guidance`
- `Insert payment and cancellation guidance`

## Privacy snippets

Implement at least:

- `Insert account data guidance`
- `Insert membership data guidance`
- `Insert event registration data guidance`
- `Insert attendance data guidance`
- `Insert payment status guidance`
- `Insert media/public asset guidance`

## Snippet rules

Snippets must:

- be factual
- be conservative
- be editable
- include placeholders where hub-specific decisions are required
- never claim legal compliance

Snippets should be generated from `legalSnippets.js`.

Where useful, snippets may interpolate:

- site name
- contact email

But they must not fabricate:

- lawful basis
- retention periods
- specific legal rights wording beyond conservative generic guidance

---

## Admin UI Structure

## Page composition

Recommended route file:

- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/legal/page.jsx`

This route should remain a composition shell.

Recommended supporting form/panel components:

- `LegalSettingsWorkspace.jsx`
- `LegalDocumentEditor.jsx`
- `DataUseSummaryPanel.jsx`
- `LegalSaveConfirmationModal.jsx`

These may be placed under:

- `apps/hub-platform/src/components/patterns/legal-settings/`

Exact file naming can vary if it better fits existing conventions.

## Suggested admin layout

### Top section

Header

Then:

- Data Use Summary panel
- legal status / attention banner
- capability-change explanation summary when review is required

### Lower sections

- Terms of Service editor panel
- Privacy Policy editor panel

These can be stacked vertically.

Do not build a tabbed document editor unless needed for usability. Separate stacked panels are clearer and reduce accidental context switching.

## Attention-required integration

The legal system must feed persistent attention state into `/admin`.

Required legal attention states include:

- Terms missing owner-provided content
- Privacy missing owner-provided content
- legal documents require review after platform capability changes
- legacy migrated legal content exists without acceptance recorded in the new system

Each attention item should:

- be durable until resolved
- link directly to `/admin/settings/legal`
- explain the issue in plain English
- indicate whether the owner must act

## Terms helper text

Use:

- `Use your Terms of Service to explain the rules for using your community website, creating an account, becoming a member, registering for events, making payments, cancellations, refunds, acceptable behaviour, and account responsibilities.`

## Privacy helper text

Use:

- `Use your Privacy Policy to explain what personal data your organisation collects through this website, why you use it, who can access it, how long you keep it, and how members can contact you about their data.`

---

## Public Rendering

## Presentation

Reuse the existing public legal page layout approach using:

- `SectionShell`
- `SectionContainer`
- public site header/footer
- `SectionRichText` rendering for legal content

This preserves consistency with the rest of the public site.

## Rendering rule

The public routes must render:

- owner-provided accepted legal content when available
- otherwise the system fallback page

If no accepted content exists:

- render the fallback

The fallback is not an exceptional error state.

It is the normal safe baseline for a hub whose owner has not yet provided legal text.

## Metadata

Provide sensible page metadata:

- Terms: `Terms of Service`
- Privacy: `Privacy Policy`

Hub/site naming can be appended using existing conventions if appropriate.

---

## Security Requirements

All legal save/regenerate operations must:

- validate the authenticated session server-side
- confirm user is the hub owner for the hub, or superadmin in support mode if override is allowed
- scope all reads/writes by `hubId`
- reject cross-hub access
- validate payload shape
- sanitize content
- return stable error shapes
- avoid exposing raw SDK or stack details

## Important implementation rule

Do not rely on UI-only access checks.

The legal repository/action path itself must be safe.

## Support mode

Superadmin support mode should remain supported where the rest of the admin already supports it.

When support mode performs a legal save:

- actor identity should reflect the actual support user
- UI should still show who performed the accepted update

If support override is retained, the UI should clearly distinguish:

- owner-authored acceptance
- support-mode administrative intervention

---

## Server Actions

Use the project’s existing server action pattern, but keep data writes in `src/lib/**`.

## Recommended actions

Inside a legal actions module, provide:

- `saveTermsLegalPageAction`
- `savePrivacyLegalPageAction`
- `regenerateHubDataUseSummaryAction`
- `getLegalAttentionStateForHub` helper in the legal service layer or admin aggregation layer

Do not put Firestore writes directly in the components.

The action should:

- parse form data
- resolve hub
- call a legal repository/service function
- revalidate relevant paths
- return stable `{ error, success, values }`-style state

## Revalidation targets

At minimum revalidate:

- `/${hubSlug}/terms`
- `/${hubSlug}/privacy`
- `/${hubSlug}/admin/settings/legal`
- any custom-domain cached pages that resolve the same hub

## Revalidation strategy requirement

Because this product supports both slug-based and custom-domain public routes, revalidation must not rely only on slug paths.

A production-safe implementation must use one of:

- tag-based revalidation tied to hub legal content
- a documented host-aware revalidation mechanism already used elsewhere in the app

Do not assume `revalidatePath('/{hubSlug}/terms')` alone is enough for custom-domain traffic.

---

## Migration Plan

## Goal

Preserve useful existing legal content where possible without silently treating legacy content as reviewed/accepted production legal text.

## Source

Current legacy content lives in:

- `siteSettings.pages.terms.customBody`
- `siteSettings.pages.privacy.customBody`
- `siteSettings.pages.cookies.customBody`

## Migration rules

### Terms

If `siteSettings.pages.terms.customBody` exists:

- migrate it into `legal.settings.terms.content`
- set revision to `1` only if content exists
- set `hasOwnerProvidedContent` to `false` during migration
- leave acceptance metadata unset unless an explicit migration strategy is chosen

### Privacy

If `siteSettings.pages.privacy.customBody` exists:

- migrate it into `legal.settings.privacy.content`
- set revision to `1` only if content exists
- set `hasOwnerProvidedContent` to `false` during migration
- leave acceptance metadata unset unless an explicit migration strategy is chosen

### Acceptance metadata decision

Do **not** fabricate historical acceptance.

Recommended approach:

- migrate content
- leave `acceptedResponsibilityAt` and related identity fields empty
- require the next actual admin save to capture responsibility formally

### Public rendering during migration

To keep the live-content rule internally consistent, migrated legacy content must not automatically count as owner-provided accepted content in the new system.

Recommended behavior:

- migrate legacy content into the legal document store
- preserve it for editing continuity
- keep `hasOwnerProvidedContent` false
- render system fallback publicly until the owner completes the first accepted save in the new system
- surface persistent attention in admin explaining that legal content must be reviewed and accepted before it replaces the fallback

This is stricter than showing migrated content immediately, but it keeps the live-content rule clear and avoids fabricating acceptance.

### Migration tradeoff

This is an intentional production-safety tradeoff.

It means some hubs that previously had legacy legal text stored in page settings may temporarily show the fallback public legal page until the owner completes acceptance in the new system.

That is operationally less convenient, but it is the cleaner legal and audit boundary for this implementation.

### Cookies

Do not migrate legacy `cookiesCustomBody` into the new legal editor.

Instead:

- retire it from hub legal editing
- preserve it only if temporarily needed during deprecation
- move long-term cookie explanation into a platform-controlled route/system

---

## Decommissioning Current Useful Links Implementation

The current `Useful links` legal editing implementation should be retired cleanly.

## Required changes

- remove legal editing responsibility from `/admin/settings/pages/useful-links`
- remove the `Cookies` tab from hub-authored legal editing
- update page settings overview so it no longer presents `Useful links` as the home for legal management
- add or link to the new `Legal pages` route instead

## Transitional handling

If needed during rollout:

- the old route may temporarily redirect to `/admin/settings/legal`
- or show a deprecation notice while preserving navigation stability

Preferred outcome:

- direct users to the dedicated legal route

Also update:

- any onboarding references
- any settings overview cards
- any checklist/help copy

so that they no longer point owners to `Useful links` for legal management.

---

## Cookie Management Follow-On Work

This legal implementation must also address the fact that cookie management is currently incomplete.

## Production-grade immediate standard

For this phase, production-grade means:

- truthful explanation of current cookie usage
- clear public cookie preferences entry point
- no misleading optional categories if they do not exist
- platform-controlled wording

It does not require a full future consent centre now.

### Cookie-management tradeoff

This approach deliberately prefers truth and platform control over giving the hub owner a third editable legal page.

That is the right tradeoff here because cookie behavior is primarily a platform implementation concern and can change independently of hub-authored content.

## Required follow-on implementation

### 1. Formalize cookie capability model

Create a platform-controlled description of currently active cookie behavior:

- session/auth cookies
- public cookie-preferences cookie
- any optional cookies if truly present

### 2. Align public cookie page or explanation

If `/cookies` remains public:

- make it system-generated
- do not make it a hub-authored legal page
- ensure wording matches actual implementation

### 3. Keep preference state truthful

If only necessary cookies are in use:

- UI must say so clearly
- no fake analytics toggle
- no implied consent categories that do not exist

### 4. Prepare for later expansion

Structure the code so future optional integrations can register:

- category
- description
- default state
- whether prior consent is required

Do not build the full registry UI now unless required elsewhere.

---

## File Plan

## New files to add

Recommended additions:

- `docs/hub-legal-pages-production-implementation-plan.md`
- `apps/hub-platform/src/lib/legal/legalRepository.js`
- `apps/hub-platform/src/lib/legal/legalValidation.js`
- `apps/hub-platform/src/lib/legal/legalSanitizer.js`
- `apps/hub-platform/src/lib/legal/buildHubDataUseSummary.js`
- `apps/hub-platform/src/lib/legal/legalSnippets.js`
- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/legal/page.jsx`
- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/legal/actions.js`
- `apps/hub-platform/src/components/patterns/legal-settings/LegalSettingsWorkspace.jsx`
- `apps/hub-platform/src/components/patterns/legal-settings/LegalSettingsWorkspace.module.css`
- `apps/hub-platform/src/components/patterns/legal-settings/DataUseSummaryPanel.jsx`
- `apps/hub-platform/src/components/patterns/legal-settings/LegalDocumentEditor.jsx`
- `apps/hub-platform/src/components/patterns/legal-settings/LegalSaveConfirmationModal.jsx`

Exact component file split can vary, but keep route files thin.

## Existing files to modify

Expected modifications:

- `apps/hub-platform/src/lib/domain/section-rich-text.js`
- `apps/hub-platform/src/components/patterns/section-rich-text-field/*` if formatting support is expanded
- `apps/hub-platform/src/app/(hub)/[hubSlug]/terms/page.jsx`
- `apps/hub-platform/src/app/(hub)/[hubSlug]/privacy/page.jsx`
- `apps/hub-platform/src/components/patterns/public-legal-page/PublicLegalPage.jsx`
- `apps/hub-platform/src/components/patterns/public-site-footer/PublicSiteFooter.jsx`
- `apps/hub-platform/src/components/patterns/page-settings-overview/PageSettingsOverview.jsx`
- admin navigation config files
- `/admin` attention-required composition/state sources
- onboarding/checklist/help config where legal references currently exist or should exist

## Existing files to deprecate or narrow

- current `UsefulLinksSettingsForm` implementation
- useful-links admin route as the home of legal editing
- legal-specific logic inside `site-settings` domain/data modules
- hub-authored cookies policy editing

---

## Controlled Rollout Order

Implement in this exact order to reduce risk.

### Phase 1. Legal datastore and service layer

- add `src/lib/legal/*`
- define legal settings shape
- add repository reads/writes
- add validation/sanitizer
- add summary builder skeleton

### Phase 2. Admin legal route shell

- add `/admin/settings/legal`
- render header
- render empty or placeholder Data Use Summary panel
- render Terms and Privacy editor shells
- wire hub-scoped loading
- wire owner-only editability vs read-only admin visibility

### Phase 3. Save-and-accept workflow

- implement save actions
- implement confirmation modal
- implement checkbox gating inside the modal
- implement metadata writes
- implement revision bumping
- implement unchanged-content short-circuit
- reject empty changed saves

### Phase 4. Summary generation

- implement `buildHubDataUseSummary`
- wire regenerate action
- render structured summary UI
- implement summary staleness detection
- implement capability-change explanation items
- implement per-document accepted snapshot comparison

### Phase 5. Public route swap

- switch `/terms` and `/privacy` to read from legal settings
- implement fallback text
- keep public layout consistent
- keep live-content gate consistent with owner acceptance rule

### Phase 6. Migration

- migrate legacy terms/privacy content
- surface missing acceptance state in admin
- create persistent attention-required items for migrated-but-unaccepted content
- retire useful-links legal editing

### Phase 7. Cookie management alignment

- remove hub-authored cookies legal editing path
- align public cookie explanation and preferences with actual platform behavior
- settle the final `/cookies` route behavior and footer linkage

### Phase 8. QA and hardening

- admin auth checks
- owner-only auth checks
- support mode checks
- cross-hub rejection tests
- rendering safety
- route resolution on slug/custom-domain modes
- rich text persistence and formatting validation
- confirmation modal flow
- stale-summary and capability-change attention flow
- document-targeted review prompts

---

## Acceptance Criteria

## Admin legal settings

- hub admin can open `/{hubSlug}/admin/settings/legal`
- only the hub owner can edit Terms rich text
- only the hub owner can edit Privacy rich text
- non-owner admins can view but cannot edit or save
- changed legal content cannot be saved without modal confirmation and responsibility acknowledgement
- save action stores:
  - content
  - updated metadata
  - acceptance metadata
  - revision
- save action rejects empty content changes
- unchanged save does not create a new revision
- Data Use Summary is visible, read-only, and server-generated
- Regenerate summary updates timestamp and generator version
- stale summary/capability changes surface review guidance
- legal issues surface in `/admin` attention required

## Public rendering

- `/{hubSlug}/terms` renders current hub Terms
- `/{hubSlug}/privacy` renders current hub Privacy
- `/terms` resolves correctly on custom domains
- `/privacy` resolves correctly on custom domains
- pages are public and do not require login
- public pages do not expose admin scaffolds
- legal content renders safely
- fallback text appears when content does not yet exist
- fallback remains until owner-provided accepted content exists

## Data Use Summary

- includes accounts section
- includes memberships where applicable
- includes events/registrations where applicable
- includes payments where applicable
- includes media where applicable
- includes emails/notifications truthfully based on actual capability
- includes admin actions where applicable
- always includes hub-owner-decisions-required
- clearly separates platform responsibility from hub owner responsibility
- clearly states it is not legal advice
- identifies what changed when platform capabilities move in a way that may affect legal wording
- can target changes to Terms, Privacy, or both

## Security

- all legal saves are server-authorized
- all summary regenerations are server-authorized
- all reads/writes are hub-scoped
- cross-hub access is rejected
- rich text is normalized and sanitized
- raw SDK errors are not exposed to the UI
- non-owner admin writes are rejected server-side

## Cookie handling

- cookie explanation is platform-controlled
- current cookie preferences UI remains truthful to actual implementation
- hub-authored cookies legal editing is removed from this production legal flow
- `/cookies` end-state is explicit and system-controlled

---

## QA Checklist

Before considering implementation complete, verify all of the following.

### Admin route behavior

- normal hub admin can access legal route for their own hub
- only owner can edit/save
- non-owner admins are read-only
- hub admin cannot access another hub’s legal route
- superadmin support mode can access legal route when support mode is active
- support mode not active cannot perform cross-hub legal actions

### Save behavior

- changed save without checkbox fails
- changed save without confirmation modal completion fails
- changed save with checkbox succeeds
- unchanged save does not bump revision
- empty changed save is rejected
- invalid rich text payload is rejected safely

### Public rendering

- slug route renders correct hub content
- custom-domain route renders correct hub content
- missing content shows fallback
- migrated but unaccepted legacy content still shows fallback until owner acceptance is recorded
- formatting renders correctly
- no draft/editor guidance leaks publicly

### Summary integrity

- summary changes when relevant capabilities differ
- Stripe wording appears only when appropriate
- payment wording stays conservative when Stripe/native flow is not ready
- media wording reflects actual public asset capability
- notification wording does not overclaim automation
- change explanations identify what the owner may need to update in their legal pages
- document-targeting is correct for review prompts where only one legal page is affected

### Cookie alignment

- footer manage-cookie-preferences control still works
- cookie explanation matches actual current cookies
- no obsolete editable cookies page is left in the admin flow
- final `/cookies` route behavior matches the implementation decision

---

## Notes For Implementation

### 1. Prefer truth over completeness

If a capability is ambiguous in the current codebase, word the summary conservatively rather than inventing detail.

### 2. Keep legal-specific logic out of general site settings

This is an important architectural boundary.

### 3. Keep route files as composition shells

Do not move data writes or heavy domain logic into route components.

### 4. Do not overbuild version history now

Store revision metadata now, but do not build a full history UI in this phase.

### 5. Do not let cookie management drift back into freeform hub editing

That would reintroduce unnecessary risk.

### 6. Treat legal readiness as product state, not passive content

Because the hub site is live immediately, legal completeness and legal review requirements must be surfaced as durable operational state until resolved.

### 7. Prefer explicit document targeting for review prompts

Where the platform can tell that a capability change primarily affects Terms or Privacy, surface that explicitly to reduce owner confusion and review fatigue.

---

## Implementation Readiness

This plan is the implementation source of truth for the feature.

When implementation begins:

- follow the rollout phases in order
- do not revive the old useful-links legal path except as a temporary migration bridge
- keep all platform-responsibility wording factual and platform-controlled
- keep all hub-specific legal wording editable but explicitly acknowledged on save
- preserve the owner-only responsibility boundary throughout the full workflow
