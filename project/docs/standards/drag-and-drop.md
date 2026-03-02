# Drag-and-Drop Standard (dnd-kit) — Canonical

Goal:
- Provide a production-grade, accessible, and predictable drag-and-drop (DnD) implementation.
- Prevent janky reordering, accidental drags on mobile, and inaccessible interactions.
- Standardize how reorder is implemented across:
  - CMS block ordering
  - media lists (optional)
  - any future reorderable lists

Authority:
- Must comply with:
  - `AGENTS.md`
  - `docs/standards/engineering-source-of-truth.md`
  - `docs/standards/loading-error-and-resilience.md`
  - `docs/standards/nextjs-runtime-performance.md`

Library (LOCKED):
- MUST use `@dnd-kit/*`.
- MUST NOT introduce alternative DnD libraries unless explicitly approved + exception logged.

Install:
- `npm i @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`

---

## 1) Interaction requirements (HARD)

### 1.1 Drag handle only (HARD)
- Reorder MUST be initiated ONLY from a dedicated drag handle.
- The card/list item MUST remain normally clickable outside the drag handle.
- Drag handle MUST be clearly visible and have an accessible label.

### 1.2 Mobile safety (HARD)
To prevent accidental drags on touch devices:
- MUST use an activation constraint:
  - press-and-hold delay, OR
  - distance threshold, OR
  - both
- Default recommendation:
  - delay: 150–250ms
  - tolerance: small (e.g. 5px)
- MUST ensure scroll is not blocked by a light touch on the item.

### 1.3 Keyboard accessibility (HARD)
- Reorder MUST be keyboard operable.
- Drag handle MUST be focusable.
- Users MUST be able to:
  - pick up item
  - move item up/down
  - drop item
- MUST provide a visible focus ring on the drag handle.

### 1.4 Pointer behavior (HARD)
- MUST use transform-based dragging (no layout reflow while dragging).
- MUST avoid “jumping” at drag start.
- MUST use a drag overlay for smoothness when appropriate.

---

## 2) Visual + UX requirements (HARD)

### 2.1 Stable layout (HARD)
- Dragging MUST NOT cause layout shift of surrounding page content.
- Items should animate smoothly into place.

### 2.2 Feedback states (HARD)
- The dragged item MUST have a distinct visual state (e.g., elevated surface).
- Potential drop targets MUST show a clear affordance (subtle highlight or spacing).
- MUST show a disabled state if reordering is not allowed.

### 2.3 Persistence and optimistic UI (recommended)
- SHOULD update UI optimistically on drop.
- MUST persist reorder deterministically (server write) after drop.
- MUST handle failure:
  - revert order OR
  - show error toast and refresh from canonical order

---

## 3) Data model requirements (HARD)

### 3.1 Stable ordering field
Any reorderable collection MUST have a stable order field:
- `sortOrder` (number) OR
- a fractional ordering scheme OR
- array-of-ids on parent (only when list is small and stable)

Recommendation (MVP):
- Use `sortOrder` numeric field for each item.

### 3.2 Constraints
- Reorder MUST be hub-scoped where relevant.
- Reorder writes MUST go through repositories/services (no writes in presentational components).

---

## 4) Implementation boundaries (HARD)

### 4.1 Component placement
- DnD logic MUST live in a reusable pattern component when used in more than one place.
- CMS block reorder SHOULD live in:
  - `src/components/patterns/cms/block-list/*` (or equivalent)
- Avoid duplicating DnD wiring per screen.

### 4.2 Server/client boundaries
- DnD surfaces are interactive and will be Client Components.
- Client Components MUST NOT import server-only modules.
- Persist reorder via:
  - route handler `/api/**`, OR
  - server action (if used)
  - then repository/service on server

---

## 5) Testing requirements (recommended)
- SHOULD test:
  - reorder persistence (unit tests for service)
  - keyboard reorder flow (component test)
  - mobile activation constraint behavior (manual QA checklist)

---

## 6) Default configuration (recommended baseline)
- Sensors:
  - Pointer sensor with activation constraint (delay + tolerance)
  - Keyboard sensor for accessibility
- Sorting strategy:
  - vertical list strategy for block lists
- Drag overlay:
  - enable for smoother dragging when items are complex

---

## 7) Non-goals
- No drag-to-delete.
- No multi-select drag.
- No cross-list dragging in MVP unless explicitly specified.
