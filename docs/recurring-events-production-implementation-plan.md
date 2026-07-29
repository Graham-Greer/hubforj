# Recurring Events Production Implementation Plan

## Objective

Implement recurring events in `hub-platform` in a way that:

- preserves all current event booking, payment, waitlist, attendance, and cancellation functionality
- keeps the event series as the single source of truth for event settings
- treats each generated occurrence as a separate operational event instance
- avoids allowing direct editing of occurrences
- remains commercially and technically safe under package limits

This plan is intentionally conservative. It is designed to fit the current architecture rather than forcing a broad rewrite of bookings or payments.

## Product model

Recurring events must be implemented as:

- one `event series` record that owns the schedule and shared settings
- many generated `event occurrence` records that remain individually bookable and operationally managed

This is the core architectural decision.

Do not implement recurrence as:

- one event document with many hidden dates
- one booking record that spans multiple dates
- editable occurrences that diverge from the series

The current platform already treats a single event record as the operational unit for:

- booking
- waitlist
- attendance
- payment
- refund handling
- cancellation
- public detail pages
- member booking history

So each recurring occurrence must remain a real event record.

## Non-negotiable rules

1. The series owns settings.
- Title, summary, description, image, category, location, schedule rule, pricing, refund policy, booking settings, and visibility belong to the series.

2. Occurrences are not directly editable.
- Admins may manage registrations, bookings, payments, attendance, and status for occurrences.
- Admins may not edit occurrence configuration independently.

3. Updating the series updates future occurrences only.
- Past occurrences remain historically accurate.
- Cancelled past occurrences remain untouched.

4. Each occurrence is treated separately for member actions.
- Members can book multiple occurrences from the same series.
- Members can cancel each occurrence independently.
- Payments and refunds are managed per occurrence booking.

5. Occurrences must preserve current admin workflows.
- Registrations/bookings management must keep working.
- Attendance management must keep working.
- Payment status workflows must keep working.

6. Generation must be bounded.
- Admin chooses an `until date`.
- Until date must be no more than 6 months from the series start date.

## Package-tier rule

### Recommended product rule

Recurring series should count as one scheduled offering for package-limit purposes, not one slot per generated occurrence.

### Recommended rollout guardrail

Until that limit logic is fully implemented and verified, recurring events should only be enabled on package tiers that do not enforce active event count limits.

This gives two layers of safety:

- short-term commercial safety
- correct long-term limit behavior

### Final desired behavior

- `single events` count under current event-limit rules
- `recurring series` count as one active scheduled offering
- generated occurrences do not individually consume event-limit slots

## Data model

### New collection

Add:

- `/hubs/{hubId}/eventSeries/{seriesId}`

This record becomes the canonical editable source for recurring events.

### Event series shape

Recommended shape:

```js
{
  hubId: "",
  slugBase: "",
  status: "draft" | "published" | "cancelled",
  title: "",
  summary: "",
  description: [],
  imageAssetId: "",
  imageAlt: "",
  location: "",
  timezone: "Europe/London",
  category: "",
  visibility: "public" | "members-only",
  allowWaitlist: true,

  pricingMode: "free" | "paid",
  price: "",
  currency: "GBP",
  externalPaymentUrl: "",
  paymentInstructions: "",
  refundWindowMode: "default" | "custom",
  refundWindowHours: 48,
  refundPolicy: "full_refund_before_window" | "non_refundable",

  registrationEligibility: "members-only" | "guests-allowed",
  bookingMode: "single_attendee" | "group_booking",
  maxAttendeesPerBooking: 1,
  guestDetailsMode: "name_only",
  capacity: 0,

  recurrenceEnabled: true,
  recurrenceFrequency: "daily" | "weekly" | "monthly",
  recurrenceInterval: 1,
  recurrenceStartDate: "YYYY-MM-DD",
  recurrenceUntilDate: "YYYY-MM-DD",
  recurrenceDaysOfWeek: [1, 3, 5],
  recurrenceDayOfMonth: 15,
  startTime: "18:30",
  endTime: "19:30",

  occurrenceGenerationWindowStartDate: "YYYY-MM-DD",
  occurrenceGenerationWindowEndDate: "YYYY-MM-DD",
  generatedOccurrenceCount: 0,

  packageCountsAsScheduledOffering: true,

  createdAt: "",
  updatedAt: "",
  createdBy: "",
  updatedBy: ""
}
```

