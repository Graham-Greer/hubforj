# Loading, Error, and Resilience Standards (Production UX)

Goal:
- Consistent, token-driven loading/error UX across a complex app.
- Reduce layout shift, eliminate ad-hoc spinners/skeletons, and standardize recovery.
- Ensure streaming/Suspense is used intentionally for perceived performance.

Authority:
- Secondary to `docs/standards/engineering-source-of-truth.md`
- Compatible with `docs/standards/nextjs-runtime-performance.md`

---

## 1) Core Rules (Hard gates)

### 1.1 Loading vs Empty vs Error (MUST differentiate)
- MUST treat these as separate UI states:
  - Loading: data is not yet available.
  - Empty: data loaded successfully but contains no items/content.
  - Error: request failed or a required contract was not met.
- MUST NOT show infinite skeletons for empty results.
- MUST NOT show “empty” UI while still loading.

### 1.2 Tokenized, reusable loading UI (reuse-first)
- MUST implement reusable loading primitives in `src/components/ui/`:
  - `Spinner` (minimal, tokenized)
  - `Skeleton` (base block)
  - `SkeletonText`
  - `SkeletonCard`
  - `InlineLoader`
- MUST reuse these primitives across the app.
- MUST NOT create bespoke per-page skeleton systems if shared primitives can represent the layout.

### 1.3 No layout shift (CLS control)
- Skeletons MUST preserve final layout geometry:
  - same spacing, same heights/widths, same container structure
- Images MUST reserve space (use `next/image` with width/height or fill + sizes).
- MUST avoid loading UIs that cause major reflow on hydration.

---

## 2) Next.js Loading Boundaries (App Router)

### 2.1 Route segment loading (`loading.jsx`)
- MUST use `loading.jsx` for any route segment where server latency is non-trivial.
- `loading.jsx` MUST render a tokenized skeleton/placeholder that matches the page structure.
- MUST NOT put business logic in `loading.jsx`.

### 2.2 Error boundaries (`error.jsx`)
- MUST provide `error.jsx` for route segments that fetch critical data or perform server rendering.
- `error.jsx` MUST:
  - show a user-friendly message
  - provide a retry action (`reset()` in Next error boundary)
  - avoid leaking sensitive details (no raw stack traces in UI)

### 2.3 Not-found (`not-found.jsx`)
- MUST provide `not-found.jsx` for resource routes where missing entities are expected.
- MUST render a stable, tokenized not-found state with navigation next steps.

---

## 3) Suspense + Streaming Rules (Perceived performance)

- SHOULD use Suspense boundaries at section-level to stream independent content areas.
- MUST avoid micro-Suspense boundaries around tiny components that fragment UX.
- Suspense fallbacks MUST use shared skeleton primitives and tokens.
- SHOULD stream below-the-fold sections separately from above-the-fold sections when data sources differ.

Dynamic import fallbacks:
- If using `next/dynamic` for heavy client widgets:
  - MUST provide a fallback that matches final layout footprint.
  - MUST avoid "jumping UI" when the widget loads.

---

## 4) UI State Patterns (Standard components)

### 4.1 Empty States (required)
- MUST implement reusable empty-state pattern(s) in `src/components/ui/` or `patterns/`:
  - title + supporting text
  - optional action CTA
  - optional illustration/icon (tokenized)
- Empty states MUST be explicit and non-ambiguous (no spinner).

### 4.2 Error States (required)
- MUST implement reusable error-state UI pattern(s):
  - message + optional detail (safe)
  - retry action (if recoverable)
  - support link/path (optional)
- MUST classify errors:
  - recoverable (network, transient)
  - non-recoverable (permission, not-found, invalid contract)

### 4.3 Permission/Access Denied State
- MUST provide a standard “Access denied” state:
  - user-friendly text
  - action to sign in / switch account / go back
- MUST NOT rely on silent failures or blank screens.

---

## 5) Interaction Resilience (Client UX)

- MUST disable destructive/submit actions while a mutation is in progress.
- MUST provide optimistic UI only when correctness is preserved; otherwise show pending states.
- MUST prevent double-submit:
  - disable buttons
  - deduplicate requests (idempotency keys or server-side guards where applicable)
- MUST map server errors into user-visible, actionable messages.

---

## 6) Recovery Rules (Deterministic behavior)

- MUST implement a consistent retry strategy:
  - UI retry for recoverable failures
  - no infinite automatic retry loops in UI
- MUST ensure auth/session-related failures do not cause redirect churn:
  - follow `docs/standards/nextjs-runtime-performance.md`

---

## 7) Placement Rules (Where this lives)

- Shared primitives:
  - `src/components/ui/*`
- Composed loading layouts for a surface:
  - `src/components/patterns/*` (if reused across routes)
- Route segment boundaries:
  - `src/app/**/loading.jsx`, `src/app/**/error.jsx`, `src/app/**/not-found.jsx`

All styling MUST be tokenized and colocated `.module.css` per component.