# Emulators and Testing (Rules + Critical Paths)

Goal:
- Provide confidence that rules and auth boundaries match product requirements.
- Prevent shipping with broken rules or insecure defaults.

---

## 1) Emulator Suite (recommended)
- SHOULD use Auth + Firestore + Storage emulators in development.
- SHOULD run rules tests in CI for critical paths.

---

## 2) Minimum rule test cases (HARD for production readiness)
Codex MUST implement tests for:

Users:
- member can read own `/users/{uid}`
- member cannot change `role` or `hubId`
- superadmin can read any user

Events:
- guest can read published event
- guest cannot read draft event
- hub admin can read draft event
- member can register for eligible event
- member cannot mark attendance or set paid on their own registration
- admin can promote waitlist and set paid/attendance

Memberships:
- member can read own membership
- member cannot mark self paid
- admin can mark paid and renew

Pages:
- guest can read published pages
- guest cannot read draft composition (unless server uses Admin SDK)
- superadmin can write drafts

Media:
- admin can list media metadata
- guest cannot list media metadata
- delete denied when usageCount > 0

Avatar:
- member can upload avatar to own path
- member cannot write to another user’s avatar path

---

## 3) Contract tests (recommended)
- SHOULD test state machine transitions in server services (not only UI).
- SHOULD test deterministic auth redirect flow (no bounce loops).
