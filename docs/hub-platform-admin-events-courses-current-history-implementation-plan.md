# Hub Platform Admin Events/Courses Current History Implementation Plan

## Objective

Improve the admin events and courses list journeys by giving admins a clear way to separate current operational items from historical records.

The admin should be able to open Events or Courses and immediately focus on records that still need operational attention, while retaining a clean way to review past/cancelled history.

This is a UX, routing, and projection-readiness enhancement. The list-view filtering can remain client-side in the first implementation slice, but truthful historical event attendance requires additive event attendance projection fields before the UI relies on `Attended` outcome labels.

## Current State Audit

### Routes

Admin events route:

- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/events/page.jsx`

Admin courses route:

- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/courses/page.jsx`

Shared list workspace:

- `apps/hub-platform/src/components/patterns/offering-admin-list-workspace/OfferingAdminListWorkspace.jsx`
- `apps/hub-platform/src/components/patterns/offering-admin-list-workspace/offering-admin-list-helpers.js`
- `apps/hub-platform/src/components/patterns/offering-admin-list-workspace/OfferingAdminListWorkspace.module.css`

Related detail routes that preserve list query state:

- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/events/[eventId]/page.jsx`
- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/events/series/[seriesId]/page.jsx`
- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/courses/[courseId]/page.jsx`

### Existing Behavior

Events:

- Loads all hub events through `listEventsByHubSlug`.
- Loads all event series through `listEventSeriesByHubSlug`.
- Excludes `series_occurrence` event items from the main event item list.
- Combines standalone event items and event series items into one list.
- Sorts ascending by `dateSortValue`.
- Supports client-side search.
- Supports filter menus for:
  - Status
  - Pricing
  - Visibility
- Persists search/filter query params in the URL.

Courses:

- Loads all hub courses through `listCoursesByHubSlug`.
- Builds list items with registration summaries.
- Sorts by existing course query/order behavior.
- Supports client-side search.
- Supports filter menus for:
  - Status
  - Pricing
  - Delivery format
- Persists search/filter query params in the URL.

Shared workspace:

- Uses client-side filtering and pagination.
- Keeps `q` and filter params in the URL via `router.replace`.
- Passes the current offering query into row actions so detail/edit links preserve list context.
- Current code usage audit shows `OfferingAdminListWorkspace` is only used by the admin Events and Courses routes. This lowers the shared-component blast radius, but the component should still remain backwards-compatible when `enableTemporalView` is false.

### Current UX Gap

The admin sees one mixed list of:

- Upcoming/current records.
- Completed/past records.
- Cancelled records.
- Draft records.

This makes the list less operationally clear as the hub grows. Admins need an obvious default view for items that still require attention, with history available intentionally.

## Target UX

Add a segmented view toggle to the admin Events and Courses list toolbar.

Default view:

- `Current`

Secondary view:

- `History`

Placement:

- The toggle should sit to the left of the search bar.
- The toolbar should follow the Payments route operational layout rather than the current narrow offering-list layout.
- The search bar should flex across the available row width and extend toward the filter controls, like `/admin/payments`.
- Existing search and filter menus should remain in the same toolbar, with filter controls aligned to the right edge.
- On mobile, the toggle should stack above the search/filter controls without layout jumping.

URL behavior:

- Persist the selected non-default view with `view=history`.
- Treat no `view` param as `current`.
- Omit `view=current` from generated URLs to keep default list URLs clean.
- If an incoming URL contains `view=current`, normalize state to Current and allow the next client-side query sync to remove the redundant param.
- Preserve `view=history` when navigating into a detail route and back.

Recommended URL contract:

- `/admin/events`
- `/admin/events?view=history`
- `/admin/events?q=garden&view=history&status=published`
- `/admin/courses`
- `/admin/courses?view=history`
- `/admin/courses?q=safety&view=history&format=in-person`

Invalid URL handling:

- Unknown `view` values must fall back to `current`.
- Unknown values must not throw, redirect, or break rendering.
- Query preservation should only preserve validated view values.

## Attendance And Completion Display Semantics

The Current/History split changes what the admin is trying to understand.

Current view:

- The admin needs intent and operational load.
- Events should show booking/registration intent.
- Courses should show enrolment intent.

History view:

- The admin needs outcome.
- Events should show how many people were marked as attended.
- Courses should show how many learners were marked as completed.

Do not keep showing `15 Attending` for a passed event or course. Once an item has moved into History, that label implies an active future state and is no longer the right operational language.

### Display Rules

Events in Current:

- Primary count label: `Registered`
- Value source: event registered attendee projection.
- Example badge: `15 Registered`

Events in History:

- Primary count label: `Attended`
- Value source: event attended attendee projection.
- Example badge: `12 Attended`
- If there were registered attendees but no attendance has been marked, show `0 Attended` and an additional warning/neutral context badge such as `15 unmarked`.

Courses in Current:

- Primary count label: `Enrolled`
- Value source: course enrolled registration projection.
- Example badge: `15 Enrolled`

Courses in History:

- Primary count label: `Completed`
- Value source: course completed attendance/progression projection.
- Example badge: `10 Completed`
- If there were enrolled registrations but no completion/progression has been marked, show `0 Completed` and an additional warning/neutral context badge such as `15 unmarked`.

Detail pages:

- Event detail should use the same rule as the list.
- Course detail should use the same rule as the list.
- Current details can continue to display registration/enrolment capacity context.
- History details should display attendance/completion outcome context clearly.

### Attendance Copy Decision

Use more precise labels than `Attending` where possible:

- Events Current: `Registered`
- Events History: `Attended`
- Courses Current: `Enrolled`
- Courses History: `Completed`

Rationale:

- `Attending` is ambiguous after the event/course has passed.
- `Registered` and `Enrolled` describe pre-event intent.
- `Attended` and `Completed` describe post-event outcome.
- This avoids overstating attendance where a person registered but was never marked present/completed.

## Attendance Projection Requirements

This work must not introduce list-level row scans.

Do not calculate attended/completed counts by reading all attendance rows for every card on the Events or Courses list.

Required projection behavior:

- List cards read projected counters already available on the event/course document.
- Detail pages read projected counters from the event/course document or a bounded summary read, not broad row assembly.
- Attendance/progression updates maintain the projected counters.
- A reconciliation/backfill path exists for historical records.
- The normal list route must not repair projections one record at a time during render. Backfill or support diagnostics should bring existing records into shape before relying on outcome labels at scale.

### Course Projection State

Courses already have a projection-like shape on the course document:

- `registrationCount`
- `enrolledRegistrationCount`
- `waitlistedRegistrationCount`
- `cancelledRegistrationCount`
- `attendanceInProgressCount`
- `attendanceCompletedCount`
- `attendanceActiveCount`

For this workstream:

- Current course count should use `enrolledRegistrationCount`.
- History course count should use `attendanceCompletedCount`.
- Do not use `attendanceActiveCount` for completed course outcome labels because it includes `in_progress + completed`.
- Course detail should switch to `Completed` for History/passed courses and use `attendanceCompletedCount`.

### Event Projection Gap

Events currently expose booking/registration counters such as:

- `registeredAttendeeCount`
- `waitlistedAttendeeCount`
- `cancelledAttendeeCount`
- `activeBookingCount`

Event attendance is stored at attendee row level with attendance statuses:

- `pending`
- `present`
- `absent`

The current event detail page has a verified-attendance branch, but the route passes `attendanceCountVerified={false}`, so passed events still show registration count as `Attending`.

For enterprise-grade implementation, add event attendance projections before using outcome labels on event list cards.

Recommended event document counters:

- `attendancePresentCount`
- `attendanceAbsentCount`
- `attendancePendingCount`
- `attendanceMarkedCount`
- `attendanceSummaryUpdatedAt`
- `attendanceSummaryUpdatedBy`
- `attendanceSummarySchemaVersion`

Counter semantics:

- `attendancePresentCount`: registered attendees marked `present`.
- `attendanceAbsentCount`: registered attendees marked `absent`.
- `attendancePendingCount`: registered attendees still `pending`.
- `attendanceMarkedCount`: `present + absent`.
- Only attendance-eligible registered attendees should be counted in these attendance outcome counters.
- Cancelled/waitlisted attendees should not inflate present/absent outcome counts.

### Event Attendance Counter Maintenance

Update the event attendance mutation path:

- `apps/hub-platform/src/lib/data/event-booking-mutations.js`
- `updateEventBookingAttendeeAttendanceStatus`

Required behavior:

- When attendance changes from `pending` to `present`, increment present and decrement pending.
- When attendance changes from `pending` to `absent`, increment absent and decrement pending.
- When attendance changes from `present` to `absent`, decrement present and increment absent.
- When attendance changes from `absent` to `present`, decrement absent and increment present.
- If moving back to `pending` is supported later, decrement the previous marked status and increment pending.
- Updates should be transactional or use atomic increments so concurrent marking does not corrupt counts.
- Counter values must never go below zero.

Current allowed statuses are `pending`, `present`, and `absent`, so the maintenance helper should be written to handle all three even if the UI mostly moves between present/absent/pending.

### Event Booking Lifecycle Counter Maintenance

Event attendance projection maintenance is not limited to the attendance marking action.

The implementation must cover all event booking lifecycle paths that can change whether an attendee is attendance-eligible.

Relevant mutation paths:

- Event booking creation.
- Whole booking status updates.
- Individual attendee status updates.
- Individual attendee cancellation.
- Waitlist promotion.

Required behavior by lifecycle path:

- Creating an active booking should increase `attendancePendingCount` by the number of newly registered attendees.
- Creating a waitlisted booking should not increase attendance outcome counters until attendees become registered.
- Promoting waitlisted attendees to registered should increase `attendancePendingCount` for promoted attendees.
- Moving a registered attendee to waitlisted/cancelled should remove that attendee from whichever attendance bucket they currently occupy.
- Moving a waitlisted/cancelled attendee to registered should add that attendee to the correct attendance bucket, usually pending unless an explicit attendance status is preserved.
- Cancelling a booking should remove all previously registered attendees from attendance counters.
- Updating whole booking status should apply the same aggregate delta as updating each attendee status.

Recommended implementation approach:

- Build a small pure helper that summarizes event attendance counter contribution from attendee rows.
- Use that helper to calculate `previousContribution` and `nextContribution` inside the existing event booking transactions.
- Apply the delta to event document counters in the same transaction that updates attendee/booking/event registration counters.
- Clamp final projected counters to zero to avoid negative values after legacy inconsistencies.

This mirrors the existing course registration summary approach and reduces the risk of missing a status transition edge case.

### Booking/Attendee Status Changes

Attendance counters must also remain correct when attendee status changes after attendance was marked.

Risk:

- An attendee can be registered, marked present, and later cancelled.
- If the attendee is no longer attendance-eligible, they should no longer count toward present/absent/pending outcome counters.

Implementation requirement:

- Audit attendee status mutation paths before implementation.
- When attendee status changes into or out of `registered`, adjust attendance counters accordingly.
- If a status change resets attendance to `pending`, update counters based on the previous attendance state and the next eligibility state.

Relevant areas to audit during implementation:

- Event booking attendee status updates.
- Event booking cancellation.
- Event booking waitlist promotion.
- Any path that changes attendee `status` or `attendanceStatus`.

### Event Attendance Reconciliation

Add or reuse a reconciliation path for event attendance counters.

Minimum required behavior:

- Given `hubId` and `eventId`, scan attendee records for that event.
- Recalculate present/absent/pending counts for registered attendees.
- Write the projected counters to the event document.
- Return before/after counts for diagnostics.

Recommended integration:

- Add this to the existing projection reconciliation/support diagnostics pattern if practical.
- At minimum, expose a safe server-side helper that future support diagnostics can call.

Historical records:

- Existing events may not have attendance counters.
- Before the UI relies on these counters for historical events, the implementation must either:
  - backfill/reconcile counters for the hub, or
  - display a safe fallback label that does not claim attendance truth.

Safe fallback:

- If a historical event lacks attendance projection fields, show `Attendance not synced` or use a neutral badge rather than showing `15 Attending`.
- Prefer implementing reconciliation/backfill in the same workstream so the admin sees outcome counts immediately.

Backfill requirement:

- Run event attendance reconciliation for existing events before validating production history UI.
- If this cannot be run before deployment, guard historical event outcome labels behind a projection-current check and show a safe fallback until sync is complete.

### Course Reconciliation

Course registration summary projection already exists, but the workstream should still verify it.

Required:

- Confirm `attendanceCompletedCount` is maintained when course attendance/progression is updated.
- Confirm existing course summary reconciliation/backfill can repair historical course documents.
- If not already available through support diagnostics, document or add a bounded repair path.
- Avoid repairing missing course registration summaries inside the list render path for every course. Use preflight/backfill or a safe fallback for stale/missing projections.
- Course detail may repair a single course summary because it is a focused route, but the list route should avoid broad per-card repair work.

### Projection Verification

Verification must include:

- Future event with 15 registered shows `15 Registered`.
- Passed event with 12 present, 2 absent, 1 pending shows `12 Attended` and context for unmarked/absent if implemented.
- Passed event with 15 registered and no marked attendance shows `0 Attended` plus unmarked context, not `15 Attending`.
- Future course with 15 enrolled shows `15 Enrolled`.
- Passed course with 10 completed, 3 withdrawn/in-progress/pending shows `10 Completed`.
- Passed course with 15 enrolled and no completed progress shows `0 Completed` plus unmarked context, not `15 Attending`.
- Event detail and course detail match the list semantics.
- Attendance/progression updates immediately update the relevant list/detail counters after refresh/navigation.

## View Semantics

Use `Current` instead of `Upcoming`.

Rationale:

- `Current` can include upcoming and in-progress items.
- Courses can span date ranges, so `Upcoming` is less accurate once a course has started but not ended.
- Admins are thinking operationally: "what is active or needs attention now?"

## Classification Rules

### Shared Rule

Use the best available end boundary for classification.

An item is `Current` when:

- It is not cancelled, and
- Its end boundary is today or in the future in the hub/admin user's local browser time, or
- It has no valid date boundary.

An item is `History` when:

- It is cancelled, or
- Its end boundary is before today.

Missing/invalid dates should stay in `Current` so records are not hidden from the operational default view.

Date comparison rule:

- Compare at day granularity, not exact millisecond granularity.
- A record ending at any time today should remain `Current` for the whole local day.
- This avoids items moving to History midway through a browser session because an end time passed a few minutes ago.

### Events

Standalone event date boundary priority:

1. `endAt`
2. `startAt`
3. `endDate`
4. `startDate`
5. `dateSortValue`

Cancelled event:

- Always `History`.

Draft event:

- `Current` if it has not ended or has no valid date.
- `History` if its date boundary is before today.

Published event:

- `Current` if it has not ended.
- `History` if its date boundary is before today.

### Event Series

Series date boundary priority:

1. `recurrenceUntilDate`
2. `recurrenceStartDate`
3. `dateSortValue`

Cancelled series:

- Always `History`.

Active/draft/published series:

- `Current` if `recurrenceUntilDate` is today or future.
- `History` if `recurrenceUntilDate` is before today.
- `Current` if the boundary cannot be parsed.

Important edge case:

- A recurring series should remain `Current` while any future occurrence is still expected. Using `recurrenceUntilDate` as the boundary is the safest first implementation.
- If a series has preserved past occurrences but a future `recurrenceUntilDate`, the series remains `Current`.
- Individual occurrences are not listed on `/admin/events`; they remain managed through the series/detail flows.

### Courses

Course date boundary priority:

1. `endAt`
2. `startAt`
3. `endDate`
4. `startDate`
5. `dateSortValue`

Cancelled course:

- Always `History`.

Draft course:

- `Current` if it has not ended or has no valid date.
- `History` if its date boundary is before today.

Published course:

- `Current` if it has not ended.
- `History` if its date boundary is before today.

## Sorting Rules

Current view:

- Sort ascending by start/date sort value, using `temporalStartValue` first and then `dateSortValue`.
- Missing dates should appear after dated records.
- Tie-break by title.

History view:

- Sort descending by end/date sort value, using `temporalEndValue` first and then `dateSortValue`.
- Missing dates should appear after dated records.
- Tie-break by title.

The existing list currently sorts events ascending. The implementation should avoid surprising admins by keeping Current in date-forward order, while making History newest-first.

## Results And Empty States

The shared workspace should display a view-aware count.

Recommended labels:

- Events Current: `12 current events`
- Events History: `8 event history records`
- Courses Current: `5 current courses`
- Courses History: `14 course history records`

If search/filter returns no matches across both views:

- Use existing "No matching records" behavior.

If search/filter has matches but the selected view is empty:

- Current events title: `No current events`
- Current events description: `Upcoming, in-progress, and undated events will appear here.`
- History events title: `No event history yet`
- History events description: `Past and cancelled events will appear here once your event history begins to build.`
- Current courses title: `No current courses`
- Current courses description: `Upcoming, in-progress, and undated courses will appear here.`
- History courses title: `No course history yet`
- History courses description: `Past and cancelled courses will appear here once your course history begins to build.`

## Implementation Phases

### Phase 0: Attendance/Completion Projection Readiness

Before implementing the Current/History UI, make the count semantics safe.

Required:

- Audit event attendee status and attendance mutation paths.
- Add event attendance projection counters if they do not already exist.
- Maintain event attendance projection counters when attendance is marked.
- Maintain event attendance projection counters when attendee status changes into or out of attendance eligibility.
- Add or expose event attendance reconciliation/backfill.
- Confirm course `attendanceCompletedCount` is already maintained and repairable.
- Update detail-page count semantics so passed event/course pages do not continue showing future-intent wording.

Acceptance criteria:

- Historical list/detail UI can safely show `Attended`/`Completed` outcome counts without row scans.
- Existing records can be reconciled or have a safe non-misleading fallback.
- No admin list card performs per-record attendance row scans.
- Event booking lifecycle mutations maintain attendance counters transactionally or through deterministic same-transaction deltas.
- Course list rendering does not trigger broad per-course summary repair scans.

### Phase 1: Shared Workspace Capability

Update `OfferingAdminListWorkspace` to support an optional temporal view.

Add props:

- `enableTemporalView`
- `temporalViewParam`, default `view`
- `temporalViewOptions`, default `Current` and `History`
- `defaultTemporalView`, default `current`
- `itemNounSingular`
- `itemNounPlural`

Implementation requirements:

- Import and use the existing `SegmentedToggle` component.
- Initialize the active view from `searchParams`.
- Validate the active view against allowed options.
- Reset pagination to page 1 when the active view changes.
- Include the view value in `buildOfferingQuery`.
- Omit the default `current` view from the URL.
- Keep search/filter behavior unchanged.
- Keep delete modal behavior unchanged.
- Keep row action query preservation unchanged, now including the view param.
- Keep backwards compatibility when `enableTemporalView` is false. Existing search/filter/pagination behavior should remain unchanged for any future workspace consumer.
- Avoid adding a second source of truth for query state. The active temporal view should be part of the same active filter/query state pathway as search and existing filters.
- Be aware that `router.replace` for URL synchronization may appear in browser tooling as a navigation event. The acceptance target is no expensive server data refetch and no full page reload when changing only the view.

### Phase 2: Shared Helper Logic

Update `offering-admin-list-helpers.js`.

Add helper functions:

- `normalizeTemporalView`
- `isOfferingHistoryItem`
- `filterOfferingItemsByTemporalView`
- `sortOfferingItemsForTemporalView`
- `getOfferingTemporalBoundaryDate`
- `compareOfferingItemsForTemporalView`

Expected item fields:

- `status`
- `temporalStartValue`
- `temporalEndValue`
- `dateSortValue`
- `dateFilterValue`

Do not rely only on display labels. Use explicit temporal fields on items where possible.

Helper requirements:

- Treat `cancelled` status as History before date evaluation.
- Treat invalid/missing dates as Current.
- Compare dates at day granularity.
- Use `temporalEndValue` for history classification.
- Use `temporalStartValue` for Current sorting.
- Use `temporalEndValue` for History sorting.
- Use stable title tie-breaks for deterministic ordering.
- Export helpers for potential focused unit tests later.

### Phase 3: Events Route Integration

Update `/admin/events`.

For standalone event items, add:

- `status`
- `temporalStartValue`: `event.startAt || event.startDate || event.dateSortValue`
- `temporalEndValue`: `event.endAt || event.startAt || event.endDate || event.startDate || event.dateSortValue`
- `dateSortValue`
- `dateFilterValue`

For event series items, add:

- `status`
- `temporalStartValue`: `series.recurrenceStartDate || series.dateSortValue`
- `temporalEndValue`: `series.recurrenceUntilDate || series.recurrenceStartDate || series.dateSortValue`
- `dateSortValue`
- `dateFilterValue`

Enable temporal view in `OfferingAdminListWorkspace`.

Use item nouns:

- Singular: `event`
- Plural: `events`

Count badge behavior:

- Current items show `Registered` using `registeredAttendeeCount`.
- History items show `Attended` using `attendancePresentCount`.
- History items with registered attendees but no marked attendance should include unmarked context.
- Do not show `Attending` for history items.
- Do not scan attendee rows per list item.

Update copy only if needed:

- Page description can continue to mention upcoming and draft events.
- Avoid claiming the page only shows upcoming records.

### Phase 4: Courses Route Integration

Update `/admin/courses`.

For course items, add:

- `status`
- `temporalStartValue`: `course.startAt || course.startDate || course.dateSortValue`
- `temporalEndValue`: `course.endAt || course.startAt || course.endDate || course.startDate || course.dateSortValue`
- `dateSortValue`
- `dateFilterValue`

Enable temporal view in `OfferingAdminListWorkspace`.

Use item nouns:

- Singular: `course`
- Plural: `courses`

Count badge behavior:

- Current items show `Enrolled` using `enrolledRegistrationCount`.
- History items show `Completed` using `attendanceCompletedCount`.
- History items with enrolled registrations but no completed progress should include unmarked context.
- Do not show `Attending` for history items.
- Do not scan registration rows per list item.

Update copy only if needed:

- Page description can continue to mention published and draft courses.
- Avoid claiming the page only shows active records.

### Phase 5: Query Preservation On Detail Routes

Update detail routes so `view` is preserved in list-return links.

Events:

- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/events/[eventId]/page.jsx`
- Preserve `view` alongside `q`, `status`, `pricing`, and `visibility`.
- Validate `view` before adding it to `eventsSearchParams`.

