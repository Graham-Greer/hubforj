# Ops, Quality, and Security Standards (Canonical)

Goal:
- Production readiness: debuggable, secure, operable, and evolvable.
- Prevent incidents caused by missing validation, weak tenant isolation, or missing guardrails.

MUST read `docs/firebase/firestore-rules` and `docs/firebase/emulators-and-testing`

---

## 1) Input validation (HARD)
- MUST validate all external inputs on the server:
  - route handlers (`src/app/api/**/route.js`)
  - server actions (if used)
- MUST reject invalid input with a stable error shape.
- MUST normalize outputs after reads.

---

## 2) Authorization and tenant isolation (HARD)
- MUST enforce authorization server-side for protected resources.
- MUST scope every read/write by `hubId` (tenant isolation by construction).
- MUST NOT rely solely on client checks to enforce access.

---

## 3) Rate limiting (HARD gate for public mutation endpoints)
- MUST rate limit public mutation endpoints (signup, join, invites, submissions).
- SHOULD rate limit expensive reads if abuse is plausible.
- MUST implement anti-automation controls where relevant (captcha, email verification, throttling), depending on product needs.
- MUST log rate-limit triggers in a privacy-safe way.

---

## 4) Safe error reporting (HARD)
- MUST NOT leak secrets/stack traces to user UI.
- MUST map SDK/DB errors to app-level error codes/messages.
  - code
  - message (safe)
  - SHOULD use correlation IDs for debugging.

---

## 5) Logging/observability (HARD for critical paths)
- MUST use structured logs in server code for critical operations:
  - hub provisioning
  - event publish/cancel
  - registration promotion/cancel
  - membership renew/activate/deactivate
- MUST avoid logging sensitive payload fields (PII, secrets, tokens).
- SHOULD propagate a correlation id through request -> repository -> response.
- UI error states SHOULD display a short “reference id” if it helps support/debugging.
- Client error reporting SHOULD be centralized (single module) rather than scattered `console.error`.
- Any adopted monitoring vendor must be integrated through a single adapter module in `src/lib/**`.

---

## 6) Testing baseline
- MUST unit test repositories/services normalization logic.
- MUST test validation schemas for critical mutations.
- SHOULD add smoke tests for auth determinism and tenant isolation.
- Tests live colocated or in a dedicated test folder, but MUST follow module ownership.
- core publish/save pipeline
- MUST avoid UI tests that depend on brittle selectors; prefer role-based queries and stable data attributes.

---

## 7) Schema Evolution + Migrations (Complex-project reality)

- MUST define a schema evolution strategy per persistent domain:
  - backward compatible changes by default
  - versioned contracts when breaking changes occur
- For breaking changes:
  - MUST support a migration path:
    - lazy migration on read, OR
    - scheduled batch migration scripts, OR
    - dual-read/dual-write during transition
- MUST document migrations and deprecation timelines in repo docs or a migrations log.
- MUST ensure old content remains renderable during migration windows (unless explicitly deprecated).

Identity rule reinforcement:
- MUST NOT persist canonical document `id` inside payloads if datastore provides it.

---

## 8) Security Headers + Script Safety (Baseline)

- SHOULD adopt a Content Security Policy (CSP) appropriate to product constraints.
- MUST load third-party scripts via `next/script` with deliberate strategy.
- MUST avoid inline scripts where possible; if required, document and constrain them.

### 8.1 CSP contract (HARD for production)
- `script-src` MUST NOT use `'unsafe-inline'`.
- `style-src` MUST NOT use `'unsafe-inline'`.
- Per-request nonce MAY be used for framework-managed inline tags (Next.js runtime/font internals).
- Theme overrides MUST be served as external CSS from Storage, not inline `<style>`.
- CSP allowlists MUST explicitly include required hosts only:
  - `self`
  - Storage host used by generated theme CSS
  - image/connect/font hosts required by current runtime integrations

Change process for new external domains:
- Add domain to CSP builder allowlist in code.
- Update this standard with rationale.
- Verify in lint/tests/manual smoke before deploy.

---

## 9) Performance Budgets + Guardrails (Operational)

- MUST avoid shipping heavy dependencies to client bundles.
- SHOULD periodically run bundle analysis and track regressions.
- MUST ensure caching intent is declared for new server fetches (see data standards).

---

## 10) Deployment + Environment Hygiene

- MUST keep secrets server-only and never expose them to the client bundle.
- MUST separate client/server Firebase modules if Firebase is used:
  - client SDK only in client-safe modules
  - admin SDK server-only
- MUST ensure environment variables are documented:
  - required vars list
  - which are public (`NEXT_PUBLIC_*`) vs server-only

---

## 11) Incident-readiness checklist (When something breaks)

When production issues occur:
- MUST be able to answer:
  - what happened (log event)
  - who/what tenant was impacted
  - what request path and correlation id
  - whether it is recoverable
- MUST have a safe rollback strategy:
  - feature flags or staged rollout
  - re-deploy prior build
