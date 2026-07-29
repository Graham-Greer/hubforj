# Admin Onboarding Engineering Plan

## Purpose
This document turns the onboarding product spec into an engineering delivery plan.

It covers:
- component breakdown
- data structures
- persistence shape
- rollout order
- acceptance criteria per phase

Related docs:
- [admin-onboarding-map.md](/mnt/c/local/community-app/docs/admin-onboarding-map.md)
- [admin-onboarding-product-spec.md](/mnt/c/local/community-app/docs/admin-onboarding-product-spec.md)

## Delivery Principles
- typed config is the source of truth
- persistence is per hub, per admin user
- onboarding must not block normal admin work
- route-level onboarding should be resumable and restartable
- onboarding UI must be theme-aware and accessible
- the implementation should bias toward low interruption and avoid stacking multiple auto-open experiences

---

## Architecture Overview
The onboarding system should have 6 parts:

1. typed journey registry
2. server-backed onboarding state store
3. client onboarding runtime
4. modal + spotlight presentation layer
5. floating help launcher
6. checklist module on `/admin`

Suggested flow:
- route loads
- onboarding runtime resolves current route
- runtime fetches onboarding state
- runtime checks trigger rules
- runtime opens a journey if eligible
- runtime persists progress as the user moves

Guardrails:
- only one journey may auto-open at a time
- dismissed journeys should not immediately cascade into another auto-open in the same session

---

## Component Breakdown

## 1. Registry Layer
### `admin-onboarding-registry.ts`
Responsibilities:
- define all journeys
- define route matchers
- define steps
- define package-aware variants
- define video asset keys

Suggested exports:
- `adminOnboardingJourneys`
- `resolveOnboardingJourneyForRoute(...)`
- `resolveJourneyStepsForContext(...)`
- `resolveJourneyPriority(...)`

Important IA note:
- `settings_overview` should only target the real cards on `/{hubSlug}/admin/settings`:
  - Branding
  - Site
- `Page settings` and `Account settings` must remain separate route journeys and should not be represented as targets on the settings overview route.

## 2. Server State Layer
### `admin-onboarding-store.ts`
Responsibilities:
- read onboarding state for `hubId + userId`
- upsert onboarding state
- reset one journey
- mark journey completed
- mark journey dismissed
- update checklist item state

Suggested exports:
- `getAdminOnboardingState(hubId, userId)`
- `saveAdminOnboardingState(hubId, userId, patch)`
- `resetAdminOnboardingJourney(hubId, userId, journeyKey)`

## 3. Runtime Layer
### `AdminOnboardingProvider.jsx`
Responsibilities:
- load initial state
- expose current journey
- expose open/close/next/restart actions
- calculate route-level eligibility
- coordinate persistence

Suggested hooks:
- `useAdminOnboarding()`
- `useRouteOnboardingJourney()`
- `useOnboardingHelpMenu()`
- `useOnboardingSessionSuppression()`

## 4. Presentation Layer
### `OnboardingModal.jsx`
Responsibilities:
- render text or video step
- render progress
- render primary/secondary actions
- theme-aware surface styling

### `OnboardingSpotlightLayer.jsx`
Responsibilities:
- overlay
- spotlight target hole/highlight
- target ring
- connector placement support if needed later

### `OnboardingVideoFrame.jsx`
Responsibilities:
- resolve light/dark asset
- render autoplay/loop/muted video
- gracefully degrade if missing

## 5. Route UI Integration
### `OnboardingHelpLauncher.jsx`
Responsibilities:
- floating bottom-right question-mark launcher
- open route help menu
- launch `Show me around`
- launch `Restart this tour`
- open checklist
- open route video again if available

### `OnboardingTarget` contract
Use stable selectors or explicit marker attributes on target elements:
- `data-onboarding="settings-site-card"`
- `data-onboarding="homepage-hero-tab"`
- `data-onboarding="events-create-button"`

