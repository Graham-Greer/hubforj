# Admin Onboarding Product Spec

## Purpose
This document converts the onboarding planning in [admin-onboarding-map.md](/mnt/c/local/community-app/docs/admin-onboarding-map.md) into a build-ready product spec.

It defines:
- state model
- route trigger rules
- onboarding progress persistence
- help menu behavior
- video asset naming contract
- visual behavior rules for the onboarding layer

This spec is intentionally implementation-oriented, while still leaving room for engineering choices inside the final component architecture.

## Goals
- onboard new admins without overwhelming them
- keep onboarding contextual and route-aware
- let onboarding be restarted at any time
- keep progress persistent across sessions
- make onboarding feel native to the admin portal
- support both light and dark theme variants
- keep the admin UI operational first, with onboarding as a lightweight assistive layer

## Non-Goals
- build a generic product-tour engine for every future surface
- onboard all advanced workflows at first launch
- force long mandatory tours before admins can use the product

---

## Core Model
The onboarding system has 3 layers:

1. welcome journey
- first-run onboarding on `/{hubSlug}/admin`

2. route journeys
- contextual onboarding on specific admin routes

3. checklist
- persistent progress overview for setup milestones

These layers should be related but independently controlled.

---

## State Model
Suggested top-level onboarding state:

```ts
type AdminOnboardingState = {
  hubId: string;
  actorUserId: string;
  actorRole: string;
  version: string;
  welcomeJourney: JourneyState;
  routeJourneys: Record<string, JourneyState>;
  checklist: ChecklistState;
  preferences: OnboardingPreferences;
};

type JourneyState = {
  status: "not_started" | "in_progress" | "completed" | "dismissed";
  currentStepId: string;
  firstStartedAt: string | null;
  lastOpenedAt: string | null;
  completedAt: string | null;
  dismissedAt: string | null;
  seenStepIds: string[];
};

type ChecklistState = {
  dismissed: boolean;
  lastViewedAt: string | null;
  items: ChecklistItemState[];
};

type ChecklistItemState = {
  key: string;
  status: "not_started" | "in_progress" | "completed";
  completedAt: string | null;
};

type OnboardingPreferences = {
  reducedMotion: boolean;
  autoPlayVideo: boolean;
};
```

## State Ownership
Recommended ownership split:

- server source of truth:
  - whether a journey has been completed or dismissed
  - checklist completion status
  - versioning

- client session state:
  - currently open step
  - spotlight target geometry
  - temporarily paused or resumed flow

## Versioning
Include a required `version` string in the onboarding state.

Purpose:
- allow re-running onboarding when the flow materially changes
- allow route journeys to be reset safely

Recommended version format:
- `admin-onboarding-v1`
- `admin-onboarding-v2`

Behavior:
- if stored version differs from current version, reset journey state
- keep previously completed checklist items only if their completion rules still evaluate true

---

## Route Registry
Each onboarding journey should be defined in a route registry.

Suggested shape:

```ts
type OnboardingRouteJourney = {
  key: string;
  routePattern: string;
  autoTrigger: boolean;
  triggerCondition: TriggerCondition;
  steps: OnboardingStep[];
};

type OnboardingStep = {
  id: string;
  type: "text" | "video";
  target: StepTarget | null;
  title: string;
  body: string;
  ctaLabel: string;
  secondaryCtaLabel?: string;
  videoAssetKey?: string;
  completionMode: "next" | "target_interaction" | "route_change" | "finish";
};

type StepTarget = {
  selector: string;
  placement: "top" | "right" | "bottom" | "left" | "center";
  spotlight: boolean;
};
```

## Recommended Journey Keys
- `welcome_overview`
- `settings_overview`
- `settings_site`
- `settings_branding`
- `settings_pages_home`
- `settings_account`
- `media`
- `what_we_do`
- `testimonials`
- `membership_plans`
- `payments_setup`
- `payments_records`
- `events_list`
- `events_create_edit`
- `event_detail`
- `courses_list`
- `courses_create_edit`
- `members_list`
- `member_detail`
- `admins`

Notes:
- `settings_overview` refers specifically to the `/{hubSlug}/admin/settings` route, which currently surfaces Branding and Site settings cards.
- `Page settings` and `Account settings` are separate route journeys and should not be modeled as cards within `settings_overview`.

---