Event series:

- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/events/series/[seriesId]/page.jsx`
- Preserve `view` alongside `q`, `status`, `pricing`, and `visibility`.
- Validate `view` before adding it to `eventsSearchParams`.

Courses:

- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/courses/[courseId]/page.jsx`
- Preserve `view` alongside `q`, `status`, `pricing`, and `format`.
- Validate `view` before adding it to `coursesSearchParams`.

Acceptance behavior:

- Select History on Events.
- Open an event.
- Click Back to events.
- Land back on Events with History still selected.

Repeat for:

- Event series.
- Courses.
- Edit mode links.

### Phase 6: Styling And Skeleton Review

Update `OfferingAdminListWorkspace.module.css`.

Requirements:

- Toggle should sit left of search on desktop.
- Search should use a Payments-style flexible search cluster rather than the current `22rem` max-width offering-list search.
- Search should expand across the row and stop before the right-aligned filters.
- Filters should remain easy to scan and should align to the right edge of the toolbar when space allows.
- The resulting desktop order should be:
  - Current/History toggle
  - wide search field
  - filter menus
- On mobile, toggle/search/filter menus should stack cleanly.
- Use existing token-based styling via `SegmentedToggle`.
- Do not introduce public-site-only color tokens into admin surfaces.

Reference implementation:

