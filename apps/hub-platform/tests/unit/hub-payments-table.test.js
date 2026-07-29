import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("hub payments table source uses compact menus for filtering", () => {
  const workspaceSource = readFileSync(
    new URL("../../src/components/patterns/hub-payments-workspace/HubPaymentsWorkspace.jsx", import.meta.url),
    "utf8"
  );
  const tableSource = readFileSync(
    new URL("../../src/components/patterns/hub-payments-workspace/PaymentItemsTable.jsx", import.meta.url),
    "utf8"
  );
  const helperSource = readFileSync(
    new URL("../../src/components/patterns/hub-payments-workspace/hub-payments-helpers.js", import.meta.url),
    "utf8"
  );

  assert.match(workspaceSource, /CompactMenu/);
  assert.match(workspaceSource, /SearchField/);
  assert.match(workspaceSource, /getTypeFilterLabel/);
  assert.match(workspaceSource, /getStatusFilterLabel/);
  assert.match(workspaceSource, /Filter payments by record type/);
  assert.match(workspaceSource, /Filter payments by payment status/);
  assert.match(workspaceSource, /triggerTooltip="Record type"/);
  assert.match(workspaceSource, /triggerTooltip="Payment status"/);
  assert.match(workspaceSource, /Export CSV/);
  assert.match(workspaceSource, /size="sm"/);
  assert.match(workspaceSource, /Search payments/);
  assert.match(tableSource, /item\.operationalLabel/);
  assert.match(helperSource, /value: "failed", label: "Failed"/);
  assert.match(helperSource, /value: "refunded", label: "Refunded"/);
});

test("hub payments table source keeps member and plan cells simplified", () => {
  const source = readFileSync(
    new URL("../../src/components/patterns/hub-payments-workspace/PaymentItemsTable.jsx", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(source, /item\.userEmail \? <p className=\{styles\.secondaryValue\}/);
  assert.doesNotMatch(source, /Course booking/);
  assert.doesNotMatch(source, /Event registration/);
});

test("hub payments table view action opens the payment detail route", () => {
  const source = readFileSync(
    new URL("../../src/components/patterns/hub-payments-workspace/PaymentItemsTable.jsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /item\.detailHref/);
  assert.match(source, /View payment record/);
  assert.match(source, /item\.userId && hasMemberRecord/);
  assert.match(source, /item\.userName \|\| item\.userEmail \|\| "Former member"/);
  assert.doesNotMatch(source, /Unknown member/);
});
