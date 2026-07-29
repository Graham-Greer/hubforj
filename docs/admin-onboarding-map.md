# Admin Portal Onboarding Map

## Purpose
This document defines a concrete onboarding flow for new hub admins inside the admin portal. It is intended to:

- orient new admins quickly
- reduce first-session overwhelm
- guide setup in the right order
- introduce deeper operational areas only when relevant

This is a product/content planning document, not an implementation spec.

## Principles
- Start with setup, not every module.
- Keep the first-run tour short.
- Use route-level help only when the admin reaches that route.
- Prefer short text steps by default.
- Use video only where motion or sequence genuinely improves comprehension.
- Treat onboarding as progressive disclosure, not a forced product walkthrough.
- Keep onboarding assistive and lightweight so the admin portal still feels operational first.

## Onboarding Structure
The recommended onboarding system has 3 layers:

1. Welcome tour on `/admin`
- short orientation
- highlights the most important setup destinations

2. Setup checklist
- persistent progress tracker
- helps admins understand what “done” looks like

3. Route-level contextual tours
- shown only when an admin first enters a module
- tailored to the page they are on

## Recommended First-Run Checklist
- Complete site details
- Complete branding
- Upload core media assets
- Set homepage content
- Add What we do items
- Add testimonials
- Review account and package settings
- Create your first event
- Create your first course
- Review members and admin access

## Step Format Guidance
### Text-only step
Use when:
- the action is obvious
- the UI is simple
- the goal is directional

Recommended contents:
- title
- one short sentence of context
- one short instruction
- CTA: `Next`, `Skip`, or `Take me there`

### Video step
Use when:
- the task has multiple controls
- the flow is procedural
- the admin benefits from seeing sequence or motion

Recommended contents:
- title
- one sentence of framing
- 20-40 second muted looping clip
- CTA: `Next`

Recommended video format:
- MP4 or WebM
- muted
- autoplay
- loop
- tightly cropped to the relevant UI
- one concept per clip

## Global Rules
- Every tour should have `Skip` and `Close`.
- Every route-level tour should be dismissible and not reappear unless manually restarted.
- Prefer 3-5 steps per route.
- Avoid long paragraphs.
- If a route has both beginner and advanced actions, onboard only the beginner actions first.
- Only one journey should auto-open at a time.
- Do not auto-open a second journey in the same session immediately after a dismissal.
- Video is enhancement, not dependency. Every video step must still make sense if rendered as text only.

---

## Layer 1: Welcome Tour
### Route
- `/{hubSlug}/admin`

### Goal
Orient the admin and move them into the core setup sequence.

### Step 1
- Route: `/{hubSlug}/admin`
- Target: Page header / overview intro
- Type: Text only
- Title: `Welcome to your admin portal`
- Copy: `This is your operational home for managing your website, members, content, events, courses, and payments. We will start with the core setup areas first.`
- CTA: `Next`

### Step 2
- Route: `/{hubSlug}/admin`
- Target: `Site settings` nav item
- Type: Text only
- Title: `Set your core site details`
- Copy: `Start in Site settings to set the name, core details, and brand foundations for your hub.`
- CTA: `Open Site settings`

### Step 3
- Route: `/{hubSlug}/admin`
- Target: `Page settings` nav item
- Type: Text only
- Title: `Shape the public pages`
- Copy: `Page settings controls your homepage and key public routes. This is where your public website starts to feel real.`
- CTA: `Next`

### Step 4
- Route: `/{hubSlug}/admin`
- Target: `Media` nav item
- Type: Text only
- Title: `Upload your media first`
- Copy: `Add your logo, homepage visuals, and supporting images before editing content sections. It will make the rest of setup much smoother.`
- CTA: `Next`

### Step 5
- Route: `/{hubSlug}/admin`
- Target: `What we do` and `Testimonials` nav items
- Type: Text only
- Title: `Add your first public content`
- Copy: `Use What we do and Testimonials to build the first meaningful content on your homepage.`
- CTA: `Next`

