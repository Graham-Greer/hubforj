# Hub Admin Invite Email Delivery Implementation Plan

Date: 2026-05-08
Status: Ready for implementation
Scope: `apps/hub-platform`

## Purpose

This document locks the implementation plan for real admin invite email delivery in `hub-platform`.

The goal is to replace the current link-only invite workflow with a proper email-based invite flow using Resend, while keeping `Copy acceptance link` as an operational fallback.

## Locked Decisions

The following decisions are now locked:

1. Admin invite emails will be implemented in `hub-platform`.
2. `Copy acceptance link` remains available as a fallback.
3. `Resend invite` must actually resend the email, not just refresh the invite record.
4. Invite links should use the hub’s public host.
5. If the hub has a connected custom domain, the invite email should use that domain.
6. Otherwise, the invite email should use `https://{hubSlug}.hubforj.com`.
7. Invite emails must not use a custom domain unless the domain is truly connected/live.
8. Invite delivery metadata must be stored so the UI can reflect real delivery state.
9. The UX copy must match actual behavior.

## Current-State Summary

Today, admin invites in `hub-platform`:

- create an invite record in Firestore
- generate an acceptance token and relative join path
- allow manual `Copy acceptance link`
- do not send any email

This means:

- `Send invite` is currently misleading
- `Resend invite` is currently misleading
- the system behaves like a manual link-sharing workflow, not a real invite-delivery workflow

## Target Product Behaviour

### On create invite

When the owner creates an admin invite:

1. the invite record is created
2. an acceptance token is generated
3. a canonical absolute acceptance URL is generated
4. an email is sent to the invited address
5. invite delivery metadata is updated
6. the owner sees a truthful success or failure state

### On resend invite

When the owner resends an invite:

1. the invite remains or becomes valid again
2. expiry is refreshed as needed
3. a fresh invite email is sent
4. invite delivery metadata is updated

### Copy acceptance link

`Copy acceptance link` stays available for:

- manual fallback
- environments where email is not configured
- support/debugging

## Canonical Invite Link Rules

### Rule order

Use the invite link host in this order:

1. connected custom domain
2. platform subdomain: `https://{hubSlug}.hubforj.com`

### Custom domain eligibility

Only use the custom domain if the domain is fully connected/live.

Do not use the custom domain if it is:

- pending verification
- verifying
- verification failed
- disconnected
- disconnect scheduled

In those states, fall back to:

- `https://{hubSlug}.hubforj.com`

### Rationale

This keeps invite emails:

- branded when safe
- operationally stable
- resistant to broken or half-configured domain states

## Delivery Infrastructure

### Email provider

Use Resend in `hub-platform`, consistent with the pattern already used in `product-site`.

### Environment configuration

Add support in `hub-platform` for:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

These should be exposed through:

- [`src/lib/config/env.js`](../../../src/lib/config/env.js)

### Dependency

Add `resend` to:

- [`apps/hub-platform/package.json`](../../../package.json)

## Mailer Architecture

Create a dedicated server-only invite email module rather than inlining email logic in route actions.

### Recommended file direction

- `src/lib/server/admin-invite-email.js`

Responsibilities:

- build canonical invite URL
- generate invite email subject/html/text
- send via Resend
- return normalized send result

### Design requirements

The email should feel consistent with the product ecosystem, but be operationally scoped to hub admin onboarding.

It should include:

- hub name
- invited role
- expiry context
- clear CTA button
- fallback raw URL

Tone:

- professional
- operational
- trust-building
- not commercial/signup-oriented

## Invite Data Model Extensions

The invite record should be extended to store delivery metadata.

### Recommended fields

- `emailSentAt`
- `lastEmailAttemptAt`
- `deliveryStatus`
- `deliveryError`
- `deliveryProvider`
- `deliveryMessageId`

### Delivery status values

Recommended initial states:

- `pending`
- `sent`
- `failed`
- `logged`

`logged` is useful for non-production or fallback behavior where the system cannot actually send mail but logs the link for operators/developers.

## Fallback Behaviour

### When Resend is configured

- send email normally
- update invite delivery metadata
- show success UI

### When Resend is not configured

Recommended fallback:

- log the acceptance URL server-side
- mark the invite delivery state as `logged`
- keep `Copy acceptance link` available
- surface honest admin-facing success copy such as:
  - invite created, but email delivery is not configured in this environment

### Why keep a fallback

This preserves:

- development usability
- staging verification
- support/debugging resilience

without pretending the email was sent.

## UX Changes Required

### Invite form route

Current wording implies delivery that does not exist.

Once email is implemented:

- `Send invite` becomes accurate
- email-delivery hints can remain

If email sending fails or is not configured:

- the form must show truthful feedback

### Pending invite list

`Resend invite` should only remain named that way if it truly sends the email again.

With the new implementation:

- keep `Resend invite`
- update success/error messaging to reflect email delivery outcome

### Success messages

Recommended examples:

- `Invite sent.`
- `Invite resent.`
- `Invite created, but email delivery is not configured in this environment.`

### Keep

- `Copy acceptance link`

