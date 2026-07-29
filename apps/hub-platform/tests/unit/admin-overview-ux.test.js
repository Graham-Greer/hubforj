import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("admin overview page uses a flatter page-header layout without the legacy lead copy", () => {
  const source = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/page.jsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /PageHeader/);
  assert.match(source, /eyebrow="Overview"/);
  assert.match(source, /title=\{hub\?\.name \|\| "Hub overview"\}/);
  assert.doesNotMatch(source, /WorkspaceSection/);
  assert.doesNotMatch(source, /Confirm current package usage here first/);
});

test("admin overview data groups recurring events into recent-event rows with series registration totals", () => {
  const source = readFileSync(
    new URL("../../src/lib/data/hub-admin.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /listEventSeriesByHubSlug/);
  assert.match(source, /buildRecentEventItems/);
  assert.match(source, /series_occurrence/);
  assert.match(source, /registeredCount \+= registeredCount/);
  assert.match(source, /\/admin\/events\/series\/\$\{seriesId\}/);
});

test("admin overview revenue uses the canonical payments report summary", () => {
  const source = readFileSync(
    new URL("../../src/lib/data/hub-admin.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /getHubPaymentReportByHub/);
  assert.match(source, /getHubPaymentReportByHub\(hub, \{/);
  assert.match(source, /eventItems: eventPaymentItems/);
  assert.match(source, /courseItems: coursePaymentItems/);
  assert.match(source, /paymentReport\.summary\?\.collectedRevenue/);
  assert.doesNotMatch(source, /summarizeCollectedRevenue/);
  assert.doesNotMatch(source, /listPaymentRecordsByHub/);
  assert.doesNotMatch(source, /listNativePaymentTransactionsByHub/);
});