- `apps/hub-platform/src/components/patterns/hub-payments-workspace/HubPaymentsWorkspace.jsx`
- `apps/hub-platform/src/components/patterns/hub-payments-workspace/HubPaymentsWorkspace.module.css`

Relevant Payments layout concepts to reuse:

- `.toolbarControls` as a flexible row.
- `.searchCluster` as the flexible middle area.
- `.search` flexing within the cluster.
- `.toolbarMenus` using `margin-inline-start: auto` so filters sit at the right edge.

Do not copy Payments-specific date-filter or CSV-export behavior into Events/Courses. Only reuse the toolbar structure and responsive layout principle.

Skeleton/loading:

- `AdminProgrammeListFallback` currently shows a narrow `min(22rem, 100%)` input skeleton and filter pills.
- Because this change deliberately moves the list toolbar to a wide Payments-style search layout, update the fallback in the same implementation pass so hard refresh does not show a noticeably different toolbar shape.
- Add a toggle-shaped pill/button skeleton to the left of a wide search skeleton.
- Keep the fallback generic enough for both Events and Courses.

### Phase 7: Verification

Manual verification:

- `/admin/events` defaults to Current.
- `/admin/events?view=history` opens History.
- Events Current includes upcoming/in-progress/undated non-cancelled records.
- Events History includes past and cancelled records.
- Event series classify based on `recurrenceUntilDate`.
- Events search works within selected view.
- Events status/pricing/visibility filters work within selected view.
- Events pagination works within selected view.
- Events detail back link preserves selected view and filters.
- Event series detail back link preserves selected view and filters.
- `/admin/courses` defaults to Current.
- `/admin/courses?view=history` opens History.
- Courses Current includes upcoming/in-progress/undated non-cancelled records.
- Courses History includes past and cancelled records.
- Courses search works within selected view.
- Courses status/pricing/format filters work within selected view.
- Courses pagination works within selected view.
- Courses detail back link preserves selected view and filters.
- Desktop toolbar uses the Payments-style wide search layout, with the Current/History toggle on the left and filters on the right.
- Mobile toolbar stacks toggle, search, and filters cleanly without overflow.

