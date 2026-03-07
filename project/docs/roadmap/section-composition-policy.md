# Section Composition Policy (Canonical, Machine-Enforced)

Purpose:
- Prevent “god sections” where unrelated semantics are hidden behind variants.
- Preserve CMS editor clarity, validation correctness, and maintainable section architecture.
- Enable production-quality section data composition via shared schema fragments and editor foundations.

Authority alignment:
- `AGENTS.md`
- `docs/codex-workflow.md`
- `docs/standards/engineering-source-of-truth.md`
- `docs/standards/repo-structure-and-conventions.md`
- `docs/product/cms-pages.md`
- `docs/product/cms-block-registry.md`
- `docs/component-registry.md`

---

## 1) Canonical rule: Sections are semantic, variants are layout (HARD)

### 1.1 Sections MUST remain separate by semantic intent (HARD)
Codex MUST model major semantic surfaces as separate section types (block types).
Examples (non-exhaustive):
- Feature grid
- Team
- Pricing
- Testimonials
- Stats
- Accordion (domain-neutral)
- Hero
- Footer
- Header

Codex MUST NOT collapse these into a single “FeatureGrid” with many semantic variants (e.g. `variant="team"` or `variant="pricing"`)
when the required data model differs materially.

Rationale:
- Semantic sections have distinct:
  - item shapes
  - required fields
  - validation gates
  - authoring guidance
  - publish-quality expectations

### 1.2 Variants MUST be constrained to layout/presentation (HARD)
Variants may change:
- layout: columns, alignment, media placement
- density/spacing: compact vs comfortable
- presentation style: bordered vs subtle
- simple affordances: icon vs image when the underlying data model remains the same

Variants MUST NOT:
- introduce a fundamentally different item schema (e.g. pricing tiers vs team members)
- cause unpredictable “field explosions” where half the editor changes under a variant

---

## 2) Canonical rule: Use shared schema fragments to get production-quality composition (HARD)

Codex MUST use shared schema fragments to avoid duplication across sections while keeping sections semantic.

Fragments are reusable schema + validation + editor metadata building blocks.

Fragments MAY be composed into section schemas, for example:
- FeatureGridItem = CardFragment + MediaFragment + (optional) CtaFragment
- TeamMemberItem = PersonFragment + MediaFragment + (optional) CtaFragment
- PricingTierItem = PriceFragment + (optional) CtaFragment
- TestimonialItem = QuoteFragment + PersonFragment + (optional) MediaFragment

Fragments MUST NOT override:
- the section’s semantic identity
- the section’s readiness/publish gate definitions

---

## 3) CMS editor implications (HARD)

### 3.1 Editor UX MUST remain predictable
- The editor MUST remain schema-driven.
- The same section type MUST always render the same major groups.
- Variant changes MAY hide/show only variant-relevant layout fields, not entire semantic schemas.

### 3.2 Readiness + publish gates remain section-owned
- Readiness must be computed from section+variant schema (single source of truth).
- Fragments contribute rules, but the section owns the gate composition.

---

## 4) Migration protocol (HARD)

When migrating sections from MVP contracts to production contracts:
- Codex MUST migrate one section type at a time.
- Codex MUST not change unrelated sections in the same slice.
- Each migration slice MUST include:
  - canonical section schema (single source of truth)
  - renderer update to accept structured props
  - editor update via schema metadata
  - readiness/publish gates
  - tests for validation/readiness and repeatable editor interactions
  - docs updates (`cms-block-registry`, section schema docs)

---

## 5) Exception policy (HARD)
If Codex believes a semantic merge into a single section type is warranted:
- Codex MUST propose it explicitly as an exception and justify why schemas are materially the same.
- Codex MUST update docs and ask for explicit approval BEFORE implementation.
