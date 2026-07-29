# Navigation Schema Cleanup Plan

## Status

Implemented for the current public-site architecture

## Implementation Notes

Implemented in:

- `src/lib/domain/site-settings.js`
- `src/lib/domain/public-site.js`
- `src/lib/domain/public-routes.js`
- `src/lib/domain/site-settings-capabilities.js`
- `src/lib/data/site-settings.js`
- `src/lib/data/public-site.js`
- `src/app/(hub)/[hubSlug]/layout.jsx`
- `src/components/patterns/public-shell/PublicShell.jsx`
- `src/app/(admin)/[hubSlug]/admin/settings/site/SiteSettingsForm.jsx`
- `src/app/(admin)/[hubSlug]/admin/settings/actions.js`
- `src/app/(admin)/[hubSlug]/admin/settings/form-state.js`
- `src/components/patterns/settings-overview/SettingsOverview.jsx`

Delivered in the current slice:

- old admin-managed navigation settings flow has been removed
- old navigation config schema path is no longer used by active code
- public header navigation is now system-derived
- shared public-route availability is now centralized in `public-routes.js`
- nav CTAs are system-driven in the public shell
- site settings now use a structured address model
- site settings now include structured hours fields
- settings overview no longer advertises navigation editing

Retired admin files:

- `src/app/(admin)/[hubSlug]/admin/settings/navigation/NavigationSettingsForm.jsx`
- `src/app/(admin)/[hubSlug]/admin/settings/navigation/page.jsx`

## Purpose

Retire the remaining CMS-like navigation settings model from `hub-platform` and replace it with a cleaner SaaS-aligned public-site contract.

This cleanup should:

- remove admin-managed navigation chrome authoring
- make header navigation system-derived
- keep footer implementation bounded and structured
- simplify the site-settings schema
- align public-site composition with tier/package-aware page availability

## Why This Cleanup Is Needed

The current `Navigation settings` direction no longer matches the product model we have been converging on.

We now want:

- bounded homepage sections
- structured footer settings
- system-driven navigation
- admin-managed content, not site-chrome authoring

The older navigation model introduces flexibility that is no longer desirable in a SaaS product:

- editable header links
- editable footer links
- editable nav CTAs
- editable footer meta

That makes the platform feel more like a light CMS than a bounded product system.

## Locked Direction

### Header navigation

Header links should be system-derived from:

- package/tier
- enabled public pages
- route availability for the hub

Admins should not manage header links manually in v1.

### Navigation CTAs

Primary/secondary nav CTA behavior should be system-driven.

Admins should not manage navigation CTA links manually in v1.

### Footer links

Footer useful links in the new footer should be platform-defined in v1.

Admins should not manage footer navigation groups manually in v1.

### Footer meta

The old freeform `footerMeta` field should be retired.

The new footer meta row should be system-generated:

- `© {siteName}, All rights reserved.`

## Schema Changes

Retire the following navigation config fields from the active public-site schema:

- `headerItems`
- `footerItems`
- `primaryCta`
- `secondaryCta`
- `footerMeta`

These should be removed from:

- normalization
- admin form state
- server actions
- public-site data shaping
- public rendering consumers

## Structured Address Update

Agreed: the current single `address` textarea should be replaced with a structured address object.

This is needed so the new footer can lay address content out cleanly and predictably.

### Replace

```js
address: ""
```

### With

```js
address: {
  line1: "",
  line2: "",
  city: "",
  stateOrProvince: "",
  postalCode: "",
  country: "",
}
```

### Admin field labels

- Address line 1
- Address line 2
- Town / city
- State / province
- ZIP / postal code
- Country

### Why this is better

- supports consistent footer layout
- avoids fragile string parsing
- works across regions better than one freeform block
- keeps the public-site data model more explicit and reusable

## Existing Areas Likely Affected

### Domain/data normalization

- `src/lib/domain/site-settings.js`
- `src/lib/domain/public-site.js`

### Admin settings

- `src/app/(admin)/[hubSlug]/admin/settings/site/*`
- `src/app/(admin)/[hubSlug]/admin/settings/actions.js`
- `src/app/(admin)/[hubSlug]/admin/settings/form-state.js`
- `src/components/patterns/settings-overview/SettingsOverview.jsx`

### Public rendering

Any public navigation/header/footer consumers currently reading old navigation config should be moved to the new system-driven source once that source is defined.

## Replacement Model

### Header source of truth

The header should be built from a system-owned availability model based on:

- enabled routes/pages
- package tier
- site capabilities

This logic should live in a domain helper rather than in admin-managed settings.

### Footer source of truth

The footer should be built from:

- structured site settings
- structured hours
- platform-defined useful links

Not from admin-authored navigation groups.

## Admin UX Changes

### Remove

- `Navigation settings` page
- navigation settings card from settings overview
- form state/action handling for navigation config

### Keep

- branding settings
- site settings
- homepage settings

### Expand

Site settings should absorb the structured footer-relevant fields:

- site name
- contact email
- contact phone
- social links
- structured address
- structured hours

## Data Migration Approach

Because this is still a moving internal product slice, we should prefer a clean schema transition over preserving weak legacy shape indefinitely.

Recommended approach:

1. Stop reading/writing retired navigation fields in active code paths.
2. Replace the old single `address` string with structured address fields in normalization and admin forms.
3. If legacy records still contain `address` as a string, support a temporary read fallback during transition only if necessary.
4. Do not build new features on top of retired navigation config.

## Implementation Sequence

Completed:

1. structured address fields added to site settings schema and admin form
2. structured hours fields added to site settings schema and admin form
3. system-derived header navigation helper introduced
4. navigation settings UI removed
5. navigation schema fields removed from active normalization/data flow
6. old public consumers of navigation config removed
7. settings overview updated
8. footer implemented against the structured site-settings contract

## Risks

### Risk: orphaned config assumptions

Some code paths may still assume navigation config exists because the schema has been present up to now.

Mitigation:

- audit all reads of `headerItems`, `footerItems`, `primaryCta`, `secondaryCta`, and `footerMeta`
- remove consumers in the same cleanup pass

### Risk: address rendering regressions

Moving from one freeform address string to a structured object may leave some hubs with incomplete address data until forms are updated.

Mitigation:

- provide a temporary normalization fallback from legacy string to empty structured fields where needed
- do not try to parse freeform addresses automatically unless absolutely necessary

## Recommendation

Proceed with the cleanup.

This is the right architectural move for the SaaS direction:

- system-owned header navigation
- bounded structured footer
- no admin-managed navigation chrome
- structured address and hours as part of site settings
