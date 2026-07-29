import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("what we do admin list source uses a compact menu for edit and delete actions", () => {
  const source = readFileSync(
    new URL("../../src/components/patterns/what-we-do-admin-list/WhatWeDoAdminList.jsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /import CompactMenu from "\@\/components\/ui\/compact-menu\/CompactMenu"/);
  assert.match(source, /label: "Edit"/);
  assert.match(source, /label: "Delete"/);
  assert.match(source, /router\.push\(`\/\$\{hub\.slug\}\/admin\/what-we-do\/\$\{item\.id\}`\)/);
  assert.match(source, /<Icon name="more_vert" size="sm" decorative \/>/);
  assert.doesNotMatch(source, /Open item/);
});

test("what we do admin routes wire a delete action into the list and data layer", () => {
  const pageSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/what-we-do/page.jsx", import.meta.url),
    "utf8"
  );
  const actionSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/what-we-do/actions.js", import.meta.url),
    "utf8"
  );
  const dataSource = readFileSync(
    new URL("../../src/lib/data/what-we-do.js", import.meta.url),
    "utf8"
  );

  assert.match(pageSource, /deleteWhatWeDoAction/);
  assert.match(pageSource, /deleteWhatWeDoAction=\{deleteWhatWeDoAction\}/);
  assert.match(actionSource, /export async function deleteWhatWeDoAction/);
  assert.match(actionSource, /Unable to delete What we do item\./);
  assert.match(dataSource, /export async function deleteWhatWeDoItem/);
});
