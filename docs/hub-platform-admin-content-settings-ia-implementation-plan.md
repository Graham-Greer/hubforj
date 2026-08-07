# Hub Platform Admin Content And Settings IA Implementation Plan

## Purpose

This plan defines the controlled migration of the hub admin sidebar and related content-management journeys so the admin portal presents a clearer enterprise-grade information architecture.

The main UX correction is to move public page/content authoring out of the Settings mental model and into the Content mental model, while keeping compliance and account configuration under Settings.

This plan intentionally does not remove existing route URLs in the first implementation pass. Existing deep links, onboarding references, support workflows, and previously built skeleton/loading states must continue to work while the visible navigation and user journey are improved.

## Current State Audit

### Sidebar Navigation

Current groups in `apps/hub-platform/src/lib/navigation/hub-admin-nav.js`:

- Overview
  - Overview
- People
  - Admins
  - Members
- Programmes
  - Events
  - Courses
- Content
  - Media
  - What we do
  - Testimonials
- Finance
  - Stripe setup
  - Payments
  - Membership plans
- Settings
  - Site settings
  - Page settings
  - Legal pages
  - Account settings

### Current Route Ownership

The current route structure is functional but conceptually split:

- `/admin/settings/pages`
  - Public page settings overview.
  - Cards for homepage, events page, courses page, testimonials page.
- `/admin/settings/pages/home`
  - Homepage section-level settings.
  - Includes tabs for Hero, About us, What we do, Testimonials, CTA.
  - The What we do tab currently edits section copy only.
- `/admin/what-we-do`
  - Standalone What we do item list.
  - Contains homepage-specific item content.
- `/admin/what-we-do/create`
  - Standalone What we do item create form.
- `/admin/what-we-do/[itemId]`
  - Standalone What we do item edit form.
- `/admin/testimonials`
  - Standalone testimonial item list.
- `/admin/testimonials/create`
  - Standalone testimonial create form.
- `/admin/testimonials/[testimonialId]`
  - Standalone testimonial edit form.
- `/admin/settings/legal`
  - Dedicated legal pages editor.
- `/admin/settings/site`
  - Structured site details such as contact, address, social links, hours, SEO defaults, and regional defaults.
- `/admin/settings/branding`
  - Brand identity and visual settings.
- `/admin/settings/account`
  - Account-level settings.

### UX Issues Identified

Page Settings is currently under Settings even though it is primarily public-site content authoring.

What we do item management is a standalone Content route, while homepage What we do section copy is inside the Home page settings form. This requires admins to understand two separate places for one homepage section.

Testimonials are correctly standalone content records, but the homepage settings form should make it clear that the homepage uses existing testimonial records rather than creating a separate testimonial set.

Legal pages appear both in the Settings sidebar and as a Settings overview panel. This duplication is intentional and should remain because the overview panel communicates setup/completion state, while the sidebar item provides permanent direct access.

The Settings overview should not include an Account settings card. Account settings is already directly available from the sidebar and is not part of public-site/compliance setup.

The Settings overview naming still needs a focused cleanup. Current code still surfaces:

- `/admin/settings` header eyebrow: `Site settings`
- `/admin/settings` header title: `Manage site settings`
- Settings overview card: `Branding`
- Settings overview card: `Site`
- Branding route title: `Brand and appearance`
- Site details route title: `Site details`

The target naming should be more explicit:

- Settings overview should be the configuration overview for site setup.
- Branding card should be renamed to `Site branding`.
- Site card should be renamed to `Site details`.
- Site details copy should not imply homepage content lives there.
- Account settings should remain a sidebar route only and should not appear as a Settings overview card.

### Pre-Implementation Code Audit Findings

The plan has been checked against the current codebase before implementation.

Important findings:

- `PageSettingsOverview` already uses `Pages` as its eyebrow and already has reasonably page/content-oriented copy. Phase 2 should therefore be a focused polish, not a broad rewrite.
- The sidebar still places `Page settings` under Settings and labels it `Page settings`.
- The Home page form currently redirects to `/${hub.slug}/admin/settings/pages` after every successful save. This must become section-context aware, otherwise a user saving while working in the What we do panel will be ejected back to the Pages overview.
- The Home page form uses `useDirtyFormState` and the admin form runtime, but there is no generic dirty-aware inline link component for actions inside a form section.
- `AdminDirtyAwareBackButton` only hides a back button when the current form is dirty.
- `AdminDiscardChangesButton` provides a modal-confirmed discard flow, but it is currently designed as a footer/back action rather than an inline management link.
- `Button href` renders a Next `Link`, so using it directly for `Add item`, `Edit item`, or `Manage testimonials` inside the Home page form would navigate immediately and bypass dirty-state protection.
- What we do create/update server actions currently redirect only to What we do routes:
  - create redirects to `/${hubSlug}/admin/what-we-do/${item.id}?created=1`
  - update redirects to `/${hubSlug}/admin/what-we-do/${itemId}?saved=1`