### Step 6
- Route: `/{hubSlug}/admin`
- Target: `Events`, `Courses`, `Members`, `Account settings`
- Type: Text only
- Title: `Then move into operations`
- Copy: `Once your hub basics are in place, you can create offerings, review members, and complete package or domain setup when needed.`
- CTA: `Go to my next setup task`

---

## Layer 2: Route-Level Tours

## Settings Overview Tour
### Route
- `/{hubSlug}/admin/settings`

### Goal
Help the admin understand the two site-settings areas shown on this route before they enter them.

### Step 1
- Route: `/{hubSlug}/admin/settings`
- Target: Branding panel/card
- Type: Text only
- Title: `Start with branding`
- Copy: `Use Branding to control the public identity and appearance of your hub before refining page content.`
- CTA: `Next`

### Step 2
- Route: `/{hubSlug}/admin/settings`
- Target: Site panel/card
- Type: Text only
- Title: `Then complete site details`
- Copy: `Use Site to manage contact details, public-facing information, and structured configuration that supports the website.`
- CTA: `Next`

### Step 3
- Route: `/{hubSlug}/admin/settings`
- Target: route-level orientation
- Type: Text only
- Title: `Use other settings routes separately`
- Copy: `Page settings and Account settings are separate routes in the admin portal and should be onboarded when the admin reaches them directly.`
- CTA: `Finish`

## Site Details Tour
### Route
- `/{hubSlug}/admin/settings/site`

### Goal
Help the admin complete core site details confidently.

### Step 1
- Route: `/{hubSlug}/admin/settings/site`
- Target: site details form
- Type: Text only
- Title: `Set your hub details`
- Copy: `This form controls the core identity and contact details for your hub. Complete this before moving into homepage content.`
- CTA: `Next`

### Step 2
- Route: `/{hubSlug}/admin/settings/site`
- Target: save button
- Type: Text only
- Title: `Save and return`
- Copy: `When you save, you will return to Settings so you can continue setup without losing your place.`
- CTA: `Finish`

## Branding Tour
### Route
- `/{hubSlug}/admin/settings/branding`

### Goal
Teach the admin how branding affects the public site.

### Step 1
- Route: `/{hubSlug}/admin/settings/branding`
- Target: brand form
- Type: Video
- Title: `Brand your hub`
- Copy: `This is where you control the visual identity of your public site, including logos, colors, and template presentation.`
- Video:
  - `branding-settings-overview-light.mp4`
  - `branding-settings-overview-dark.mp4`
- CTA: `Next`

### Step 2
- Route: `/{hubSlug}/admin/settings/branding`
- Target: save button
- Type: Text only
- Title: `Apply your branding`
- Copy: `Save here once your visual identity is in place, then review how it appears on the public site.`
- CTA: `Finish`

## Homepage Settings Tour
### Route
- `/{hubSlug}/admin/settings/pages/home`

### Goal
Teach homepage structure and editing behavior.

### Step 1
- Route: `/{hubSlug}/admin/settings/pages/home`
- Target: section tabs
- Type: Text only
- Title: `Edit one homepage section at a time`
- Copy: `The homepage editor is broken into focused sections so you can update the page in manageable steps.`
- CTA: `Next`

### Step 2
- Route: `/{hubSlug}/admin/settings/pages/home`
- Target: hero section
- Type: Video
- Title: `Set the homepage hero`
- Copy: `Start with the hero to define the main message, media, and first actions visitors see.`
- Video:
  - `homepage-hero-editing-light.mp4`
  - `homepage-hero-editing-dark.mp4`
- CTA: `Next`

### Step 3
- Route: `/{hubSlug}/admin/settings/pages/home`
- Target: About / What we do / Testimonials sections
- Type: Text only
- Title: `Support the hero with clear content`
- Copy: `Use the remaining sections to explain your offering, build trust, and guide visitors toward the right next step.`
- CTA: `Next`