### Existing events collection remains operational

Keep using:

- `/hubs/{hubId}/events/{eventId}`

But add recurrence metadata to event occurrence records.

### Event occurrence additions

Recommended new fields on event docs:

```js
{
  eventKind: "single" | "series_occurrence",
  seriesId: "",
  seriesSlugBase: "",
  occurrenceDate: "YYYY-MM-DD",
  occurrenceOrdinal: 1,
  isSeriesManaged: true,
  sourceSeriesUpdatedAt: "",
  seriesStatusSnapshot: "draft" | "published" | "cancelled",
  recurrenceFrequencySnapshot: "daily" | "weekly" | "monthly",
  recurrenceIntervalSnapshot: 1
}
```

Occurrences should still store the full existing event shape so current queries continue to work:

- `title`
- `summary`
- `description`
- `startDate`
- `startTime`
- `startAt`
- `capacity`
- pricing fields
- booking config
- counts

This is deliberate denormalization and is the correct choice here.

## Slug and URL strategy

Each occurrence must have a unique event slug.

Recommended pattern:

- series slug base: `morning-yoga`
- occurrence slug: `morning-yoga-2026-06-04`

This preserves the current public and admin event detail routing model.

Do not route recurring events through one shared slug with query-string occurrence selection.

### Slug collision rule

Generated occurrence slugs must be unique within the hub.

Required behavior:

- the preferred generated slug must be deterministic
- if the preferred slug already exists, generation must use a deterministic suffix strategy
- regeneration of the same occurrence must reproduce the same slug rather than creating a new variant each time

Recommended strategy:

- preferred: `morning-yoga-2026-06-04`
- first collision fallback: `morning-yoga-2026-06-04-2`
- then increment deterministically as needed

Collisions must be checked against:

- existing single events
- existing recurring occurrences
- legacy or manually created event records in the same hub

## Recurrence rule behavior

### Timezone rule

Recurrence generation must use the hub's canonical timezone.

Required behavior:

- recurrence date calculation must be evaluated in hub-local time
- weekly weekday matching must be evaluated in hub-local time
- monthly day-of-month matching must be evaluated in hub-local time
- generated `startAt` and `endAt` timestamps must be derived from local occurrence date plus local start/end time in the hub timezone

This is required for correct behavior around daylight saving changes and for keeping recurring schedules aligned with the hub's expected local calendar.

### Daily

Inputs:

- start date
- until date
- start time
- end time
- interval in days

Behavior:

- generate one occurrence every `N` days

### Weekly

Inputs:

- start date
- until date
- start time
- end time
- interval in weeks
- one or more weekdays

Behavior:

- generate occurrences on the chosen weekdays every `N` weeks

### Monthly

Inputs:

- start date
- until date
- start time
- end time
- interval in months
- day of month

Behavior:

- generate one occurrence every `N` months on the chosen calendar day

### Monthly edge case rule

If the chosen day of month does not exist in a given month:

- skip that month

Do not automatically move to the last day of month in v1.

## Generation window rules

### Hard rule

Series may only be generated up to an admin-selected `until date` that is at most 6 months after the series start date.

### Why

- avoids unbounded data growth
- avoids excessive future occurrence generation
- keeps the schedule understandable for admins
- makes series updates manageable

## Booking and attendance model

### Core principle

Occurrences must remain first-class events for operations.

That means each occurrence gets:

- its own bookings collection
- its own attendee records
- its own waitlist state
- its own payment state
- its own attendance management

### Member booking behavior

Members must be able to:

- book one occurrence
- book multiple different occurrences from the same series
- cancel one occurrence without affecting the others

