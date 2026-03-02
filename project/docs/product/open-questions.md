# Open Questions (Track and Resolve)

This file lists remaining decisions that may affect scope or implementation details.
Resolve items by updating the relevant `docs/product/*.md` files and (if needed) standards.

## 1) Content visibility defaults
- Default for page/event visibility: public or members-only?
- Default for event eligibility: members-only or guests-allowed?

## 2) Guest eligibility definition
We currently define "guest" as "non-member account" (account required).
- Should some hubs require active membership for all registrations by default?

## 3) Currency model
- Single platform currency vs per-hub currency setting?

## 4) Email notification implementation
Email sending is deferred but scoped.
- Which provider? (SendGrid/Mailgun/etc.)
- Should emails be queued with retries (recommended) or synchronous?

## 5) Stripe integration shape (future)
- Stripe at hub-level only, or also per plan/event?
- Webhook processing model and idempotency strategy.

## 6) CMS editing permissions (add-on)
- When `cmsPages` enabled for hub admins, can they create pages or only edit existing?
- Do we need separate CMS roles later (not MVP)?

## 7) Search and filtering
- Do we need full-text search for events/pages/members (likely later)?

## 8) Audit logs
- Should we record an audit trail for admin actions (mark paid, attendance, cancellations)?
  (Recommended for production; MVP may be minimal.)