- What we do create/edit forms do not currently include return-context hidden fields.
- What we do create page does not currently accept `searchParams`.
- What we do edit page accepts `searchParams`, but currently only uses `created` and `saved` feedback flags.
- No shared safe admin return-path helper currently exists for this flow. Existing auth return-path helpers are member-auth specific and should not be reused directly.
- Onboarding currently includes a first-run spotlight that targets both `nav_site_settings` and `nav_page_settings`.
- Onboarding currently has a dedicated `what_we_do` journey with `routePatterns: ["/admin/what-we-do"]`.
- The checklist item `Add What we do items` currently links to `/admin/what-we-do`.
- The onboarding selector map includes `what_we_do_list` and `nav_page_settings`, but does not currently define a Home page What we do item-manager selector.

## Target Sidebar Navigation

The target visible sidebar structure is:

- Overview
  - Overview
- People
  - Admins
  - Members
- Programmes
  - Events
  - Courses
- Content
  - Pages
  - Media
  - Testimonials
- Finance
  - Stripe setup
  - Payments
  - Membership plans
- Settings
  - Site settings
  - Legal pages
  - Account settings

## Target Mental Model

### Content

Content is where admins manage public-facing content and editorial surfaces.

It should contain:

- Pages
- Media
- Testimonials

The standalone What we do nav item should be removed from the sidebar once the Home page editor provides a clear item-management entry point.

### Pages

Pages replaces the current Page settings sidebar label.

The underlying route can remain `/admin/settings/pages` for now to avoid unnecessary routing churn. The label and nav placement should change first. A future route alias such as `/admin/content/pages` may be considered later, but it is not required for this IA improvement.

Pages should continue to expose:

- Home page
- Events page
- Courses page
- Testimonials page

### Home Page

The Home page editor owns homepage composition.

The What we do section inside the Home page editor should include:

- section eyebrow
- section title
- section description
- existing What we do item list
- item statuses
- item ordering visibility
- add item CTA
- edit item CTA for each item

The initial implementation should reuse the existing What we do create/edit routes rather than rebuilding CRUD inside the Home page form.

### What We Do Items

What we do item create/edit routes should remain:

- `/admin/what-we-do/create`
- `/admin/what-we-do/[itemId]`

They should support a return journey back to the Home page What we do section.

The standalone `/admin/what-we-do` list route should remain accessible by direct URL for compatibility, support workflows, and staged migration. It should not appear as a top-level sidebar item after this IA pass.

### Testimonials

Testimonials remain a standalone Content route.

Reasoning:

- Testimonials are reusable content records.
- They can be used on the homepage and the testimonials page.
- They are not owned exclusively by the homepage.

The Home page Testimonials tab should communicate that the homepage uses existing testimonials and should provide a link to manage testimonials if needed.

### Settings

Settings is for configuration, compliance, and account/admin setup.

It should contain:

- Site settings
- Legal pages
- Account settings

The Settings overview route `/admin/settings` should continue to act as the settings dashboard.

It should include:

- Site branding
- Site details
- Legal pages
- Stripe/regional setup if relevant

It should not include:

- Account settings card
- Page settings card
- What we do item management
- Testimonials item management

Legal pages should remain duplicated as both:

- a sidebar item, for permanent direct access
- an overview panel, for completion/review-state visibility

## Implementation Principles

Do not change database shape for this IA pass.

Do not remove existing routes in the first pass.

Prefer visible navigation and copy changes before route migrations.

Preserve existing permissions and entitlement checks.

Preserve admin skeleton/loading behavior and route-specific fallbacks.

Use return-to behavior instead of duplicating What we do CRUD logic prematurely.

Prevent accidental loss of unsaved Home page changes when navigating to create/edit What we do items.

Update onboarding references so tours/checklists do not point at hidden or renamed sidebar items.

Keep the implementation reversible until production usage confirms the new IA is clearer.

## Phase 1: Sidebar Navigation Restructure

### Objective

Move public page authoring into the Content group and remove What we do as a standalone sidebar destination.

### Required Changes

Update `apps/hub-platform/src/lib/navigation/hub-admin-nav.js`.

Content group should become:

- Pages
- Media
- Testimonials

Settings group should become:

- Site settings
- Legal pages
- Account settings

The existing `Page settings` item should:

- move from Settings to Content
- be renamed to `Pages`
- continue pointing to the existing `/admin/settings/pages` route
- retain route active state for `/admin/settings/pages/*`
- retain `onboardingKey: "nav-page-settings"` initially unless onboarding selectors are migrated in the same implementation pass