### Existing duplicate-booking rules

Current duplicate-booking protection uses an event-level sentinel:

- `bookingBookers/{bookerUserId}`

This should remain unchanged because each occurrence has its own `eventId`.

That means:

- one active booking per member per occurrence
- many bookings across many occurrences in the same series

This is the desired behavior.

## Payment and refund behavior

### Payments

Payments remain per occurrence booking.

This means:

- one booking per occurrence
- one payment record per booking
- one checkout session per paid occurrence booking

Do not implement:

- series-level bundles
- subscription-style recurring payments
- multi-occurrence cart checkout

### Refunds

Refund rules should remain occurrence-specific.

Refund evaluation should continue using the occurrence snapshot:

- occurrence `startAt`
- refund policy
- refund window
- payment status

That already aligns with the current booking/payment implementation.

### Admin-driven or series-driven occurrence cancellation refunds

Booked future occurrences cancelled by the admin or by series reconciliation must follow an explicit refund rule.

#### Growth / built-in payments

If:

- the occurrence is a paid event
- the hub is using built-in Growth payment processing
- the occurrence is cancelled by the admin or as a direct result of a series update/cancellation

then:

- the member must receive an automatic full refund
- this automatic full refund overrides the normal refund cutoff window
- this automatic full refund overrides a non-refundable event policy

Rationale:

- the member did not choose to cancel
- the hub/platform changed or cancelled the occurrence

#### Free occurrences

If the occurrence is free:

- no refund is required
- the occurrence and related booking state are simply cancelled

#### External/manual payments

If the occurrence is paid but the hub is using external/manual payment handling:

- the platform cannot enforce an automatic refund
- the occurrence should still be cancelled
- the admin must receive a clear refund follow-up notice
- refund follow-up remains the hub owner's operational responsibility

### Refund communication rule

When a series update or series cancellation affects booked future paid occurrences, the admin impact summary must state:

- how many booked future occurrences were automatically refunded
- how many booked future occurrences require manual/external refund follow-up

This should be part of the post-save/admin-impact feedback for recurring event changes.

## Admin UX

### Event creation mode

Add a schedule mode selector to the event editor:

- `Single event`
- `Repeating event`

Default:

- `Single event`

### Schedule section behavior

If `Single event`:

- keep the current schedule fields

If `Repeating event`:

- replace current one-off schedule fields with recurring controls

### Repeating event fields

Required:

- repeat frequency
- repeat interval
- start date
- until date
- start time
- optional end time

Conditional:

- weekly: weekday selection
- monthly: day-of-month input

### Preview

Show a read-only preview in the schedule section:

- plain-English summary
- first few generated dates
- final date in the range

Example:

- `Repeats every Tuesday and Thursday at 18:30 until 2026-11-30`

### Validation copy

Show concise admin validation messages for:

- invalid until date
- until date beyond 6 months
- no weekday selected for weekly
- invalid day of month for monthly

## Admin series management

### Primary edit surface

The admin edits the series, not individual occurrences.

Recommended routes:

- create recurring event through existing event creation route with recurrence mode enabled
- series edit remains in the canonical event editing workflow, but backed by an `eventSeries` record

### Occurrence management

Expose an occurrences list beneath or alongside the series workspace.

Each row should allow:

- manage bookings / registrations
- manage attendance
- open public page
- view payment state indirectly through existing booking management

Do not allow:

- edit occurrence content/settings
- change occurrence date/time independently
- detach occurrence from series

### Operational-only occurrence actions

Allowed occurrence-specific actions:

- manage attendee attendance
- manage booking/payment state
- cancel or publish occurrence if future product rules require it

Not allowed in v1:

- content edits
- schedule edits
- pricing overrides

## Series update behavior

### Rule

Updating the series updates all future occurrences.

Past occurrences remain unchanged.

### Reconciliation rule

When the recurrence rule itself changes, the system must reconcile future occurrences against the new rule.

Examples:

- weekly Tuesday changes to weekly Thursday
- until date is shortened
- until date is extended within the 6-month limit
- monthly day-of-month changes

