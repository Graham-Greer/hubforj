# Site Settings Ownership Cleanup Plan

Status:
- Proposed
- Detailed implementation-planning document

Purpose:
- Remove overlapping ownership between `/admin/settings/site` and `/admin/settings/branding`
- Establish one clear home for site-wide identity and contact fields
- Prevent header, footer, and public-shell work from depending on ambiguous settings boundaries

Related:
- [Public Header And Navigation Plan](/mnt/c/local/community-app/apps/hub-platform/docs/public-site/public-header-and-navigation-plan.md)
- [SaaS Site Settings Code Schema Plan](/mnt/c/local/community-app/apps/hub-platform/docs/public-site/saas-site-settings-code-schema-plan-2026-03-15.md)

---

## 1) Problem statement

The current settings ownership is not clean enough.

Today, fields such as:
- `siteName`
- `contactEmail`
- `tagline`
- `logoAssetId`
- `logoAlt`

are tied into branding-oriented code paths, while:
- `/admin/settings/site`
already owns broader site-wide concerns such as:
  - address
  - contact information
  - hours
  - social links
  - SEO defaults

This creates two problems:
- admins can reasonably become confused about where site-wide identity actually lives
- future public-header/footer/member-shell work risks building on muddled ownership

The overlap is even more problematic because:
- `siteName` and `contactEmail` are clearly site-level concerns
- `tagline` is a site-level identity concern
- `hub name` should not be treated as branding-settings-owned

---

## 2) Cleanup decision

The canonical site-level settings surface should be:
- `/{hubSlug}/admin/settings/site`

Branding settings should not own:
- hub name
- site name
- contact email
- tagline

If any of those fields do not currently live in site settings, they must be added there.

### 2.1 Canonical ownership after cleanup

`/admin/settings/site` should own:
- `hubName`
- `siteName`
- `contactEmail`
- `tagline`
- `contactPhone`
- address
- hours
- social links
- SEO defaults

`/admin/settings/branding` should own only bounded visual-brand inputs such as:
- `themeKey`
- `templateKey`
- `logoAssetId`
- `logoAlt`

Important:
- logo remains a brand/presentation asset
- site name remains a canonical site identity field
- branding should not become a dumping ground for general business/site metadata

---

## 3) Why this ownership split is better

### 3.1 It matches admin mental models

Admins reasonably interpret:
- site name
- contact email
- tagline

as site-level identity/settings, not purely visual branding.

### 3.2 It reduces duplication and drift

Once header/footer/public-shell work expands, those surfaces will need:
- canonical site identity
- canonical contact identity

Those should not be split across multiple settings areas.

### 3.3 It keeps branding bounded

Branding should remain about:
- visual identity
- theme/template presentation
- logo/media-level brand treatment

Not general site metadata.

---

## 4) Target ownership table

### 4.1 Move to site settings

These fields should definitively live in `/admin/settings/site`:
- `hubName`
- `siteName`
- `contactEmail`
- `tagline`

### 4.2 Remain in branding

These fields should remain in `/admin/settings/branding`:
- `themeKey`
- `templateKey`
- `logoAssetId`
- `logoAlt`

### 4.3 Explicitly not duplicated

After cleanup, the following fields should not appear in both surfaces:
- `siteName`
- `contactEmail`
- `tagline`
- `hubName`

---

## 5) Current-code implications

Based on current code, the overlap exists in:
- [site-settings.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/site-settings.js)
- [site-settings.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/data/site-settings.js)
- [form-state.js](/mnt/c/local/community-app/apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/form-state.js)
- [actions.js](/mnt/c/local/community-app/apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/actions.js)
- [BrandingSettingsForm.jsx](/mnt/c/local/community-app/apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/branding/BrandingSettingsForm.jsx)
- [SiteSettingsForm.jsx](/mnt/c/local/community-app/apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/site/SiteSettingsForm.jsx)

The cleanup should update all of those layers together, not just the form UI.

---

## 6) Normalized schema implications

The normalized site-settings/domain layer should expose one authoritative source for:
- `hubName`
- `siteName`
- `contactEmail`
- `tagline`

The branding normalization layer should no longer own or validate those fields.

### 6.1 Preferred normalized split

Conceptually:

```js
{
  siteIdentity: {
    hubName: "",
    siteName: "",
    tagline: "",
    contactEmail: "",
  },
  branding: {
    themeKey: "",
    templateKey: "",
    logoAssetId: "",
    logoAlt: "",
  },
}
```

The exact object shape can evolve, but the ownership boundary should match this intent.

---

## 7) Admin form implications

### 7.1 Site settings form

`/admin/settings/site` should be updated to include:
- hub name
- site name
- contact email
- tagline

This form should remain the canonical editor for site-level identity.

### 7.2 Branding settings form

`/admin/settings/branding` should remove:
- hub name
- site name
- contact email
- tagline

It should focus on:
- theme/template
- logo

### 7.3 Dirty-state and save behavior

This cleanup must preserve:
- existing dirty-form behavior
- existing save/cancel standards
- route revalidation correctness

No one-off exceptions should be introduced just because fields are moving between forms.

---

## 8) Data migration strategy

Because many of these values may already be stored at the same top-level settings document, the migration may be lightweight at persistence level and heavier at ownership/UI level.

The migration should be treated in three layers:

### 8.1 Persistence layer

Confirm whether:
- the stored document already has the fields in a shared top-level shape

If yes:
- avoid unnecessary record migration
- focus on normalization and admin-form ownership

### 8.2 Domain layer

Move validation/normalization authority so that:
- branding payload normalization does not own site-wide identity fields
- site settings payload normalization does own them

### 8.3 UI layer

Move the fields so admin users only see and edit them in the correct place.

---

## 9) Risks to avoid

The cleanup must avoid:
- duplicating the same field in both forms temporarily without clear write precedence
- hidden backfills that silently overwrite newer values
- route revalidation gaps after saving site-level identity changes
- header/footer/public surfaces reading a stale or transitional field path

---

## 10) Implementation order

Recommended order:

1. update domain normalization ownership
2. update action payload ownership
3. update site settings form to include moved fields
4. remove moved fields from branding form
5. verify public/header consumers still read the canonical site-level values

---

## 11) Acceptance criteria

This cleanup should be considered complete only when:
- `hubName`, `siteName`, `contactEmail`, and `tagline` are owned by `/admin/settings/site`
- `/admin/settings/branding` no longer edits those fields
- the normalized domain layer has one clear source of truth for those values
- public/header/footer consumers can read those values without ambiguity
- admin users no longer face overlapping ownership across site and branding settings