Regression verification:

- Delete event flow still works.
- Delete course flow still works.
- Create event/course buttons still work.
- Edit event/course links still work.
- Existing query params with no `view` still behave as before except defaulting to Current.
- Invalid `view` values safely fall back to Current.
- `/admin/events?view=current` behaves like `/admin/events` and does not keep producing duplicate state.
- `/admin/events?view=bad-value` behaves like Current.
- `/admin/courses?view=current` behaves like `/admin/courses`.
- `/admin/courses?view=bad-value` behaves like Current.
- Member `My Bookings` route remains unchanged.

Performance verification:

- Confirm no new server fetches are introduced by toggling Current/History.
- Confirm switching views is client-side.
- Confirm no expensive RSC/server data refetch occurs when changing only the segmented toggle.
- If URL synchronization produces a lightweight client navigation entry in dev tooling, confirm it does not reload the route data or show route-level loading.
- Confirm Events list does not query attendee rows per event.
- Confirm Courses list does not repair/scan registration rows per course during normal render.
- Confirm event attendance reconciliation/backfill is run through support/internal tooling, not hidden in the hot list path.

## Future Enterprise Performance Phase

After Phase 0, this workstream does introduce event attendance projection fields and maintenance. The list filtering/sorting phase still deliberately keeps filtering client-side because the current routes already load all admin records.

