# Component Registry

## Purpose

This file records reusable components that are considered canonical in `apps/hub-platform`.

If a component is reusable and is expected to shape future implementation, it belongs here. This prevents duplicate inventions and forces clarity about component purpose.

## Primitives

### `Surface`

Path:

- `src/components/primitives/surface/Surface.jsx`

Purpose:

- neutral container primitive for elevated or framed content surfaces

Use for:

- cards
- contained layout surfaces
- panel wrappers when no domain-specific pattern is needed

Do not use for:

- shell ownership
- route headers
- arbitrary semantic meaning

### `ThemeScope`

Path:

- `src/components/primitives/theme-scope/ThemeScope.jsx`

Purpose:

- scoped theme/template boundary for hub-specific presentation

Use for:

- public, member, and admin shell theming boundaries

Do not use for:

- ad hoc component-level color overrides

## UI

### `Button`

Path:

- `src/components/ui/button/Button.jsx`

Purpose:

- canonical button and link-button action control

### `Badge`

Path:

- `src/components/ui/badge/Badge.jsx`

Purpose:

- compact status or audience indicator

### `Input`

Path:

- `src/components/ui/input/Input.jsx`

Purpose:

- canonical single-line text input control

### `Select`

Path:

- `src/components/ui/select/Select.jsx`

Purpose:

- canonical select control

### `Textarea`

Path:

- `src/components/ui/textarea/Textarea.jsx`

Purpose:

- canonical multiline text input control

### `Icon`

Path:

- `src/components/ui/icon/Icon.jsx`

Purpose:

- canonical Google Material Symbols wrapper using the self-hosted outlined WOFF2 asset in `src/app/assets/fonts/MaterialSymbolsOutlined.woff2`

Notes:

- semantic tones are supported via `tone="default|muted|accent|success|warning|danger|inverse"`

### `SocialIcon`

Path:

- `src/components/ui/social-icon/SocialIcon.jsx`

Purpose:

- canonical brand social mark wrapper for supported network icons where the generic Material icon set is not appropriate

### `FormMessage`

Path:

- `src/components/ui/form-message/FormMessage.jsx`

Purpose:

- canonical inline form feedback message for error, success, and informational states

### `CompactMenu`

Path:

- `src/components/ui/compact-menu/CompactMenu.jsx`

Purpose:

- compact reusable menu primitive for lightweight action and filter menus, including header utility-menu composition when appropriate

### `Avatar`

Path:

- `src/components/ui/avatar/Avatar.jsx`

Purpose:

- generic identity-avatar primitive with initials fallback and future image support across public, member, and admin surfaces

### `NavToggleButton`

Path:

- `src/components/ui/nav-toggle-button/NavToggleButton.jsx`

Purpose:

- generic navigation-toggle trigger primitive for burger-to-close interactions in header and menu systems

### `SubmitButton`

Path:

- `src/components/ui/submit-button/SubmitButton.jsx`

Purpose:

- canonical server-action submit button with pending-state label support

### `NavItem`

Path:

- `src/components/ui/nav-item/NavItem.jsx`

Purpose:

- canonical navigation item inside approved nav structures

### `NavGroup`

Path:

- `src/components/ui/nav-group/NavGroup.jsx`

Purpose:

- grouped navigation structure for shells

### `StatCard`

Path:

- `src/components/ui/stat-card/StatCard.jsx`

Purpose:

- compact summary statistic card

## Section Primitives

### `SectionCard`

Path:

- `src/components/sections/primitives/section-card/SectionCard.jsx`

Purpose:

- thin shared shell for public section cards using the section-card semantic token contract

### `SectionItemsGrid`

Path:

- `src/components/sections/primitives/section-items-grid/SectionItemsGrid.jsx`

Purpose:

- thin responsive layout primitive for repeated section item grids

### `SectionSearchFilters`

Path:

- `src/components/sections/primitives/section-search-filters/SectionSearchFilters.jsx`

Purpose:

- neutral public discovery-controls primitive for search, lightweight filtering, and results context

### `SectionArticleLayout`

Path:

- `src/components/sections/primitives/section-article-layout/SectionArticleLayout.jsx`

Purpose:

- neutral internal section-layout primitive for dominant reading content plus a supporting aside, with optional sticky-aside behavior on larger screens

## Patterns

### `GridSection`

Path:

- `src/components/sections/grid-section/GridSection.jsx`