This is preferable to brittle CSS selectors.

Recommendation:
- store `targetKey` in config
- resolve `targetKey -> selector/query strategy` in a dedicated resolver
- avoid embedding raw selectors directly in product-facing registry entries

## 6. Checklist Layer
### `AdminOnboardingChecklist.jsx`
Responsibilities:
- show setup progress on `/admin`
- compute completed/in-progress/not-started states
- deep link to relevant route
- support dismiss and reopen behavior

---

## Data Structures

## Typed Registry
Suggested shape:

```ts
type JourneyKey =
  | "welcome_overview"
  | "settings_overview"
  | "settings_site"
  | "settings_branding"
  | "settings_pages_home"
  | "settings_account"
  | "media"
  | "what_we_do"
  | "testimonials"
  | "membership_plans"
  | "payments_setup"
  | "payments_records"
  | "events_list"
  | "events_create_edit"
  | "event_detail"
  | "courses_list"
  | "courses_create_edit"
  | "members_list"
  | "member_detail"
  | "admins";

type ThemeMode = "light" | "dark";
type PackageTier = "free" | "starter" | "growth";

type JourneyDefinition = {
  key: JourneyKey;
  routePattern: string;
  autoTrigger: boolean;
  triggerRule: TriggerRule;
  priority: number;
  roleRule?: RoleRule;
  restartable: true;
  steps: StepDefinition[];
};

type StepDefinition = {
  id: string;
  type: "text" | "video";
  title: string;
  body: string | PackageAwareCopy;
  targetKey?: string;
  spotlight?: boolean;
  placement?: "top" | "right" | "bottom" | "left" | "center";
  ctaLabel: string;
  secondaryCtaLabel?: string;
  completionMode: "next" | "target_interaction" | "route_change" | "finish";
  videoAssetBaseName?: string | PackageAwareVideoName;
};

type PackageAwareCopy = Record<PackageTier, string>;
type PackageAwareVideoName = Partial<Record<PackageTier, string>>;
type RoleRule = { type: "always" } | { type: "role_in"; values: string[] };
```

## Runtime State
Suggested client runtime state:

```ts
type AdminOnboardingRuntimeState = {
  isOpen: boolean;
  activeJourneyKey: JourneyKey | null;
  activeStepId: string | null;
  origin: "auto" | "help_menu" | "checklist";
  highlightedTargetKey: string | null;
  suppressedJourneyKeys: string[];
};
```

## Checklist Data
Suggested checklist config:

```ts
type ChecklistItemDefinition = {
  key: string;
  label: string;
  href: string;
  completionRule: "site_details" | "branding" | "homepage" | "media" | "what_we_do" | "testimonials" | "account_review" | "first_event" | "first_course" | "people_review";
};
```

---

## Persistence Shape

## Recommended Storage Location
Preferred:
- `hubs/{hubId}/adminOnboarding/{userId}`

Recommended record shape:

```ts
type PersistedAdminOnboardingRecord = {
  hubId: string;
  userId: string;
  actorRole: "owner" | "admin" | string;
  version: string;
  welcomeJourney: JourneyPersistenceState;
  routeJourneys: Record<string, JourneyPersistenceState>;
  checklist: PersistedChecklistState;
  preferences: {
    reducedMotion: boolean;
    autoPlayVideo: boolean;
  };
  createdAt: string;
  updatedAt: string;
};

type JourneyPersistenceState = {
  status: "not_started" | "in_progress" | "completed" | "dismissed";
  currentStepId: string;
  seenStepIds: string[];
  firstStartedAt: string | null;
  lastOpenedAt: string | null;
  completedAt: string | null;
  dismissedAt: string | null;
};

type PersistedChecklistState = {
  dismissed: boolean;
  lastViewedAt: string | null;
  items: Array<{
    key: string;
    status: "not_started" | "in_progress" | "completed";
    completedAt: string | null;
  }>;
};
```

