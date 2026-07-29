# Firebase, Data, Auth, And Security

## Purpose

This app is a multi-hub product built on a shared Firebase backend. That means data correctness, hub isolation, and permission boundaries are foundational concerns.

## Strategic backend decision

The app uses:

- one shared Firebase project
- strict hub-scoped multi-tenancy

This is the correct product tradeoff because the product is expected to evolve across multiple hubs with one shared feature rollout path.

## Hub isolation rules

All hub-owned records must be explicitly scoped.

Preferred rule:

- every hub-owned record stores `hubId`
- every hub-scoped query must constrain by `hubId`
- every authorization rule must verify hub ownership and role

Do not rely on naming convention or route shape for isolation.

## Repository boundary

Firestore access belongs in repository/data modules under `src/lib/data` or a future domain/repository split.

UI and route files must not perform raw Firestore queries directly.

Repositories should be responsible for:

- persistence
- query shaping
- normalization between Firestore and app contracts

Repositories should not become the final home for domain transitions. Those belong in domain contract modules as the app matures.

## Authentication boundary

Auth and session authority must remain server-driven.

Do not build protected-route assumptions that depend on client-side checks to establish authority.

Use the client SDK only where it is genuinely required for browser-side interaction. Do not let the client SDK become the authority for protected route rendering.

## Environment variable rules

Environment configuration must be explicit.

Public variables:

- only values safe for the browser
- read through the config boundary

Server variables:

- admin credentials
- session secrets
- reserved host configuration
- emulator configuration

Rules:

- no ad hoc `process.env` reads outside config modules
- no silent missing-env behavior in production paths
- admin private keys must be normalized centrally

## Mock and fixture policy

Mocks are allowed for:

- tests
- isolated design development
- controlled local bootstrapping

Mocks are not allowed as silent fallback in production-facing repository functions.

If a repository cannot talk to its backend, it should fail explicitly.

## Firestore write rules

All writes must:

- validate required fields
- normalize input consistently
- stamp `createdAt` and `updatedAt`
- stamp actor identity where relevant
- enforce uniqueness constraints where required
- avoid duplicating transition rules in multiple places

## Domain contracts to formalize next

The following should move into explicit domain modules as implementation expands:

- hub status and support state enums
- invite status lifecycle
- event status and pricing rules
- course lifecycle rules
- membership and registration status machines
- payment and attendance state transitions

## Security posture

Requirements:

- hub access must never be inferred from route path alone
- role checks must be explicit
- platform-only actions must remain platform-only
- admin-only actions must remain admin-only
- member self-service must only expose records the member is authorized to view

## Reserved host and domain rules

Public custom domains may resolve to hub public/member surfaces.

Platform and hub-admin surfaces must remain on approved platform domain authority unless an explicit future design changes that rule.

## Write-flow design rules

Server actions are acceptable for current write flows.

They must:

- validate and normalize payloads on the server
- preserve input state on validation failure where practical
- redirect deterministically after success
- avoid treating successful redirect throws as generic errors

## Data quality expectations

A field existing in Firestore does not make it canonical.

Canonical status comes from:

- documented domain contract
- repository normalization
- tested transition rules

If Firestore contains legacy or malformed data later, repository normalization must handle it deliberately rather than spreading defensive logic through routes and UI.