The existing `What we do` sidebar item should:

- be removed from visible sidebar navigation
- remain reachable by direct URL
- remain available for return-to flows from Home page What we do item management

### Acceptance Criteria

The sidebar displays `Content -> Pages`.

The sidebar no longer displays `Content -> What we do`.

The sidebar still displays `Content -> Testimonials`.

The sidebar still displays `Settings -> Legal pages`.

The sidebar still displays `Settings -> Account settings`.

The `/admin/settings/pages` route still loads successfully.

The `/admin/what-we-do`, `/admin/what-we-do/create`, and `/admin/what-we-do/[itemId]` routes still load by direct URL.

Active nav state works when viewing:

- `/admin/settings/pages`
- `/admin/settings/pages/home`
- `/admin/settings/pages/events`
- `/admin/settings/pages/courses`
- `/admin/settings/pages/testimonials`

The first-run onboarding spotlight that currently targets `nav_page_settings` still finds the renamed `Pages` sidebar item.

## Phase 2: Pages Overview Copy And Journey Alignment

### Objective

Make the Pages overview feel like a Content area rather than a Settings area, without changing the route path yet.

### Required Changes

Update copy on `/admin/settings/pages`.

The page should refer to public pages/content rather than settings-heavy language.

Code audit note: the route and `PageSettingsOverview` already use `Pages` wording in several places. This phase should polish the remaining language rather than replacing the whole view.

Suggested direction:

- Eyebrow: `Content`
- Title: `Pages`
- Description: `Manage the public pages visitors use to understand and join your community.`

Update cards if needed:

- Home page
  - Should mention hero, homepage sections, CTAs, What we do, and testimonials presentation.
- Events page
  - Should mention event page hero/copy and public event browsing.
- Courses page
  - Should mention course page hero/copy and public course browsing.
- Testimonials page
  - Should mention the testimonials listing page, not testimonial item creation.

### Acceptance Criteria

Admins can understand that Pages is a content authoring area.

The Home page card hints that What we do lives inside Home page content.

The Testimonials page card does not imply testimonial records are created there.

No route URL change is required.

## Phase 2B: Settings Overview Naming And Card Alignment

### Objective

Bring the Settings overview and related route labels into alignment with the final IA, so admins can clearly distinguish site branding, site details, legal compliance, and account settings.

This phase addresses a gap found after the first implementation slice: the plan moved `Pages` correctly but did not explicitly require the Settings overview card labels and related copy to be updated.

### Required Changes

Update `/admin/settings` and `SettingsOverview`.

Target overview header:

- Eyebrow: `Settings`
- Title: `Site settings`
- Description should communicate that this area manages site configuration, compliance, regional/payment setup where relevant, and public-site defaults.

Do not use `Manage site settings` as the title if the sidebar item already says `Site settings`; it creates a repetitive label stack.

Update Settings overview cards:

- `Branding` becomes `Site branding`
- `Site` becomes `Site details`
- `Legal pages` remains `Legal pages`
- `Regional setup` remains `Regional setup`
- `Stripe setup` remains `Stripe setup`

Update card actions:

- `Edit brand settings` should become `Edit site branding`
- `Edit site settings` should become `Edit site details`
- `Open legal settings` may remain as-is or become `Open legal pages`; prefer whichever matches the existing legal route tone.

Update card body copy:

- Site branding should describe logo, public visual identity, theme/template choices, and public header/CTA branding.
- Site details should describe contact details, address, hours, social links, SEO defaults, country/locale/timezone/currency defaults where appropriate.
- Site details should not mention homepage hero content. Homepage content now lives under `Content -> Pages -> Home page`.

Update related route headers if needed:

- `/admin/settings/branding`
  - Preferred title: `Site branding`
  - Description should explain public visual identity and brand presentation.
- `/admin/settings/site`
  - Keep title: `Site details`
  - Description should remove `homepage hero content` and focus on structured public details and defaults.

Update loading states for these routes so hard refresh does not show old names.

Update form/action copy where user-facing:

- Branding form submit copy may become `Save site branding`.
- Branding action success may become `Site branding updated.`
- Site form submit copy may become `Save site details`.
- Site action success may become `Site details updated.`

These are copy changes only. They must not alter field names, server action contracts, validation, or database shape.

### Onboarding Impact

Update onboarding language:

- `Start with branding` should become `Start with site branding`.
- `Complete branding` should become `Complete site branding`.
- Any copy saying `Use Branding` should say `Use Site branding`.

Keep the existing journey key `settings_branding` and selector names such as `branding_settings_card` unless there is a separate, deliberate onboarding migration. Stable keys avoid unnecessary checklist state churn.