## Why This Shape
- hub-scoped
- user-scoped
- role-aware
- versionable
- safe for multi-hub admins
- easy to query alongside hub setup progress

## Persistence Rules
- update `updatedAt` on every onboarding mutation
- only persist journey-level progress at meaningful boundaries
- do not persist every animation or hover interaction

Meaningful boundaries:
- journey opened
- step completed
- journey dismissed
- journey completed
- checklist dismissed

Session-only state:
- same-session suppression after dismissal
- active spotlight measurement
- current modal placement resolution

---

## Route Trigger Implementation

## Trigger Pipeline
On route load:

1. identify current route key
2. resolve matching journey definition
3. fetch persisted onboarding state
4. check onboarding version
5. evaluate route trigger rule
6. evaluate package/capability constraints
7. evaluate role constraints
8. check if journey already completed or dismissed
9. check same-session suppression
10. sort by priority
11. auto-open if still eligible

## Trigger Rule Types
Suggested rule helpers:

```ts
type TriggerRule =
  | { type: "always" }
  | { type: "package_in"; values: PackageTier[] }
  | { type: "capability_enabled"; key: string }
  | { type: "record_exists"; key: "events" | "courses" }
  | { type: "record_missing"; key: "events" | "courses" }
  | { type: "query_equals"; key: string; value: string };
```

## Query Handling
For payments:
- `view=setup`
- `view=payments`
- `view=plans`

Use query-aware route matching rather than separate route files.

---

## Help Menu Behavior

## Floating Launcher
Build a fixed-position launcher:
- bottom: `var(--space-5)` or equivalent
- right: `var(--space-5)` or equivalent
- circular or rounded-square
- question mark icon
- touch-friendly hit area
- above page content, below blocking modals

Suggested z-index tiers:
- page content
- help launcher
- onboarding spotlight
- onboarding modal
- destructive/system modals

## Help Menu Actions
- `Show me around`
- `Restart this tour`
- `View setup checklist`
- `Watch demo again` when route includes video

## Help Menu State
Suggested internal state:

```ts
type HelpMenuState = {
  open: boolean;
  routeJourneyKey: JourneyKey | null;
  hasVideo: boolean;
  hasChecklist: boolean;
};
```

---

## Video Asset Naming Contract

## Base Naming Rule
Use:

```txt
<feature>-<purpose>-<theme>.mp4
```

Where:
- `feature` = route or module domain
- `purpose` = specific step topic
- `theme` = `light` or `dark`

## Locked Initial Names
### Account settings
- `account-settings-payments-overview-light.mp4`
- `account-settings-payments-overview-dark.mp4`
- `account-settings-domain-setup-light.mp4`
- `account-settings-domain-setup-dark.mp4`

### Media
- `media-upload-first-assets-light.mp4`
- `media-upload-first-assets-dark.mp4`
- `media-reuse-across-admin-light.mp4`
- `media-reuse-across-admin-dark.mp4`

### Homepage
- `homepage-hero-editing-light.mp4`
- `homepage-hero-editing-dark.mp4`

### Membership plans
- `membership-plan-create-edit-light.mp4`
- `membership-plan-create-edit-dark.mp4`

### Payments
- `stripe-setup-admin-flow-light.mp4`
- `stripe-setup-admin-flow-dark.mp4`
- `payments-record-review-light.mp4`
- `payments-record-review-dark.mp4`

### Events
- `events-list-and-lifecycle-light.mp4`
- `events-list-and-lifecycle-dark.mp4`
- `event-create-pricing-and-booking-light.mp4`
- `event-create-pricing-and-booking-dark.mp4`

### Courses
- `courses-list-and-lifecycle-light.mp4`
- `courses-list-and-lifecycle-dark.mp4`
- `course-create-registration-and-pricing-light.mp4`
- `course-create-registration-and-pricing-dark.mp4`