Required reconciliation behavior:

- future unbooked occurrences that no longer match the new rule must be cancelled by the platform
- future booked occurrences that no longer match the new rule must not be deleted or silently moved
- future booked occurrences that no longer match the new rule should remain as locked operational commitments
- newly matching future occurrences should be generated

This prevents the platform from invalidating member bookings when the admin changes the series.

V1 decision:

- do not introduce an archived occurrence state
- use explicit occurrence cancellation instead

### Scope of propagation

Future occurrences should receive updated values for:

- title
- summary
- description
- image
- location
- category
- visibility
- start time
- end time
- capacity
- pricing
- payment instructions
- refund policy
- booking settings
- status

### Propagation safety classes

Not all fields should propagate equally once future occurrences already have bookings.

#### Class A: safe content/display propagation

These may propagate to future occurrences, including booked future occurrences, with a warning:

- title
- summary
- description
- image
- location
- category
- visibility
- start time
- end time

#### Class B: constrained operational propagation

These may propagate only if the resulting occurrence state remains valid:

- capacity

Capacity rule:

- the platform must never reduce an occurrence capacity below its current active attendee count
- if a new series capacity would underflow a booked future occurrence, the save must be blocked or the booked occurrence must retain a safe minimum capacity

Recommended behavior:

- apply the new capacity to unbooked future occurrences
- retain booked future occurrences at `max(newCapacity, currentActiveAttendeeCount)`

#### Class C: commercial/policy fields

These must not silently overwrite booked future occurrences:

- pricing mode
- price
- currency
- refund policy
- refund window mode
- refund window hours
- registration eligibility
- booking mode
- max attendees per booking
- guest details mode

Recommended behavior:

- apply these changes to newly generated occurrences and unbooked future occurrences
- do not retroactively rewrite booked future occurrences

This is the safest commercial rule for members and support.

### Preserved occurrence state

When a booked future occurrence is intentionally preserved from a series change, that occurrence must be visibly marked in admin tooling as preserved from the current series configuration.

Required behavior:

- preserved occurrences are read-only for configuration
- preserved occurrences remain fully manageable for bookings, attendance, payment state, and refunds
- preserved occurrences must surface a clear admin label indicating they no longer fully inherit current series commercial/rule settings

Recommended representation:

- `isSeriesPreserved: true`
- `preservedReasons: []`

Example reasons:

- `pricing_locked_from_series_change`
- `refund_policy_preserved_due_to_existing_bookings`
- `occurrence_retained_after_schedule_change`

### Important warning behavior

If future occurrences already have bookings, show a confirmation warning before saving changes that affect:

- time
- location
- capacity
- pricing
- refund rules
- registration eligibility
- booking mode

The warning should explain that future booked occurrences will be updated.

Refinement:

- for Class A changes, the warning may state that booked future occurrences will be updated
- for Class B and Class C changes, the warning must state exactly what will and will not be updated
- if the platform is preserving booked future occurrences from a rule change, the warning should say so explicitly

Example:

- `12 future occurrences already have bookings. Time and location will update for those occurrences. Pricing and refund settings will only update for unbooked future occurrences.`

### Past occurrence rule

Never mutate past occurrence schedule/content automatically.

Historical bookings, payments, attendance, and exports must remain stable.

## Registrations, bookings, and attendance preservation

We must not lose existing event management functionality.

That means recurring occurrences must continue to work with current:

- booking admin rows
- attendance admin rows
- waitlist promotion logic
- member booking history
- payment state management
- refund handling

This is why occurrences must stay as real event docs.

### Admin route preservation rule

Recurring events must not replace or weaken the current operational admin flows.

Occurrences should continue to use the existing event-level routes for:

- bookings / registrations management
- attendance management
- payment-state management

The recurring-series workspace should link into those existing occurrence-level tools rather than re-implementing them.

## Query and listing behavior

### Public event list

Initial recommended behavior:

- show occurrences as normal upcoming events
- optionally add a recurring badge or label later