## Route Trigger Rules
General rules:
- route journeys auto-trigger on first visit
- welcome journey auto-triggers on first visit to `/{hubSlug}/admin`
- journeys do not auto-trigger again once completed or dismissed
- journeys can always be restarted manually from the help menu
- only one onboarding journey may auto-open at a time
- dismissed journeys should respect same-session suppression before anything else auto-opens

## Trigger Resolution Order
When a route loads:

1. resolve matching journey for current route
2. check onboarding version
3. evaluate package-aware conditions
4. evaluate role-aware conditions
5. evaluate completion/dismissal state
6. evaluate same-session suppression
7. if eligible, auto-open journey at first unfinished step

## Journey Priority
If more than one journey could open on a route, use this order:

1. explicit user-triggered journey from help menu
2. welcome journey on `/admin`
3. route-level journey
4. checklist remains visible but non-blocking

Never auto-open more than one journey in sequence without a new route change or explicit user action.

## Route Matching Rules
Use route patterns, not literal full URLs.

Examples:
- `/{hubSlug}/admin`
- `/{hubSlug}/admin/settings`
- `/{hubSlug}/admin/settings/site`
- `/{hubSlug}/admin/settings/branding`
- `/{hubSlug}/admin/settings/pages/home`
- `/{hubSlug}/admin/settings/account`
- `/{hubSlug}/admin/media`
- `/{hubSlug}/admin/what-we-do`
- `/{hubSlug}/admin/testimonials`
- `/{hubSlug}/admin/events`
- `/{hubSlug}/admin/events/create`
- `/{hubSlug}/admin/events/{eventId}`
- `/{hubSlug}/admin/courses`
- `/{hubSlug}/admin/courses/create`
- `/{hubSlug}/admin/courses/{courseId}`
- `/{hubSlug}/admin/members`
- `/{hubSlug}/admin/members/{memberId}`
- `/{hubSlug}/admin/admins`
- `/{hubSlug}/admin/payments?view=plans`
- `/{hubSlug}/admin/payments?view=setup`
- `/{hubSlug}/admin/payments?view=payments`

## Query-Aware Routing
For payments journeys, trigger by route + query:
- `payments?view=plans`
- `payments?view=setup`
- `payments?view=payments`

If the query is absent or different, no payments onboarding journey should auto-open.

## Trigger Conditions
Suggested condition types:

- `always`
- `package_in(["free","starter","growth"])`
- `package_is("growth")`
- `capability_enabled("paymentsEnabled")`
- `capability_enabled("coursesEnabled")`
- `record_exists("events")`
- `record_exists("courses")`
- `record_missing("events")`
- `record_missing("courses")`

Examples:
- `settings_account`:
  - always
- `payments_setup`:
  - only if payments module is exposed
- `courses_list`:
  - only if courses capability is enabled
- `event_detail`:
  - only if `eventId` exists and record resolves

---

## Package-Aware Behavior
Some journeys must adapt by package tier.

## Package-sensitive journeys
- `settings_account`
- `payments_setup`
- `payments_records`

## Role-sensitive journeys
- `admins`
- parts of `settings_account`
- any step that spotlights package-management or access-management controls

## Package rules
### Free
- focus on what is available now
- explain what paid packages unlock
- do not imply native payment setup is usable now

### Starter
- explain external payment model
- explain Growth unlocks
- explain current limits and domain/payment distinctions

### Growth
- show full native payment readiness and reconciliation guidance

## Implementation rule
Do not create separate journey keys per package.
Instead:
- use a single journey key
- swap step body, title, and video asset key by package tier

---

## Checklist Spec
The checklist is a persistent onboarding progress module displayed on `/{hubSlug}/admin`.

## Checklist Behavior
- visible for admins who have not completed setup
- dismissible
- restartable from help
- not modal
- each item links to the relevant route
- each item can become complete automatically
- it should represent setup progress, not a full product-learning curriculum

## Recommended Checklist Items
- `site_details`
- `branding`
- `homepage_content`
- `media_assets`
- `what_we_do`
- `testimonials`
- `account_review`
- `first_event`
- `first_course`
- `people_review`

## Suggested Completion Rules
### `site_details`
- required site fields saved

### `branding`
- branding settings saved

### `homepage_content`
- homepage settings saved

### `media_assets`
- at least one logo asset and one general-purpose image exist

### `what_we_do`
- at least 3 published What we do items

