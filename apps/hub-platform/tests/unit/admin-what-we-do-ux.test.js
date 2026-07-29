import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("what we do admin route uses the same page-header and summary-card pattern as testimonials", () => {
  const routeSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/what-we-do/page.jsx", import.meta.url),
    "utf8"
  );
  const listSource = readFileSync(
    new URL("../../src/components/patterns/what-we-do-admin-list/WhatWeDoAdminList.jsx", import.meta.url),
    "utf8"
  );
  const cssSource = readFileSync(
    new URL("../../src/components/patterns/what-we-do-admin-list/WhatWeDoAdminList.module.css", import.meta.url),
    "utf8"
  );

  assert.match(routeSource, /WhatWeDoAdminList/);
  assert.match(listSource, /PageHeader/);
  assert.match(listSource, /title=\{!items\.length \? "Create the first item" : "Manage items"\}/);
  assert.match(listSource, /Create homepage offering content to describe what your community offers\./);
  assert.match(listSource, /Review homepage offering content, we recommend keeping it to 6 items max to avoid cluttering the home page\./);
  assert.match(listSource, /StatCard label="Total"/);
  assert.match(listSource, /StatCard label="Published"/);
  assert.match(listSource, /StatCard label="Drafts"/);
  assert.match(listSource, /Create item/);
  assert.doesNotMatch(listSource, /EmptyState/);
  assert.match(listSource, /CompactMenu/);
  assert.match(listSource, /label: "Edit"/);
  assert.match(listSource, /label: "Delete"/);
  assert.match(cssSource, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/);
});
