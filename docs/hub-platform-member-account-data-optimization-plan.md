# Hub Platform Member Account Data Optimization Plan

## Objective

Make logged-in member account routes scale without scanning every event/course and nested booking/registration document.

## Audit Findings

The member account skeleton work improved perceived performance, but some data helpers still use nested fan-out patterns.

Relevant audited files:

- `apps/hub-platform/src/app/(hub)/[hubSlug]/account/page.jsx`
- `apps/hub-platform/src/app/(hub)/[hubSlug]/account/bookings/page.jsx`
- `apps/hub-platform/src/app/(hub)/[hubSlug]/account/billing/page.jsx`
- `apps/hub-platform/src/lib/data/event-booking-shared.js`
- `apps/hub-platform/src/lib/data/course-registration-shared.js`
- `firestore.indexes.json`

Current high-risk patterns:

- User event bookings can scan all events and their bookings, then filter by `bookerUserId`.
- User course registrations can scan all courses and their registrations, then filter by user.
- Billing/account views can indirectly rely on payment data assembled from broader hub-level structures.
- Current route shells load fast, but data sections can remain expensive for large hubs.

## Target Data Model

Use one of two enterprise-safe models:

- Collection-group queries:
  - Query all `bookings` subcollections by `hubId` and `bookerUserId`.
  - Query all `registrations` subcollections by `hubId` and `userId`.
  - Order by created date, event date, or registration date.

- Denormalized hub-level member activity index:
  - `hubs/{hubId}/memberActivity/{activityId}`
  - Contains member id/user id, item type, item id, status, payment state, date fields, and display summary.
  - Updated when bookings/registrations change.

Recommended first step:

- Use collection-group queries where existing nested documents already contain `hubId` and user identifiers.
- Move to a denormalized activity index later if collection-group query complexity or display hydration remains too high.

Security rule requirement:

- Collection-group queries must be backed by Firestore security rules that restrict access to the current user's own documents for member-facing routes.
- Server-side admin SDK reads still need application-level authorization before returning data to the client.
- Any denormalized activity projection must not expose another member's records.

Parent hydration rule:

- Querying bookings/registrations is only half the optimization.
- Parent event/course display data must be hydrated only for returned page items.
- If parent hydration becomes N+1 heavy, introduce a small display projection on the booking/registration/activity item.

## Implementation Phases

### Phase 1: Confirm Nested Document Fields

- Confirm event booking documents include `hubId`, `bookerUserId`, status, payment status, event id, and timestamps.
- Confirm course registration documents include `hubId`, user id/member id, status, payment status, course id, and timestamps.
- Identify missing fields and define compatibility behavior.
- Identify guest booking fields and whether they can later attach to a user account.
- Identify deleted/cancelled parent event/course behavior.
- Identify refund/cancellation fields required by account and billing routes.

Acceptance criteria:

- No collection-group query is introduced unless the required fields exist or are backfilled.
- Legacy documents have a clear fallback path.
- Required user identifiers are normalized before relying on them for security-sensitive reads.

### Phase 1.5: Backfill Required Query Fields

- Backfill missing `hubId`, `bookerUserId`, `userId`, status, payment status, and timestamp fields where possible.
- Mark records that cannot be associated with a signed-in user.
- Keep the backfill idempotent.

Acceptance criteria:

- Existing member account records remain visible after the optimized query path is enabled.
- Records that cannot be safely attributed to the current user are not exposed.

### Phase 2: Add Collection-Group Indexes

Likely indexes:

- Collection group `bookings`: `hubId`, `bookerUserId`, `createdAt`.
- Collection group `bookings`: `hubId`, `bookerUserId`, `status`, `createdAt`.
- Collection group `bookings`: `hubId`, `bookerUserId`, `paymentStatus`, `createdAt`.
- Collection group `registrations`: `hubId`, `userId`, `createdAt`.
- Collection group `registrations`: `hubId`, `userId`, `status`, `createdAt`.
- Collection group `registrations`: `hubId`, `userId`, `paymentStatus`, `createdAt`.

Acceptance criteria:

- Indexes are committed in `firestore.indexes.json`.
- Existing field overrides are preserved.
- Query paths stay behind a flag until indexes are deployed.

Implementation progress:

- Added the first production query indexes for the optimized member account read path:
  - collection group `bookings`: `hubId`, `bookerUserId`, `createdAt desc`
  - collection group `registrations`: `hubId`, `userId`, `createdAt desc`
