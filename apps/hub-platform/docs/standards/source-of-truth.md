# Source Of Truth

## Purpose

This document defines how engineering authority works inside `apps/hub-platform`.

The core rule is simple:

Implementation may move fast only when authority is explicit.

If authority is unclear, the codebase will drift. The purpose of this document is to remove ambiguity before that happens.

## Authority precedence

When two sources disagree, use this order:

1. `apps/hub-platform/docs/standards/*`
2. `apps/hub-platform/docs/component-registry.md`
3. `apps/hub-platform/docs/component-build-order.md`
4. `apps/hub-platform/docs/roadmap/*`
5. Existing code in `apps/hub-platform`
6. Any legacy documentation or legacy code outside `apps/hub-platform`

## Non-negotiable principle

The legacy project is not an implementation authority for the greenfield rebuild.

The legacy project may still provide:

- domain references
- historical context
- examples of what to avoid

It does not provide:

- standards authority
- route authority
- reusable component authority
- permission to copy patterns without review

## Decision model

Every meaningful implementation decision must be answerable from one of these sources:

- product direction in roadmap docs
- architecture and layering standards
- component registry and build order
- explicit domain contracts

If a change cannot be justified through those sources, the change is premature.

## What must be documented before implementation expands

The following must be documented before the related area grows substantially:

- route families and gating rules
- shell ownership and navigation model
- data ownership and persistence boundaries
- domain status enums and transition rules
- reusable component purpose and layer placement
- theme/template/token contract expectations

## What is forbidden

- Implementing new architectural patterns because they are expedient.
- Borrowing structures from the old repo without review.
- Treating a route, component, or data shape as canonical just because it exists already.
- Silent fallback behavior that masks missing authority or missing configuration.

## Required engineering behavior

Before implementing a new slice, check:

- which route family owns the work
- which layer should contain the logic
- whether the component already belongs in the registry
- whether the change expands the data contract
- whether the route should exist at all

If any of those answers is unclear, stop and document the ambiguity first.