### Acceptance Criteria

Settings sidebar still displays:

- `Site settings`
- `Legal pages`
- `Account settings`

`/admin/settings` overview displays cards for:

- `Site branding`
- `Site details`
- `Legal pages`
- `Regional setup`, only when incomplete
- `Stripe setup`, only when relevant

`/admin/settings` overview does not display:

- `Pages`
- `What we do`
- `Testimonials`
- `Account settings`

No user-facing Settings overview card is titled only `Branding`.

No user-facing Settings overview card is titled only `Site`.

The `/admin/settings/site` page does not claim to manage homepage hero content.

Hard refresh/loading states use the same `Site branding` and `Site details` naming.

Onboarding and checklist copy use `Site branding` where user-facing, while internal journey keys remain stable.

## Phase 3: Home Page What We Do Item Management Entry Point

### Objective

Make the Home page What we do section the primary user journey for managing What we do items, while reusing existing create/edit routes.

### Required Changes

Update the Home page settings form at:

- `/admin/settings/pages/home`

The What we do tab should show:

- section eyebrow input
- section title input
- section description input
- a clearly separated `Items` area
- existing What we do items
- item title
- item status
- item sort/order indicator
- edit action for each item
- add item CTA

The add/edit actions should navigate to existing routes:

- add: `/admin/what-we-do/create`
- edit: `/admin/what-we-do/[itemId]`

Both links should include return context back to the Home page What we do section.

Suggested query shape:

- `/admin/what-we-do/create?returnTo=/admin/settings/pages/home&section=what-we-do`
- `/admin/what-we-do/[itemId]?returnTo=/admin/settings/pages/home&section=what-we-do`

The exact query parameter names may vary, but they must be consistent and documented.

### Dirty-Aware Inline Navigation

The current admin form runtime does not provide a generic dirty-aware inline link for actions inside a form section.

This phase should add a small reusable component before adding item-management links inside the Home page form.

Recommended component:

- `AdminDirtyAwareActionLink`

Expected behavior:

- accepts `href`, `children`, `variant`, and optional modal copy
- reads `isDirty` from `useAdminFormRuntime`
- if the form is clean, behaves like a normal Button/Link
- if the form is dirty, opens a confirmation modal before navigating
- uses context-specific copy, for example: `Your unsaved homepage changes will be lost if you leave to manage an item.`

Do not use plain `Button href` for Home page `Add item`, item `Edit`, or `Manage testimonials` links because it will navigate immediately and bypass dirty-state protection.

### Home Page Save Redirect Behavior

The current Home page form redirects to the Pages overview after every successful save.

For this IA change, the save behavior must become section-context aware.

Required behavior:

- normal Home page editing may keep the existing default behavior if that remains the desired product behavior
- when the route has `?section=what-we-do`, saving should keep the admin in the What we do section-specific journey
- if a future `Save and add item` CTA is implemented, it should save first, then navigate to the create route with safe return context

Minimum acceptable first pass:

- support opening the What we do section from `?section=what-we-do`
- avoid forcing the admin back to Pages overview after saving while they are in a section-specific journey

### Data Loading

The Home page editor currently loads site settings and media folders.

Adding What we do items must not meaningfully slow the initial Home page title/shell.

Recommended approach:

- Load section-level form values as today.
- Load What we do items in the existing Suspense boundary if server-rendered.
- If this introduces measurable delay, split the items area into its own deferred server component or client fetch.

Because What we do items are intentionally small and recommended to remain capped to 3-6 published items, a bounded server load is acceptable as a first pass if route timing remains healthy.

### Dirty State

The Home page form already participates in admin dirty-state handling.

Navigating from the Home page form to add/edit an item must not silently discard unsaved section changes.

Required behavior:

- If the Home page form is clean, `Add item` and `Edit` may navigate normally.
- If the Home page form is dirty, the admin must be warned before navigating away or given a save-first path.

Preferred enterprise behavior:

- Provide `Save and add item` when dirty.
- Provide `Save and edit item` only if technically straightforward.
- Otherwise rely on the existing dirty-aware navigation guard and make the CTA copy clear.

Do not implement autosave in this phase unless the existing form runtime already supports it safely.

### Acceptance Criteria

The Home page What we do tab becomes the obvious place to manage homepage What we do content.

Admins can add a What we do item from the Home page What we do tab.

Admins can edit a What we do item from the Home page What we do tab.

Existing What we do create/edit routes are reused.

Unsaved Home page form changes are protected.

The user can return to the Home page What we do tab after creating or editing an item.

Plain inline item-management links do not bypass dirty-state protection.

Saving from a section-specific Home page journey does not unexpectedly eject the admin back to the Pages overview.