- Preserved existing `bookings.hubId` and `registrations.hubId` field overrides.
- The optimized read path remains behind `HUB_PLATFORM_MEMBER_ACCOUNT_COLLECTION_GROUP_ENABLED=true` so indexes can be deployed and built before production cutover.
- Status/payment-status collection-group indexes remain deferred because the current member account UI does not execute server-side status/payment filters. Add them only when implementing URL-driven member booking filters or cursor pagination that requires those query shapes.

### Phase 3: Replace Fan-Out Account Queries

- Update member account booking helpers to query collection groups by current user and hub.
- Update member account course registration helpers similarly.
- Keep route output shape unchanged for UI components.
- Add lightweight hydration for parent event/course display data only for returned page items.
- Use page limits for booking/registration history.
- Prefer `hasMore` over full totals unless exact totals already exist cheaply.
- Add a legacy comparison mode during rollout where practical.

Acceptance criteria:

- Account bookings route does not scan all hub events.
- Account bookings route does not scan all hub courses.
- Data-rich sections still match current UI behavior.
- Deleted parent event/course records produce a stable fallback row instead of throwing.

Implementation progress:

- Added feature-flagged collection-group readers for member event bookings and course registrations.
- `listEventBookingsByBooker` and `listCourseRegistrationsByUser` keep their existing output shape and hydrate parent event/course display data only for returned rows.
- `/account` now requests bounded member activity slices for overview previews, capped below the hard helper maximum while avoiding tiny slices that could hide future bookings behind a large history.
- `/account/bookings` now requests the maximum bounded member activity slice for the dedicated bookings/history workspace.
- Admin member detail now requests bounded member activity slices through the same helpers instead of relying on unbounded defaults.
- Public recurring-series member booking checks now pass an explicit bounded limit through the same helper.
- Legacy fan-out readers remain as rollout fallback when `HUB_PLATFORM_MEMBER_ACCOUNT_COLLECTION_GROUP_ENABLED` is false or if a collection-group query fails while indexes are being deployed.
- The collection-group path is scoped by both `hubId` and the authenticated member user id, so member account routes do not scan every event/course in the hub.
- Cursor pagination remains a future follow-up if individual members regularly exceed the bounded history cap; this slice is focused on removing hub-wide nested fan-out while preserving the current workspace shape.

### Phase 4: Bound Account Billing Reads

- Audit member billing reads for broad hub-level payment scans.
- Query only current member/user payment records.
- If needed, add member payment projection documents.
- Align billing source with the payments ledger plan when that projection exists.
- Until the ledger exists, avoid calling full hub-level payment reports from member routes.

Acceptance criteria:

- Member billing route reads current user payment records only.
- Hub-level payment report assembly is not used for member account billing.
- Refunds, failed payments, and cancelled items display correctly.

Implementation progress:

- Completed via the payments ledger projection workstream.
- `/account/billing` uses the user-scoped `paymentItems` read model when `HUB_PLATFORM_PAYMENT_ITEMS_READ_MODEL_ENABLED=true`.
- `/account` overview uses the same projection helper with a smaller bounded limit for recent billing/attention state.
- Historical free/not-required event bookings and course registrations are normalized into canonical `paymentRecords`/`paymentItems` by the support-only ledger sync.
- Runtime legacy event/course fallback merging has been removed from the read-model path so production billing does not quietly return to broad reads.
- Production verification after ledger sync confirmed member billing records, including free/not-required activity, are present through the projection-backed path.

### Phase 5: Add Optional Member Activity Projection

Introduce only if collection-group queries still require too much hydration:

- Create a single member activity projection for bookings and registrations.
- Backfill existing member activity.
- Update booking/registration write paths to maintain projection.

Acceptance criteria:

- Projection has backfill, live update, and reconciliation paths.
- Existing booking and course journeys remain unchanged.

Implementation progress:

- Added `hubs/{hubId}/memberActivity/{kind}_{recordId}` as the member-facing activity read model.
- Projection records duplicate only the display and workflow fields needed by `/account` and `/account/bookings`:
  - hub id and authenticated member user id
  - activity kind, source record id, parent event/course id
  - parent title, slug, image, timing, location/format, price/currency, refund/payment metadata
  - booking/enrolment status, payment status, attendance status, attendee counts, source timestamps, and `sortAt`
