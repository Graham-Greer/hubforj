# Quality Gates

## Purpose

This document defines when work is allowed to move forward.

The goal is not bureaucracy. The goal is to stop drift early, while the app is still clean enough to control.

## Required pre-implementation check

Before substantial implementation work in a new slice, confirm:

- the route belongs to the approved route map
- the audience and shell owner are explicit
- the data contract is understood
- the layer placement is clear
- the reusable component path is clear
- any placeholder introduced is explicitly tracked

## Required validation before claiming completion

A slice is not complete unless the following are true:

- route authority remains intact
- no reverse-import layering breach was introduced
- no inline styles were introduced
- no hard-coded visual values bypassed the token system without justification
- route files remained thin or were extracted when necessary
- server/client boundaries remained intentional
- form error handling preserves user input where practical
- placeholder debt was not expanded casually

## Automated quality gates

The app should maintain these executable checks:

- lint
- unit tests
- route authority tests
- domain contract tests for active data modules
- targeted rendering or interaction tests where behavior is non-trivial

The absence of these checks is itself technical debt.

## Tooling truthfulness rule

Do not claim lint or test success unless they have actually run.

If the environment blocks execution, state that explicitly and record the verification gap.

## Placeholder gate

A route or module implemented as a placeholder is acceptable only if:

- it preserves approved architecture,
- it is explicitly temporary,
- it is tracked,
- and it is not misrepresented as production-ready.

No new placeholder may be added without logging the replacement slice.

## Extraction gate

Extract when any of the following become true:

- a route file starts holding significant presentation structure
- a component handles multiple independent concerns
- a data module mixes unrelated domains
- a global stylesheet becomes a catch-all
- a shell begins depending on workflow-specific state

## Production-readiness gate

A user-facing route should be considered production-ready only when:

- it is backed by real data or an intentionally designed empty state
- success and failure states are explicit
- its primary task can be completed end to end
- it does not depend on a roadmap promise to make sense

## Review priorities

When reviewing changes, prioritize these questions in order:

1. Did route authority remain correct?
2. Did layering remain correct?
3. Did the change increase hidden complexity?
4. Did the change improve or degrade user focus?
5. Did the design system remain the source of truth?
6. Did the data and security boundaries stay explicit?

## Release posture

This app is being built as a production-grade v1. That means the quality bar should reject:

- temporary architecture dressed up as permanent code
- UI that is technically functional but cognitively noisy
- implementation shortcuts that defer obvious structural fixes