Purpose:

- reusable public section for bounded structured card grids in both default and step variants

### `PublicUtilityMenu`

Path:

- `src/components/patterns/public-shell/PublicUtilityMenu.jsx`

Purpose:

- auth-aware public-route utility menu pattern built on the shared compact-menu primitive for signed-in member and admin states

### `EventsListingSection`

Path:

- `src/components/sections/events-listing-section/EventsListingSection.jsx`

Purpose:

- canonical public event-discovery section for the `/events` route using the shared section system and discovery controls

### `CoursesListingSection`

Path:

- `src/components/sections/courses-listing-section/CoursesListingSection.jsx`

Purpose:

- canonical public course-discovery section for the `/courses` route using the shared section system and discovery controls

### `EventDetailsSection`

Path:

- `src/components/sections/event-details-section/EventDetailsSection.jsx`

Purpose:

- canonical public event-detail section for the `/events/[eventSlug]` route using the shared article-layout and conversion-aside pattern

### `CourseDetailsSection`

Path:

- `src/components/sections/course-details-section/CourseDetailsSection.jsx`

Purpose:

- canonical public course-detail section for the `/courses/[courseSlug]` route using the shared article-layout and enrolment-aside pattern

### `EventDetailsSection`

Path:

- `src/components/sections/event-details-section/EventDetailsSection.jsx`

Purpose:

- canonical public event-detail section for `/{hubSlug}/events/[eventSlug]` using a section-owned media lead, article layout, and booking aside

### `PlatformShell`

Path:

- `src/components/patterns/platform-shell/PlatformShell.jsx`

Purpose:

- platform route-family shell ownership

### `PlatformSidebar`

Path:

- `src/components/patterns/platform-sidebar/PlatformSidebar.jsx`

Purpose:

- permanent primary navigation for platform routes

### `PlatformTopbar`

Path:

- `src/components/patterns/platform-topbar/PlatformTopbar.jsx`

Purpose:

- platform topbar for account/context utilities

### `OperatorSignOutButton`

Path:

- `src/components/patterns/operator-sign-out-button/OperatorSignOutButton.jsx`

Purpose:

- canonical operator sign-out control for platform and operator-led hub-admin workspaces

### `PublicShell`

Path:

- `src/components/patterns/public-shell/PublicShell.jsx`

Purpose:

- shared hub shell ownership for public and member-facing routes

### `PublicHeader`

Path:

- `src/components/patterns/public-shell/PublicHeader.jsx`

Purpose:

- shared hub header controller for public and member-facing routes with auth-aware utility behavior and mobile drawer ownership

### `PublicMobileNav`

Path:

- `src/components/patterns/public-shell/PublicMobileNav.jsx`

Purpose:

- shared right-side mobile drawer for hub navigation and auth-aware utility links beneath the sticky shared hub header

### `PublicSiteFooter`

Path:

- `src/components/patterns/public-site-footer/PublicSiteFooter.jsx`

Purpose:

- shared public footer scaffolding for hub routes using structured site settings and footer semantic tokens

### `PublicStaticPage`

Path:

- `src/components/patterns/public-static-page/PublicStaticPage.jsx`

Purpose:

- lightweight shared static public route pattern used for placeholder legal/help pages

### `PublicLandingPage`

Path:

- `src/components/patterns/public-landing-page/PublicLandingPage.jsx`

Purpose:

- canonical structured public landing composition driven by hub/site settings and public content feeds

### `PageSettingsOverview`

Path:

- `src/components/patterns/page-settings-overview/PageSettingsOverview.jsx`

Purpose:

- overview pattern for separating route-level page configuration from site-wide settings in hub admin

### `AdminFormSection`

Path:

- `src/components/patterns/admin-form-section/AdminFormSection.jsx`

Purpose:

- shared structural wrapper for grouped admin form sections with consistent hierarchy and spacing

### `AdminFormFooter`

Path:

- `src/components/patterns/admin-form-footer/AdminFormFooter.jsx`

Purpose:

- shared footer surface for full admin forms with consistent feedback and action placement

### `FormStepProgress`

Path:

- `src/components/patterns/form-step-progress/FormStepProgress.jsx`

Purpose:

- shared stepped-form progress indicator for guided multi-step forms with token-aware completed, current, and upcoming states

### `FormSectionTabs`

Path:

- `src/components/patterns/form-section-tabs/FormSectionTabs.jsx`