### Members
- `member-record-membership-actions-light.mp4`
- `member-record-membership-actions-dark.mp4`

## Resolver Contract
Suggested helper:

```ts
function resolveOnboardingVideoAsset(baseName: string, theme: "light" | "dark"): string
```

Example:

```ts
resolveOnboardingVideoAsset("events-list-and-lifecycle", "dark")
// => "events-list-and-lifecycle-dark.mp4"
```

---

## Rollout Order

## Phase 1
### Scope
- registry
- persistence
- onboarding provider
- floating help launcher shell
- standard text modal
- checklist on `/admin`
- welcome journey
- site settings
- branding
- homepage
- media
- what we do
- testimonials
- events
- courses

### Acceptance Criteria
- first visit to `/admin` opens welcome journey automatically
- help launcher appears bottom-right on onboarded routes
- checklist appears on `/admin`
- checklist updates at least for visited-route and created-record milestones
- homepage, media, events, and courses routes can auto-open their route journey once
- journeys can be restarted from help menu

## Phase 2
### Scope
- spotlight system
- theme-aware onboarding surfaces
- video asset resolver
- package-aware account/payments journeys
- membership plans
- members list
- member detail

### Acceptance Criteria
- directional steps dim and de-emphasize non-target UI
- target element remains sharp and visibly highlighted
- onboarding modal follows current light/dark theme
- correct theme-specific video asset is selected
- account settings copy adapts to free/starter/growth
- payments setup journey adapts to package tier

## Phase 3
### Scope
- payments records journey
- admins journey
- analytics
- reduced motion handling
- polish and accessibility hardening

### Acceptance Criteria
- payments and admins journeys work from auto-trigger and help menu restart
- analytics events fire for journey start, complete, dismiss, and restart
- reduced motion preference disables motion-heavy behavior
- onboarding passes keyboard/focus review

---

## Acceptance Criteria By System

## Registry
- all journeys are declared in typed config
- package-aware steps are expressed as config variants, not ad hoc component conditionals
- routes with query requirements are explicitly modeled

## Persistence
- state is isolated per `hubId + userId`
- changing hubs does not leak onboarding progress
- changing onboarding version resets journeys safely

## Help Launcher
- visible on supported routes
- reachable by keyboard
- touch-friendly on tablet/laptop touch devices
- not obscured by common admin page layouts
- should not compete visually with primary CTAs in inactive state

## Modal
- supports text and video step types
- supports progress display
- supports `Next`, `Close`, `Skip`, and restart paths
- supports text-only fallback when no video asset is available

## Spotlight
- no crash if target is missing
- fallback to centered modal works
- overlay and highlight are theme-aware

## Checklist
- visible on `/admin`
- item statuses can be computed deterministically
- clicking an item navigates correctly

---

## Suggested File/Module Layout
One reasonable structure:

```txt
apps/hub-platform/src/components/patterns/admin-onboarding/
  AdminOnboardingProvider.jsx
  OnboardingModal.jsx
  OnboardingSpotlightLayer.jsx
  OnboardingHelpLauncher.jsx
  OnboardingHelpMenu.jsx
  OnboardingVideoFrame.jsx
  AdminOnboardingChecklist.jsx

apps/hub-platform/src/lib/admin-onboarding/
  admin-onboarding-registry.ts
  admin-onboarding-routes.ts
  admin-onboarding-priority.ts
  admin-onboarding-store.ts
  admin-onboarding-checklist.ts
  admin-onboarding-video-assets.ts
  admin-onboarding-selectors.ts
  admin-onboarding-session.ts
```

This exact layout is not mandatory, but the separation of concerns should stay similar.

---

## Immediate Engineering Next Step
After sign-off, the first implementation task should be:

1. build the typed registry
2. build the persisted state store
3. wire the `/admin` welcome journey and checklist

That gives the project a real spine before adding spotlight and video complexity.
