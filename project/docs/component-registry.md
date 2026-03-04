# Component Registry (MVP Canonical)

This document is the canonical inventory of components for this repo.
It exists to:
- prevent duplicate components when new needs arise
- enforce consistent layering (primitives -> ui -> patterns -> sections -> routes)
- keep Codex aligned to folder structure and variant strategy

Authority:
- Must comply with:
  - `AGENTS.md`
  - `docs/standards/engineering-source-of-truth.md`
  - `docs/standards/repo-structure-and-conventions.md`
  - `docs/standards/theming-architecture.md`
  - `docs/standards/nextjs-runtime-performance.md`

Folder rule (hard):
- Every component lives in its own folder:
  - `src/components/<layer>/<domain>/<ComponentName>.jsx`
  - `src/components/<layer>/<domain>/<ComponentName>.module.css`

Variant rule (hard):
- Prefer **one component with `variant` props** over duplicate files like `HeroSplit`, `HeroCentered`.
- Only split into separate files if markup/behavior divergence is genuinely unmaintainable.

Icons rule (hard):
- Use Google Material Symbols via `primitives/icon/Icon.jsx`.
- Do not use react-icons.

---

## Component Registry Table

Columns:
- **Layer**: primitives | ui | patterns | sections
- **Component**
- **Path**
- **Responsibility**
- **Variants** (explicit)
- **Key props** (high-level)
- **Composes / depends on**
- **Used by**: Public | Member | HubAdmin | SuperAdmin | CMS

> “CMS” refers to the site/pages CMS builder (superadmin-only initially, hub-admin later via feature flag).

---

## Primitives

| Layer | Component | Path | Responsibility | Variants | Key props | Composes / depends on | Used by |
|---|---|---|---|---|---|---|---|
| primitives | Stack | `src/components/primitives/stack/Stack.jsx` | Vertical layout with consistent gaps | n/a | `as`, `gap`, `align`, `justify`, `wrap` | — | All |
| primitives | Inline | `src/components/primitives/inline/Inline.jsx` | Horizontal layout with consistent gaps | n/a | `as`, `gap`, `align`, `justify`, `wrap` | — | All |
| primitives | Grid | `src/components/primitives/grid/Grid.jsx` | Grid layout primitive | n/a | `columns`, `gap`, `minItemWidth`, responsive props | — | All |
| primitives | Text | `src/components/primitives/text/Text.jsx` | Semantic text component | n/a | `as`, `size`, `tone`, `weight`, `truncate`, `align` | — | All |
| primitives | Heading | `src/components/primitives/heading/Heading.jsx` | Semantic headings | n/a | `as=h1..h6`, `size`, `tone`, `weight` | — | All |
| primitives | Surface | `src/components/primitives/surface/Surface.jsx` | Tokenized surface wrapper | `default`, `muted` | `tone`, `border`, `elevation`, `radius`, `padding` | — | All |
| primitives | VisuallyHidden | `src/components/primitives/visually-hidden/VisuallyHidden.jsx` | A11y-only hidden content | n/a | n/a | — | All |
| primitives | Icon | `src/components/primitives/icon/Icon.jsx` | Google Material Symbols icon wrapper | `outlined`, `filled` | `name`, `size`, `tone`, `filled`, `decorative`, `ariaLabel` | — | All |

---

## UI Core

