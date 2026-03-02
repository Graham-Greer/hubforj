# Auth and Session Model (Deterministic, Canonical)

## Goal
Prevent redirect churn and enforce server-side access control reliably.

## Locked rules (HARD)
- Protected-route enforcement MUST be server-side (middleware/server checks).
- Client auth success MUST wait for server session readiness before navigating to protected routes.
- Admin portals MUST be platform-domain only.
- One user belongs to one hub in MVP.
- Support mode MUST be explicit and visible.

## Required flow (pattern, HARD)
1) Client performs sign-in/register (Firebase client SDK or equivalent).
2) Client calls server endpoint to establish session cookie.
3) Client waits for positive server confirmation that session is set.
4) Client navigates to canonical destination:
   - hub admin → `/{hubSlug}/admin`
   - member → `/{hubSlug}/account`
   - superadmin → `/platform`

## Forbidden
- MUST NOT navigate to protected routes before cookie readiness.
- MUST NOT rely on client-only checks to guard protected resources.

## Support mode (HARD)
- Superadmin selects hub in `/platform` and enters support mode.
- Session contains explicit support context (or server-side context).
- Hub admin layout MUST render a persistent banner when in support mode.
- Exiting support mode MUST clear that context deterministically and return to `/platform`.