This keeps public behavior simple and compatible.

V1 recommendation:

- add a lightweight label such as `Recurring event` or `Part of a recurring series`
- do not group occurrences into a series card or custom series listing pattern

### Public event detail

Each occurrence must keep its own public event detail page.

The public route model remains:

- one detail page per occurrence
- one booking flow per occurrence

Do not add a shared series-level booking page in v1.

### Cancelled occurrence member access

If a future occurrence is cancelled and a member already has a booking for that occurrence:

- that booked member must still be able to access the occurrence through booking history
- that booked member must still be able to access the relevant occurrence detail or next-steps flow needed to review the cancellation, refund outcome, or booking record
- the general public must not see cancelled future occurrences as normal upcoming events in public event listings

### Admin event list

Recommended behavior:

- show a series entry
- support drilling into occurrences

or, if using the current event list first:

- show occurrences but visually tag them as part of a recurring series

Preferred production direction:

- series-first admin management
- occurrence-second operations

### Member bookings workspace

Recurring occurrences must appear in the member bookings workspace as separate booking rows.

Rules:

- one row per booked occurrence
- one cancellation action per booked occurrence
- no bundled series-level cancellation
- existing status/payment/attendance display logic should continue to work per occurrence

This preserves the current member mental model and avoids hidden side effects.

### Member-facing clarity

Where useful, member-facing event detail and booking history may show a lightweight recurring indicator.

Do not imply that one booking covers multiple dates.

## Package enforcement implementation

### v1 gating

Add capability:

- `recurringEventsEnabled`

Only hubs with that capability may create recurring events.

### v2 counting

Implement scheduled-offering limit logic that:

- counts a recurring series as one offering
- ignores generated occurrences for event-cap enforcement

### Enforcement rule

At save time for recurring series:

- validate recurring-events capability
- validate the package permits recurring series
- enforce series-based offering count, not occurrence count

### Recommended rollout safety rule

If series-based scheduled-offering counting is not fully ready at the time of rollout:

- recurring event creation must remain restricted to package tiers that do not enforce active event count limits

This should be treated as a temporary rollout safety guard, not the final product rule.

## Service and repository structure

Add dedicated recurring-events modules under `src/lib/**`.

Recommended files:

- `src/lib/domain/event-series.js`
- `src/lib/data/event-series.js`
- `src/lib/data/event-series-mutations.js`
- `src/lib/data/event-series-queries.js`
- `src/lib/server/event-series-generation.js`

Responsibilities:

### `event-series.js`

- recurrence normalization
- recurrence validation
- occurrence schedule generation
- preview generation

### `event-series-mutations.js`

- create series
- update series
- propagate updates to future occurrences

### `event-series-queries.js`

- list series
- get series by id
- list occurrences for series

### `event-series-generation.js`

- generate occurrence event docs
- prevent duplicate occurrence creation
- update future occurrences after series changes

## Idempotency and safety

Occurrence generation must be idempotent.

Required rule:

- generating the same series window twice must not create duplicate occurrences

Recommended unique key per occurrence:

- `seriesId + occurrenceDate`

Persist:

- `seriesId`
- `occurrenceDate`

And enforce uniqueness when generating docs.

### Generation timing

In v1, occurrence generation and reconciliation should happen only at explicit mutation points:

- on series create
- on series update

Do not add background rolling generation in v1.

This keeps behavior predictable and easier to support.

### No auto-extension rule

Recurring series do not extend themselves automatically in v1.

Once the current `until date` is reached:

- no new future occurrences are generated
- the admin must explicitly edit or extend the series to generate additional future occurrences

## Cancellation and deletion rules

### Occurrence cancellation

Occurrence-level cancellation remains operational:

- bookings may still need refund handling
- attendance records may still exist

Occurrence cancellation must continue to use the current event-level cancellation/refund model.

### Series deletion

Do not allow deleting a series if any generated occurrence has:

- bookings
- legacy registrations
- payment records

Instead:

- support cancelling the series
- stop future generation
- cancel future unbooked occurrences