| Layer | Component | Path | Responsibility | Variants | Key props | Composes / depends on | Used by |
|---|---|---|---|---|---|---|---|
| ui | Button | `src/components/ui/button/Button.jsx` | Primary action button incl. icon-only | `intent: neutral|brand|danger`, `variant: primary|secondary|tertiary`, `size: sm|md|lg` | `href`, `loading`, `fullWidth`, `leftIcon/rightIcon/icon`, `ariaLabel` | Icon, Spinner | All |
| ui | Link | `src/components/ui/link/Link.jsx` | Styled link wrapper (internal/external) | `tone`, `underline` | `href`, `external`, `prefetch?` | Next Link | All |
| ui | Modal | `src/components/ui/modal/Modal.jsx` | Accessible modal base | `size: sm|md|lg` | `open`, `onClose`, `title`, `actions` | Surface, Button | All |
| ui | ConfirmModal | `src/components/ui/confirm-modal/ConfirmModal.jsx` | Destructive confirmation modal | `danger`, `neutral` | `open`, `title`, `message`, `confirmText`, `onConfirm` | Modal, Button | HubAdmin/SuperAdmin |
| ui | Drawer | `src/components/ui/drawer/Drawer.jsx` | Slide-in panel (mobile/admin/CMS) | `side: left|right|bottom`, `size` | `open`, `onClose`, `title` | Surface, Button | HubAdmin/SuperAdmin/CMS |
| ui | Tooltip | `src/components/ui/tooltip/Tooltip.jsx` | Hover/focus tooltip | `placement` | `content`, `delay`, `children` | n/a | HubAdmin/SuperAdmin |
| ui | Spinner | `src/components/ui/spinner/Spinner.jsx` | Loading indicator | `size`, `tone` | `ariaLabel` | n/a | All |
| ui | Card | `src/components/ui/card/Card.jsx` | Standard card container | `tone`, `elevation`, `interactive` | `as`, `padding`, `radius` | Surface | All |
| ui | Badge | `src/components/ui/badge/Badge.jsx` | Labels/status chip | `solid`, `soft`, `outline` | `tone`, `size` | Text | All |
| ui | Avatar | `src/components/ui/avatar/Avatar.jsx` | Avatar (image or initials) | `shape: circle|rounded` | `src?`, `name`, `size`, `fallback` | AppImage, Text | Member/HubAdmin/SuperAdmin |
| ui | Accordion | `src/components/ui/accordion/Accordion.jsx` | Accordion UI | `compact`, `separated` | `type=single|multi`, `defaultOpen`, `items` | Icon, Surface | Public/HubAdmin/CMS |
| ui | Tabs | `src/components/ui/tabs/Tabs.jsx` | Tabs UI | `orientation: horizontal|vertical` | `tabs[]`, `value`, `onChange` | Button/Link | HubAdmin/SuperAdmin/CMS |
| ui | Pagination | `src/components/ui/pagination/Pagination.jsx` | Pagination controls | `simple`, `full` | `page`, `pageSize`, `total`, `onChange` | Button | HubAdmin/SuperAdmin/Public |
| ui | ThemeToggle | `src/components/ui/theme-toggle/ThemeToggle.jsx` | Light/dark theme toggle | `icon`, `switch` | `value`, `onChange` | Icon/Button | All |
| ui | ScrollToTop | `src/components/ui/scroll-to-top/ScrollToTop.jsx` | Scroll helper | n/a | `threshold`, `behavior` | Button/Icon | Public/Member |
| ui | AppImage | `src/components/ui/image/AppImage.jsx` | Wrapper around `next/image` + skeleton | `rounded`, `square`, `circle` | `src`, `alt`, `sizes`, `priority`, `fill/width/height` | next/image, SkeletonBox | All |
| ui | FileUpload | `src/components/ui/file-upload/FileUpload.jsx` | Multi-file upload control | n/a | `multiple`, `accept`, `maxFiles`, `onUpload`, `onRemove` | Button, AppImage | CMS/SuperAdmin/HubAdmin |

---

## UI Skeleton System

| Layer | Component | Path | Responsibility | Variants | Key props | Composes / depends on | Used by |
|---|---|---|---|---|---|---|---|
| ui | Skeleton | `src/components/ui/skeleton/Skeleton.jsx` | Base skeleton block | `pulse`, `shimmer` (optional) | `width`, `height`, `radius`, `inline` | n/a | All |
| ui | SkeletonText | `src/components/ui/skeleton/SkeletonText.jsx` | Multi-line paragraph skeleton | n/a | `lines`, `widths[]` (per-line widths), `lineHeight` | Skeleton | All |
| ui | SkeletonBox | `src/components/ui/skeleton/SkeletonBox.jsx` | Large block skeleton (images/containers) | n/a | `height`, `radius` | Skeleton | All |
| ui | SkeletonAvatar | `src/components/ui/skeleton/SkeletonAvatar.jsx` | Avatar skeleton | `circle`, `rounded` | `size` | Skeleton | Member/HubAdmin/SuperAdmin |

---

## UI Empty/Error + Toast

| Layer | Component | Path | Responsibility | Variants | Key props | Composes / depends on | Used by |
|---|---|---|---|---|---|---|---|
| ui | EmptyState | `src/components/ui/empty-state/EmptyState.jsx` | Empty states (no data) | `compact`, `default` | `title`, `body`, `action` | Button, Icon | All |
| ui | ErrorState | `src/components/ui/error-state/ErrorState.jsx` | Error state + retry | `compact`, `default` | `title`, `body`, `onRetry`, `referenceId?` | Button, Icon | All |
| ui | ToastProvider | `src/components/ui/toast/ToastProvider.jsx` | Toast host + state | n/a | `position`, `durationDefault` | Toast | All |
| ui | Toast | `src/components/ui/toast/Toast.jsx` | Toast message UI | `info`, `success`, `warning`, `danger` | `title`, `body`, `action` | Icon, Button | All |