### Step 4
- Route: `/{hubSlug}/admin/settings/pages/home`
- Target: action link fields
- Type: Text only
- Title: `Use action links carefully`
- Copy: `Primary and secondary actions should drive visitors toward joining, signing in, or exploring your events and courses.`
- CTA: `Finish`

## Page Settings Scope Note
- Do not create separate onboarding tours for `/{hubSlug}/admin/settings/pages/events` or `/{hubSlug}/admin/settings/pages/courses`.
- These routes only control the hero content for those pages and do not teach operational event or course management.
- After the homepage tour, assume admins understand how hero-level page editing works.

## Account Settings Tour
### Route
- `/{hubSlug}/admin/settings/account`

### Goal
Teach the admin what belongs in package, payment, and domain setup.

### Package-adaptive rule
- This tour should adapt by package tier.
- `Free`: emphasize package understanding and upgrade pathways.
- `Starter`: emphasize external payments, package limits, and domain/custom-domain setup where available.
- `Growth`: emphasize native payment readiness, Stripe setup health, and full domain/payment operations.

### Step 1
- Route: `/{hubSlug}/admin/settings/account`
- Target: package section
- Type: Text only
- Title: `Understand your package`
- Copy: `This area shows what package your hub is on and what capabilities are available to you.`
- CTA: `Next`

### Step 2
- Route: `/{hubSlug}/admin/settings/account`
- Target: Stripe setup / payment setup area
- Type: Video
- Title: `Prepare payments when needed`
- Copy by package:
  - `Free`: `This area explains what payment capability becomes available on paid packages and where to go when you are ready to upgrade.`
  - `Starter`: `This area explains your current external payment setup path and where Growth would unlock built-in payment handling.`
  - `Growth`: `This area is where native payment readiness and connected account setup should be reviewed.`
- Video:
  - `account-settings-payments-overview-light.mp4`
  - `account-settings-payments-overview-dark.mp4`
- CTA: `Next`

### Step 3
- Route: `/{hubSlug}/admin/settings/account`
- Target: domain section
- Type: Video
- Title: `Manage your domain`
- Copy: `This is where you connect and verify the address people use to visit your website.`
- Video:
  - `account-settings-domain-setup-light.mp4`
  - `account-settings-domain-setup-dark.mp4`
- CTA: `Finish`

## Media Tour
### Route
- `/{hubSlug}/admin/media`

### Goal
Help the admin upload and organize assets before editing content-heavy areas.

### Step 1
- Route: `/{hubSlug}/admin/media`
- Target: upload action
- Type: Video
- Title: `Upload your first media`
- Copy: `Start by uploading your logo, one homepage image, and any supporting visuals you already have ready.`
- Video:
  - `media-upload-first-assets-light.mp4`
  - `media-upload-first-assets-dark.mp4`
- CTA: `Next`

### Step 2
- Route: `/{hubSlug}/admin/media`
- Target: folder controls
- Type: Text only
- Title: `Keep assets organized`
- Copy: `Folders make it easier to reuse assets later across homepage content, events, courses, and testimonials.`
- CTA: `Next`

### Step 3
- Route: `/{hubSlug}/admin/media`
- Target: asset detail / picker behavior
- Type: Video
- Title: `Reuse media across the portal`
- Copy: `Once assets are uploaded, you can reuse them throughout the admin portal instead of uploading duplicates.`
- Video:
  - `media-reuse-across-admin-light.mp4`
  - `media-reuse-across-admin-dark.mp4`
- CTA: `Finish`

## What We Do Tour
### Route
- `/{hubSlug}/admin/what-we-do`

### Goal
Teach admins how to create structured offering content for the homepage.

### Step 1
- Route: `/{hubSlug}/admin/what-we-do`
- Target: create item action
- Type: Text only
- Title: `Add your offering cards`
- Copy: `Use What we do items to explain the main things your community offers. Aim for 3 to 6 items for a strong homepage layout.`
- CTA: `Next`

