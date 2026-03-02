# M2 Events CRUD Manual QA (Minimum)

1. Create draft event from `/{hubSlug}/admin/events/create` with all required fields and save.
2. Publish event from create flow (`Publish now`) and verify it appears as `published` in events list.
3. Edit event fields and save; verify updates persist.
4. Attempt publish with selected media missing alt text and verify publish is blocked with clear error.
5. Attempt duplicate event slug in same hub and verify server rejects it.
6. Transition `draft -> published -> cancelled` from event detail page and verify each status change.
7. Verify events list empty state renders CTA when no events exist.
8. Verify loading/error states render for events routes.