This is still valuable even after email delivery exists.

## Implementation Phases

## Phase 1: Infrastructure foundation

### Goal

Prepare `hub-platform` to send transactional email.

### Work

- add `resend` dependency
- add env support in `src/lib/config/env.js`
- document required env vars if needed

### Acceptance criteria

- `hub-platform` can resolve Resend config through server env
- mailer code can be added without ad hoc env access

## Phase 2: Canonical invite URL generation

### Goal

Build a reliable absolute invite URL generator.

### Work

- inspect hub custom-domain state
- resolve whether custom domain is connected
- otherwise build `https://{hubSlug}.hubforj.com/join?...`

### Recommended file direction

- either a helper in admin-invite mailer
- or a dedicated reusable domain helper if needed

### Acceptance criteria

- invite URLs are absolute
- connected custom domains are used
- all non-connected cases fall back to platform subdomain

## Phase 3: Mailer implementation

### Goal

Add the server-only admin invite email sender.

### Work

- create email subject/html/text builders
- send via Resend
- return normalized result payload

### Acceptance criteria

- mailer can send a branded admin invite email
- mailer can return structured failure info

## Phase 4: Invite data model + persistence

### Goal

Store delivery metadata on invite records.

### Work

- extend invite record normalization
- write delivery fields after create/resend attempts
- preserve compatibility with existing records

### Acceptance criteria

- delivery fields exist on new/updated invites
- old invites without those fields still normalize safely

## Phase 5: Create invite flow integration

### Goal

Make invite creation actually send email.

### Work

- create invite record
- build token and URL
- send email
- update delivery metadata
- return truthful action state

### Acceptance criteria

- invite creation sends email in configured environments
- fallback behavior is honest in unconfigured environments

## Phase 6: Resend flow integration

### Goal

Make resend actually resend.

### Work

- refresh invite validity
- generate/send email again
- update delivery metadata

### Acceptance criteria

- resend means resend
- UI messaging matches actual outcome

## Phase 7: UX and copy cleanup

### Goal

Make the route language and feedback match reality.

### Work

- update invite form copy if needed
- update pending invite success/error states
- ensure `Copy acceptance link` remains present and clearly secondary

### Acceptance criteria

- no labels overpromise capabilities
- admin-facing feedback is truthful

## File Areas Likely Affected

### Hub invite flow

- [`src/lib/data/invites.js`](../../../src/lib/data/invites.js)
- [`src/lib/domain/invites.js`](../../../src/lib/domain/invites.js)
- [`src/lib/auth/admin-invite-token.js`](../../../src/lib/auth/admin-invite-token.js)

### Invite UI/actions

- [`src/app/(admin)/[hubSlug]/admin/admins/invite/actions.js`](../../../src/app/(admin)/[hubSlug]/admin/admins/invite/actions.js)
- [`src/app/(admin)/[hubSlug]/admin/admins/invite/AdminInviteForm.jsx`](../../../src/app/(admin)/[hubSlug]/admin/admins/invite/AdminInviteForm.jsx)
- [`src/app/(admin)/[hubSlug]/admin/admins/actions.js`](../../../src/app/(admin)/[hubSlug]/admin/admins/actions.js)
- [`src/app/(admin)/[hubSlug]/admin/admins/page.jsx`](../../../src/app/(admin)/[hubSlug]/admin/admins/page.jsx)
- [`src/components/patterns/invite-lifecycle-list/InviteLifecycleList.jsx`](../../../src/components/patterns/invite-lifecycle-list/InviteLifecycleList.jsx)

### Email/server infrastructure

- [`src/lib/config/env.js`](../../../src/lib/config/env.js)
- new `src/lib/server/admin-invite-email.js`
- possible new reusable host-resolution helper depending on implementation

## Testing Expectations

The implementation should add or update tests for:

- canonical absolute invite URL generation
- custom-domain vs platform-subdomain selection
- invite creation still normalizes correctly
- resend still refreshes the invite lifecycle
- delivery metadata normalization
- route copy reflecting actual email behavior

If the mailer is abstracted cleanly, it should also be directly unit-testable at the pure helper level for:

- subject generation
- HTML/text generation
- URL selection rules

## Risks And Safeguards

### Risk: broken custom-domain links in email

Mitigation:

- only use custom domain when connected/live

### Risk: misleading success states

Mitigation:

- surface honest delivery outcomes
- keep `logged` or `failed` states explicit

### Risk: mail logic embedded in route actions

Mitigation:

- use a dedicated server-only mailer module

### Risk: resend still only mutates state

Mitigation:

- make resend flow call the mailer every time

## Definition Of Done

This work is done when:

- admin invites send email through Resend in configured environments
- invite links use connected custom domains when appropriate
- platform subdomain fallback works for all non-connected domain states
- resend actually resends
- copy-link remains available as fallback
- delivery metadata is stored and normalized
- UI copy truthfully reflects the workflow

## Recommended Next Execution Step

Start with:

1. infrastructure + env support
2. canonical invite URL helper
3. server-only mailer module

Only after that should the invite actions and admin UI be wired into real email delivery.
