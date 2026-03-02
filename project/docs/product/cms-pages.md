# CMS Pages Spec (MVP)

## Goals
- Support custom pages beyond home/events/contact.
- Structured forms for editing blocks; WYSIWYG only for approved rich-text fields.
- Maintain preview/live parity.
- Superadmin-only CMS initially; hub-admin CMS later as add-on feature.

## Routing (locked)
Custom pages render at:
- Platform domain: `/{hubSlug}/pages/{pageSlug}`
- Custom domain: `/pages/{pageSlug}`

## Access model (locked)
- CMS editing is **superadmin-only** in MVP.
- Hub admins see CMS feature as disabled (FeatureLocked) unless enabled later via hub feature flag `cmsPages`.

## Page model (locked)
Each page has:
- `slug`, `title`
- `status`: draft/published (status may be derived by presence of published composition)
- `draftComposition[]`
- `publishedComposition[]`
- SEO fields (title, description, image)
- timestamps

## Draft/publish workflow (locked)
- Editing modifies `draftComposition` only.
- Publish action copies `draftComposition` → `publishedComposition`.
- Preview uses draft and must be no-store.
- Live site uses published and should be cached/revalidated.

## Block registry approach (locked)
- Blocks correspond to **section components** registered in code.
- Each block has:
  - `type`
  - `variant`
  - `props` (typed; structured editor form)
- No template branching inside components; styling via tokens/recipe vars.

## Headers/Footers as CMS-selectable sections (locked)
Hub config stores:
- `globalHeaderId`
- `globalFooterId`

Pages can override:
- `headerIdOverride?`
- `footerIdOverride?`

Header section variants:
- standard, minimal, landing
Footer section variants:
- simple, columns, cta

## Media handling (MVP)
- Hub-scoped media library
- Multi-file upload supported
- Alt text required
- For full contect in building out the media library read `docs/product/media-library.md`.

## WYSIWYG constraints (locked)
Allowed formatting:
- bold, italic, underline
- bullet list, numbered list
- link
Not allowed:
- code/HTML/source mode

## Section set (MVP)
All sections in `docs/component-registry.md` are included in MVP and must be supported by:
- BlockPicker (add block)
- BlockList (reorder/delete)
- BlockEditor (structured form)
- SectionRenderFallback (unknown block type)
