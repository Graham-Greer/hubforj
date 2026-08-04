# Hub Platform Admin Members Directory Optimization Plan

## Objective

Move the admin members directory from broad collection loading and client-side filtering to server-side pagination, filtering, and search.

## Audit Findings

The members route has already improved substantially through skeletons and Suspense, but the data model still has scalability pressure.

Relevant audited files:

- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/members/page.jsx`
- `apps/hub-platform/src/components/features/members/MembersWorkspace.jsx`
- `apps/hub-platform/src/lib/data/hub-admin.js`

Current high-risk patterns:

- Members route can load all member directory rows.
- It can load all membership directory summaries.
- It can load all pending upgrade request user ids.
- It can load all event booking payment attention ids.
- It can load all course registration payment attention ids.
- Filtering/search/pagination happens in the client workspace.

## Target Data Model

Use a queryable member directory projection:

- `hubs/{hubId}/memberDirectory/{userIdOrMemberId}`

Recommended fields:

- `hubId`
- `userId`
- `memberId`
- `displayName`
- `displayNameLower`
- `email`
- `emailLower`
- `status`
- `role`
- `membershipPlanId`
- `membershipPlanName`
- `membershipStatus`
- `pendingUpgradeRequest`
- `paymentAttentionCount`
- `lastActivityAt`
- `joinedAt`
- `updatedAt`
- `schemaVersion`

Source-of-truth rule:

- User/member/membership source documents remain authoritative.
- `memberDirectory` is a query-optimized read model.
- The projection must be rebuildable.
- The projection may duplicate display fields, but should not become the authority for membership or payment state.

Dependency rule:

- `paymentAttentionCount` should ultimately come from the payments ledger.
- If implemented before the payments ledger, this field must be flagged as transitional and reconciled after the ledger cutover.

## Implementation Phases

### Phase 1: Define Directory Projection

- Decide whether projection id is user id, member id, or existing user document id.
- Map current members/users/memberships into the projection.
- Define how attention states are sourced from payment ledger once available.
- Define how invited-but-not-active users appear.
- Define how admins, owners, and members differ in the directory.
- Define how duplicate emails or merged user records are handled.
- Define sort tie-breakers for stable pagination.

Acceptance criteria:

- Directory projection supports current table columns and filters.
- Projection can be updated when memberships or attention states change.
- Projection identity cannot collide across hubs.

### Phase 1.5: Backfill Directory Projection

- Backfill projection rows for existing users/members.
- Normalize `displayNameLower` and `emailLower`.
- Include membership summary state.
- Include transitional attention state if the payments ledger is not live yet.
- Keep backfill idempotent.

Acceptance criteria:

- Existing members appear in the optimized directory.
- Backfill can be rerun without duplicate rows.
- Ambiguous user/member records are logged for review.

### Phase 2: Add Indexes

Likely indexes:

- `memberDirectory`: `hubId`, `displayNameLower`.
- `memberDirectory`: `hubId`, `emailLower`.
- `memberDirectory`: `hubId`, `status`, `displayNameLower`.
- `memberDirectory`: `hubId`, `membershipStatus`, `displayNameLower`.
- `memberDirectory`: `hubId`, `pendingUpgradeRequest`, `displayNameLower`.
- `memberDirectory`: `hubId`, `paymentAttentionCount`, `displayNameLower` if needed.
- `memberDirectory`: `hubId`, `joinedAt`.
- `memberDirectory`: `hubId`, `lastActivityAt`.

Acceptance criteria:

- Indexes support the route's actual filter/sort options.
- Query paths are committed and deployable.
- Query paths stay behind a flag until indexes are deployed.

### Phase 3: Implement Server-Side Pagination

- Move page, filter, and sort state into URL search params.
- Query only the current page.
- Return total counts from counters or aggregate count queries where appropriate.
- Preserve existing table UI behavior.
- Use stable ordering with a deterministic tie-breaker.
- Validate cursor ownership and query compatibility.
- Reset cursor when filters/search/sort change.

Acceptance criteria:

- Default load does not fetch all members.
- Next/previous pagination fetches one bounded page.
- Browser back/forward restores state.
- Invalid cursor state fails gracefully.

### Phase 4: Implement Search

Options:

- Prefix search over normalized fields for simple name/email search.
- External search service later if fuzzy/full-text search becomes required.

Recommended first step:

- Implement normalized prefix search with clear limitations.
- Avoid client-side search over all members.

Acceptance criteria:

- Search query does not require full collection load.
- Empty search returns default paginated list.
- Search is debounced in the client where applicable.
- Search limitations are clear in implementation comments or admin UX if needed.

### Phase 5: Separate Export

- Do not make page load fetch everything for CSV/export readiness.
- Add explicit export route/action.
- For large hubs, consider background export and email/download notification.
- Export must enforce admin authorization.
- Export should stream or batch if row count is large.

Acceptance criteria:

- Members page initial load stays bounded.
- Export can still include all selected rows when explicitly requested.

### Phase 6: Maintain Projection On Writes

Update write paths:

- Member create/update/delete/status changes.
- User profile update.
- Membership create/update/cancel.
- Upgrade request create/approve/reject/cancel.
- Payment attention state changes once payments ledger is live.
- Admin role changes where they affect directory display.

Acceptance criteria:

- Directory rows update after relevant admin/member actions.
- Projection updates are idempotent.
- Projection drift can be repaired.

### Phase 7: Reconciliation

- Add a reconciliation path that rebuilds directory rows from authoritative user/member/membership/payment sources.
- Log missing rows, stale rows, and orphaned rows.
- Provide repair mode.

Acceptance criteria:

- Directory can recover from failed writes or migration bugs.
- Reconciliation can be run without taking the app offline.

## Edge Cases

- Hub has zero members.
- User is invited but has not accepted.
- Owner/admin is also a member.
- Same email exists in more than one hub.
- Same email has duplicate legacy records in one hub.
- Member changes display name or email.
- Membership plan is deleted or renamed.
- Upgrade request is pending while membership is active.
- Payment attention count changes after payment resolution.
- Cursor points to a member deleted between requests.
- Search query has mixed case or leading/trailing whitespace.
- Export is requested for a large hub.

## Verification Checklist

- Test default members page.
- Test pagination.
- Test filters.
- Test search.
- Test empty states.
- Test export.
- Test member status/membership updates update the projection.
- Confirm old broad reads are removed from default route.
- Test duplicate/legacy user records in a non-production fixture.
- Test cursor invalidation after filter changes.
- Run scoped checks and `git diff --check`.
