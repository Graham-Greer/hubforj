import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("admin access list uses a compact menu trigger for owner actions", () => {
  const source = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/admins/AdminAccessList.jsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /CompactMenu/);
  assert.match(source, /triggerTooltip="Admin actions"/);
  assert.match(source, /<Icon name="more_vert"/);
  assert.doesNotMatch(source, />\s*Suspend\s*<\/Button>/);
  assert.doesNotMatch(source, />\s*Transfer ownership\s*<\/Button>/);
});