- Added `MEMBER_ACTIVITY_SCHEMA_VERSION = 1`; account reads ignore stale projection documents with a mismatched schema version.
- Added the collection-scoped Firestore index:
  - `memberActivity`: `hubId`, `userId`, `sortAt desc`
- Added `HUB_PLATFORM_MEMBER_ACTIVITY_READ_MODEL_ENABLED=true` as the read cutover flag.
- `/account` and `/account/bookings` now read member activity projection rows when the flag is enabled.
- If the projection query throws, both routes fall back to the existing collection-group booking/registration readers.
- The existing `HUB_PLATFORM_MEMBER_ACCOUNT_COLLECTION_GROUP_ENABLED=true` path remains the safe fallback and should stay enabled.
- Added live projection maintenance for:
  - event booking creation
  - event booking payment state changes
  - event booking status changes
  - event attendee status changes
  - event attendee/member cancellation
  - event waitlist promotion
  - course registration creation
  - course registration status changes
  - course registration attendance changes
  - course registration payment/native payment changes
- Added parent refresh maintenance for:
  - event edits, so member account rows reflect changed title, slug, dates, image, pricing, location, and refund metadata
  - course edits, so member account rows reflect changed title, slug, dates, image, pricing, format/location, and refund metadata
- Added `rebuildHubMemberActivity` and integrated it into the existing support-only **Sync payment ledger** maintenance flow.
- The support diagnostics panel now displays member activity synced/skipped/scanned counts and rebuild timestamp.
- Rollout order:
  - deploy the new `memberActivity` Firestore index
  - deploy code with `HUB_PLATFORM_MEMBER_ACTIVITY_READ_MODEL_ENABLED` unset or `false`
  - run **Sync payment ledger** in support diagnostics for each production hub being verified
  - confirm `Member activity` synced/scanned counts are sensible
  - set `HUB_PLATFORM_MEMBER_ACTIVITY_READ_MODEL_ENABLED=true`
  - hard refresh `/account` and `/account/bookings` for members with event-only, course-only, mixed, cancelled, paid, and free histories
- Do not enable the read flag before the projection has been backfilled for the target production hub, because a valid but empty projection query will correctly return only projection rows.

### Phase 6: Authorization And Privacy Review

- Confirm members cannot access another member's bookings, registrations, billing records, or profile data.
- Confirm admins can still view relevant member records through admin routes.
- Confirm route handlers/server actions validate hub membership before returning account data.

Acceptance criteria:

- Security rules and server authorization checks are updated with any new collection group or projection paths.
- Tests or manual verification cover cross-user access attempts.

Implementation progress:

- Member account pages continue to call `requireCurrentMemberSessionForHub` before loading bookings, registrations, billing, membership, or profile data.
- Collection-group reads are server-side Admin SDK reads and are scoped by the authenticated hub id plus the authenticated member user id.
- The repo does not currently include Firestore security rules for direct client reads; no browser/client code reads the new collection-group query path directly.
- Admin member detail continues to require admin route authorization before calling member detail helpers, and the helpers are scoped to the selected hub id plus selected member id.
- Member booking cancellation still revalidates ownership server-side:
  - event cancellations load the booking by parent event id and booking id, then require `booking.bookerUserId === actorId`
  - course cancellations load the registration by current actor id, then require the submitted registration id to match
- Cross-user access remains blocked by deriving the user id from the authenticated session on member routes rather than trusting user ids from URL/search params.

## Edge Cases

- Member has no bookings or registrations.
- Member has only guest-created bookings later linked to their email.
- Member changed email after booking.
- Event/course was deleted after booking.
- Event/course was unpublished after booking.
- Booking or registration was cancelled.
- Payment was refunded, failed, disputed, or manually marked paid.
- Same user belongs to multiple hubs.
- Same email appears in multiple hub user records.
- Parent event/course display fields changed after the booking was created.

## Verification Checklist

- Test `/account`, `/account/bookings`, `/account/membership`, `/account/billing`, and `/account/profile`.
- Test member with no bookings.
- Test member with event bookings only.
- Test member with course registrations only.
- Test member with mixed paid/free items.
- Test cancelled/refunded/failed payment items.
- Test member belonging to two hubs.
- Test attempted cross-user access.
- Confirm first page loads remain bounded.
- Confirm account skeletons use public tokens and do not regress.
- Run scoped checks and `git diff --check`.
