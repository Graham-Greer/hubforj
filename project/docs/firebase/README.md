# Firebase Documentation (Canonical)

Purpose:
- Define production-grade Firebase setup, schema, rules, and Next.js integration.
- Prevent Codex from guessing data structure, permissions, or auth/session mechanics.

Authority:
- Must comply with:
  - `AGENTS.md`
  - `docs/standards/engineering-source-of-truth.md`
  - `docs/standards/ops-quality-and-security.md`
  - `docs/standards/nextjs-runtime-performance.md`
  - Product specs:
    - `docs/product/*` (especially `data-model.md`, `routes-and-gating.md`, `state-machines.md`, `media-library.md`)

Hard rule:
- Codex MUST treat these Firebase docs as authoritative for all Firebase decisions.
- If new collections/fields are introduced, Codex MUST update:
  - `docs/firebase/firestore-schema.md`
  - rules docs (`docs/firebase/*-rules.md`)
  - and the relevant product spec in `docs/product/*` in the same change.
