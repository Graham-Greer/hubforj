# Next.js Runtime + Performance Standards (App Router)

Goal:
- Production-ready performance, UX consistency, and predictable architecture.
- Prevent ad-hoc server/client splits, random caching, and bundle bloat.

Scope:
- Next.js App Router under `src/app/**`.
- React Server Components (RSC) by default.
- Works with token-based styling and layered component architecture.

This doc is secondary to:
- `docs/standards/engineering-source-of-truth.md`

---

## 1) Server vs Client Component Rules (Hard gate)

Default posture:
- MUST default to Server Components.
- MUST use Client Components only when necessary for interactivity.

Rules:
- MUST keep `src/app/**/page.jsx`, `layout.jsx`, `template.jsx` as Server Components by default.
- MUST NOT add `"use client"` to route/page/layout/template files unless explicitly justified and logged in task/PR.
- MUST isolate `"use client"` to the smallest leaf component(s) possible ("interactive islands").

Client component triggers (allowed reasons):
- uses `useState`, `useEffect`, event handlers, refs for user interaction
- uses browser-only APIs (`window`, `document`, localStorage, media queries via JS)
- needs client-side animation orchestration that cannot be done with CSS only

Forbidden:
- MUST NOT import server-only modules into Client Components.
- MUST NOT reference secrets in Client Components (only `NEXT_PUBLIC_` env vars allowed).

Server-only modules include:
- Firebase Admin / server SDKs
- server repositories/services that access DB directly
- filesystem, process secrets, private env vars

- MUST keep route handlers under `src/app/api/**/route.js` and delegate DB work to `src/lib/**`.

---

## 2) Data Fetching Standards

### 2.1 Approved patterns (only these)

Pattern A — Server Fetch + Render (default)
- MUST fetch data in:
  - Server Components, OR
  - server repositories/services called by Server Components.
- MUST pass data into Client Components via props.
- SHOULD stream UI using Suspense at section boundaries when beneficial.

Pattern B — Client Fetch via Route Handler (exception-only)
- Allowed only when data depends on client-only state or needs high-frequency refresh.
- MUST call a route handler (`src/app/api/**/route.js`) or a server action (if used), not the DB directly.
- MUST centralize client fetching into a hook (`useXyzQuery`) rather than scattered `fetch` calls in UI components.

Pattern C — Mutations
- MUST execute mutations via:
  - Server Actions, OR
  - Route Handlers (`src/app/api/**`).
- MUST validate payloads before write.
- MUST return normalized, stable response object shapes.
- MUST map SDK errors to app-friendly errors (no raw SDK errors in UI).

### 2.2 Forbidden patterns
- MUST NOT call database SDKs directly from presentational components.
- MUST NOT scatter DB imports across the app; centralize in `src/lib/**`.
- MUST NOT couple UI components to auth/session plumbing beyond consuming props/state.

---

## 3) Caching + Revalidation (Performance-first defaults)

Every server-side data fetch MUST declare caching intent.

Decision table:
- Public/shared content (same for all users):
  - MUST use cached fetches with `revalidate` or equivalent.
- Semi-static content (changes occasionally):
  - MUST use `revalidate: N` appropriate to domain.
- Authenticated per-user content:
  - MUST use `cache: "no-store"` unless explicitly proven safe to cache.
- CMS preview/drafts:
  - MUST use `cache: "no-store"`.

Rules:
- MUST avoid blanket `no-store` across the app.
- MUST document cache strategy for any new data surface.

If using tag-based invalidation:
- SHOULD use tags for CMS-driven content so publish events can invalidate cached pages/data.
- MUST keep tags consistent and centralized.

---

## 4) Loading / Error / Not-found UX (Mandatory)

For each major route segment with server data:
- MUST provide a `loading.jsx` (or shared loading boundary) for non-trivial latency.
- MUST provide an `error.jsx` with a retry action.
- MUST provide a `not-found.jsx` where the domain expects missing resources.

Rules:
- MUST reuse shared skeleton/loading primitives where possible (reuse-first).
- SHOULD place Suspense boundaries at section-level (not around every small component).
- MUST provide consistent empty states for lists and dashboards.

---

## 5) Suspense + Streaming Rules

- SHOULD use Suspense to stream sections independently when:
  - data sources are independent, OR
  - above-the-fold UI can render while below-the-fold loads.
- MUST avoid deeply nested micro-Suspense boundaries that fragment UX.
- MUST ensure Suspense fallbacks match design tokens and shared loading primitives.

Dynamic imports:
- SHOULD use `next/dynamic` for heavy client-only widgets that are:
  - below-the-fold, OR
  - rarely used, OR
  - admin-only.
- MUST keep server-rendered structure stable even when client widgets are dynamically loaded.

---

## 6) Images, Fonts, Scripts (Performance baseline)

Images:
- MUST use `next/image` for non-trivial images.
- MUST specify `width` + `height` OR `fill`, and MUST provide meaningful `sizes` for responsive layouts.
- MUST avoid layout shift by ensuring stable image boxes.

Fonts:
- MUST use `next/font` for self-hosted or provider fonts when feasible.
- MUST avoid ad-hoc `<link>` font loading unless explicitly justified.

Scripts:
- MUST use `next/script` for third-party scripts.
- MUST choose a deliberate loading strategy (`afterInteractive`, etc.).
- MUST avoid loading third-party scripts on pages that do not need them.

---

## 7) Bundle Size + Client Performance (Hard gate mindset)

Rules:
- MUST avoid importing heavy libraries into Client Components unless justified and logged.
- SHOULD prefer server-side parsing/formatting; ship results, not toolchains.
- MUST minimize global providers and avoid re-render cascades.
- Context values MUST be memoized and minimal.

---

## 8) Auth / Session Determinism (Next.js implementation rules)

- MUST enforce protected routes using middleware/server checks when server cookies are authoritative.
- After sign-in/register:
  - MUST confirm server session cookie readiness before navigating to protected routes.
  - MUST avoid intermediate navigation states that trigger redirect churn.
- MUST keep auth logic out of presentational UI components.

---

## 9) Environment and Secret Boundaries

- MUST NOT reference non-public env vars in Client Components.
- Only `NEXT_PUBLIC_*` is allowed client-side.
- Server-only env access must live in server-only modules under `src/lib/**` or route handlers/actions.

---

## 10) Recommended code boundaries (directional)

Suggested folders (directional; enforce layering via imports):
- `src/lib/data/**` repositories/services (server-first)
- `src/lib/validation/**` schemas
- `src/lib/auth/**` session helpers
- `src/lib/firebase/client.js` and `src/lib/firebase/server.js` split (if using Firebase)

Client code may import:
- `src/lib/firebase/client.js`
- request wrappers that call `/api/**`

Client code MUST NOT import:
- `src/lib/firebase/server.js`
- any server repository that touches DB directly

All placement/naming rules are defined in:
- `docs/standards/repo-structure-and-conventions.md`