---

## UI Form System (Wrappers + Controls)

| Layer | Component | Path | Responsibility | Variants | Key props | Composes / depends on | Used by |
|---|---|---|---|---|---|---|---|
| ui | Field | `src/components/ui/form/field/Field.jsx` | Wrapper with label/hint/error | n/a | `id`, `label`, `hint`, `error`, `required` | FieldLabel/Hint/Error | All |
| ui | FieldLabel | `src/components/ui/form/field/FieldLabel.jsx` | Field label | n/a | `htmlFor`, `required` | Text | All |
| ui | FieldHint | `src/components/ui/form/field/FieldHint.jsx` | Field hint | n/a | `children` | Text | All |
| ui | FieldError | `src/components/ui/form/field/FieldError.jsx` | Field error | n/a | `children` | Text | All |
| ui | Fieldset | `src/components/ui/form/fieldset/Fieldset.jsx` | Grouping container | n/a | `legend`, `hint` | Legend | All |
| ui | Legend | `src/components/ui/form/fieldset/Legend.jsx` | Fieldset title | n/a | `children` | Text | All |
| ui | FormRow | `src/components/ui/form/form-row/FormRow.jsx` | Horizontal form layout | n/a | `gap`, `align` | Inline | All |
| ui | FormGrid | `src/components/ui/form/form-grid/FormGrid.jsx` | Grid form layout | n/a | `columns`, `gap` | Grid | All |
| ui | FormGroup | `src/components/ui/form/form-group/FormGroup.jsx` | Vertical grouping | n/a | `title`, `description` | Stack | All |
| ui | Input | `src/components/ui/form/input/Input.jsx` | Styled text input | n/a | `value`, `onChange`, `type`, `placeholder`, `leftIcon/rightIcon` | Icon | All |
| ui | Textarea | `src/components/ui/form/textarea/Textarea.jsx` | Styled textarea | n/a | `value`, `onChange`, `rows`, `resize` | n/a | All |
| ui | Select | `src/components/ui/form/select/Select.jsx` | Custom select UI | `default`, `searchable` (optional) | `options`, `value`, `onChange`, `placeholder` | Drawer/Popover optional | All |
| ui | Checkbox | `src/components/ui/form/checkbox/Checkbox.jsx` | Custom checkbox | n/a | `checked`, `onChange`, `label` | Icon | All |
| ui | Radio | `src/components/ui/form/radio/Radio.jsx` | Custom radio | n/a | `checked`, `onChange`, `label` | Icon | All |
| ui | Switch | `src/components/ui/form/switch/Switch.jsx` | Toggle switch | n/a | `checked`, `onChange`, `label` | n/a | HubAdmin/SuperAdmin |
| ui | CheckboxGroup | `src/components/ui/form/checkbox-group/CheckboxGroup.jsx` | Multi-choice group | n/a | `options`, `value[]`, `onChange` | Checkbox | HubAdmin/SuperAdmin/CMS |
| ui | RadioGroup | `src/components/ui/form/radio-group/RadioGroup.jsx` | Single-choice group | n/a | `options`, `value`, `onChange` | Radio | HubAdmin/SuperAdmin/CMS |
| ui | DateTimePicker | `src/components/ui/form/date-time-picker/DateTimePicker.jsx` | Date+time selection | n/a | `value`, `onChange`, `min/max`, `clearable` | Modal/Popover | HubAdmin/SuperAdmin/CMS/Public |
| ui | WysiwygEditor | `src/components/ui/form/wysiwyg/WysiwygEditor.jsx` | Rich text editor wrapper | n/a | `value`, `onChange`, `disabled` | Editor adapter | HubAdmin/SuperAdmin/CMS |

---

## Patterns (App + CMS)