## Phase 4: Return-To Flow For What We Do Create/Edit

### Objective

Ensure admins who start item management from the Home page editor return to the correct place after create/update/cancel.

### Required Changes

Update What we do create/edit pages and server actions to support return context.

Query params alone are not enough because the final redirect is chosen inside server actions from submitted form data. The create/edit pages must normalize return context from `searchParams`, pass it into the forms, and the forms must submit it through hidden inputs.

Required form hidden inputs when a valid return target exists:

- `returnTo`
- `returnSection`

Required page/workspace updates:

- Create page must accept `searchParams`.
- Edit page already accepts `searchParams`, but must normalize return context and pass it into the workspace/form.
- Workspace header back buttons should respect validated return context when present.
- Edit form cancel/discard actions should respect validated return context when present.

The return target should be validated. Do not blindly redirect to arbitrary external URLs.

Allowed return targets should be internal admin paths only.

Suggested validation:

- must be a relative path
- must start with `/${hub.slug}/admin/`
- must not contain a protocol
- must not contain `//`
- should preferably be normalized against an allowlist for this first flow:
  - `/${hub.slug}/admin/settings/pages/home`
  - `/${hub.slug}/admin/what-we-do`

After create:

- default redirect remains current behavior if no return target exists
- if return target exists, redirect to the return target with the What we do section selected

After edit:

- default redirect remains current behavior if no return target exists
- if return target exists, redirect to the return target with the What we do section selected

After cancel/back:

- the visible back action should respect the validated return target when present
- otherwise it should return to the current What we do list route

### Section Targeting

The Home page route should support opening the What we do tab/section directly.

Acceptable approaches:

- `?section=what-we-do`
- `?tab=what-we-do`
- hash anchor such as `#what-we-do`

Preferred approach:

- use a query param for tab state because the Home page editor is a client form with tabbed sections
- optionally also set an anchor for scroll positioning

The Home page form currently starts on the Hero tab by default. It must initialize the active tab from the selected query parameter when present.

### Acceptance Criteria

Creating a What we do item from the Home page editor returns the admin to the Home page What we do tab.

Editing a What we do item from the Home page editor returns the admin to the Home page What we do tab.

Direct use of `/admin/what-we-do/create` still returns to the What we do list route.

Direct use of `/admin/what-we-do/[itemId]` still returns to the What we do list route.

Return URLs cannot be abused as open redirects.

The create/update actions retain the existing admin and public cache revalidation behavior.

The Home page settings route is revalidated after What we do item create/update so returning to the Home page What we do panel reflects the latest item list.

## Phase 5: Testimonials Home Page Cross-Linking

### Objective

Keep testimonials as a standalone content type while making the Home page testimonial section understandable.

### Required Changes

Update the Home page Testimonials tab to clarify:

- this section controls how testimonials appear on the homepage
- testimonial records are managed from the Testimonials content route

Add a contextual action:

- `Manage testimonials`
- links to `/admin/testimonials`

This action is inside the Home page form and should use the same dirty-aware inline navigation behavior as the What we do item links.

If useful and cheap, display a simple count or status:

- number of published testimonials
- warning if there are no published testimonials

Do not fetch large testimonial datasets for this panel.

If a count is needed, use an existing bounded summary if available. If not available, defer the count or omit it in the first implementation pass.

### Acceptance Criteria

Admins understand that homepage testimonial copy and testimonial records are separate concerns.

The Home page Testimonials tab links to the Testimonials content route.

The Testimonials sidebar item remains visible under Content.

No broad testimonial fetch is introduced into the Home page settings route.

The Manage testimonials action does not silently discard unsaved Home page changes.

## Phase 6: Onboarding And Checklist Alignment

### Objective

Update onboarding copy, targets, and checklist routing so the guided admin journey matches the new sidebar and Home page flow.

### Current Onboarding References

Known references exist in:

- `docs/admin-onboarding-map.md`
- `docs/admin-onboarding-product-spec.md`
- `docs/admin-onboarding-engineering-plan.md`
- `apps/hub-platform/src/lib/data/admin-onboarding.js`
- nav onboarding keys:
  - `nav-page-settings`
  - `nav-what-we-do`
  - `nav-testimonials`

### Required Changes

Review all onboarding references to:

- `Page settings`
- `What we do`
- `Testimonials`

Update wording so:

- `Page settings` becomes `Pages`
- What we do item guidance points to `Pages -> Home page -> What we do`
- Testimonials item guidance points to `Content -> Testimonials`

If `nav-what-we-do` is removed from the sidebar, no onboarding step should target a hidden sidebar item.

Checklist actions for adding What we do items should navigate to:

- Home page What we do tab, if the action is educational/compositional
- What we do create route with return context, if the action is directly creating an item

