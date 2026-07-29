# SectionRichText Plan

Status:
- Proposed
- Production-grade planning document for the bounded public section rich-text primitive

Purpose:
- Define the shared contract for rendering bounded formatted body content inside public sections
- Prevent each section from inventing its own prose and list rendering rules
- Support `InfoSection` and future section-level explanatory content without drifting into full CMS or editorial rendering

---

## 1) Role of SectionRichText

`SectionRichText` is the shared primitive for rendering bounded formatted section body content.

It should handle:

- paragraphs
- unordered lists
- bold text
- italic text
- consistent spacing and typography for section-level body copy

It should not handle:

- raw HTML rendering
- editor behavior
- media embeds
- article/blog rendering
- long-form editorial document structure

That means `SectionRichText` is not a full content system.
It is a bounded public section primitive.

---

## 2) Why it should exist

Without `SectionRichText`, the section system will quickly drift into:

- inconsistent paragraph spacing
- ad hoc list rendering
- unsafe or improvised HTML rendering
- duplicated prose styling logic across sections

`SectionRichText` creates a stable presentation contract for the richer copy that sits between:

- a short `SectionHeader` description
- and the broader long-form editorial/document use cases that may exist later

---

## 3) Proposed folder and naming

Recommended location:

- `src/components/sections/primitives/section-rich-text/SectionRichText.jsx`
- `src/components/sections/primitives/section-rich-text/SectionRichText.module.css`

---

## 4) Initial scope

The first implementation should support:

- paragraphs
- unordered lists
- bold
- italic

That is all.

This narrow scope is intentional.
It matches the current public-section needs without opening the product up to article-level or CMS-level content complexity prematurely.

---

## 5) Proposed API shape

### 5.1 Core props

- `content`
  - normalized structured rich-text value

### 5.2 Utility props

- `className`

Avoid expanding beyond this until real usage proves it necessary.

---

## 6) Content contract

`SectionRichText` should not accept raw HTML.

`SectionRichText` should also not depend on Markdown as the production data contract.

Instead, it should consume a normalized structured content model.

Recommended shape:

```js
[
  {
    type: "paragraph",
    children: [
      { text: "We support people through " },
      { text: "steady practice", bold: true },
      { text: " and community connection." },
    ],
  },
  {
    type: "unordered-list",
    items: [
      [
        { text: "Weekly sessions for all levels" },
      ],
      [
        { text: "A " },
        { text: "supportive", italic: true },
        { text: " and welcoming environment" },
      ],
    ],
  },
]
```

This keeps the rendering contract:

- safe
- explicit
- easy to validate
- easy to normalize from admin editing
- easy to extend later without reworking the whole primitive

---

## 7) Supported block types

Locked initial block types:

- `paragraph`
- `unordered-list`

### 7.1 Paragraph

Paragraph blocks should:

- render as standard body copy
- support inline marks
- preserve readable rhythm and line length as controlled by the consuming section

### 7.2 Unordered list

Unordered lists should:

- render with clear bullets
- support inline marks within list items
- maintain clean spacing relative to surrounding paragraphs

Recommendation:
- keep nested lists out of scope in v1

---

## 8) Supported inline marks

Locked initial inline marks:

- `bold`
- `italic`

These marks should be combinable where the structured content model allows it.

Recommendation:
- keep inline formatting restrained
- do not introduce underline, links, code, or color-based marks in v1

---

## 9) Explicitly out of scope in v1

Do not support initially:

- links
- headings inside the rich-text body
- ordered lists
- nested lists
- blockquotes
- raw HTML
- Markdown source rendering as the primary contract
- images or media embeds
- tables
- code blocks

These are valid for other content systems later, but they should not dilute the first section-rich-text implementation.

---

## 10) Accessibility expectations

`SectionRichText` must:

- preserve semantic paragraph and list markup
- render lists as real lists
- keep emphasis marks semantic rather than purely visual

Recommendation:
- use real `<p>`, `<ul>`, `<li>`, `<strong>`, and `<em>` markup
- avoid role-based or div-heavy approximations

---

## 11) Styling contract

`SectionRichText` should own:

- paragraph spacing
- list spacing
- bullet treatment
- emphasis rendering
- readable section-body rhythm

It should not own:

- macro layout
- section spacing
- media relationship
- CTA spacing
- article-page typography systems

Typography should remain aligned with the design-system tokens already used across public sections.

---

## 12) Relationship to consuming sections

`SectionRichText` is intended for bounded section-level explanatory content.

Primary early consumer:

- `InfoSection`

Potential later consumers:

- selected about-page sections
- selected CTA-supporting explanatory sections
- selected programme/community-summary sections

This is why the primitive should stay generic, but still narrow.

---

## 13) Relationship to admin editing

The admin editing surface should eventually output the normalized `SectionRichText` content structure.

Important:

- `SectionRichText` is the render primitive
- it is not the editor

The editor can be introduced later as a bounded rich-text editing surface that supports:

- paragraphs
- unordered lists
- bold
- italic

and strips unsupported formatting from pasted content.

This is especially important because users may paste from Word or HTML sources.

Recommendation:
- normalize pasted content into the supported subset
- do not broaden the render primitive just because rich source input exists

---

## 14) Future long-form content boundary

This primitive should not be broadened now to anticipate blog or article functionality.

That would weaken the section system.

If future product scope includes:

- blog posts
- announcements with richer body structure
- long-form editorial content
- legal or document-style rendering

then the correct approach is likely a separate primitive, such as:

- `ArticleRichText`
- or `DocumentRichText`

Why:

- section-supporting copy and editorial document bodies are different content problems
- they need different formatting scope
- they may need different admin editing models

So `SectionRichText` should remain intentionally bounded.

---

## 15) Data and validation expectations

Before content reaches `SectionRichText`, it should be:

- normalized
- validated
- stripped of unsupported structures

Recommendation:

- validate allowed block types
- validate allowed inline marks
- drop empty blocks
- reject unsupported structures at the data-layer or editor-normalization layer

Do not push this responsibility into the JSX rendering layer alone.

---

## 16) Initial v1 boundaries

`SectionRichText` v1 should include:

- paragraph rendering
- unordered-list rendering
- bold and italic inline marks
- token-aligned styling
- semantic HTML output

It should not include:

- links
- HTML input
- Markdown as the primary production contract
- long-form editorial scope
- embedded media
- broad formatting controls

---

## 17) Recommended implementation order

1. Lock the `SectionRichText` content schema
2. Implement `SectionRichText` renderer
3. Implement `InfoSection` against that renderer
4. Add the bounded admin editing surface for the homepage “About us” usage

Do not implement the admin editor before the render contract is locked.

---

## 18) Locked initial decisions

- Primitive name is `SectionRichText`
- it is a render primitive, not an editor
- it consumes normalized structured content, not raw HTML
- it does not use Markdown as the long-term production contract
- it supports:
  - paragraphs
  - unordered lists
  - bold
  - italic
- it does not support links in v1
- it is intended for bounded section-level content
- longer-form editorial/blog content should use a separate richer primitive later if needed

