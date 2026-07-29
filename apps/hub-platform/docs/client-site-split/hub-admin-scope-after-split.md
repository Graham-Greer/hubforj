# Hub Admin Scope After Split

Status:
- Proposed
- Planning document for what stays in hub admin after public-site concerns move out of admin control

Purpose:
- Define the intended admin surface for the client-site repo
- Remove confusion between site-building concerns and community operations

---

## 1) Core decision

After the split, hub admin should focus on running the community.

Hub admin should not be responsible for building or configuring the client's public site.

That means:
- no public-site composition
- no route creation
- no header/footer authoring as a site-building function
- no template selection as a site-building function
- no branding setup as a client-site delivery function

Those concerns belong to the dev/product team when creating the client site from the starter.

---

## 2) What stays in hub admin

Hub admin should keep:
- admins and invites
- members and membership operations
- membership plans
- events
- courses
- event/course registrations
- event/course attendance
- testimonials
- payments and payment visibility/history as approved

These are the operational capabilities that directly support community management.

---

## 3) What comes out of hub admin

The following current or implied settings should be removed from hub admin in the split model:
- public branding setup
- public template selection
- public navigation setup
- public CTA configuration
- site name/tagline editing as part of site-building
- public page enablement
- public-site route composition

If some of this data still needs to exist at runtime, it should be handled by the client-site code/config, not by hub-admin page-building UI.

---

## 4) Testimonials and articles

Testimonials and articles should remain admin-managed content because they are content records, not page-building tools.

Hub admin should be able to:
- create/edit/publish/archive testimonial records
- create/edit/publish/archive article records once approved in the client-site starter

The dev team decides how those records are surfaced on the client site.

---

## 5) Why this scope is better

This scope is better because it keeps admin aligned to the actual job:
- running events
- managing people
- tracking registrations and attendance
- handling plans/payments
- maintaining trusted community content records

It avoids burdening admins with:
- design decisions
- route/composition logic
- site-building responsibilities that are better handled at delivery time

---

## 6) UX consequence

The hub-admin experience should feel narrower and more confident after the split.

It should read as:
- operations workspace
- people and program management
- finance and attendance visibility

It should not feel like:
- half CMS
- half operations tool

This is a simplification, not a loss.

---

## 7) Implementation implication

When extracting the client-site starter from the current app:
- keep operational admin routes and workflows
- drop or redesign public-site settings routes
- keep only data-management capabilities that still belong to community operations

This should materially simplify the long-term admin surface.
