# Next.js Runtime And Route Architecture

## Purpose

This document defines how the App Router is to be used in `apps/hub-platform`.

The product has four route families and several audiences. The route architecture must remain explicit and calm as those surfaces grow.

## Server-first default

Route surfaces are server-first by default.

Use server components for:

- param resolution
- data loading
- redirects
- `notFound()` handling
- shell composition
- read-heavy route rendering

Use client components only for:

- local interactivity
- form state
- UI-only state transitions
- controls that genuinely require browser APIs

Do not convert route trees into client components just to move faster.

## Thin route rule

Route files should remain thin.

A route file should typically do only these things:

- resolve params
- call data/domain functions
- choose the right shell/patterns
- render a small composition tree

If a route file starts holding large rendering trees, repeated section markup, or workflow logic, extract it.

## Route-family responsibilities

### Platform routes

`/(platform)/platform/*`

These routes exist for internal operator workflows:

- hub provisioning
- hub overview/configuration
- support-mode entry
- admin invitation bootstrap

They are not a second hub-admin portal.

### Hub-admin routes

`/(admin)/[hubSlug]/admin/*`

These routes exist for hub operational management:

- admins
- members
- events
- courses
- testimonials
- payments
- settings

They must optimize for low cognitive load and task-focused workflows.

### Shared hub routes

`/(hub)/[hubSlug]/*`

These routes exist for the member-facing hub site as one continuous branded surface.

Within this route family:
- public pages remain open
- account routes remain protected below the shared hub layout
- the shared hub shell owns the persistent header/footer experience

## Shell ownership

Only shells own permanent navigation chrome.

Route files must not invent their own persistent navigation systems.

Expected shell model:

- platform shell owns platform nav
- shared hub shell owns public + member-facing hub nav
- hub-admin shell owns hub-admin nav
- member shell owns member account navigation
- public shell owns public site navigation

## Redirect rules

Redirects should be deterministic and server-driven.

Avoid:

- client-side redirect churn
- route-level conditional rendering that hides missing authority instead of redirecting or `notFound()`-ing
- redirect loops caused by unclear role or hub resolution

## Param and identity resolution

Resolve route params at the server boundary.

Examples:

- `hubSlug` should resolve to a real hub record before rendering admin/member/public surfaces
- `hubId` should resolve to a real hub record before rendering platform detail/support routes

Do not allow downstream components to guess whether params are valid.

## Data loading rules

Data should be loaded as close to the route boundary as practical, but data rules should remain in `src/lib`.

Good pattern:

- route resolves params
- route calls `requireHubBySlug` or equivalent
- route calls domain/repository functions
- route passes normalized data into patterns or sections

Bad pattern:

- route performs ad hoc Firestore queries inline
- route normalizes records manually in multiple places
- component fetches authoritative route data by itself

## Placeholder rule

A placeholder route is acceptable only during controlled implementation, not as a product state.

A placeholder route must:

- preserve the approved route map
- be explicit about its temporary status
- be tracked in roadmap/audit docs
- be replaced before public release if user-facing

Do not build a product out of placeholders.

## Performance expectations

- Avoid route-wide client hydration when a narrow interactive leaf will do.
- Do not fetch large unrelated datasets in shell layouts.
- Do not put route-irrelevant state into shell components.
- Keep shell props light and stable.
- Avoid duplicate route-family fetches for the same hub context.

## Error and loading boundaries

The app should use meaningful loading and error behavior.

Requirements:

- route loading states should exist where the user may wait
- errors should be explicit and bounded
- invalid entities should use `notFound()` rather than rendering broken UI
- server action failures should preserve form input when possible

## Route sprawl restrictions

Do not create routes because they feel convenient.

Every route must answer:

- which audience owns this route
- which shell owns this route
- why this is a route instead of a panel or substate
- what canonical action or information this route owns

If that answer is weak, the route should not exist.
