# Deployment: Rules, Indexes, and Safety

Goal:
- Ensure Firebase rules and indexes are deployed safely and in sync with code changes.

---

## 1) Deployment artifacts (HARD)
For each release that changes data access:
- MUST deploy Firestore rules.
- MUST deploy Storage rules.
- MUST deploy Firestore indexes (if new query patterns introduced).

---

## 2) Release gates (HARD)
A milestone is NOT complete unless:
- rules updated for any touched collections
- indexes created for any new query surfaces
- emulator/rules tests updated for critical paths

---

## 3) Incremental rollout (recommended)
- SHOULD ship schema changes with backward compatibility:
  - dual-read/dual-write where needed
  - lazy migration on read for minor field additions

---

## 4) Observability (recommended)
- SHOULD log server-side mutations for critical flows:
  - hub provisioning
  - event publish/cancel
  - registration promote/cancel
  - membership renew/mark paid
  - media upload and delete attempts (especially denied due to usage)