If hubs begin to hold large numbers of events/courses, implement a later bounded-query phase:

- Server query Current by `endAt >= now`.
- Server query History by `endAt < now`.
- Add Firestore indexes for status/date/view-specific combinations.
- Add server-side pagination.
- Avoid loading full historical lists by default.

Do not start with server-bounded list queries unless production evidence shows the list volume requires it. The first win is admin clarity and truthful outcome counters without reintroducing row-scan fan-out.

## Rollback Plan

If the temporal view introduces unexpected UX or routing issues:

- Disable `enableTemporalView` on Events and Courses.
- Leave helper functions in place if unused and harmless.
- The shared workspace should continue operating with existing search/filter/pagination behavior.

If event attendance projection fields are introduced:

- Do not delete projection fields as part of a UI rollback; they are additive and should be harmless.
- If counter maintenance is found to be incorrect, stop using projected attendance outcome labels in the UI and run reconciliation before re-enabling.
- Keep reconciliation/backfill tooling available so existing event records can be repaired.

No destructive database rollback should be required because the event attendance projection fields are additive.

## Progress Log

### 2026-08-07 - Plan Created

Status: planning complete, implementation not started.

Completed:

- Audited admin Events and Courses list routes.
- Audited shared `OfferingAdminListWorkspace`.
- Audited member `My Bookings` current/history UX pattern.
- Audited detail route query preservation behavior.
- Defined Current/History semantics for events, event series, and courses.
- Defined implementation phases and verification checklist.

