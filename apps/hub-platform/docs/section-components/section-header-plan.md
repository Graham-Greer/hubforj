# SectionHeader Plan

Status:
- Proposed
- Production-grade planning document for the core public section header primitive

Purpose:
- Define the shared contract for eyebrow, title, and description rendering across public sections
- Prevent each section from inventing its own content hierarchy
- Support consistent typography, spacing, and alignment across the section system

---

## 1) Role of SectionHeader

`SectionHeader` is the shared content-header primitive for public sections.

It should handle:
- eyebrow
- title
- description
- alignment and width constraints

It should not handle:
- CTA rendering
- media rendering
- section-level outer spacing
- grid layout

That means `SectionHeader` is not a section.
It is a section-system primitive used by real sections.

---

## 2) Why it should exist

Without `SectionHeader`, the section system will quickly drift into:
- inconsistent title spacing
- repeated eyebrow markup
- varying description widths
- different alignment rules from section to section

`SectionHeader` creates a stable contract for the most repeated part of public sections: the content header.

---

## 3) Proposed folder and naming

Recommended location:

- `src/components/sections/primitives/section-header/SectionHeader.jsx`
- `src/components/sections/primitives/section-header/SectionHeader.module.css`

---

## 4) Proposed API shape

### 4.1 Core props

- `eyebrow`
- `title`
- `description`

### 4.2 Layout and formatting props

- `align`
  - proposed initial values:
    - `"start"`
    - `"center"`

- `width`
  - proposed initial values:
    - `"default"`
    - `"narrow"`
    - `"wide"`

- `headingLevel`
  - likely values:
    - `1`
    - `2`
    - `3`

### 4.3 Utility props

- `id`
- `className`
- `titleClassName`
- `descriptionClassName`

Keep this surface tightly bounded.

---

## 5) Content rules

### 5.1 Eyebrow

- optional
- short, concise, high-signal label
- rendered only when present

### 5.2 Title

- required
- should remain plain content input
- actual semantic level should be controlled by `headingLevel`

### 5.3 Description

- optional
- should support concise supporting narrative
- start with plain text or bounded content only

Recommendation:
- do not design this first version around arbitrary rich-text markup

---

## 6) Alignment contract

Initial alignment contract should stay simple:
- `start`
- `center`

`SectionHeader` should not attempt to support every text alignment from day one.

If a future section needs something more specific, that should be reviewed deliberately rather than added casually.

---

## 7) Width contract

The header should be able to constrain readable line length.

Initial width options:
- `narrow`
- `default`
- `wide`

Recommendation:
- most sections should use `default`
- `narrow` is useful for centered heroes and intro sections
- `wide` should be used sparingly

The exact widths should map to token-aware CSS values rather than one-off max-width decisions per section.

---

## 8) Typography ownership

`SectionHeader` should own:
- eyebrow treatment
- title hierarchy
- description spacing
- title-to-description rhythm

It should not own:
- overall section spacing
- CTA spacing
- media relationship

Typography should be inherited from the app’s token and template system, not hardcoded per section.

Semantic heading level should control both:

- the rendered heading tag
- the corresponding semantic heading token mapping

This avoids treating `headingLevel` as semantic-only while styling is chosen ad hoc elsewhere.

---

## 9) Accessibility expectations

`SectionHeader` must:
- render semantic headings correctly
- avoid skipping heading hierarchy accidentally
- ensure decorative eyebrow treatment remains readable

Recommendation:
- use `headingLevel` to select the actual heading element
- keep the default decision controlled by the consuming section

---

## 10) What stays out of SectionHeader

Do not include initially:
- CTA rendering
- badge/chip lists
- metadata rows
- breadcrumbs
- media captions
- arbitrary slot systems

Those are different primitives or section-specific concerns.

---

## 11) Open decisions to review

### 11.1 Description type

Recommendation:
- start with bounded string content
- do not open this to arbitrary children on first implementation

### 11.2 Heading level default

Recommendation:
- require explicit `headingLevel` from consuming sections
- avoid hiding heading semantics inside the primitive

### 11.3 Width token strategy

Recommendation:
- implement width as semantic modifier classes
- map to stable max-width values that fit the token system

---

## 12) Relationship to HeroSection

`HeroSection` is the first primary consumer.

It should use `SectionHeader` for:
- eyebrow
- title
- description

But `SectionHeader` must remain generic enough to support later sections such as:
- page intro
- CTA
- event list
- course list
- announcement list

That is why its API should remain restrained and structural rather than hero-specific.