### Step 2
- Route: `/{hubSlug}/admin/what-we-do`
- Target: item list / compact menu
- Type: Text only
- Title: `Manage each item from the list`
- Copy: `Use the menu on each item to edit or delete it without leaving the content management flow.`
- CTA: `Finish`

## Testimonials Tour
### Route
- `/{hubSlug}/admin/testimonials`

### Goal
Teach admins how testimonials support trust on the public site.

### Step 1
- Route: `/{hubSlug}/admin/testimonials`
- Target: create testimonial action
- Type: Text only
- Title: `Add trust content`
- Copy: `Testimonials help visitors understand the impact of your community and can strengthen conversion across the site.`
- CTA: `Next`

### Step 2
- Route: `/{hubSlug}/admin/testimonials`
- Target: list / compact menu
- Type: Text only
- Title: `Control publishing and maintenance`
- Copy: `Use the testimonial list to review, publish, edit, or remove items as your public content evolves.`
- CTA: `Finish`

## Membership Plans Tour
### Route
- `/{hubSlug}/admin/payments?view=plans`

### Goal
Help admins understand free vs paid plans and upgrade handling.

### Step 1
- Route: `/{hubSlug}/admin/payments?view=plans`
- Target: plan list
- Type: Text only
- Title: `Define your membership structure`
- Copy: `Membership plans determine what tiers your community offers and how members move between them.`
- CTA: `Next`

### Step 2
- Route: `/{hubSlug}/admin/payments?view=plans`
- Target: create/edit plan form
- Type: Video
- Title: `Create or update plans`
- Copy: `Use this area to define pricing, renewal cadence, visibility, and any external payment instructions where relevant.`
- Video:
  - `membership-plan-create-edit-light.mp4`
  - `membership-plan-create-edit-dark.mp4`
- CTA: `Next`

### Step 3
- Route: `/{hubSlug}/admin/payments?view=plans`
- Target: upgrade requests area
- Type: Text only
- Title: `Review member upgrade requests`
- Copy: `If members request plan changes, this is where admins can review and action those requests.`
- CTA: `Finish`

## Stripe Setup Tour
### Route
- `/{hubSlug}/admin/payments?view=setup`

### Goal
Explain payment-readiness setup for native payments.

### Package-adaptive rule
- `Free`: this route should either not onboard or should explain that native payment setup is not available on the current package.
- `Starter`: this route should explain that native payment setup is a Growth-level capability.
- `Growth`: this route should fully onboard native payment setup and status review.

### Step 1
- Route: `/{hubSlug}/admin/payments?view=setup`
- Target: setup status area
- Type: Text only
- Title by package:
  - `Free`: `Understand payment availability`
  - `Starter`: `Understand native payment availability`
  - `Growth`: `Check payment readiness`
- Copy by package:
  - `Free`: `This area explains that platform-native payment setup is not available on the current package.`
  - `Starter`: `This area explains that native payment setup becomes available on Growth, while Starter uses external payment links.`
  - `Growth`: `This area shows whether your hub is ready to take platform-native payments and what still needs attention.`
- CTA: `Next`

### Step 2
- Route: `/{hubSlug}/admin/payments?view=setup`
- Target: onboarding / refresh actions
- Type: Video
- Title by package:
  - `Free`: `See what this unlocks later`
  - `Starter`: `See what Growth unlocks`
  - `Growth`: `Complete payment setup`
- Copy by package:
  - `Free`: `When you move onto a paid package, this is where payment setup guidance will appear.`
  - `Starter`: `When you upgrade to Growth, this is where built-in payment setup and readiness checks will appear.`
  - `Growth`: `Follow the setup actions here to connect and confirm your payment account status.`
- Video:
  - `stripe-setup-admin-flow-light.mp4`
  - `stripe-setup-admin-flow-dark.mp4`
- CTA: `Finish`

## Payments Tour
### Route
- `/{hubSlug}/admin/payments?view=payments`

### Goal
Help admins understand payment records and reconciliation.

