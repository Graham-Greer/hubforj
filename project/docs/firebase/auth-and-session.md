# Firebase Auth + Session (Deterministic, Production-Grade)

Goal:
- Implement a deterministic auth/session model that avoids bounce loops and respects Next.js constraints.

Authority:
- `docs/product/auth-and-session.md`
- `docs/standards/nextjs-runtime-performance.md`
- `docs/standards/ops-quality-and-security.md`

---

## 1) Source of truth for role/hub binding (HARD)
MVP recommendation:
- Store `hubId` and `role` in `/users/{uid}` Firestore doc.
- Optionally mirror `role` in Firebase custom claims for faster checks.
- If custom claims are used:
  - MUST treat Firestore as canonical and claims as a cache.
  - MUST provide a refresh mechanism after role changes.

---

## 2) Session establishment (HARD)
- Client signs in with Firebase client SDK.
- Client obtains ID token.
- Client calls server endpoint (route handler) to mint a session cookie.
- Server sets HttpOnly session cookie and returns success.
- Client MUST wait for success before navigation to protected routes.

Forbidden:
- MUST NOT navigate to protected routes before session cookie readiness.
- MUST NOT trust client-only checks for protected routes.

---

## 3) Server verification (HARD)
Because Next middleware is Edge runtime:
- MUST NOT verify session cookies with Firebase Admin in middleware.
- MUST verify sessions in Node runtime server code:
  - Server Components (layout/page) may call server helpers that verify cookie
  - Route handlers MUST verify cookie before returning protected data

Middleware MAY:
- check for existence of cookie and redirect to sign-in if absent
- but MUST NOT be treated as the authorization source of truth

---

## 4) Canonical redirect destinations (HARD)
After session establishment:
- superadmin → `/platform`
- hub admin → `/{hubSlug}/admin`
- member → `/{hubSlug}/account`

---

## 5) Support mode (HARD)
- Support mode MUST be explicit in server session state (cookie or server-stored session record).
- Hub admin layout MUST show a persistent support banner when enabled.
- Support mode must be exit-able deterministically, clearing the context.

---

## 6) Rate limiting (HARD)
The following endpoints MUST be rate limited:
- sign-in session creation
- signup
- invite acceptance
- uploads