| Layer | Component | Path | Responsibility | Variants | Key props | Composes / depends on | Used by |
|---|---|---|---|---|---|---|---|
| patterns | PageHeader | `src/components/patterns/page-header/PageHeader.jsx` | Title + actions row | `default`, `dense` | `title`, `actions`, `breadcrumbs?` | Heading, Button | HubAdmin/SuperAdmin |
| patterns | Section | `src/components/patterns/section/Section.jsx` | Standard content wrapper | n/a | `tone`, `padding`, `maxWidth` | Surface/Stack | Public/Member |
| patterns | SectionHeader | `src/components/patterns/section-header/SectionHeader.jsx` | Section title block | n/a | `title`, `subtitle?`, `actions?` | Heading/Text | Public/Member |
| patterns | FeatureLocked | `src/components/patterns/feature-locked/FeatureLocked.jsx` | Locked feature upsell | n/a | `featureKey`, `benefits[]`, `cta` | Card/Button/Icon | HubAdmin |
| patterns | DataTable | `src/components/patterns/data-table/DataTable.jsx` | Table + empty/loading/error | `dense`, `default` | `columns`, `rows`, `loading`, `error`, `empty` | Table, FilterBar, Pagination | HubAdmin/SuperAdmin |
| patterns | DomainListManager | `src/components/patterns/domain-list-manager/DomainListManager.jsx` | Domain list with explicit remove confirmation | n/a | `hubId`, `domains[]`, `removeDomainAction` | ConfirmModal, Button, Text | SuperAdmin |
| patterns | FilterBar | `src/components/patterns/filter-bar/FilterBar.jsx` | Search + filters | `default`, `compact` | `search`, `filters[]`, `onChange` | Input, Select, Badge | HubAdmin/SuperAdmin |
| patterns | CMS BlockPicker | `src/components/patterns/cms/block-picker/BlockPicker.jsx` | Select section type to add | n/a | `availableBlocks`, `onPick` | Drawer/Modal, Card | CMS/SuperAdmin |
| patterns | CMS BlockList | `src/components/patterns/cms/block-list/BlockList.jsx` | Reorder/delete blocks | n/a | `blocks`, `onMove`, `onRemove`, `onSelect` | Card, Button, Icon | CMS/SuperAdmin |
| patterns | CMS BlockEditor | `src/components/patterns/cms/block-editor/BlockEditor.jsx` | Structured prop forms per block | n/a | `block`, `schema`, `onChange` | Field controls | CMS/SuperAdmin |
| patterns | CMS RepeatableListEditor | `src/components/patterns/cms/repeatable-list-editor/RepeatableListEditor.jsx` | Reusable repeatable item editor with vertical DnD and destructive confirm | n/a | `items`, `onChange`, `renderItemFields`, `addLabel` | ConfirmModal, Button, dnd-kit | CMS/SuperAdmin |
| patterns | CMS DraggableAccordionItem | `src/components/patterns/cms/draggable-accordion-item/DraggableAccordionItem.jsx` | Reusable draggable row shell with collapsible content for repeatable CMS item editing | n/a | `title`, `subtitle`, `statusLabel`, `actionItems`, `dragAttributes`, `dragListeners` | Badge, Button, Icon | CMS/SuperAdmin |
| patterns | CMS PublishBar | `src/components/patterns/cms/publish-bar/PublishBar.jsx` | Draft/publish controls | n/a | `status`, `onPublish`, `onUnpublish?` | Button, Badge | CMS/SuperAdmin |
| patterns | CMS MediaLibrary | `src/components/patterns/cms/media-library/MediaLibrary.jsx` | Select/upload media | n/a | `media`, `onSelect`, `onUpload` | FileUpload, AppImage | CMS/SuperAdmin |
| patterns | CMS PageSettingsForm | `src/components/patterns/cms/page-settings/PageSettingsForm.jsx` | title/slug/seo/status | n/a | `value`, `onChange` | Form controls | CMS/SuperAdmin |

---

## Sections (CMS Registry Blocks)

All sections are CMS-renderable blocks. Each has explicit variants.

