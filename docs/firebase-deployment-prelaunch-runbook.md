# Firebase Deployment Pre-Launch Runbook

## Purpose

This runbook covers Firebase deployment hygiene for the active launch apps:

- `apps/product-site`
- `apps/hub-platform`

The old top-level `project/` scaffold has been removed. The active launch should only consider the root files plus the two active apps.

## Current Source Of Truth

Current active launch artifact:

- `firebase.json`
- `firestore.indexes.json`

The root Firebase config points the Firebase CLI at the root index file only. It does not define Firestore rules, Storage rules, or hosting.

This root index file contains the notification outbox and scheduled membership indexes required by the internal processors.

## Firestore Index Deployment

Before deploying indexes, confirm the Firebase project you intend to target.

Example command from the repo root:

```powershell
cd C:\local\community-app
firebase deploy --only firestore:indexes --project your-firebase-project-id
```

The root `firestore.indexes.json` must include:

- `notificationOutbox` by `status` then `scheduledFor`
- `notificationOutbox` by `status` then `processingStartedAt`
- `memberships` by `scheduledChangeStatus`, `scheduledChangeType`, then `scheduledChangeAt`

These indexes are required by:

- `apps/hub-platform/src/lib/data/notification-outbox.js`
- `apps/hub-platform/src/app/api/internal/booking-notifications/process/route.js`
- `apps/hub-platform/src/lib/data/membership-user-records.js`
- `apps/hub-platform/src/app/api/internal/memberships/process-scheduled-changes/route.js`

## Rules And Storage Status

The active product-site + hub-platform launch does not currently have a reviewed root Firebase rules or Storage rules source of truth.

Current posture:

- Most application data access uses the Firebase Admin SDK from server code.
- Admin SDK access bypasses Firestore and Storage security rules.
- Firebase client SDK usage is primarily Auth-focused.
- Public media reads are an intentional product requirement for hub public pages.
- Media/upload hardening was intentionally deferred and should be revisited separately.

Before deploying Firestore or Storage rules for the active apps, create reviewed root-level rules deliberately.

## Pre-Deploy Checklist

- Confirm target Firebase project ID.
- Confirm root `firebase.json` points at `firestore.indexes.json`.
- Confirm root `firestore.indexes.json` contains notification outbox indexes.
- Confirm root `firestore.indexes.json` contains scheduled membership indexes.
- Confirm no old `project/` Firebase scaffold is being used for the active product launch.
- Confirm booking notification processor route is protected by `INTERNAL_AUTOMATION_SECRET`.
- Confirm scheduler/cron uses the same `INTERNAL_AUTOMATION_SECRET`.

## Post-Deploy Smoke Checks

After deploying indexes:

1. Run the booking notification processor once.
2. Confirm no Firestore missing-index error appears.
3. Confirm due notification outbox records can be claimed and processed.
4. Confirm product-site signup can still provision a hub through hub-platform.
5. Confirm hub public member join still works.

## Do Not Do

- Do not recreate or deploy from the old `project/` scaffold for the active product-site + hub-platform launch.
- Do not add Firestore or Storage rules without a separate rules review.
- Do not enable `CUSTOM_DOMAIN_RUNTIME_ENABLED=true` as part of Firebase index deployment.