### Package-adaptive rule
- `Free`: focus on plan/package limitation messaging if this route is exposed.
- `Starter`: focus on externally managed payment records and admin follow-up.
- `Growth`: focus on native payment records, reconciliation, and exceptions.

### Step 1
- Route: `/{hubSlug}/admin/payments?view=payments`
- Target: payment list
- Type: Text only
- Title: `Review payment activity`
- Copy: `Use this view to track transaction state, exceptions, and payment records tied to members, events, courses, and plans.`
- CTA: `Next`

### Step 2
- Route: `/{hubSlug}/admin/payments?view=payments`
- Target: payment detail links / filters
- Type: Video
- Title: `Investigate and reconcile`
- Copy: `Use filters and record detail views when you need to follow up on a payment or understand what happened.`
- Video:
  - `payments-record-review-light.mp4`
  - `payments-record-review-dark.mp4`
- CTA: `Finish`

## Events List Tour
### Route
- `/{hubSlug}/admin/events`

### Goal
Explain lifecycle management for events.

### Step 1
- Route: `/{hubSlug}/admin/events`
- Target: create event action
- Type: Text only
- Title: `Create and manage events`
- Copy: `This area handles the full event lifecycle, from setup and publishing through registrations and attendance.`
- CTA: `Next`

### Step 2
- Route: `/{hubSlug}/admin/events`
- Target: create flow orientation
- Type: Video
- Title: `See how event management works`
- Copy: `This short walkthrough shows how events move from creation into editing, registrations, and attendance management once items exist.`
- Video:
  - `events-list-and-lifecycle-light.mp4`
  - `events-list-and-lifecycle-dark.mp4`
- CTA: `Finish`

## Event Create/Edit Tour
### Route
- `/{hubSlug}/admin/events/create`
- `/{hubSlug}/admin/events/{eventId}?mode=edit`

### Goal
Teach the event authoring flow.

### Step 1
- Route: event create/edit
- Target: section tabs
- Type: Text only
- Title: `Work section by section`
- Copy: `The event form is grouped into focused sections so setup stays manageable.`
- CTA: `Next`

### Step 2
- Route: event create/edit
- Target: pricing and booking settings
- Type: Video
- Title: `Configure registrations and payment`
- Copy: `Use the event form to set pricing, booking mode, eligibility, waitlist behavior, and publishing state.`
- Video:
  - `event-create-pricing-and-booking-light.mp4`
  - `event-create-pricing-and-booking-dark.mp4`
- CTA: `Next`

### Step 3
- Route: event create/edit
- Target: save action
- Type: Text only
- Title: `Save as you refine`
- Copy: `Once saved, the event can be opened for deeper operational tasks like registrations and attendance.`
- CTA: `Finish`

## Event Detail Tour
### Route
- `/{hubSlug}/admin/events/{eventId}`

### Goal
Explain the difference between editing an event and managing operations on a live event.

### Step 1
- Route: event detail
- Target: summary facts
- Type: Text only
- Title: `Use this page for operations`
- Copy: `This screen helps you monitor registrations, attendance, and event state once the event exists.`
- CTA: `Next`

### Step 2
- Route: event detail
- Target: registrations / attendance links or sections
- Type: Text only
- Title: `Move into live management`
- Copy: `From here you can inspect attendee records, track attendance, and handle event-specific admin work.`
- CTA: `Finish`

## Courses List Tour
### Route
- `/{hubSlug}/admin/courses`

### Goal
Explain lifecycle management for courses.

### Step 1
- Route: `/{hubSlug}/admin/courses`
- Target: create course action
- Type: Text only
- Title: `Create and manage courses`
- Copy: `This area handles structured course delivery, enrolments, pricing, and course lifecycle management.`
- CTA: `Next`

### Step 2
- Route: `/{hubSlug}/admin/courses`
- Target: create flow orientation
- Type: Video
- Title: `See how course management works`
- Copy: `This short walkthrough shows how courses move from creation into editing, enrolments, and operational management once items exist.`
- Video:
  - `courses-list-and-lifecycle-light.mp4`
  - `courses-list-and-lifecycle-dark.mp4`
