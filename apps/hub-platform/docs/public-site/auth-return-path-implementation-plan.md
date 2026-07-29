# Auth Return Path Implementation Plan

Status:
- Proposed
- Detailed implementation-planning document

Purpose:
- Define the production-grade return-path rules for sign-in and join
- Ensure visitors continue their public task after authentication where appropriate
- Prevent auth flows from prematurely forcing members into account

Related:
- [Public Header And Navigation Plan](/mnt/c/local/community-app/apps/hub-platform/docs/public-site/public-header-and-navigation-plan.md)
- [Public Auth-Aware UX And CTA Rules](/mnt/c/local/community-app/apps/hub-platform/docs/public-site/public-auth-aware-ux-and-cta-rules.md)

---

## 1) Core problem

Current auth behavior is functional, but the product direction now requires stronger continuity.

The system must avoid:
- redirecting a member to `/account` when they signed in from a public event detail page
- redirecting a member to `/account` when they signed in from a public course detail page
- losing context between public intent and post-auth continuation

---

## 2) Core decision

Authentication should preserve the current public task whenever a safe and meaningful return path exists.

That applies to:
- sign in
- join

This is now the canonical UX rule.

---

## 3) Return-path model

### 3.1 `next` path contract

The system should standardize around one `next` path contract.

That means:
- public CTAs pass a `next` path when auth is required
- sign-in and join pages accept and preserve that `next` value
- final redirect resolution happens centrally

### 3.2 Valid return path rules

The `next` path must:
- be internal
- belong to the resolved hub context
- not point to unsafe destinations
- not allow open redirects

### 3.3 Default fallback

If there is no valid `next` path:
- member fallback => `/{hubSlug}/account`
- admin fallback => `/{hubSlug}/admin`

But these are fallbacks only, not the preferred path when a meaningful public origin exists.

---

## 4) Public CTA implications

Public CTAs that lead to auth should consistently pass context.

Examples:
- event booking CTA
- course enrolment CTA
- members-only content prompts

Those CTAs should not independently invent redirect behavior.

They should all use one shared rule:
- pass the current route as `next` when the user should return there after auth

---

## 5) Sign-in flow rules

### 5.1 Anonymous visitor signs in from public route

If a visitor signs in from:
- an event detail page
- a course detail page
- another public route with clear post-auth continuation

they should return there after successful sign-in if allowed by role and access rules.

### 5.2 Anonymous visitor signs in intentionally for account

If a visitor explicitly initiates sign-in for account access:
- `next` may be absent
- fallback to `/{hubSlug}/account`

### 5.3 Admin sign-in nuance

If an admin signs in from a public route for general browsing:
- preserve public route continuity where appropriate

If an admin signs in intentionally for admin work:
- the resolver may send them to `/{hubSlug}/admin`

This distinction should be explicit in the resolver rather than left to scattered page logic.

---

## 6) Join flow rules

### 6.1 Member join from a public task

If a visitor joins while trying to:
- book an event
- enrol on a course
- access a members-only public route

they should return to that public route after successful account creation, subject to access rules.

### 6.2 Default member join fallback

If there is no meaningful originating task:
- fallback to `/{hubSlug}/account`

### 6.3 Admin invite onboarding

Invite-based admin onboarding remains a separate path.

Its redirects should remain:
- explicit
- invite-aware
- role-aware

It should not be merged carelessly into the general member join return-path rules.

---

## 7) Resolver architecture

The code should centralize redirect logic rather than duplicate it across:
- sign-in page
- join page
- API auth routes
- CTA server actions

### 7.1 Likely helper boundaries

Possible helpers:
- `sanitizeHubReturnPath(...)`
- `resolvePostAuthRedirect(...)`
- `buildAuthHrefWithNext(...)`

### 7.2 Responsibilities

`sanitizeHubReturnPath(...)`
- validates `next`
- ensures hub-safe internal routing

`resolvePostAuthRedirect(...)`
- takes role + hub + sanitized next
- returns the final redirect target

`buildAuthHrefWithNext(...)`
- builds auth links consistently from public CTAs

---

## 8) Security requirements

Return-path handling must not introduce:
- open redirect vulnerabilities
- cross-hub redirect leakage
- malformed next-path crashes

This means:
- validate and normalize centrally
- reject unsafe values
- default safely

---

## 9) Acceptance criteria

This plan should be considered implemented correctly when:
- sign-in from event/course detail returns the user there after auth
- join from event/course detail returns the user there after account creation
- no unsafe external redirects are possible through `next`
- `/account` is used as a fallback, not as an unconditional post-auth destination
- auth redirect logic is centralized rather than duplicated across routes and CTAs

