import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("hub admin overview attention sources include incomplete Stripe setup for Growth hubs", () => {
  const overviewSource = readFileSync(
    new URL("../../src/lib/data/hub-admin.js", import.meta.url),
    "utf8"
  );
  const adminPageSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/page.jsx", import.meta.url),
    "utf8"
  );

  assert.match(overviewSource, /getHubPaymentSetupState/);
  assert.match(overviewSource, /hubUsesInternalNativePayments/);
  assert.match(overviewSource, /id: "stripe-setup"/);
  assert.match(overviewSource, /label: "Stripe setup"/);
  assert.match(overviewSource, /href: `\/\$\{hub\.slug\}\/admin\/payments\?view=setup`/);
  assert.match(adminPageSource, /<DashboardAttentionPanel items=\{attentionItems\} \/>/);
});