- CTA: `Finish`

## Course Create/Edit Tour
### Route
- `/{hubSlug}/admin/courses/create`
- `/{hubSlug}/admin/courses/{courseId}?mode=edit`

### Goal
Teach course authoring without making it feel like an event clone.

### Step 1
- Route: course create/edit
- Target: section tabs
- Type: Text only
- Title: `Build the course section by section`
- Copy: `The course form separates structure, schedule, enrolment, pricing, and delivery so you can work methodically.`
- CTA: `Next`

### Step 2
- Route: course create/edit
- Target: registration and pricing areas
- Type: Video
- Title: `Control enrolment and payment`
- Copy: `Use this form to define registration windows, capacity, delivery format, pricing, and payment expectations.`
- Video:
  - `course-create-registration-and-pricing-light.mp4`
  - `course-create-registration-and-pricing-dark.mp4`
- CTA: `Next`

### Step 3
- Route: course create/edit
- Target: save action
- Type: Text only
- Title: `Save, then manage operations`
- Copy: `After saving, use the course detail and registration views for the operational side of course delivery.`
- CTA: `Finish`

## Members List Tour
### Route
- `/{hubSlug}/admin/members`

### Goal
Teach list review and navigation into individual records.

### Step 1
- Route: `/{hubSlug}/admin/members`
- Target: member list / filters
- Type: Text only
- Title: `Review your members here`
- Copy: `Use this workspace to search, filter, and identify members who need attention.`
- CTA: `Next`

### Step 2
- Route: `/{hubSlug}/admin/members`
- Target: member row or record link
- Type: Text only
- Title: `Open the full member record`
- Copy: `Select a member to review status, membership, payments, and booking activity in one place.`
- CTA: `Finish`

## Member Detail Tour
### Route
- `/{hubSlug}/admin/members/{memberId}`

### Goal
Teach the structure of a member record.

### Step 1
- Route: member detail
- Target: header / summary card
- Type: Text only
- Title: `Start with identity and current status`
- Copy: `This top area gives you the member's identity, account status, and the fastest access to key actions.`
- CTA: `Next`

### Step 2
- Route: member detail
- Target: member state section
- Type: Text only
- Title: `Control access carefully`
- Copy: `Use the member state controls when you need to suspend or reactivate access. Suspension includes confirmation because it affects normal hub use.`
- CTA: `Next`

### Step 3
- Route: member detail
- Target: membership section
- Type: Video
- Title: `Manage membership and plan changes`
- Copy: `This area is where you assign plans, review upgrade requests, and manage membership state.`
- Video:
  - `member-record-membership-actions-light.mp4`
  - `member-record-membership-actions-dark.mp4`
- CTA: `Next`

### Step 4
- Route: member detail
- Target: payment history and registrations
- Type: Text only
- Title: `Review billing and activity`
- Copy: `Use the lower sections to understand this member's payment history, bookings, and course enrolments.`
- CTA: `Finish`

## Admins Tour
### Route
- `/{hubSlug}/admin/admins`

### Goal
Teach invite-based admin access management.

### Step 1
- Route: `/{hubSlug}/admin/admins`
- Target: invite admin action
- Type: Text only
- Title: `Invite trusted admins`
- Copy: `Use this area to control who has admin access to the hub and keep that access explicit and traceable.`
- CTA: `Next`

### Step 2
- Route: `/{hubSlug}/admin/admins`
- Target: active admins / invite list
- Type: Text only
- Title: `Review access and pending invites`
- Copy: `You can monitor current admins and any outstanding invitations from this page.`
- CTA: `Finish`

---

## Recommended Video Priority List
If video production needs to be phased, make these first:

1. `Media` upload and reuse
2. `Homepage settings` hero editing
3. `Account settings` domain setup
4. `Membership plans` create/edit
5. `Events` create flow
6. `Courses` create flow
7. `Member detail` membership actions
8. `Payments` review flow