### 2026-08-07 - Pre-Implementation Tradeoff And Gap Audit

Status: plan tightened, implementation not started.

Findings:

- `OfferingAdminListWorkspace` is currently only used by admin Events and Courses, so this shared-component change has limited immediate blast radius.
- The plan needed a stricter URL contract so `view=current` is treated as the default and omitted from generated URLs.
- The plan needed explicit invalid-view behavior to prevent bad query params from breaking list rendering.
- Date classification needed to be day-based so records ending today remain Current for the full local day.
- Temporal field mappings needed to be explicit for standalone events, event series, and courses.
- Detail routes need to validate `view` before preserving it in return links.
- The loading fallback should be updated in the same pass because the toolbar layout is intentionally changing from a narrow search field to a Payments-style wide search field.
- Performance verification wording needed to distinguish harmless client URL synchronization from expensive route data refetching.

Plan updates made:

- Added the code usage audit note for the shared workspace.
- Tightened URL/default/invalid query behavior.
- Added day-granularity date comparison rules.
- Added explicit temporal field mappings for events, event series, and courses.
- Added helper requirements for deterministic sorting and cancellation handling.
- Added query validation requirements for detail route preservation.
- Upgraded skeleton/fallback work from optional to required in the first implementation pass.
- Expanded regression and performance verification criteria.