Purpose:

- shared section-navigation component for large forms that need tabbed editing over one unified form state

## Section Primitives

### `SectionCard`

Path:

- `src/components/sections/primitives/section-card/SectionCard.jsx`

Purpose:

- thin shared shell for public section cards using the section-card semantic token contract

Use for:

- testimonial cards
- future event/course/announcement cards
- repeated public section card surfaces where only shared card scaffolding is needed

Do not use for:

- admin workspace panels
- dashboard/stat cards
- owning internal card anatomy or card-to-card spacing

### `MediaAssetField`

Path:

- `src/components/patterns/media-asset-field/MediaAssetField.jsx`

Purpose:

- structured asset attachment field for hub-scoped records, with direct upload support and a route into the dedicated media workspace

### `HubSignOutButton`

Path:

- `src/components/patterns/hub-sign-out-button/HubSignOutButton.jsx`

Purpose:

- shared hub-scoped authenticated sign-out control for non-platform users outside the public-header utility menu flow

### `HubAdminShell`

Path:

- `src/components/patterns/hub-admin-shell/HubAdminShell.jsx`

Purpose:

- hub-admin shell ownership with explicit hub context, public-site shortcut, and settings shortcut

### `HubAdminTopbar`

Path:

- `src/components/patterns/hub-admin-shell/HubAdminTopbar.jsx`

Purpose:

- compact, route-aware hub-admin topbar that avoids duplicated page-title hierarchy and suppresses redundant shell actions

### `PageHeader`

Path:

- `src/components/patterns/page-header/PageHeader.jsx`

Purpose:

- canonical page-level header for route content areas

### `WorkspaceSection`

Path:

- `src/components/patterns/workspace-section/WorkspaceSection.jsx`

Purpose:

- canonical framed section for operational workspace content

### `WorkflowGuidance`

Path:

- `src/components/patterns/workflow-guidance/WorkflowGuidance.jsx`

Purpose:

- compact operational guidance panel used beside high-impact creation and setup flows

### `WorkspaceThemeToggle`

Path:

- `src/components/patterns/workspace-theme-toggle/WorkspaceThemeToggle.jsx`

Purpose:

- operator-facing theme preference toggle for platform and hub-admin shells, independent from hub public branding

### `HubPaymentsWorkspace`

Path:

- `src/components/patterns/hub-payments-workspace/HubPaymentsWorkspace.jsx`

Purpose:

- hub-admin payments overview for membership, event, and course payment follow-up

### `EmptyState`

Path:

- `src/components/patterns/empty-state/EmptyState.jsx`

Purpose:

- canonical empty-state presentation

### `HubSummaryCard`

Path:

- `src/components/patterns/hub-summary-card/HubSummaryCard.jsx`

Purpose:

- platform hub overview summary card

### `PersonList`

Path:

- `src/components/patterns/person-list/PersonList.jsx`

Purpose:

- list presentation for admins or members

### `InviteLifecycleList`

Path:

- `src/components/patterns/invite-lifecycle-list/InviteLifecycleList.jsx`

Purpose:

- operational invite list pattern for pending admin access with resend and revoke actions

### `EventDetailWorkspace`

Path:

- `src/components/patterns/event-detail-workspace/EventDetailWorkspace.jsx`

Purpose:

- canonical hub-admin event detail workspace pattern

### `EventFormFields`

Path:

- `src/components/patterns/event-form-fields/EventFormFields.jsx`

Purpose:

- shared canonical field contract for event create and event edit flows

### `EventRegistrationWorkspace`

Path:

- `src/components/patterns/event-registration-workspace/EventRegistrationWorkspace.jsx`

Purpose:

- canonical hub-admin event registrations workspace

### `EventAttendanceWorkspace`

Path:

- `src/components/patterns/event-attendance-workspace/EventAttendanceWorkspace.jsx`

Purpose:

- canonical hub-admin event attendance workspace

### `MemberRegistrationWorkspace`

Path:

- `src/components/patterns/member-registration-workspace/MemberRegistrationWorkspace.jsx`

Purpose:

- canonical member self-service workspace for upcoming and historical event bookings

### `MemberMembershipWorkspace`

Path:

- `src/components/patterns/member-membership-workspace/MemberMembershipWorkspace.jsx`

Purpose:

- canonical member self-service workspace for membership status and renewal visibility

### `MemberPaymentsWorkspace`

Path:

