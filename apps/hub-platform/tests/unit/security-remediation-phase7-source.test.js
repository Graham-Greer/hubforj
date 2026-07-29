import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

function readTarget(relativePath) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

function targetExists(relativePath) {
  return existsSync(new URL(relativePath, import.meta.url));
}

test("phase 7 root ignore protects local secrets and generated output", () => {
  const source = readTarget("../../../../.gitignore");

  assert.match(source, /^\.env\*/m);
  assert.match(source, /^!\.env\.example/m);
  assert.match(source, /^\.vercel\//m);
  assert.match(source, /^\.next\//m);
  assert.match(source, /^node_modules\//m);
  assert.match(source, /^\*service-account\*\.json/m);
  assert.match(source, /^\*firebase-admin\*\.json/m);
  assert.match(source, /^\*credentials\*\.json/m);
  assert.match(source, /^\*\.pem/m);
  assert.match(source, /^\*\.key/m);
});

test("phase 7 Firebase deployment docs use the active root index artifact", () => {
  const rootIndexes = readTarget("../../../../firestore.indexes.json");
  const runbook = readTarget("../../../../docs/firebase-deployment-prelaunch-runbook.md");

  assert.match(rootIndexes, /"collectionGroup": "notificationOutbox"/);
  assert.match(rootIndexes, /"fieldPath": "scheduledFor"/);
  assert.match(rootIndexes, /"fieldPath": "processingStartedAt"/);
  assert.match(rootIndexes, /"collectionGroup": "memberships"/);
  assert.match(rootIndexes, /"fieldPath": "scheduledChangeAt"/);
  assert.equal(targetExists("../../../../project/firebase.json"), false);

  assert.match(runbook, /active launch apps/);
  assert.match(runbook, /apps\/product-site/);
  assert.match(runbook, /apps\/hub-platform/);
  assert.match(runbook, /old top-level `project\/` scaffold has been removed/);
  assert.match(runbook, /firebase deploy --only firestore:indexes --project your-firebase-project-id/);
  assert.match(runbook, /Do not recreate or deploy from the old `project\/` scaffold/);
});

test("phase 7 product-site env example matches GBP-only Stripe package price config", () => {
  const envExample = readTarget("../../../product-site/.env.example");

  assert.match(envExample, /STRIPE_PRICE_STARTER_GBP_MONTHLY=price_/);
  assert.match(envExample, /STRIPE_PRICE_GROWTH_GBP_MONTHLY=price_/);
  assert.doesNotMatch(envExample, /STRIPE_PRICE_STARTER_MONTHLY=/);
  assert.doesNotMatch(envExample, /STRIPE_PRICE_GROWTH_MONTHLY=/);
});

test("phase 7 hub-platform env example documents runtime-required secrets", () => {
  const envExample = readTarget("../../.env.example");

  assert.match(envExample, /NEXT_PUBLIC_FIREBASE_API_KEY=replace-me/);
  assert.match(envExample, /NEXT_PUBLIC_FIREBASE_PROJECT_ID=replace-me/);
  assert.match(envExample, /NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxx/);
  assert.match(envExample, /FIREBASE_ADMIN_PROJECT_ID=replace-me/);
  assert.match(envExample, /FIREBASE_ADMIN_CLIENT_EMAIL=replace-me/);
  assert.match(envExample, /FIREBASE_ADMIN_PRIVATE_KEY=/);
  assert.match(envExample, /HUB_PLATFORM_BASE_URL=http:\/\/localhost:3000/);
  assert.match(envExample, /PRODUCT_SITE_BASE_URL=https:\/\/hubforj\.com/);
  assert.match(envExample, /RESEND_API_KEY=re_xxxxxxxxx/);
  assert.match(envExample, /STRIPE_SECRET_KEY=sk_test_xxxxxxxxx/);
  assert.match(envExample, /STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxx/);
  assert.match(envExample, /SESSION_HMAC_SECRET=replace-me/);
});

test("phase 7 supersedes stale regional product-site billing plans", () => {
  const packagePlan = readTarget("../../../../docs/product-site-package-pricing-production-implementation-plan.md");
  const regionalPlan = readTarget("../../../../docs/locale-currency-stripe-production-implementation-plan.md");
  const remediationChecklist = readTarget("../../../../docs/regionalization-final-remediation-checklist.md");

  assert.match(packagePlan, /Superseded launch note: product-site SaaS billing is now GBP-only/);
  assert.match(packagePlan, /STRIPE_PRICE_STARTER_GBP_MONTHLY/);
  assert.match(regionalPlan, /product-site billing and checkout no longer localize by visitor country/);
  assert.match(regionalPlan, /SaaS package billing is GBP-only/);
  assert.match(remediationChecklist, /older multi-currency product-site regionalization track/);
  assert.match(remediationChecklist, /product-site SaaS billing GBP-only/);
});
