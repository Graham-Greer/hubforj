# Client Site Route And Auth Plan

Status:
- Proposed
- Planning document for the client-site route map and auth/session model

Purpose:
- Define the canonical route model for one-hub client sites
- Define how member and admin auth should work on the client domain
- Make clear which current assumptions from `apps/hub-platform` are being replaced

---

## 1) Route philosophy

The client-site repo is a single-hub app.

Therefore:
- routes should be clean
- routes should not include `[hubSlug]`
- route ownership should remain explicit across public, member, and admin surfaces

This keeps the client domain coherent:
- public, member, and admin all belong to the same branded site

---

## 2) Canonical public routes

The starter should provide:
- `/`
- `/about`
- `/events`
- `/events/[eventSlug]`
- `/courses`
- `/courses/[courseSlug]`
- `/articles`
- `/articles/[articleSlug]`
- `/contact`
- `/privacy-policy`
- `/terms`
- `/join`
- `/sign-in`

Additional client-specific routes may be added by the dev team when building a client site from the starter.

---

## 3) Canonical member routes

The starter should provide:
- `/account`
- `/account/membership`
- `/account/registrations`
- `/account/courses`
- `/account/payments`
- `/account/profile`

These remain focused self-service routes.

---

## 4) Canonical admin routes

The starter should provide:
- `/admin`
- `/admin/admins`
- `/admin/admins/invite`
- `/admin/members`
- `/admin/members/[memberId]`
- `/admin/events`
- `/admin/events/create`
- `/admin/events/[eventId]`
- `/admin/events/[eventId]/registrations`
- `/admin/events/[eventId]/attendance`
- `/admin/courses`
- `/admin/courses/create`
- `/admin/courses/[courseId]`
- `/admin/courses/[courseId]/registrations`
- `/admin/courses/[courseId]/attendance`
- `/admin/testimonials`
- `/admin/testimonials/create`
- `/admin/testimonials/[testimonialId]`
- `/admin/payments`

This route map keeps the operational core and deliberately excludes public-site editing capabilities.

---

## 5) Hub resolution

Because the app is single-hub, hub resolution should come from configuration rather than route params.

Recommended model:
- load fixed hub identity from config
- resolve the hub record at the server boundary
- make hub context available to shells and routes

The route system should not need slug-based hub resolution at runtime.

---

## 6) Member auth on the client domain

Member auth should:
- establish session on the client domain
- support server-first route protection
- redirect deterministically between sign-in, join, account, and booking flows

The core expectations remain the same as the current app, but the host/domain model changes.

---

## 7) Admin auth on the client domain

Hub-admin auth should:
- establish session on the client domain
- protect `/admin/*` server-side
- support invite acceptance and onboarding
- redirect admins safely into admin routes rather than member destinations

This is a key shift from the current standards, which assumed admin stayed on the product domain.

---

## 8) Public auth-aware behavior

Public routes must still adapt to:
- anonymous visitor
- signed-in member
- signed-in admin

This affects:
- navigation
- CTA behavior
- join/sign-in redirects
- booking/register flows
- admin/account entry affordances

The auth-aware UX work already identified for the public site remains relevant in the client-site model.

---

## 9) What changes from the current app

The following current assumptions are replaced:
- `/(public)/[hubSlug]/*`
- `/(member)/[hubSlug]/account/*`
- `/(admin)/[hubSlug]/admin/*`
- admin on shared platform host
- hub resolution through route slug everywhere

The following current behaviors remain conceptually valid:
- server-first route protection
- thin route files
- shared shell ownership
- shared auth-aware CTA rules
- strict hub-scoped data access

---

## 10) Immediate implementation implications

The starter repo will need:
- a new route tree
- a new hub-resolution boundary
- a client-domain session model
- extraction of reusable auth/session logic from the current app where possible

The current route files and domain logic are still useful reference material, but the route model itself must be rewritten for the single-hub client-site architecture.