- `src/components/patterns/member-payments-workspace/MemberPaymentsWorkspace.jsx`

Purpose:

- canonical member self-service workspace for payment obligations and payment history visibility

### `MemberProfileWorkspace`

Path:

- `src/components/patterns/member-profile-workspace/MemberProfileWorkspace.jsx`

Purpose:

- canonical member self-service workspace for account identity and profile essentials

### `AdminMemberDetailWorkspace`

Path:

- `src/components/patterns/admin-member-detail-workspace/AdminMemberDetailWorkspace.jsx`

Purpose:

- canonical hub-admin workspace for consolidated member identity, membership, booking, and payment context

### `MemberAccountOverview`

Path:

- `src/components/patterns/member-account-overview/MemberAccountOverview.jsx`

Purpose:

- canonical member account landing workspace for surfacing the next relevant self-service tasks without dashboard noise

### `CourseDetailWorkspace`

Path:

- `src/components/patterns/course-detail-workspace/CourseDetailWorkspace.jsx`

Purpose:

- canonical hub-admin operational workspace for a single course

### `CourseFormFields`

Path:

- `src/components/patterns/course-form-fields/CourseFormFields.jsx`

Purpose:

- shared canonical field contract for course create and course edit flows

### `CourseRegistrationWorkspace`

Path:

- `src/components/patterns/course-registration-workspace/CourseRegistrationWorkspace.jsx`

Purpose:

- canonical hub-admin workspace for managing course enrolment state and payment attention

### `CourseAttendanceWorkspace`

Path:

- `src/components/patterns/course-attendance-workspace/CourseAttendanceWorkspace.jsx`

Purpose:

- canonical hub-admin workspace for course attendance and progression marking

### `MemberCourseWorkspace`

Path:

- `src/components/patterns/member-course-workspace/MemberCourseWorkspace.jsx`

Purpose:

- canonical member self-service workspace for current and historical course participation

### `TestimonialAdminList`

Path:

- `src/components/patterns/testimonial-admin-list/TestimonialAdminList.jsx`

Purpose:

- canonical hub-admin list workspace for testimonial review and publishing activity

### `TestimonialDetailWorkspace`

Path:

- `src/components/patterns/testimonial-detail-workspace/TestimonialDetailWorkspace.jsx`

Purpose:

- canonical hub-admin workspace for editing a testimonial record without CMS drift

### `SettingsOverview`

Path:

- `src/components/patterns/settings-overview/SettingsOverview.jsx`

Purpose:

- canonical hub-admin settings landing workspace for directing admins into focused configuration panels

### `ModuleOverview`

Path:

- `src/components/patterns/module-overview/ModuleOverview.jsx`

Purpose:

- transitional module overview pattern for operational surfaces while real workflows are being implemented

Restriction:

- this is transitional and should not become the permanent experience for core product flows

### `WorkspacePlaceholder`

Path:

- `src/components/patterns/workspace-placeholder/WorkspacePlaceholder.jsx`

Purpose:

- temporary operational route placeholder

Restriction:

- roadmap-backed use only

### `PublicRoutePlaceholder`

Path:

- `src/components/patterns/public-route-placeholder/PublicRoutePlaceholder.jsx`

Purpose:

- temporary public route placeholder

Restriction:

- roadmap-backed use only

### `MemberRoutePlaceholder`

Path:

- `src/components/patterns/member-route-placeholder/MemberRoutePlaceholder.jsx`

Purpose:

- temporary member route placeholder

Restriction:

- roadmap-backed use only

### `Modal`

Path:

- `src/components/ui/modal/Modal.jsx`

Purpose:

- reusable overlay dialog for focused secondary workflows such as folder creation and asset upload

### `MediaLibraryWorkspace`

Path:

- `src/components/patterns/media-library-workspace/MediaLibraryWorkspace.jsx`

Purpose:

- canonical hub-admin media workspace with folder organization, asset grid browsing, detail editing, and safe asset operations

## Registry rules

- Add reusable components here when they become part of the intentional architecture.
- Do not add one-off route-local helpers here.
- Transitional placeholder patterns must remain clearly marked as transitional.
- If a component outgrows its documented role, update the registry before expanding use.

### `SupportModeBanner`

Path:

- `src/components/patterns/support-mode-banner/SupportModeBanner.jsx`

Purpose:

- persistent operator-context banner used when a superadmin is working inside hub admin via explicit support mode