Suggested destination:

- `/${hub.slug}/admin/settings/pages/home?section=what-we-do`

Code-level required changes:

- Keep `nav_page_settings` selector mapped to the renamed `Pages` nav item unless a broader selector rename is performed.
- Update first-run onboarding copy from `Page settings` to `Pages`.
- Update the `what_we_do` journey route pattern away from `/admin/what-we-do` if the intended guided journey is now the Home page What we do panel.
- Add a selector for the Home page What we do item-management area, for example `homepage_what_we_do_items`.
- Add `data-onboarding="homepage-what-we-do-items"` to the item-management area.
- Update checklist `what_we_do.href` from `/admin/what-we-do` to `/admin/settings/pages/home?section=what-we-do`.
- Preserve record-based completion logic for `recordKey: "whatWeDo"` unless the data model changes.

### Acceptance Criteria

Onboarding does not reference a sidebar item that no longer exists.

The setup checklist still helps admins complete:

- homepage setup
- at least 3 published What we do items
- testimonials setup

Guided steps land on the correct page/section.

No onboarding completion logic is weakened.

The old `/admin/what-we-do` onboarding route is not auto-triggered from normal sidebar-driven setup, but direct route visits may still show a compatibility tour if desired.

## Phase 7: Skeleton, Loading, And Route UX Verification

### Objective

Ensure the IA change does not regress the skeleton/loading strategy previously implemented for hub admin routes.

### Required Checks

Verify loading behavior for:

- `/admin/settings/pages`
- `/admin/settings/pages/home`
- `/admin/what-we-do`
- `/admin/what-we-do/create`
- `/admin/what-we-do/[itemId]`
- `/admin/testimonials`
- `/admin/settings`
- `/admin/settings/pages/home?section=what-we-do`
- `/admin/what-we-do/create?returnTo=...`
- `/admin/what-we-do/[itemId]?returnTo=...`

Specific checks:

- no generic fallback appears before route-specific skeletons
- no duplicate title sections appear
- Home page title/shell loads quickly
- What we do item area does not cause layout jumping
- direct navigation and hard refresh both show the correct loading treatment
- dark and light theme skeleton tokens remain correct
- Home page What we do item area has a stable route-specific panel layout and does not flash a generic loading block above the form
- returning from create/edit does not first show the wrong route skeleton

### Acceptance Criteria

Moving Pages to Content does not break any existing skeleton route.

Home page What we do item management area has stable dimensions.

No visible loading regression appears during throttled navigation.

## Phase 8: Access Control And Entitlement Verification

### Objective

Ensure the new navigation and Home page item links respect existing permissions and plan entitlements.

### Required Checks

Verify the following users:

- hub owner
- admin
- superadmin support mode
- restricted/readonly admin if supported

Verify the following hub states:

- free plan
- Growth plan
- regional setup incomplete
- legal pages incomplete
- testimonials capability disabled if applicable

What we do item links should only appear where the user can reasonably use them.

If a user can edit Home page settings but cannot create What we do items, the UI should not present a broken CTA.

The existing What we do create/edit actions use `requireHubOperatorActionAccess`. Any new Home page item-management links must align with this access model.

### Acceptance Criteria

No unauthorized create/edit link is exposed.

Hidden sidebar items remain protected by server-side route guards.

Removing What we do from the sidebar does not remove route-level authorization.

Entitlement locking remains consistent with existing behavior.

## Phase 9: Documentation And Support Notes

### Objective

Keep product, engineering, and support documentation aligned with the new IA.

### Required Updates

Update this plan with progress notes after implementation.

Update onboarding documentation if changed.

Update any support/admin-facing docs that refer to:

- Page settings under Settings
- What we do as a top-level sidebar item
- testimonials setup journey

Document the compatibility decision:

- existing `/admin/settings/pages/*` URLs remain valid
- existing `/admin/what-we-do/*` URLs remain valid
- What we do is hidden from sidebar but not removed

### Acceptance Criteria

Documentation matches the implemented admin experience.

Future engineers understand why routes and nav labels differ.

Support can guide admins through the new journey without referencing hidden sidebar items.

## Implementation Order

Recommended order:

1. Add safe admin return-context helper and dirty-aware inline action component.
2. Sidebar nav restructure.
3. Pages overview copy cleanup.
4. Settings overview naming and card alignment.
5. Home page section query-param support.
6. Home page What we do item list and add/edit entry points.
7. Safe return-to support for What we do create/edit routes.
8. Home page Testimonials cross-linking.
9. Onboarding copy/target updates.
10. Skeleton/loading verification.
11. Access control verification.
12. Documentation progress update.