### Series status options

Recommended:

- `draft`
- `published`
- `cancelled`

Cancelling a series should affect future occurrences only.

### Series-to-occurrence status mapping

Status behavior must be explicit:

- `draft` series
  - generate occurrences as draft only
  - occurrences are not publicly visible
- `published` series
  - generate occurrences as published
- `cancelled` series
  - stop future generation
  - future unbooked occurrences are automatically cancelled
  - future booked occurrences are also marked cancelled as occurrences
  - future booked occurrences remain visible and manageable for booking history, attendance, payment, and refund workflows

This mapping must be deterministic so admin and member behavior stays predictable.

## Admin communication and operational responsibility

### Booked-future-occurrence impact notice

When a series save affects future occurrences that already have bookings, the admin must receive a post-save impact summary.

Required summary content:

- how many future occurrences were updated
- how many future booked occurrences were preserved from commercial-rule changes
- whether any no-longer-matching future unbooked occurrences were cancelled/archived
- whether attendee communication may be needed
- how many paid booked occurrences were automatically refunded
- how many paid booked occurrences require manual refund follow-up

### Communication reminder

If the platform does not automatically notify attendees, the admin should be clearly told when they may need to contact booked attendees manually.

This is especially important for:

- time changes
- location changes
- future occurrence cancellations

## Migration / backward compatibility

This feature should not require migrating existing one-off events.

Existing events remain:

- `eventKind = "single"`

Recurring events are additive.

Do not rewrite existing events into series automatically.

## Testing and QA requirements

### Domain/unit coverage

Add tests for:

- daily recurrence generation
- weekly recurrence generation
- monthly recurrence generation
- six-month max validation
- monthly invalid-date skip behavior
- future-occurrence propagation logic
- recurrence-rule reconciliation when future occurrences already exist
- booked future occurrence preservation when a rule no longer matches
- commercial-field freeze behavior for booked future occurrences
- capacity reduction safeguards
- occurrence slug generation
- duplicate-generation prevention

### Integration coverage

Test:

- create recurring series
- generated occurrences appear in event lists
- member can book one occurrence
- member can book multiple occurrences from same series
- member can cancel one occurrence only
- admin can manage attendance per occurrence
- admin can manage bookings per occurrence through the existing event operational routes
- paid recurring occurrence creates separate payment flow
- refund behavior remains per occurrence
- future series edits update allowed fields for booked future occurrences only as defined
- future series edits do not retroactively rewrite booked occurrence pricing/refund rules
- shortened recurrence windows do not delete booked future occurrences

### Regression coverage

Ensure no regressions for:

- single events
- event bookings
- event attendance
- public event detail routing
- member booking workspace
- package enforcement for one-off events

## Rollout phases

### Phase 1: domain and generation layer

- add recurrence domain model
- add event series persistence
- add occurrence generation utilities
- add unit coverage

### Phase 2: admin creation UX

- add repeating mode to event form
- add recurrence validation and preview
- create series and generate occurrences

### Phase 3: series management UX

- add series workspace
- add occurrence list
- add future-occurrence propagation on save

### Phase 4: operational integration

- wire occurrence management into current bookings/attendance flows
- ensure public event detail and next-steps flows work with occurrences

### Phase 5: package enforcement

- recurring-events capability gating
- scheduled-offering counting logic

### Phase 6: QA and hardening

- regression testing
- support/admin flow review
- copy and UX tightening

## Explicit non-goals for v1

Do not implement in this phase:

- editable occurrence overrides
- per-occurrence content customization
- bulk member booking across multiple occurrences
- recurring payment subscriptions
- bundled multi-date checkout
- ICS / calendar sync generation
- automatic background rolling generation beyond the chosen 6-month window
- no-show automation

## Final recommendation

Build recurring events as:

- an editable series
- generated occurrence event docs
- occurrence-level bookings/payments/attendance
- no occurrence editing

This is the safest production-grade design for the current codebase and preserves existing operational behavior without forcing a rewrite of the booking or payment stack.
