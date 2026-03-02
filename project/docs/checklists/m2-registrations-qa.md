# M2 Registrations Manual QA (Minimum)

1. Open `/{hubSlug}/admin/events/{eventId}/registrations` and verify table renders registered/waitlisted/cancelled states.
2. Use FilterBar search and status filter; verify table updates without full-page form controls.
3. Promote a waitlisted registration when capacity is available; verify status changes to registered.
4. Attempt promote when capacity is full; verify action is rejected with a safe error.
5. Update payment status on paid event registrations (`unpaid` <-> `paid`); verify updates persist.
6. Confirm free events do not allow payment status away from `not-required`.
7. Update attendance (`attended` / `no-show` / `unknown`) for registered registrations.
8. Verify attendance updates are rejected for waitlisted/cancelled registrations.
9. Cancel a registration using ConfirmModal; verify status becomes cancelled and attendance resets to unknown.
10. Verify loading/error/empty states render for registrations segment.
