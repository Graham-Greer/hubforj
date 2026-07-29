import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("hub admin nav separates Stripe setup, payment records, and membership plans", () => {
  const source = readFileSync(
    new URL("../../src/lib/navigation/hub-admin-nav.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /label: "Stripe setup"/);
  assert.match(source, /href: `\$\{base\}\/payments\?view=setup`/);
  assert.match(source, /queryValue: "setup"/);
  assert.match(source, /label: "Payments"/);
  assert.match(source, /href: `\$\{base\}\/payments\?view=payments`/);
  assert.match(source, /queryValue: "payments"/);
  assert.match(source, /label: "Membership plans"/);
  assert.match(source, /href: `\$\{base\}\/payments\?view=plans`/);
});

test("payments page recognizes the setup view and loads payment configuration", () => {
  const source = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/payments/page.jsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /view === "plans" \? "plans" : view === "payments" \? "payments" : "setup"/);
  assert.match(source, /getCurrentHubOperatorAccess/);
  assert.match(source, /const showSupportDiagnostics = access\?\.mode === "support"/);
  assert.match(source, /getHubPaymentConfigurationByHubId/);
  assert.match(source, /getHubPaymentLedgerSyncStatus/);
  assert.match(source, /getHubPaymentReconciliationReport/);
  assert.match(source, /showSupportDiagnostics \? getHubPaymentLedgerSyncStatus\(hub\.id\) : Promise\.resolve\(null\)/);
  assert.match(source, /showSupportDiagnostics \? getHubPaymentReconciliationReport\(hub\.id\) : Promise\.resolve\(null\)/);
  assert.match(source, /getHubPaymentSetupState/);
  assert.match(source, /getStripeConnectEnvironmentState/);
  assert.match(source, /paymentSetupState=\{paymentSetupState\}/);
  assert.match(source, /stripeConnectEnvironment=\{stripeConnectEnvironment\}/);
  assert.match(source, /paymentLedgerSyncStatus=\{paymentLedgerSyncStatus\}/);
  assert.match(source, /paymentReconciliationReport=\{paymentReconciliationReport\}/);
  assert.match(source, /showSupportDiagnostics=\{showSupportDiagnostics\}/);
  assert.match(source, /beginHubPaymentSetupAction=\{beginHubPaymentSetupAction\}/);
  assert.match(source, /refreshHubPaymentSetupAction=\{refreshHubPaymentSetupAction\}/);
  assert.match(source, /syncHubPaymentLedgerAction=\{syncHubPaymentLedgerAction\}/);
});

test("account settings keeps payment capability messaging at the package level", () => {
  const source = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/settings/account/page.jsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /Built-in payments/);
  assert.match(source, /External payments/);
  assert.match(source, /Paid offerings locked/);
  assert.doesNotMatch(source, /Native payments/);
  assert.doesNotMatch(source, /Open payments/);
  assert.doesNotMatch(source, /payments workspace/i);
});

test("payment setup workspace exposes create, refresh, and embedded onboarding states", () => {
  const source = readFileSync(
    new URL("../../src/components/patterns/hub-payments-workspace/PaymentSetupWorkspace.jsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /Create Stripe account/);
  assert.match(source, /Refresh Stripe status/);
  assert.match(source, /Set up built-in payments/);
  assert.match(source, /getSetupActionContent/);
  assert.match(source, /shouldShowSetupActionPanel = setupState\?\.key !== "ready" \|\| showSupportDiagnostics/);
  assert.match(source, /Create the Stripe account/);
  assert.match(source, /Finish Stripe setup/);
  assert.match(source, /Setup complete/);
  assert.match(source, /Sync payment ledger/);
  assert.match(source, /Last status/);
  assert.match(source, /Last mode/);
  assert.match(source, /Last started/);
  assert.match(source, /Incremental sync baseline/);
  assert.match(source, /Reconciliation/);
  assert.match(source, /Open issues/);
  assert.match(source, /No reconciliation issues are currently flagged/);
  assert.match(source, /showSupportDiagnostics \? \(/);
  assert.match(source, /hub admins should not see finance-maintenance internals/i);
  assert.match(source, /no longer perform hidden backfill writes/);
  assert.match(source, /StripeEmbeddedOnboardingPanel/);
  assert.doesNotMatch(source, /How setup works/);
  assert.doesNotMatch(source, /Implementation boundary/);
});

test("hub payments workspace exposes explicit navigation between setup, records, and plans", () => {
  const source = readFileSync(
    new URL("../../src/components/patterns/hub-payments-workspace/HubPaymentsWorkspace.jsx", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(source, /Payments sections/);
  assert.match(source, /PaymentSetupWorkspace/);
  assert.match(source, /MembershipPlanManager/);
  assert.match(source, /PaymentItemsTable/);
});

test("payment and admin read sources do not perform ledger backfill writes implicitly", () => {
  const paymentsSource = readFileSync(
    new URL("../../src/lib/data/hub-payments.js", import.meta.url),
    "utf8"
  );
  const adminSource = readFileSync(
    new URL("../../src/lib/data/hub-admin.js", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(paymentsSource, /await backfillMembershipPaymentRecordsToLedger/);
  assert.doesNotMatch(paymentsSource, /await backfillNativeMembershipUpgradeTransactionsToLedger/);
  assert.doesNotMatch(adminSource, /await backfillMembershipPaymentRecordsToLedger/);
  assert.doesNotMatch(adminSource, /await backfillNativeMembershipUpgradeTransactionsToLedger/);
});