### 2026-08-07 - Attendance/Completion Semantics Expansion

Status: plan tightened, implementation not started.

Findings:

- Existing Events list cards always show `registeredAttendeeCount` as `Attending`.
- Existing Event detail has a verified attendance branch, but the route passes `attendanceCountVerified={false}`, so passed events still show registration intent instead of attendance outcome.
- Existing Courses list cards always show enrolment count as `Attending`.
- Existing Course detail switches after the course has happened, but currently uses `attendanceActiveCount`, which includes `in_progress + completed`; this is not the right outcome count for a completed historical course.
- Course documents already expose useful registration/progression projection fields, including `attendanceCompletedCount`.
- Event attendance appears to be stored at attendee row level and needs an event-level attendance projection before list cards can show outcome counts without row scans.

Decisions:

- Current Events should show `Registered`.
- History Events should show `Attended`.
- Current Courses should show `Enrolled`.
- History Courses should show `Completed`.
- History items must not continue showing `Attending`.
- List cards must not scan attendance/registration rows per item.
- Projection readiness is now Phase 0 and must happen before the Current/History UI is considered complete.

Plan updates made:

- Added Attendance And Completion Display Semantics.
- Added Attendance Projection Requirements.
- Added Event Attendance Counter Maintenance requirements.
- Added Booking/Attendee Status Change counter requirements.
- Added Event Attendance Reconciliation requirements.
- Added Course Reconciliation requirements.
- Added Projection Verification cases.
- Added Phase 0: Attendance/Completion Projection Readiness.
- Added list badge behavior requirements to Events and Courses integration phases.

### 2026-08-07 - Final Pre-Implementation Audit

Status: plan tightened, implementation not started.

Findings:

- Event attendance counters must be maintained across the whole booking lifecycle, not only when attendance is marked.
- Event booking creation, whole booking status updates, attendee status updates, attendee cancellation, and waitlist promotion can all affect attendance eligibility.
- The safest implementation mirrors the course summary approach: calculate previous and next attendance counter contribution and write the delta in the same transaction.
- The plan previously allowed a misleading assumption that the first implementation did not change data shape. Phase 0 now intentionally adds additive event attendance projection fields.
- Course summary projection exists, but list rendering should not repair every stale/missing course projection during normal render.
- Event/course list performance verification needs to explicitly guard against attendee/registration row scans.
- Rollback guidance needed to distinguish disabling UI usage from deleting additive projection fields.

Plan updates made:

