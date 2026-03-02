# Firebase Deployment Checklist Stub

Aligned to `docs/firebase/deployment.md`.

## Pre-deploy
- [ ] Firestore rules updated for touched collections
- [ ] Storage rules updated for touched storage paths
- [ ] `firestore.indexes.json` updated for new query patterns
- [ ] Emulator/rules tests updated for critical paths

## Deploy
- [ ] `firebase deploy --only firestore:rules`
- [ ] `firebase deploy --only storage`
- [ ] `firebase deploy --only firestore:indexes`

## Post-deploy
- [ ] Verify platform provisioning read/write paths
- [ ] Verify invite flows and support mode gating
- [ ] Verify invite authorization (superadmin create/revoke, non-superadmin denied)
- [ ] Verify media delete guard (`usageCount > 0`) remains enforced
