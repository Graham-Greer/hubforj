import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("what we do edit form source includes a dirty-aware cancel action back to the list", () => {
  const formSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/what-we-do/[itemId]/EditWhatWeDoForm.jsx", import.meta.url),
    "utf8"
  );
  const workspaceSource = readFileSync(
    new URL("../../src/components/patterns/what-we-do-detail-workspace/WhatWeDoDetailWorkspace.jsx", import.meta.url),
    "utf8"
  );

  assert.match(formSource, /import AdminDiscardChangesButton/);
  assert.match(formSource, /href=\{`\/\$\{hub\.slug\}\/admin\/what-we-do`\}/);
  assert.match(formSource, /label="Cancel"/);
  assert.match(formSource, /variant="secondary"/);
  assert.match(formSource, /<Button href=\{`\/\$\{hub\.slug\}\/admin\/what-we-do`\} variant="secondary">/);
  assert.match(workspaceSource, /AdminFormRuntimeProvider/);
});
