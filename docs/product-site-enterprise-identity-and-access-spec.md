# Enterprise identity and access specification

Created/updated: 2026-09-07. Owner: founder. Engineering/review: Codex, not independent security assurance. Status: first slice contract ready; broader design pending.

Parent: [master plan](product-site-enterprise-upgrade-master-plan.md), DOC-03, S2-14/RA05. Current-state evidence: [baseline](product-site-enterprise-current-state-and-regression-baseline.md).

## Current slice contract

- Anonymous commercial signup creates only a genuinely new Firebase identity. An existing UID/email, including disabled identities, requires authenticated recovery/onboarding instead. Never update existing credentials from anonymous form input.
- Check email availability before commercial/hub writes; repeat at creation, and rely on Firebase uniqueness to reject a concurrent identity creation. Only `auth/user-not-found` means absence. Outages/permission failures fail closed.
- Accounts with an existing `authUid` cannot acquire a new identity through signup even if that UID is stale.
- Normal sign-in still verifies Firebase tokens with revocation checking. UID-linked accounts may continue the existing unverified-email verification journey.
- Email fallback requires a verified email and a blank or identical UID binding. Existing different bindings are rejected, never overwritten. Re-read and enforce this invariant in the Firestore transaction to close the read/write race.
- Missing commercial account records are not recreated by UID attachment. Repeating the same binding is safe.

## Tradeoffs and next design work

Existing member-only identities cannot acquire a workspace through anonymous signup; that requires a later authenticated onboarding slice. Tell users how to sign in/recover or use a different email; do not imply commercial sign-in alone already creates the missing workspace. A rare concurrent failure after provisioning may leave records; no identity credentials are altered and no successful session/checkout should follow a rejected identity creation. Do not auto-delete orphaned records as compensation.

MFA, existing-session invalidation, ownership transfer, fully resumable provisioning and authenticated identity linking remain open master tasks. Provider/email/account collisions must be covered again when those are implemented. No schema migration or new provider setting is required for this guardrail slice; no secret/config change.

## Signup recovery foundation — slice 002

[Slice 002](product-site-enterprise-slice-002-provisioning-idempotency.md) adds internal provisioning deduplication only. Operation keys are not proof of identity, ownership, email control or permission to resume an account. Never derive them solely from email/slug or accept an arbitrary browser-supplied key as authorization. Signup remains unkeyed until a durable server-owned operation is bound to verified recovery authority. Existing identity guards continue to apply; do not bypass them to make retries succeed.

## Slice 004 implementation contract

[Slice 004](product-site-enterprise-slice-004-signup-recovery.md) now establishes a create-only identity before hub provisioning and persists a random-key initial operation bound to account/UID/email. Pending recovery reuses its immutable payload/key; ownership/account references/paid intent/completion commit together. The explicit recovery POST requires Firebase revocation checking and authentication within five minutes; ordinary sign-in does not provision anything. Current account state and UID are rechecked in data transactions. Completed recovery checks the owner link and existing hub. No password is stored in operations or returned in invalid action state.

`PRODUCT_SITE_SIGNUP_PROVISIONING_ENABLED` defaults off until receiver deployment, access controls, distributed abuse controls and actual provider recovery checks are verified. This supersedes the previous unkeyed-new-signup description: the implemented new signup flow now uses keyed provisioning when enabled. Legacy/pre-operation recovery, member-only onboarding and full lifecycle/session invalidation remain open. No new production flag was enabled in this slice.
# Account-access closure addendum

The bounded STOP-01–08 closure uses version-2 commercial cookies bound to account ID, Firebase UID and original authentication time. Read/issuance checks require a raw active account, the same current UID, an existing enabled Firebase user and no later Firebase token-revocation time. Legacy cookies require reauthentication; email fallback never selects an account for an established session. Invalid sessions can reach sign-in without redirect loops. Account context refreshes email verification from current authority and supplies no stale/deleted/non-owner hub identity. Provider outages fail closed. This supersedes earlier session-gap descriptions for the implemented scope; it does not claim global logout or transactional lifecycle enforcement across both apps. See [release record](product-site-enterprise-release-and-operations-record.md) for costs and rollout constraints and [reconciliation](product-site-incomplete-signup-reconciliation.md) for pre-operation failures.
