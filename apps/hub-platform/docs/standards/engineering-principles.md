# Engineering Principles

## Purpose

This document captures the engineering posture for `apps/hub-platform`.

These are not generic ideals. They are implementation constraints designed to keep the codebase coherent while it grows into a real multi-hub product.

## Core principles

### 1. Build for extension, not rewrite

The app is being built as a durable product foundation.

Do not accept foundational shortcuts that are likely to require structural rework later in:

- route architecture
- shell ownership
- data isolation
- design system shape
- domain model boundaries

### 2. Keep the user experience simple, not the system naive

Great UX often depends on thoughtful internal structure.

Requirements:

- user flows should feel obvious
- screens should feel focused
- navigation should reduce cognitive load
- architecture should absorb complexity so the interface does not have to

### 3. Reuse only when the abstraction is real

Reuse-first does not mean abstract early without evidence.

Good reuse:

- repeated structural pattern
- repeated visual contract
- repeated domain rule
- repeated route-family behavior

Bad reuse:

- one-off helper extracted too early
- large generic component that hides multiple responsibilities
- prop-heavy “flexible” component with weak semantics

### 4. Make boundaries explicit

Every non-trivial module should make its role obvious.

The app should make it easy to answer:

- is this visual or non-visual logic
- is this route-specific or reusable
- is this data persistence or domain policy
- is this shell-level or workflow-level

If those boundaries blur, the codebase will decay quickly.

### 5. Fail explicitly

Do not hide meaningful failure behind fake success.

Examples:

- missing environment config should not silently fall back to mock production paths
- missing data authority should not render half-valid UI
- invalid route params should not be pushed deeper into the tree

### 6. Prefer strong defaults over broad option surfaces

Reusable components and patterns should be intentionally designed.

Prefer:

- strong defaults
- clear variants
- constrained extension points

Avoid:

- unlimited prop combinations
- uncontrolled style escape hatches
- “just in case” flexibility

### 7. Keep architecture truth close to implementation

The new app should have its own docs, its own standards, and its own quality gates.

Do not depend on the old project to explain what the new app is allowed to become.

## What this means day to day

- route files stay thin
- design tokens stay authoritative
- shells stay stable and audience-specific
- data modules do not become UI controllers
- UI modules do not become repository layers
- placeholders stay temporary and tracked
- code claims only what has actually been verified