Do not combine all phases into one large unverified change. The safe helper and dirty-aware link component should be implemented first because later phases depend on them. Sidebar nav and Pages copy can be implemented together because they are low-risk navigation/copy changes. Settings overview naming should be completed before final verification so the IA does not remain half-migrated. Home page item links and return behavior should be implemented together because they belong to one user journey.

## Risks And Mitigations

### Risk: Hidden What We Do Route Becomes Hard To Find

Mitigation:

- Make the Home page What we do panel clearly expose item management.
- Keep direct route access available.
- Update onboarding targets.

### Risk: Unsaved Home Page Changes Are Lost

Mitigation:

- Use existing dirty-aware form runtime.
- Add dirty-aware inline action links for form-internal management links.
- Prefer a save-first CTA if practical.

### Risk: Route URLs And Nav Labels Diverge

Mitigation:

- Keep route paths stable intentionally.
- Document that `Pages` currently maps to `/admin/settings/pages`.
- Consider route aliases only after the IA is production-proven.

### Risk: Home Page Settings Becomes Too Heavy

Mitigation:

- Keep What we do item list bounded.
- Defer item list if route timings regress.
- Avoid loading full testimonial datasets into Home page settings.
- Revalidate `/admin/settings/pages/home` after What we do create/update so the item area remains fresh without broad reload work.

### Risk: Onboarding Targets Hidden Nav Item

Mitigation:

- Audit onboarding keys before final verification.
- Replace any `nav-what-we-do` target with the Home page What we do section.

### Risk: Legal Pages Duplicate Link Feels Redundant

Mitigation:

- Keep legal sidebar and overview panel intentionally.
- Ensure the overview panel communicates status/completion, not just navigation.

## Verification Checklist

Manual verification:

- Visit `/admin`.
- Confirm sidebar groups match the target IA.
- Open `Content -> Pages`.
- Open Home page.
- Open What we do tab.
- Confirm section fields render.
- Confirm existing What we do items render.
- Click Add item.
- Create or cancel and confirm return behavior.
- Click Edit item.
- Save or cancel and confirm return behavior.
- Confirm dirty-state protection when Home page fields have unsaved changes.
- Confirm saving Home page content while on `?section=what-we-do` keeps the admin in the intended section-specific journey.
- Open `Content -> Testimonials`.
- Confirm testimonials item management still works.
- Open Settings.
- Confirm Legal pages remains in sidebar.
- Confirm Legal pages overview card remains.
- Confirm Account settings is not duplicated as an overview card if currently present.
- Confirm Settings overview card labels are `Site branding`, `Site details`, and `Legal pages`.
- Confirm Settings overview does not show cards titled only `Branding` or `Site`.
- Confirm `/admin/settings/branding` uses `Site branding` naming.
- Confirm `/admin/settings/site` uses `Site details` naming and does not mention homepage hero content.
- Confirm relevant loading states match the same naming.

Performance verification:

- Hard refresh Home page settings.
- Confirm title/shell render quickly.
- Confirm no broad testimonial fetch is introduced.
- Confirm What we do item loading does not cause visible layout jump.
- Confirm no duplicate skeleton appears.

Regression verification:

- Create What we do item from direct `/admin/what-we-do/create`.
- Edit What we do item from direct `/admin/what-we-do/[itemId]`.
- Confirm old default return path still works.
- Confirm public homepage still displays What we do items correctly.
- Confirm testimonial public/homepage display is unchanged.
- Confirm legal pages route is unchanged.
- Confirm onboarding setup checklist routes to the Home page What we do section for What we do item setup.
- Confirm first-run onboarding still spotlights the renamed `Pages` sidebar item.

## Progress Log

### 2026-08-06 - Plan Created

Status: planning complete, implementation not started.

Decisions locked in:

- Move Page settings into Content and rename to Pages.
- Remove What we do from visible sidebar once Home page What we do panel exposes item management.
- Keep existing What we do create/edit routes.
- Add safe return-to behavior back to Home page What we do section.
- Keep Testimonials as a standalone Content route.
- Keep Legal pages in Settings sidebar and Settings overview panel.
- Do not add Account settings as a Settings overview card.

### 2026-08-06 - Pre-Implementation Code Audit

Status: plan audited against current code and tightened before implementation.

Findings locked in:

- Home page save currently redirects to Pages overview and must become section-context aware.
- Plain `Button href` links inside the Home page form would bypass dirty-state protection.
- A dirty-aware inline action component is required before adding item-management links inside the Home page form.
- What we do create/edit actions require hidden return-context fields because query params are not available directly to server actions.
- A safe admin return-context helper is required; existing member-auth return helpers are not the right fit for this admin form flow.
- Onboarding updates are mandatory because `nav-what-we-do` will no longer be visible in the sidebar.
- Checklist `Add What we do items` should route to the Home page What we do section while preserving record-based completion.

