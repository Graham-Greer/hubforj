# Enterprise copy and design specification

Created/updated: 2026-09-07. Accountable owner: founder. Author/reviewer: Codex. Status: slice 001 copy specified and source-reviewed; programme visual/messaging work and rendered/user validation pending.

Parent: [master](product-site-enterprise-upgrade-master-plan.md), DOC-06/COPY-03/COPY-04; [slice 001](product-site-enterprise-slice-001-identity-reuse.md).

## Slice 001 error copy

- Existing identity: “This email already has sign-in details. Sign in or reset your password to access your existing account. To create a new workspace here, use a different email address.” This intentionally does not promise member-to-commercial onboarding that has not been implemented.
- Previously bound account: “This account already has sign-in details. Sign in or reset your password to recover access.”
- Provider lookup unavailable: “We could not check your sign-in details. Please try again shortly.” Do not expose Firebase diagnostics in this availability check.
- Email fallback unverified: “Verify your email address before linking it to a commercial account.” This does not restrict normal UID-linked sign-in for users completing verification.
- Conflicting UID: “These sign-in details do not match this commercial account.” Never suggest overwriting credentials as recovery.

Existing form error presentation and sign-in/reset routes are reused; no layout or visual claims change. Self-review checked accuracy, next action, terminology and no implied new functionality. Browser/assistive-technology and representative-user review remain outstanding; this document is not the full visual specification or editorial programme sign-off.

## Slice 004 recovery copy review

Implemented `/signup/recover`, a signup error recovery link, sign-in recovery navigation and explicit disabled/saved/missing-setup messages. Copy distinguishes saving setup from workspace readiness and explains that recovery does not start a paid subscription. Legacy/pre-operation failures do not claim automatic recovery. Recovery errors announce with `role="alert"`; form fields retain labels/autocomplete and pending buttons. Invalid signup responses redact passwords.

Codex reviewed local Edge rendering at explicit 390px mobile and 1440px desktop sizes; no horizontal overflow. This verifies rendered layout and copy presence, not keyboard/screen-reader coverage or representative-reader comprehension. Those checks and the complete email/legal/account consistency audit remain required. No invented staffing, response-time or legal promises were added.

## Bounded closure update

Email success copy now requires actual provider acceptance. Missing transport returns unavailable without a generated/logged action link or sent timestamp; reset responses remain non-enumerating. Customer pages no longer treat logged links as delivered. Both actual verification/reset templates were delivered to the authorized founder inbox and their emulator actions verified. See [final handover](product-site-closure-handoff.md) for exact boundaries and deployment prerequisites.