| Layer | Component | Path | Responsibility | Variants | Key props | Composes / depends on | Used by |
|---|---|---|---|---|---|---|---|
| sections | HeroSection | `src/components/sections/hero/HeroSection.jsx` | Hero block | `centered`, `split` | `heading`, `subheading`, `imageId?`, `ctaText?`, `ctaHref?` | Heading, Text, Button, AppImage | Public/Member/CMS |
| sections | RichTextSection | `src/components/sections/rich-text/RichTextSection.jsx` | Rich text content block | `default` | `content` (WYSIWYG) | WYSIWYG renderer | Public/Member/CMS |
| sections | CTASection | `src/components/sections/cta/CTASection.jsx` | CTA block | `centered`, `split` | `title`, `body`, `ctaText`, `ctaHref`, `imageId?` | Button, AppImage | Public/Member/CMS |
| sections | FeatureGridSection | `src/components/sections/feature-grid/FeatureGridSection.jsx` | Feature grid | `2col`, `3col`, `4col` | `title`, `items[]` | Card, Icon, Text | Public/Member/CMS |
| sections | AccordionSection | `src/components/sections/accordion/AccordionSection.jsx` | Domain-neutral accordion section for FAQs, policies, and structured explainers | `default` | `eyebrow?`, `title?`, `description?`, `items[]` | Accordion, Wysiwyg renderer | Public/Member/CMS |
| sections | EventListSection | `src/components/sections/event-list/EventListSection.jsx` | Events list block | `upcoming`, `featured`, `category` | `title?`, `category?`, `limit?` | Card, Badge, Link | Public/Member/CMS |
| sections | ContactSection | `src/components/sections/contact/ContactSection.jsx` | Contact block | `card`, `split` | `address`, `email`, `phone?`, `mapLink?` | Card, Text | Public/Member/CMS |
| sections | LogoMarqueeSection | `src/components/sections/logo-marquee/LogoMarqueeSection.jsx` | Logo display | `marquee`, `grid` | `logos[]` | AppImage, Grid/Inline | Public/Member/CMS |
| sections | PricingSection | `src/components/sections/pricing/PricingSection.jsx` | Pricing block | `3tier`, `enterprise` | `title?`, `tiers[]` | Card, Button | Public/Member/CMS |
| sections | StatsSection | `src/components/sections/stats/StatsSection.jsx` | Stats block | `row`, `cards` | `items[]` | Card, Text | Public/Member/CMS |
| sections | TeamSection | `src/components/sections/team/TeamSection.jsx` | Team block | `grid`, `withLead` | `title?`, `members[]` | Card, Avatar/AppImage | Public/Member/CMS |
| sections | TestimonialsSection | `src/components/sections/testimonials/TestimonialsSection.jsx` | Testimonials | `grid`, `spotlight` | `title?`, `items[]` | Card, Text | Public/Member/CMS |
| sections | LegalDocumentSection | `src/components/sections/legal/LegalDocumentSection.jsx` | Legal content page | `default` | `content` (WYSIWYG) | RichText renderer | Public/Member/CMS |
| sections | SectionRenderFallback | `src/components/sections/fallback/SectionRenderFallback.jsx` | Unknown block fallback | `default` | `type` | ErrorState | Public/Member/CMS |

---

## Headers and Footers (CMS-selectable)

These are sections registered separately so CMS can assign them globally and per page.

| Layer | Component | Path | Responsibility | Variants | Key props | Composes / depends on | Used by |
|---|---|---|---|---|---|---|---|
| sections | HeaderSection | `src/components/sections/headers/HeaderSection.jsx` | Header/nav | `standard`, `minimal`, `landing` | `navItems[]`, `cta?`, `showThemeToggle?` | Link, Button, Icon | Public/Member/CMS |
| sections | FooterSection | `src/components/sections/footers/FooterSection.jsx` | Footer | `simple`, `columns`, `cta` | `linkGroups[]`, `contact?`, `cta?` | Link, Text, Button | Public/Member/CMS |

Global layout config (hub-scoped):
- `globalHeaderId`
- `globalFooterId`

Per page overrides:
- `headerIdOverride?`
- `footerIdOverride?`

---

## Next.js Layout Shells (Routing + Performance)

These are route-level layouts (not components) but are included because they are required for performance:
- persistent nav shells
- avoids reloading nav on route changes
- clean separation of public/member/admin/platform surfaces

Recommended layout groups:
- `src/app/(public)/[hubSlug]/layout.jsx` — public + member surface shell (domain or hubSlug)
- `src/app/(member)/[hubSlug]/account/layout.jsx` — member portal shell
- `src/app/(admin)/[hubSlug]/admin/layout.jsx` — hub admin shell (top nav + collapsible side nav)
- `src/app/(platform)/platform/layout.jsx` — superadmin shell (top nav + collapsible side nav)

Support Mode (superadmin managing hub):
- Implement a support-mode banner in the hub admin layout when session indicates superadmin context switch.

Admin on custom domain:
- Not supported. Admin surfaces are platform-domain only.

---

## Lock-in note (when the time comes)

Once this registry is accepted as stable:
- create a Product/Feature spec pack (docs) that references these components and their responsibilities.
- Codex should be instructed to:
  - never create new components outside this registry without updating this doc first
  - prefer adding variants to existing components over introducing new siblings

Reference:
- `docs/component-build-order.md`
- `docs/product/*`
