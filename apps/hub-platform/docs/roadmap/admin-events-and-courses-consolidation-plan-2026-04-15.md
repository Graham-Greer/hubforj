# Admin Events And Courses Consolidation Plan

## Purpose

- Create a single source of truth for consolidating the admin experience for events and courses in `hub-platform`
- Raise coding standards by reducing bespoke implementations where a shared operational pattern is better
- Improve admin usability through clearer search, filtering, table layout, and inline operational actions
- Keep the UI clean, high-signal, and performant across desktop and mobile

## Why This Work Is Needed

The current admin experience for events and courses is inconsistent.

The inconsistency is not a simple case of `events are good` and `courses are behind`.
The current state is mixed:

- top-level admin list pages for both events and courses are still relatively static and underpowered
- course registrations and attendance are structurally ahead because they already use a reusable records table
- event registrations and attendance are operationally ahead because they have faster inline actions
- events and courses now use two competing admin patterns instead of one coherent system

This creates avoidable product friction:

- admins have to relearn different interaction patterns between events and courses
- list pages do not yet support the level of search/filtering needed for real operations
- inline workflows are uneven
- the implementation surface is harder to maintain than it should be

## Product Goals

The consolidated admin experience should be:

- consistent across events and courses
- fast to scan
- fast to operate
- explicit about state
- resilient on mobile
- built from reusable patterns rather than duplicated page-specific logic

The admin experience should feel like one operational system, not two similar but separate feature families.

## Current State Summary

### 1. Admin list pages

Current state:

- events list page and courses list page are both card lists
- neither page currently has a proper admin search/filter workflow
- the layout and metadata density differ between the two
- the container patterns differ (`WorkspaceSection` vs `PageHeader`-led layout)

Conclusion:

- neither page is the target
- both should converge into a shared offering-admin-list pattern

### 2. Registrations

Current state:

- event registrations use a bespoke workspace and bespoke table layout
- course registrations use the shared `OperationalRecordsTable`
- event registrations support quicker inline status and payment actions
- course registrations do not yet offer equal inline payment control for paid courses

Conclusion:

- courses are ahead in structure
- events are ahead in interaction speed
- the final solution should combine the best parts of both

### 3. Attendance

Current state:

- event attendance uses a bespoke workspace and compact action menus
- course attendance uses the shared `OperationalRecordsTable`
- course attendance still relies on form-style actions with explicit save buttons

Conclusion:

- the shared table direction is correct
- the interaction model should be brought up to event-level speed and clarity

### 4. Detail pages

Current state:

- event and course detail workspaces are already broadly aligned
- both use the same page/header/summary/edit structure

Conclusion:

- detail pages are not the highest-priority parity problem
- they should stay largely as they are unless list/workflow consolidation reveals a clear follow-up need

## Architecture Direction

The correct long-term direction is:

1. one shared admin list pattern for offerings
2. one shared operational table pattern for registrations and attendance
3. one shared inline-action interaction model across both events and courses

This means:

- do not make courses imitate the weaker parts of events
- do not leave events on older bespoke table patterns
- converge both onto the stronger combined model

## Design Principles

### 1. Search and filters should be first-class

Admins should be able to find the right record without scanning long lists manually.

Search/filter UX should:

- work the same way for events and courses
- use stable visible controls
- avoid hidden complexity
- remain usable on smaller screens

### 2. Tables should be operational, not decorative

The admin table should optimize for action density without becoming visually noisy.

That means:

- strong primary columns
- status expressed clearly
- actions available inline
- mobile behavior that remains readable

### 3. Actions should be fast

If an admin is reviewing registrations or attendance, they should not have to:

- open a separate screen
- use a form when a compact state action would do
- mentally switch between two different operational models for events and courses

### 4. Shared primitives should own the common behavior

If search, filters, table layout, and inline actions are conceptually the same:

- they should be shared
- page-specific wrappers should only provide record-specific columns and copy

## Target End State

### Offering admin list pages

Both `Events` and `Courses` should use the same overall list workspace pattern:

- page header
- search
- status filters
- pricing filter
- optional visibility filter
- optional format/type filter where useful
- rows/cards that present:
  - image
  - title
  - schedule
  - concise metadata
  - lifecycle badge
  - quick actions

### Registration admin pages

Both event and course registrations should use:

- shared table structure
- shared filter ergonomics
- shared column composition pattern
- inline status updates
- inline payment updates for paid offerings

### Attendance admin pages

Both event and course attendance should use:

- shared table structure
- shared filter ergonomics
- inline attendance/progress updates
- registration status visible alongside attendance/progress

## Implementation Phases

## Phase 1. Shared Admin Offering List Workspace

### Goal

Create a shared admin workspace pattern for top-level event and course management pages.

### Scope

- design and implement a reusable offering-admin-list workspace
- define a common row layout contract
- support page-level search and filter state
- migrate events list page
- migrate courses list page

### Recommended shared concerns

