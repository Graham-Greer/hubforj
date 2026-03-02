# M2 Membership Plans + Lifecycle Manual QA (Minimum)

1. Create a membership plan with title, duration, price, and optional WYSIWYG description.
2. Edit an existing plan and verify fields persist.
3. Delete a plan via ConfirmModal and verify it is removed from the plans table.
4. Create a membership by selecting a plan and entering a user ID.
5. Verify paid plan memberships start as `pending` + `unpaid` when Stripe is disabled.
6. Mark membership payment `paid`; verify pending memberships can become `active`.
7. Deactivate an active membership and then reactivate it.
8. Renew a membership and verify renewalDate moves forward.
9. Cancel a membership via ConfirmModal and verify status becomes `cancelled`.
10. Verify expired status is system-derived from renewalDate + grace (not set manually).
11. Verify loading/error/empty states render in membership-plans segment.