### `testimonials`
- at least 1 published testimonial

### `account_review`
- account settings route visited once

### `first_event`
- at least 1 event created

### `first_course`
- at least 1 course created

### `people_review`
- members route visited once and admins route visited once

## Checklist Completion Philosophy
Use only two completion styles:
- `visited`: route has been meaningfully opened once
- `configured`: underlying setup condition is satisfied

This should remain deterministic and easy to reason about in code.

## Checklist Item Status Rules
- `not_started`: route never visited and requirement incomplete
- `in_progress`: route visited but requirement incomplete
- `completed`: requirement complete

---

## Persistence Model
Recommended persistence scope:
- per hub
- per admin user

Why:
- onboarding should reflect each admin’s familiarity
- one admin completing onboarding should not suppress it for another admin

## Persistence Recommendation
From a senior engineering perspective, the cleanest model is a hub-user-scoped onboarding record rather than a single global user record.

Recommended shape:
- one onboarding record per `hubId + userId`
- include the admin's current role context for that hub

Why this is the best fit:
- the same admin may belong to multiple hubs
- onboarding completion should be independent per hub
- owner/admin capabilities differ slightly and should be available to the onboarding layer
- checklist completion is hub-specific, not user-global

Recommended persisted identity fields:
- `hubId`
- `userId`
- `actorRole`
- `version`

## Persistence Storage
Recommended:
- server-backed record

Possible storage shapes:
- `hubs/{hubId}/adminOnboarding/{userId}`
- or user-hub-scoped onboarding record in a shared admin state collection

Preferred option:
- `hubs/{hubId}/adminOnboarding/{userId}`

Why preferred:
- naturally scoped to hub state
- easy to clean up if a hub is archived
- keeps onboarding close to the hub-specific data it reflects
- avoids mixing multi-hub onboarding state onto a single global user document

## Persisted Fields
- onboarding version
- completed/dismissed journey states
- current checklist status
- timestamps
- preferences
- actor role for this hub

## What Should Not Be Persisted
- spotlight geometry
- DOM selectors
- current viewport layout
- live modal coordinates
- same-session suppression flags

Those should remain client-derived.

---

## Help Menu Behavior
Each route with onboarding should expose a restart point from a help menu.

## Help Entry Placement
The help entry should be rendered as a floating, always-available control:
- bottom right
- absolutely or fixed positioned above route content
- large enough for touch interaction
- question mark icon
- visible in both light and dark themes
- above normal page chrome but below active modal/dialog layers

## Help Menu Requirements
- visible on every onboarded route
- route-specific
- non-blocking
- lightweight
- should not compete visually with primary route CTAs when inactive

## Recommended Menu Items
- `Show me around`
- `Restart this tour`
- `View setup checklist`
- `Watch demo again` if the current route has a video step

## Behavior Rules
### `Show me around`
- opens the route journey at step 1

### `Restart this tour`
- clears that route journey’s completed/dismissed state
- restarts from step 1 immediately

### `View setup checklist`
- opens or navigates to the checklist on `/{hubSlug}/admin`

### `Watch demo again`
- opens the first video step on the current route

## Placement
Recommended:
- floating bottom-right launcher for the primary entry point
- per-route menu contents opened from that launcher

## Labeling
Recommended visible label:
- `Help`

Recommended icon:
- `help` or `lightbulb`

---

## Modal and Spotlight Behavior
This section locks in the onboarding UI behavior.

## Modal Hierarchy
When onboarding opens:
- the onboarding modal is the primary focal point
- the highlighted target element is the secondary focal point
- all non-relevant UI is visually suppressed

## Spotlight Rules
For directional steps:
- dim the entire app with an overlay
- keep the target element visually sharp
- add a highlight ring or spotlight around the target
- place the modal relative to the target where possible

For informational steps:
- use standard modal + backdrop
- do not require a spotlight target

## Anti-Bloat Rules
- default to text-only steps
- use video only where sequence or spatial complexity is real
- keep the welcome journey to 6 steps max
- keep route journeys to 2-4 steps by default
- avoid onboarding the same concept across multiple routes unless context truly changes
- do not rely on list-item controls that may not exist yet; use orientation or video steps for empty-state routes

## Overlay Rules
Recommended treatment:
- darkened translucent overlay
- optional subtle blur where supported
- no blur on the highlighted target

