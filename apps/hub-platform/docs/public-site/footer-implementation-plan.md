# Public Footer Implementation Plan

## Status

Implemented for v1

## Implementation Notes

Implemented in:

- `src/components/patterns/public-site-footer/PublicSiteFooter.jsx`
- `src/components/patterns/public-site-footer/PublicSiteFooter.module.css`
- `src/components/patterns/public-shell/PublicShell.jsx`
- `src/components/ui/social-icon/SocialIcon.jsx`
- `src/components/ui/social-icon/SocialIcon.module.css`
- `src/app/styles/semantic.css`
- `src/app/styles/theme-modes.css`
- `src/app/styles/templates/*.css`

Delivered in the current slice:

- footer is now rendered across shared public routes via `PublicShell`
- four-column footer structure is in place
- copyright meta row is in place
- footer uses structured address data
- footer uses structured hours data
- useful links are platform-defined and routed to hub-scoped placeholder pages
- social icons use a shared `SocialIcon` primitive
- footer heading typography and social control sizing/radius are now token/template-driven

Still intentionally deferred:

- richer hours UX than bounded daily inputs
- final legal/help content replacing placeholder routes
- any package-aware footer link behavior beyond the current fixed set

## Purpose

Define the first reusable public-site footer for `hub-platform` so every public route can end with a structured, brand-aware footer driven by bounded admin-managed site settings.

This footer should:

- reinforce trust and contact clarity
- feel consistent with the template/theming system
- avoid CMS-like footer authoring
- use existing site settings where possible
- add only the missing data needed for the agreed footer shape

## Why This Is Needed Now

The public site now has a stronger homepage section system, but it still lacks a proper shared footer. That leaves:

- contact details without a consistent footer home
- social links without a branded footer presentation
- legal/help links without a predictable public location
- no place for operating hours yet

The footer is foundational page scaffolding, not a content section. It should be planned separately from the section system while still consuming the same design tokens and template rules.

## Locked Direction

The first-release footer should use a two-part structure:

1. Main footer body
   - four columns
2. Footer meta row
   - copyright line aligned left

### Main footer columns

#### Column 1: Contact details

- site name
- contact phone
- contact email
- social media icons below

#### Column 2: Address

- address heading
- structured address text block

#### Column 3: Useful links

For v1 these should be bounded platform-provided/dummy links:

- Terms of service
- Privacy policy
- Cookies
- FAQs

These are not admin-authored in v1.

#### Column 4: Hours

- operating hours heading
- structured hours content

Hours are not yet captured in site settings, so this plan includes adding that data model and admin form support.

### Footer meta row

Single left-aligned line:

- `© {siteName}, All rights reserved.`

## Brand and Visual Rules

Footer column headings and social icons should use a primary-brand-driven accent derived from the active template/theme.

This must be token-driven, not local hardcoded color in the footer component.

The footer should feel:

- clear
- structured
- calm
- trustworthy

It should not feel like a marketing banner or a dense sitemap.

## Relationship to Existing Data

The current site settings/admin flow already covers:

- `siteName`
- `contactEmail`
- `contactPhone`
- structured `address`
- `socialLinks`

Those should be reused directly.

The current settings model does not yet cover structured operating hours. That is the main missing data addition required for this footer.

The old navigation settings shape has now been retired from the active architecture.

So for v1:

- there is no admin-managed footer navigation config to merge
- footer useful links remain platform-defined
- the copyright row remains system-generated

## Footer Data Contract

### Existing fields reused

- `siteName`
- `contactEmail`
- `contactPhone`
- `address.line1`
- `address.line2`
- `address.city`
- `address.stateOrProvince`
- `address.postalCode`
- `address.country`
- `socialLinks.facebook`
- `socialLinks.instagram`
- `socialLinks.linkedin`
- `socialLinks.youtube`

### New fields required

Add a bounded `hours` object under site settings:

```js
hours: {
  monday: "",
  tuesday: "",
  wednesday: "",
  thursday: "",
  friday: "",
  saturday: "",
  sunday: "",
}
```

### Normalization expectations

- address should already arrive as a structured object, not a freeform string
- each day value is a trimmed string
- blank means do not display a value for that day
- fully blank hours object means the footer may show a neutral placeholder or omit detailed day rows, depending on final component behavior

## Admin Ownership

### Site settings should own

- site name
- contact phone
- contact email
- structured address
- social links
- hours

### Admins should not control in v1

- useful links set
- column order
- footer visual style
- social icon selection
- copyright line wording

This keeps the footer bounded and consistent with the SaaS direction.

## Component Architecture

Introduce a dedicated public footer pattern, not a section component.

Recommended component:

- `PublicSiteFooter`

Potential supporting pieces if needed:

- `FooterHoursList`
- `FooterSocialLinks`

But avoid premature decomposition unless the component becomes hard to read.

This should not use:

- `SectionShell`

It may still reuse shared width ownership through `SectionContainer` so the footer aligns with the same public-site content width contract as the surrounding sections.

However, it should still consume shared semantic/template tokens for:

- spacing
- surface
- text roles
- accent color
- icon treatment

## Layout Rules

### Desktop

- four-column grid

### Tablet

- two-column grid

### Mobile

- one-column stack

The component should remain readable and balanced without requiring content trimming by admins.

### Column behavior

- missing phone/email/address/hours values should not leave awkward empty headings
- if a whole column lacks meaningful content, the footer should either:
  - omit that block
  - or show a bounded fallback only where appropriate

This should be decided deliberately in implementation, not handled with ad hoc `||` strings per field.

## Fallback Strategy

Use the same principle already established for homepage sections:

- structural fallback is acceptable
- optional-field fallback substitution should be minimized

Recommended v1 behavior:

- site name: required, always present
- contact email: required, always present
- contact phone: optional, hidden if blank
- social icons: show only for populated links
- address block: hide if blank
- hours block:
  - if all day values are blank, hide the detailed list
  - optional small placeholder text may be acceptable if we want to preserve the four-column rhythm, but this should be decided carefully during implementation

Useful links should always render because they are platform-defined in v1.

When possible, useful links should be informed by the shared public-route availability model so the footer does not drift from the active public site structure.

## Hours UX Recommendation

Keep hours input bounded and literal in the admin portal.

For v1, the simplest approach is one text field per day:

- Monday
- Tuesday
- Wednesday
- Thursday
- Friday
- Saturday
- Sunday

Examples of acceptable values:

- `9am - 5pm`
- `Closed`
- `By appointment`

Avoid trying to build a scheduling engine here.

## Social Links UX Recommendation

Only render icons for social URLs that are actually present.

Use the shared `Icon` component and token-driven icon color rules. Do not hardcode per-network brand colors in v1.

## Useful Links Strategy

Useful links should be platform-defined for now.

Proposed initial set:

- Terms of service
- Privacy policy
- Cookies
- FAQs

These may initially point to placeholder routes or platform legal/help pages until those real routes are implemented.

This is preferable to exposing admin-managed legal/footer navigation too early.

The current shared route helper should also be treated as the canonical source for any footer links that point to active public pages.

## Public Rendering Contract

The footer should be available to all public routes, not just the homepage.

That likely means integrating it into the shared public-site route layout or public page composition layer once the right layout surface is identified.

The footer should consume normalized public-site data, not raw admin form state.

It should also sit comfortably beside the now system-derived header/navigation model:

- header routes come from shared public-route availability
- footer contact/address/hours come from structured site settings
- footer useful/legal links remain platform-defined in v1

## Semantic Token Needs

Implementation should likely add footer-specific semantic tokens for:

- footer background/surface
- footer border/divider
- footer title/accent color
- footer body text color
- footer meta row text color
- footer social icon color
- footer grid gap
- footer vertical padding

These should live in `semantic.css` with template overrides in `src/app/styles/templates/*.css` and non-template theme-mode overrides in `src/app/styles/theme-modes.css` where needed.

## Accessibility Requirements

- social links need accessible labels
- useful links should be standard text links, not icon-only links
- email and phone should use `mailto:` / `tel:` where appropriate
- headings should remain semantic and ordered consistently
- sufficient contrast must hold in both light and dark themes

## Out of Scope for V1

- admin-authored footer column editing
- arbitrary footer navigation groups
- newsletter signup
- map embeds
- dynamic holiday hours logic
- per-network brand icon colors
- package-tier footer variants

## Implementation Sequence

1. Extend site settings schema with `hours`
2. Add admin site-settings form support for hours
3. Normalize/public-site-load the new footer data
4. Add footer semantic tokens
5. Implement `PublicSiteFooter`
6. Wire footer into the shared public-site layout/composition
7. Add temporary useful-link destinations if final routes do not yet exist
8. Perform responsive and theme verification

## Open Questions

1. Should a fully blank address column eventually hide entirely, or should we keep the current placeholder behavior to preserve rhythm?
2. Should hours collapse to only populated days permanently, or should we later support fixed seven-day rendering once the UX is richer?
3. Should useful links remain fixed in v1.1, or should some become package-aware once the legal/help route model matures?

## Recommendation

Proceed with the footer as a dedicated public-site scaffolding component driven primarily by site settings.

Use the existing site/contact/social fields, the new structured address model, add bounded `hours`, keep useful links platform-defined, and make the visual treatment template-aware through semantic tokens.
