# Next.js + Firebase Integration (Production-Grade)

Goal:
- Integrate Firebase with Next.js App Router without violating:
  - server/client boundaries
  - session determinism
  - performance/caching standards

Authority:
- `docs/standards/nextjs-runtime-performance.md`
- `docs/product/auth-and-session.md`
- `docs/firebase/auth-and-session.md`

---

## 1) Server-first data fetching (HARD)
- MUST default to Server Components for data fetching and rendering.
- MUST fetch Firestore data in server repositories called by Server Components.
- MUST pass data into Client Components as props.
- Client fetching is exception-only and MUST go through `/api/**` route handlers.

---

## 2) Middleware constraints (HARD)
Next.js middleware runs in the Edge runtime.
- MUST NOT use Firebase Admin SDK in middleware.
- Middleware MAY perform coarse gating only (e.g., cookie presence) but MUST NOT be the source of truth for authorization.

Authorization source of truth:
- MUST be enforced in:
  - server layouts/pages (Server Components), and/or
  - route handlers/server actions (Node runtime), and/or
  - Firestore/Storage rules (client access paths)

---

## 3) Session cookies + deterministic redirects (HARD)
- Protected-route navigation MUST wait for server session readiness.
- MUST avoid redirect bounce loops.

Pattern:
1) Client signs in via Firebase client SDK.
2) Client calls server endpoint to create session cookie.
3) Server returns success only after cookie is set.
4) Client navigates to canonical destination.

Destinations:
- superadmin → `/platform`
- hub admin → `/{hubSlug}/admin`
- member → `/{hubSlug}/account`

---

## 4) Public content caching rules (HARD)
- Published pages/events are public/shared content:
  - SHOULD be cached with `revalidate`.
- Draft/preview content:
  - MUST be `no-store`.
- Per-user content (member portal/admin):
  - MUST be `no-store` unless proven safe.

---

## 5) Media rendering (HARD)
- Images MUST use `ui/image/AppImage.jsx` (next/image wrapper).
- Public site MUST NOT require public listing access to `/media` metadata.
  - Public rendering SHOULD fetch only referenced media by ID server-side.
  - Hub media blob access is public-read by URL (per `docs/product/media-library.md`).