## Theme Awareness
The onboarding layer must follow the current admin theme.

Required:
- light-mode modal tokens
- dark-mode modal tokens
- theme-aware spotlight ring
- theme-aware overlay tuning
- theme-aware video frame styling

## Reduced Motion
If reduced motion is enabled:
- disable animated spotlight movement
- disable motion-heavy transitions
- keep video optional and non-autoplay if needed by preference

---

## Video Asset Contract
Videos should be theme-aware and route-scoped.

## Naming Convention
Recommended pattern:

```txt
<journey-key>-<step-purpose>-<theme>.<ext>
```

Examples:
- `account-settings-payments-overview-light.mp4`
- `account-settings-payments-overview-dark.mp4`
- `media-upload-first-assets-light.mp4`
- `media-upload-first-assets-dark.mp4`
- `homepage-hero-editing-light.mp4`
- `homepage-hero-editing-dark.mp4`
- `homepage-hero-editing-light.mp4`
- `homepage-hero-editing-dark.mp4`
- `events-list-and-lifecycle-light.mp4`
- `events-list-and-lifecycle-dark.mp4`
- `member-record-membership-actions-light.mp4`
- `member-record-membership-actions-dark.mp4`

## Theme Suffixes
Allowed theme suffixes:
- `light`
- `dark`

## File Format
Preferred:
- `.mp4`

Optional:
- `.webm`

## Duration Rules
- target 20-40 seconds
- one concept per clip
- muted
- autoplay allowed by preference
- loop

## Recording Rules
- neutral admin data
- no private or production data
- no template-specific branding needed
- record both light and dark theme variants

## Asset Resolution
Suggested strategy:
- each video step references a logical `videoAssetKey`
- runtime resolves `light` or `dark` variant from current theme

Example:

```ts
resolveOnboardingVideo("events-list-and-lifecycle", theme)
// => events-list-and-lifecycle-dark.mp4
```

---

## Step Completion Rules
Each step should declare how it completes.

## Allowed completion modes
### `next`
- user clicks `Next`

### `target_interaction`
- user clicks or opens the highlighted element

### `route_change`
- user navigates to the intended destination

### `finish`
- journey ends

## Recommended usage
- directional navigation steps:
  - `target_interaction` or `route_change`
- video explanation steps:
  - `next`
- final summary steps:
  - `finish`

---

## Failure and Fallback Rules
If a target element is missing:
- do not crash the onboarding flow
- fall back to centered modal mode
- show the step copy without directional placement

If a route is package-locked:
- do not trigger the route journey
- or show a package-aware explanation if that is the intended route behavior

If a video asset is missing:
- degrade to text-only step
- log the missing asset in development
- do not block the journey

---

## Analytics Recommendations
Track:
- journey started
- journey completed
- journey dismissed
- route journey restarted
- step viewed
- video played
- checklist item completed

Useful dimensions:
- hub package tier
- admin theme mode
- route key
- step id

---

## Recommended Build Order
### Phase 1
- onboarding state model
- persistence layer
- welcome journey
- checklist
- help menu shell
- text-only route tours

### Phase 2
- spotlight system
- package-aware journey branching
- theme-aware onboarding layer
- video asset resolver

### Phase 3
- analytics
- reduced-motion preferences
- manual restart controls
- polish and accessibility pass

---

## Accessibility Requirements
- full keyboard navigation
- focus trapped in modal
- escape closes onboarding step if safe
- aria labeling for modal title/body
- spotlight target must not break focus order
- sufficient contrast in light and dark theme
- all videos must work without sound

---

## Decisions Locked In
- route-level journeys auto-trigger on first visit
- every journey can be restarted from a help menu on that route
- onboarding is theme-aware
- directional steps use spotlight + de-emphasis treatment
- informational steps use standard modal behavior
- videos are recorded in both light and dark variants
- homepage onboarding is the only dedicated page-settings journey
- event/course list onboarding should not depend on existing records being present
- the help entry is a floating bottom-right question-mark control with a touch-friendly hit area
- typed config is the source of truth for journeys and steps
- persistence is per admin user, per hub, with role awareness
- only one journey may auto-open at a time
- video is enhancement, not dependency

## Open Engineering Choices
- exact persistence collection shape
- exact selector strategy for spotlight targets
- whether help menu is its own component or folded into route header actions
- whether the checklist is server-rendered or client-hydrated after load
