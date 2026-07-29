# Admin Onboarding Remaining Checklist

This document captures the remaining implementation work for the admin onboarding system in priority order so it can be worked through methodically.

## Priority Order

1. `Account settings` journey
- implement package-aware onboarding for Free, Starter, and Growth
- adapt copy and spotlight targets to the hub’s current tier

2. `Payments / Stripe setup` journey
- implement package-aware onboarding
- cover setup expectations cleanly for each package
- wire correct targets on `?view=setup`

3. `Membership plans` journey
- onboard the plans view and plan-management flow
- ensure route/query awareness works the same way as the other payments views

4. `Members list` journey
- orient admins to the members list, search/filter controls, and opening a member record

5. `Member detail` journey
- orient admins to the key sections and actions on a member record
- keep the journey short and operational

6. `Payments records` journey
- add onboarding for `?view=payments`
- explain what the admin is looking at without overloading them

7. `Admins` journey
- onboard inviting and managing admin access
- respect owner/admin role awareness

8. Real video assets
- record the planned light and dark walkthrough clips
- replace current fallback placeholders with real assets

9. Analytics
- track journey start
- track journey complete
- track journey dismiss
- track journey restart
- track step viewed
- track checklist progress and completion

10. Reduced-motion support
- disable or soften motion-heavy onboarding behavior when appropriate
- keep the experience accessible without losing clarity

11. Accessibility hardening
- keyboard and focus review
- verify modal and spotlight reading order
- ensure the blocking overlay remains usable and understandable

12. Final polish pass
- journey pacing
- copy tightening
- target accuracy
- responsive behavior
- visual consistency across all routes

## Recommended Working Order

1. `Account settings`
2. `Payments / Stripe setup`
3. `Membership plans`
4. `Members list`
5. `Member detail`
6. `Payments records`
7. `Admins`
8. Real video assets
9. Analytics
10. Reduced-motion support
11. Accessibility hardening
12. Final polish pass

## Notes

- The current foundation already covers the onboarding registry, persistence, help launcher, checklist, spotlight system, and the first wave of route journeys.
- The biggest remaining product work is package-aware onboarding for account and payments, followed by deeper operational journeys.
- Video assets are enhancement work and should not block the remaining route-journey implementation.
