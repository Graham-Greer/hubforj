import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("admin members page uses the flatter page-header layout", () => {
  const source = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/members/page.jsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /PageHeader/);
  assert.match(source, /title="Member directory"/);
  assert.doesNotMatch(source, /WorkspaceSection/);
});

test("admin admins page keeps a page-level header and a secondary pending-access section", () => {
  const source = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/admins/page.jsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /PageHeader/);
  assert.match(source, /title="Manage admin access"/);
  assert.match(source, /title=\{`\$\{actionableInvites\.length\} invite/);
});