### 2026-08-07 - Implementation Slice 1

Status: implemented, pending local browser verification.

Completed:

- Added a safe admin return-context helper for the What we do to Home page journey.
- Added a reusable dirty-aware inline action link for form-internal navigation.
- Moved `Pages` into the Content sidebar group.
- Removed `What we do` from the visible sidebar while preserving direct route access.
- Kept Legal pages unchanged in Settings.
- Updated page editor headers/loading states from `Page settings` to `Content` and `Back to pages`.
- Updated the Home page editor to support `?section=what-we-do`.
- Added a What we do item-management panel under the Home page What we do tab.
- Reused existing What we do create/edit routes for item management.
- Added validated return context through What we do create/edit pages, forms, and server actions.
- Revalidated the Home page settings route after What we do create/update.
- Added a dirty-aware `Manage testimonials` link inside the Home page Testimonials tab.
- Updated onboarding selector/config so the What we do checklist routes to the Home page What we do section.

Verification notes:

- Static searches confirmed the app no longer surfaces stale `Page settings` labels in the migrated route headers.
- Static searches confirmed the hidden `nav-what-we-do` sidebar key is no longer referenced in app code.
- `npm run lint` and `npm run test:unit` could not run in the current shell because the local Node/npm environment reports `WSL 1 is not supported. Please upgrade to WSL 2 or above.`
- Full verification still needs to be run from the user's normal Windows shell, WSL2, or CI.

### 2026-08-07 - What We Do Panel UX Refinement

Status: implemented, pending local browser verification.

Completed:

- Replaced the bespoke Home page What we do item cards with the established `WhatWeDoAdminList` card pattern.
- Preserved the compact menu interaction for each What we do item.
- Restored delete functionality from the Home page What we do panel.
- Made What we do edit navigation dirty-aware when the list is embedded inside the Home page form.
- Made What we do delete return-aware so deletion from the Home page panel returns to `?section=what-we-do`.
- Added unsaved-homepage-change warning copy to the delete confirmation when needed.
- Updated `Modal` to render through a portal so modal forms do not become invalid nested forms when opened from form-heavy admin pages.

Verification notes:

- Targeted `git diff --check` passed for the changed files in this refinement.
- Full lint/unit verification remains blocked in this shell by the WSL 1 Node/npm limitation noted above.

### 2026-08-07 - Settings Overview Naming Gap Audit

Status: gap identified, plan updated, implementation pending.

Findings:

- The implementation plan previously mentioned `Site details` in the target model but did not create a concrete phase for Settings overview naming.
- Current code still surfaces Settings overview cards titled `Branding` and `Site`.
- Current code still uses `/admin/settings` header copy `Site settings / Manage site settings`.
- Current `/admin/settings/site` description mentions `homepage hero content`, which conflicts with the updated IA because homepage content now belongs under `Content -> Pages -> Home page`.
- User preference is to rename `Branding` to `Site branding` and `Site` to `Site details`.

Plan updates made:

- Added Phase 2B: Settings Overview Naming And Card Alignment.
- Added required card/header/action/loading/onboarding copy updates.
- Added acceptance criteria to prevent cards titled only `Branding` or `Site`.
- Updated implementation order and verification checklist.

### 2026-08-07 - Phase 2B Settings Overview Naming Implementation

Status: implemented, pending local browser verification.

Completed:

- Updated `/admin/settings` header copy to `Settings / Site settings`.
- Updated Settings overview card labels from `Branding` to `Site branding` and from `Site` to `Site details`.
- Updated Settings overview card bodies and action labels to describe site branding and structured site details more clearly.
- Kept `Legal pages`, `Regional setup`, and `Stripe setup` behavior unchanged.
- Updated `/admin/settings/branding` route and loading copy to use `Site branding`.
- Updated `/admin/settings/site` route and loading copy to use `Site details`.
- Removed the stale `homepage hero content` wording from the Site details route because homepage content is now managed under `Content -> Pages -> Home page`.
- Updated branding and site settings submit, pending, success, and error copy to use `Site branding` and `Site details`.
- Updated onboarding welcome/checklist copy to use `Site branding`.
- Preserved internal onboarding keys and selectors such as `settings_branding` and `branding-settings-card` to avoid checklist state churn.

Verification notes:

- Static fallback audit confirmed the Settings overview loading state is skeleton-only and does not surface stale labels.
- Targeted stale-copy searches should confirm there are no user-facing Settings overview cards titled only `Branding` or `Site`.
- Targeted whitespace validation should be run for the Phase 2B files.
- Full lint/unit verification remains blocked in this shell by the WSL 1 Node/npm limitation noted above.
