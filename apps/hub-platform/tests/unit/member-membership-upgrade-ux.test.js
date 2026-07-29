import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("member membership workspace source shows current membership and upgrade discovery together", () => {
  const source = readFileSync(
    new URL("../../src/components/patterns/member-membership-workspace/MemberMembershipWorkspace.jsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /getAvailableMembershipUpgradePlans/);
  assert.match(source, /buildMembershipUpgradeCta/);
  assert.match(source, /Available upgrades/);
  assert.match(source, /public upgrade plans/i);
  assert.match(source, /Your current membership details and renewal timing\./);
  assert.match(source, /currentMembershipDetails/);
  assert.doesNotMatch(source, /DetailRow label="Current plan"/);
  assert.doesNotMatch(source, /DetailRow label="Status"/);
  assert.match(source, /const showAvailableUpgradesPanel =/);
  assert.match(source, /upgradePlans\.length > 0/);
  assert.match(source, /membership\?\.isDefault === true/);
  assert.match(source, /\{showAvailableUpgradesPanel \? \(/);
  assert.match(source, /Upgrade to \$\{upgradeRequest\.planTitle \|\| "your next plan"\} in progress/);
  assert.match(source, /Start upgrade/);
  assert.match(source, /Continue to payment/);
  assert.match(source, /Continue checkout/);
  assert.match(source, /Stripe checkout/);
  assert.match(source, /Open billing/);
  assert.match(source, /Cancel upgrade/);
  assert.match(source, /ReturnToDefaultMembershipPanel/);
  assert.match(source, /Default plan scheduled/);
  assert.match(source, /#footer-contact/);
  assert.match(source, /Finish the current upgrade request before starting another plan change/i);
  assert.match(source, /your current membership stays active/i);
  assert.match(source, /Complete the Stripe checkout below to start this upgrade/i);
});

test("member membership page source loads membership plans, pending upgrade requests, and native transactions", () => {
  const source = readFileSync(
    new URL("../../src/app/(hub)/[hubSlug]/account/membership/page.jsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /listMembershipPlansByHub/);
  assert.match(source, /getPendingMembershipUpgradeRequestByUser/);
  assert.match(source, /getNativePaymentTransactionById/);
  assert.match(source, /Promise\.all/);
  assert.match(source, /membershipPlans=\{membershipPlans\}/);
  assert.match(source, /upgradeRequest=\{upgradeRequest\}/);
  assert.match(source, /upgradeTransaction=\{upgradeTransaction\}/);
  assert.match(source, /success === "checkoutSubmitted"/);
  assert.match(source, /success === "membershipReturnScheduled"/);
  assert.match(source, /success === "membershipReturnScheduleCancelled"/);
});

test("membership upgrade action source redirects after the try-catch and supports native checkout branching", () => {
  const source = readFileSync(
    new URL("../../src/app/(hub)/[hubSlug]/account/membership/actions.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /let redirectPath = `\/\$\{hubSlug\}\/account\/membership\?success=upgradeRequested`/);
  assert.match(source, /startMembershipUpgradeCheckout/);
  assert.match(source, /redirectPath = checkout\.checkoutUrl/);
  assert.match(source, /redirectPath = `\/\$\{hubSlug\}\/account\/membership\?error=\$\{message\}`/);
  assert.match(source, /redirect\(redirectPath\);/);
  assert.doesNotMatch(source, /catch \(error\) \{[\s\S]*redirect\(`\/\$\{hubSlug\}\/account\/membership\?error=/);
});

test("membership upgrade action source supports canceling a pending request", () => {
  const source = readFileSync(
    new URL("../../src/app/(hub)/[hubSlug]/account/membership/actions.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /cancelMembershipUpgradeRequestAction/);
  assert.match(source, /getPendingMembershipUpgradeRequestByUser/);
  assert.match(source, /stripe\.checkout\.sessions\.expire/);
  assert.match(source, /checkout_cancelled/);
  assert.match(source, /cancelMembershipUpgradeRequest/);
  assert.match(source, /No pending membership upgrade request was found\./);
});

test("member membership action source supports scheduling and cancelling default-plan returns", () => {
  const source = readFileSync(
    new URL("../../src/app/(hub)/[hubSlug]/account/membership/actions.js", import.meta.url),
    "utf8"
  );
  const panelSource = readFileSync(
    new URL("../../src/components/patterns/member-membership-workspace/ReturnToDefaultMembershipPanel.jsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /scheduleCurrentMembershipDowngradeAction/);
  assert.match(source, /scheduleMembershipDefaultPlanDowngradeForUser/);
  assert.match(source, /cancelScheduledMembershipDowngradeAction/);
  assert.match(source, /cancelScheduledMembershipDefaultPlanDowngradeForUser/);
  assert.match(source, /You are already on the default membership plan\./);
  assert.match(source, /Finish or cancel the current upgrade request before changing your membership again\./);
  assert.match(source, /membershipReturnScheduled/);
  assert.match(source, /membershipReturnScheduleCancelled/);
  assert.match(panelSource, /Return to default membership\?/);
  assert.match(panelSource, /Schedule return/);
  assert.match(panelSource, /Keep upgraded membership/);
  assert.match(panelSource, /cancelScheduledMembershipDowngradeAction/);
});

test("scheduled membership changes have a processor and Firestore index", () => {
  const dataSource = readFileSync(
    new URL("../../src/lib/data/membership-user-records.js", import.meta.url),
    "utf8"
  );
  const processorSource = readFileSync(
    new URL("../../src/lib/server/membership-schedule-processor.js", import.meta.url),
    "utf8"
  );
  const routeSource = readFileSync(
    new URL("../../src/app/api/internal/memberships/process-scheduled-changes/route.js", import.meta.url),
    "utf8"
  );
  const indexesSource = readFileSync(
    new URL("../../../../firestore.indexes.json", import.meta.url),
    "utf8"
  );

  assert.match(dataSource, /scheduleMembershipDefaultPlanDowngradeForUser/);
  assert.match(dataSource, /A future renewal date is required/);
  assert.match(dataSource, /listDueScheduledMembershipDefaultPlanDowngrades/);
  assert.match(dataSource, /applyScheduledMembershipDefaultPlanDowngrade/);
  assert.match(processorSource, /processScheduledMembershipChanges/);
  assert.match(routeSource, /getInternalAutomationAuthorizationState/);
  assert.match(routeSource, /processScheduledMembershipChanges/);
  assert.match(indexesSource, /"collectionGroup": "memberships"/);
  assert.match(indexesSource, /"fieldPath": "scheduledChangeStatus"/);
  assert.match(indexesSource, /"fieldPath": "scheduledChangeType"/);
  assert.match(indexesSource, /"fieldPath": "scheduledChangeAt"/);
});

test("membership checkout return route finalises Stripe returns through a hub-owned path", () => {
  const source = readFileSync(
    new URL("../../src/app/(hub)/[hubSlug]/account/membership/checkout-return/route.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /finalizeMembershipUpgradeCheckoutReturn/);
  assert.match(source, /success=checkoutSubmitted/);
  assert.match(source, /success=checkoutCompleted/);
  assert.match(source, /success=checkoutCancelled/);
});