## Recommended V1 Launch Scope
If onboarding needs to ship in phases, launch this first:

### Phase 1
- `/admin` welcome tour
- `Site settings`
- `Page settings`
- `Media`
- `What we do`
- `Testimonials`
- `Events`
- `Courses`

### Phase 2
- `Membership plans`
- `Members`
- `Member detail`
- `Account settings`

### Phase 3
- `Payments`
- `Stripe setup`
- `Admins`

## Content Tone Guidance
- calm
- concise
- task-oriented
- confident but not salesy

Avoid:
- long explanations
- internal package jargon unless necessary
- generic “click here to continue” filler

Prefer:
- “Use this area to…”
- “Start by…”
- “Once saved…”
- “This is where…”

## Decision Outcomes
- Every onboarding journey should be restartable from a help menu on that route.
- Route-level tours should trigger automatically on first visit.
- Video assets should be recorded in both light and dark admin theme variants.
- The tour should display the currently selected light/dark version automatically.
- The help control should live in the bottom-right corner as an always-available floating touch target using a question mark icon.
- Homepage, media, events, and courses should remain in v1.

## Checklist Clarification
The checklist is a persistent onboarding progress module for new admins.

Recommended behavior:
- show it on `/{hubSlug}/admin`
- list the core setup tasks in order
- let admins open the relevant route from each checklist item
- mark items complete once the underlying requirement is met
- keep it dismissible, but restartable from help

Suggested completion rules:
- `Complete site details`: required site fields saved
- `Complete branding`: branding settings meaningfully updated or explicitly saved
- `Upload core media assets`: at least one logo and one general-purpose image uploaded
- `Set homepage content`: homepage settings saved
- `Add What we do items`: at least 3 published items
- `Add testimonials`: at least 1 published testimonial
- `Review account and package settings`: account settings route visited
- `Create your first event`: first event created
- `Create your first course`: first course created
- `Review members and admin access`: members route and admins route visited

## Checklist Semantics
Use two checklist completion styles only:
- `visited`: the admin has meaningfully opened the route once
- `configured`: the underlying setup condition is actually satisfied

This keeps the checklist useful without making it feel like a training scorecard.

## Role Awareness
- Onboarding state should persist per admin user, per hub, with awareness of whether the actor is an `owner` or regular `admin`.
- Owner-only or higher-privilege actions should not be spotlighted for admins who cannot actually use them.

## Video Asset List
This is the current video inventory implied by the onboarding plan.

### Account settings
- `account-settings-payments-overview-light.mp4`
- `account-settings-payments-overview-dark.mp4`
- `account-settings-domain-setup-light.mp4`
- `account-settings-domain-setup-dark.mp4`

### Media
- `media-upload-first-assets-light.mp4`
- `media-upload-first-assets-dark.mp4`
- `media-reuse-across-admin-light.mp4`
- `media-reuse-across-admin-dark.mp4`

### Homepage
- `homepage-hero-editing-light.mp4`
- `homepage-hero-editing-dark.mp4`

### Membership plans
- `membership-plan-create-edit-light.mp4`
- `membership-plan-create-edit-dark.mp4`

### Payments
- `stripe-setup-admin-flow-light.mp4`
- `stripe-setup-admin-flow-dark.mp4`
- `payments-record-review-light.mp4`
- `payments-record-review-dark.mp4`

### Events
- `events-list-and-lifecycle-light.mp4`
- `events-list-and-lifecycle-dark.mp4`
- `event-create-pricing-and-booking-light.mp4`
- `event-create-pricing-and-booking-dark.mp4`

### Courses
- `courses-list-and-lifecycle-light.mp4`
- `courses-list-and-lifecycle-dark.mp4`
- `course-create-registration-and-pricing-light.mp4`
- `course-create-registration-and-pricing-dark.mp4`

### Members
- `member-record-membership-actions-light.mp4`
- `member-record-membership-actions-dark.mp4`