- search term
- lifecycle/status filter
- pricing filter
- optional visibility filter
- result count
- empty-state handling
- shared responsive row/card pattern

### Page-specific concerns

Events:

- location
- event pricing
- event summary

Courses:

- course type
- level
- delivery format
- session count where useful

### Acceptance criteria

- events and courses list pages use the same overall workspace contract
- both pages support search
- both pages support at least status and pricing filters
- both pages present rows with a consistent visual hierarchy
- actions are consistent in placement and naming
- mobile layout remains readable and compact

### Notes

This phase should not yet try to solve registrations or attendance.
It should focus on the top-level management pages only.

## Phase 2. Registration Workflow Consolidation

### Goal

Consolidate event and course registration management onto one operational pattern.

### Scope

- move event registrations to the reusable operational table architecture
- preserve or improve the fast inline interactions currently available for event registrations
- bring courses up to parity for payment actions

### Required improvements

- event registrations should stop using a bespoke table layout
- course registrations should gain inline payment status actions for paid courses
- shared registration row behavior should support:
  - member identity
  - registration state
  - payment state
  - created date
  - inline actions

### Acceptance criteria

- event and course registrations use the same underlying operational table pattern
- both support consistent search and filters
- both support inline registration status updates
- paid events and paid courses both support inline payment status updates
- no registration workflow requires a slower `select then save` interaction when a compact state action is sufficient

## Phase 3. Attendance Workflow Consolidation

### Goal

Consolidate event attendance and course attendance into one clear operational pattern.

### Scope

- move event attendance onto the shared operational table pattern
- preserve event attendance speed
- remove slow form-based attendance interactions for courses where a compact action model is better

### Required improvements

- event attendance should stop using a bespoke table
- course attendance should stop relying on `Select + Save` as the default interaction model
- attendance/progress actions should be compact and consistent

### Acceptance criteria

- event and course attendance use the same operational table pattern
- both support consistent search and filters
- both support inline attendance/progress updates
- disabled states remain explicit when registration state does not allow marking attendance/progress

## Phase 4. Shared Operational Action Components

### Goal

Remove divergence in how status-changing actions are implemented.

### Scope

- create shared action patterns for:
  - registration status
  - payment status
  - attendance/progress status

### Desired outcome

The system should stop having:

- event compact menus in one area
- course select-and-save forms in another

Instead, it should use one action family with record-specific labels and allowed states.

### Acceptance criteria

- events and courses use the same action interaction model
- action components are configurable rather than duplicated
- server actions remain bounded to their domain routes, but the client interaction pattern is shared

## Phase 5. UX Polish And Performance Sweep

### Goal

Make the consolidated admin experience feel intentional, fast, and launch-ready.

### Scope

- spacing and density review
- mobile behavior review
- accessibility review
- result-count and empty-state review
- avoid unnecessary rerenders and redundant client state
- check image handling and table responsiveness

### Acceptance criteria

- no admin offering list or records table feels visually heavier than necessary
- search/filter interactions remain fast on realistic record counts
- mobile and tablet layouts remain operationally usable
- empty states and zero-result states are informative without being verbose

## Technical Standards

### Shared UI patterns over page-specific duplication

Prefer:

- a shared offering admin workspace
- shared operational records table
- shared action components

Avoid:

- copying event patterns into course pages manually
- adding new page-specific table implementations

### Domain logic remains the source of truth

Filters, labels, and visible states should continue to come from domain helpers wherever possible.

Do not let page-level display logic drift from:

- event lifecycle logic
- course lifecycle logic
- payment status logic
- attendance/progress logic

### Keep server boundaries clean

The UI may consolidate, but the data and mutations should remain domain-correct:

- event actions stay event-specific
- course actions stay course-specific
- shared client interaction must not collapse domain boundaries incorrectly

## Suggested Implementation Order

1. Phase 1: shared offering admin list pages
2. Phase 2: registration workflow consolidation
3. Phase 3: attendance workflow consolidation
4. Phase 4: shared operational action components
5. Phase 5: polish and performance sweep

This order is deliberate:

- list pages improve top-level discoverability first
- registrations are a higher-frequency operational surface than attendance
- shared action cleanup should happen after the record-table direction is stable

## Out Of Scope For This Plan

- public event/course discovery
- member account bookings UX
- course or event creation form redesign beyond parity fixes needed for consistency
- payment model changes beyond operational action parity
- detail page redesign unless required by later consolidation work

## Recommended Next Step

Start with Phase 1 and treat it as a standalone delivery slice:

- define the shared offering admin list workspace contract
- migrate events and courses onto it
- add tests for search/filter behavior and row rendering

Only after Phase 1 is stable should registrations and attendance be consolidated.

## Source Of Truth

This document is now the source of truth for consolidating the admin events and courses experience in `hub-platform`.

The implementation should optimize for:

- best admin user experience
- high performance
- clean UI
- shared, maintainable code
- reduced divergence between events and courses