- Added Event Booking Lifecycle Counter Maintenance.
- Added backfill requirements for event attendance counters.
- Added course list hot-path repair guardrails.
- Added Phase 0 acceptance criteria for transactional/deterministic event attendance counter maintenance.
- Added performance verification criteria for avoiding list-level row scans.
- Updated Future Enterprise Performance Phase to acknowledge Phase 0 projection fields.
- Updated Rollback Plan so additive projection fields are not destructively removed during a UI rollback.

### 2026-08-07 - Initial Implementation Pass

Status: implementation completed, browser/production verification pending.

Completed:

- Added additive event-level attendance projection fields to normalized event records.
- Initialized event attendance projection counters when new events are created.
- Added event attendance summary helpers for:
  - source-row summarisation
  - event document projection reads
  - projection-current checks
  - deterministic previous/next delta calculation
  - single-event projection repair
  - hub-level reconciliation reporting
  - hub-level projection rebuild
- Wired event attendance counter maintenance into the event booking lifecycle paths that can change attendance eligibility:
  - booking creation
  - waitlist promotion
  - whole booking status updates
  - attendee status updates
  - attendance status updates
  - attendee cancellation
- Counter changes are applied in the same transaction as the related booking/attendee/event mutation where the existing flow already uses a transaction.
- Legacy or stale event documents are not marked projection-current by incremental deltas; they stay visibly stale until the repair path completes.
- Extended the existing internal projection maintenance route with `includeEventAttendance`.
- Dry-run projection maintenance now reports event attendance projection issues.
- Repair-mode projection maintenance now rebuilds event attendance projections for the selected hub or bounded hub page.
- Updated event detail semantics:
  - current/unverified view displays `Registered`
  - verified historical attendance displays `Attended`
- Updated course detail semantics:
  - current/unverified view displays `Enrolled`
  - verified historical completion displays `Completed`
  - course outcome count now uses `attendanceCompletedCount`, not `attendanceActiveCount`
- Updated the Events list:
  - Current badges use `Registered`
  - History badges use `Attended`
  - stale legacy projections show `Attendance not synced`
  - unmarked and absent context badges are shown when available
  - temporal classification fields are explicit on standalone events and event series
- Updated the Courses list:
  - Removed per-course `resolveCourseRegistrationSummary` calls from normal list render
  - Current badges use projected `Enrolled`
  - History badges use projected `Completed`
  - stale legacy projections show `Attendance not synced`
  - unmarked/in-progress context badges are shown when available
  - temporal classification fields are explicit on courses
- Updated the shared offering list workspace:
  - optional Current/History segmented toggle
  - validated `view` query handling
  - default `current` omitted from generated URLs
  - view-aware filtering and sorting
  - view-aware pagination labels
  - row actions preserve the selected view
  - backwards-compatible behavior when `enableTemporalView` is false
- Updated the offering list toolbar to match the wider Payments-style layout.
- Updated the Events/Courses loading fallback to match the new toolbar structure.
- Updated event, event-series, and course detail route query preservation to keep validated `view=history`.
- Updated event-series edit links to preserve list query context.

Verification completed:

- Targeted `git diff --check` passed for all files touched by this implementation pass.
- Production repair was run for `maplegrovecommunityhub` after deploying the projection maintenance boolean-normalization fix.
- Historical Events cards changed from `Attendance not synced` to projected attendance outcome badges after repair and hard refresh.
- Confirmed the internal projection maintenance POST body now respects JSON boolean `false` for `dryRun`.
- Network screenshots after hard reload showed Current/History toggle changes still triggering lightweight RSC requests through `router.replace`.
- Replaced offering-list query synchronization with `window.history.replaceState` for client-only search/filter/view state so toggling Current/History does not trigger an App Router RSC navigation.
- Network screenshots also showed `create?_rsc` fetches caused by automatic prefetching of heavy create-form routes.
- Disabled prefetch on Events and Courses create CTAs so create-form RSC payloads load only when the admin explicitly selects Create.
- User verification confirmed the Current/History RSC toggle fetches and create-route prefetches are fixed.

Verification pending:

- Browser test `/admin/events`:
  - default Current view
  - History view
  - search/filter combined with History
  - open event/detail/edit and return with view preserved
  - event series open/edit/back with view preserved
- Browser test `/admin/courses`:
  - default Current view
  - History view
  - search/filter combined with History
  - open course/detail/edit and return with view preserved
- Verify Events and Courses list route network behavior:
  - toggling Current/History should not trigger expensive route-level data refetch
  - Events list should not read attendee rows per card
  - Courses list should not repair/scan registration rows per card
- Verify attendance/progression mutations:
  - event booking, cancellation, waitlist promotion, attendee status change, and attendance marking update event counters after refresh/navigation
  - course progress/attendance updates continue updating course projected counters

Known environment note:

- Full local Node/npm validation was not available in the current shell, so route-level browser verification remains required before deployment.
