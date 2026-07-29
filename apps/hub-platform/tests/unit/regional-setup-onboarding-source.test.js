import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("hub admin routes and Stripe setup are gated behind regional onboarding", () => {
  const overviewSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/page.jsx", import.meta.url),
    "utf8"
  );
  const onboardingPageSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/onboarding/page.jsx", import.meta.url),
    "utf8"
  );
  const eventsLayoutSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/events/layout.jsx", import.meta.url),
    "utf8"
  );
  const coursesLayoutSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/courses/layout.jsx", import.meta.url),
    "utf8"
  );
  const paymentsLayoutSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/payments/layout.jsx", import.meta.url),
    "utf8"
  );
  const stripeConnectSource = readFileSync(
    new URL("../../src/lib/server/hub-payment-connect.js", import.meta.url),
    "utf8"
  );
  const paymentsActionsSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/payments/actions.js", import.meta.url),
    "utf8"
  );
  const onboardingConfigSource = readFileSync(
    new URL("../../src/lib/admin-onboarding/config.js", import.meta.url),
    "utf8"
  );
  const onboardingSelectorsSource = readFileSync(
    new URL("../../src/lib/admin-onboarding/selectors.js", import.meta.url),
    "utf8"
  );
  const onboardingDataSource = readFileSync(
    new URL("../../src/lib/data/admin-onboarding.js", import.meta.url),
    "utf8"
  );
  const regionalSetupFormSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/onboarding/RegionalSetupForm.jsx", import.meta.url),
    "utf8"
  );

  assert.match(overviewSource, /isHubRegionalSetupComplete/);
  assert.match(overviewSource, /redirect\(getHubRegionalOnboardingHref\(hub\)\)/);
  assert.match(onboardingPageSource, /Set up your community region/);
  assert.match(onboardingPageSource, /RegionalSetupForm/);
  assert.match(eventsLayoutSource, /RegionalSetupRequiredState/);
  assert.match(coursesLayoutSource, /RegionalSetupRequiredState/);
  assert.match(paymentsLayoutSource, /RegionalSetupRequiredState/);
  assert.match(stripeConnectSource, /assertHubRegionalSetupComplete/);
  assert.match(paymentsActionsSource, /requireHubPaymentsAccess/);
  assert.match(onboardingConfigSource, /"regional_setup"/);
  assert.match(onboardingConfigSource, /"payments_setup"/);
  assert.match(onboardingConfigSource, /href: "\/admin\/onboarding"/);
  assert.match(onboardingConfigSource, /completionMode: "regional_setup"/);
  assert.match(onboardingConfigSource, /growthChecklistOrderWithStripeSecond/);
  assert.match(onboardingSelectorsSource, /nav_regional_setup/);
  assert.match(onboardingSelectorsSource, /regional_setup_form/);
  assert.match(onboardingSelectorsSource, /regional_setup_save/);
  assert.match(onboardingDataSource, /completionMode === "regional_setup"/);
  assert.match(onboardingDataSource, /isHubRegionalSetupComplete/);
  assert.match(onboardingDataSource, /item\.key === "payments_setup"/);
  assert.match(onboardingDataSource, /paymentSetupState\?\.key === "ready"/);
  assert.match(regionalSetupFormSource, /data-onboarding="regional-setup-form"/);
  assert.match(regionalSetupFormSource, /onboardingKey="regional-setup-save"/);
});
