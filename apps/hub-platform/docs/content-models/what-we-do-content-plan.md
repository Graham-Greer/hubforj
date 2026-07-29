# What We Do Content Plan

Status:
- Proposed
- Production-grade planning document for the managed content type that feeds `GridSection` on the public site

Purpose:
- Define the production contract for the `What we do` managed content type
- Establish the first real admin-managed content source for `GridSection` variant `"default"`
- Keep the admin experience consistent with the existing testimonials workflow where that consistency improves usability

---

## 1) Why this content type matters

`GridSection` is now planned as a reusable section component, but its first homepage use needs a clean content source.

That source should not be:

- six repeated inline fields inside homepage settings
- a page-builder-style repeater hidden inside one route
- improvised JSON or freeform admin content

Instead, it should be a dedicated managed content type.

`What we do` is the right first implementation because it gives communities a clear way to explain:

- what they offer
- what members can expect
- what kinds of activities or support they provide

This supports the homepage conversion journey well and keeps the admin model scalable.

---

## 2) Product role

`What we do` is a hub-scoped managed content type for short structured content cards that explain a community’s offerings or core activities.

It should be suitable for:

- homepage “What we do”
- homepage “What we offer”
- homepage “What to expect”
- similar structured community-intro grids on other public pages later

It should not be used for:

- process steps such as “How to book”
- event/course/announcement records
- testimonials
- rich editorial/article content

Those are separate content problems.

---

## 3) Relationship to GridSection

`What we do` is the first planned managed content type that feeds:

- `GridSection`
  - variant `"default"`

It should not require its own section component.

The intended architecture is:

- managed content type: `What we do`
- section component: `GridSection`
- section layout primitive: `SectionItemsGrid`
- card shell primitive: `SectionCard`

This keeps content, section rendering, layout, and card scaffolding cleanly separated.

---

## 4) Admin UX direction

The admin experience should deliberately align with the existing testimonial workflow where that consistency is useful.

That means:

- dedicated sidebar entry
- dedicated list page
- dedicated create flow
- dedicated edit flow
- consistent save/validation/dirty-state patterns

### Sidebar placement

The navigation entry should be:

- `What we do`

It should sit:

- above `Testimonials`

This is a sensible position because the content supports the public-site narrative before testimonials in the homepage journey.

---

## 5) Why this should not live inside homepage settings

Homepage settings should remain focused on:

- section-level wrapper copy
- bounded homepage composition content

They should not become the place where admins manage a whole mini collection of items.

If `What we do` were managed inline in homepage settings, we would create:

- a heavier form
- repeated card-item groups inside one page
- worse sorting/publishing ergonomics
- poorer reuse later on other pages

So the cleaner model is:

- `What we do` records managed in their own admin area
- homepage settings manage only section-level heading/description if needed

---

## 6) Proposed record model

Each `What we do` item should be intentionally simple.

### Required fields

- `title`
- `description`
- `status`

### Recommended supporting fields

- `sortOrder`

### Explicitly out of scope in v1

- `featured`
- icons
- media/image
- links/CTAs
- badges
- rich text

Keeping the item model narrow is important for:

- admin clarity
- layout consistency
- strong section rendering

---

## 7) Field semantics

### 7.1 Title

- required
- short and scannable
- should fit comfortably in a card heading

### 7.2 Description

- required
- concise supporting copy
- should explain the offering or experience point clearly without becoming long-form content

### 7.3 Status

Expected values:

- `draft`
- `published`

Only published items should appear on public surfaces.

### 7.4 Sort order

- optional but strongly recommended
- lower numbers appear earlier

This should control public ordering.

---

## 8) Ordering rules

`What we do` should use a simple ordering contract in v1:

1. ascending `sortOrder`
2. deterministic fallback ordering after that

Because `featured` is explicitly out of scope in v1, the ordering model should stay simple.

This gives admins a clear and predictable way to influence what appears first.

---

## 9) Public rendering rules

The public site should only consume:

- published items

The homepage `GridSection` should render a bounded subset of those items.

### V1 display rule

- maximum 6 items

If more than 6 published items exist:

- the public section should render only the first 6 according to the ordering contract

This keeps the homepage stable and avoids unbounded growth.

---

## 10) Relationship to step-based sections

This content type is specifically for the `GridSection` `"default"` variant.

It should not be reused for:

- `GridSection` `"step"` content

Step-based sections like:

- `How to book`
- `How to join`
- `How registration works`

should come from known platform flow logic rather than admin-managed `What we do` records.

That distinction should remain explicit.

---

## 11) Admin pages to plan

The v1 admin workflow should likely include:

- list page
- create page
- edit page

### 11.1 List page

Should provide:

- item title
- status
- sort order
- quick scanability

This should feel similar in rhythm to the testimonial list.

### 11.2 Create page

Should support:

- title
- description
- status
- sort order

### 11.3 Edit page

Should support the same fields and form behavior as create, plus:

- existing values
- save feedback
- dirty-state handling

---

## 12) Form UX standards

For consistency with newer admin work, the forms should follow the same standards now used in homepage settings and testimonial editing:

- required indicators
- concise helper text
- bottom-positioned save feedback
- disabled submit when not dirty
- clear saved state

This is important because we do not want each new admin content type inventing its own form behavior.

---

## 13) Validation rules

### Required validation

- title is required
- description is required
- status must be valid

### Nice-to-have validation guidance

- title length should remain reasonably short
- description should remain concise enough for a grid card

In v1, the hard requirements above are sufficient.

---

## 14) Route and naming expectations

Recommended route family:

- `/{hubSlug}/admin/what-we-do`
- `/{hubSlug}/admin/what-we-do/create`
- `/{hubSlug}/admin/what-we-do/{itemId}`

The label shown to admins should be:

- `What we do`

This is specific enough to be understandable and generic enough to support the first homepage use cleanly.

---

## 15) Public-site integration expectations

The homepage should eventually consume:

- section-level header copy from homepage settings
- published `What we do` items from the managed content type

This mirrors the emerging pattern already established with testimonials:

- records managed in their own admin area
- section wrapper copy managed where appropriate in homepage settings

That is the right architecture.

---

## 16) Risks to avoid

### Risk 1: Turning it into a generic CMS content type

If the content model starts growing links, icons, media, badges, and multiple display options, it will stop being a clean feed for `GridSection`.

### Risk 2: Duplicating section logic inside the content model

The content type should not decide whether it is rendered as cards, steps, shapes, or borders.
That belongs to:

- `GridSection`
- template configuration

### Risk 3: Recreating inline homepage item management later

Once this dedicated content type exists, homepage settings should not regress into managing repeated item blocks for the same concept.

---

## 17) Locked decisions

- the managed content type should be named `What we do`
- it should appear in the admin sidebar above `Testimonials`
- it should be the first managed content source for `GridSection` variant `"default"`
- it should follow the testimonial-style admin UX pattern where that improves consistency
- it should not include `featured` in v1
- it should support:
  - title
  - description
  - status
  - sort order
- it should render only published items on public surfaces
- public ordering should be driven by sort order, then deterministic fallback ordering
- homepage settings should not manage the individual items directly
- process-driven step content should remain a separate system-driven concern, not part of this content type
