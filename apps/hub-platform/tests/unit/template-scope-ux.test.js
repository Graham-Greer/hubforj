import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("public template styling stays scoped off the root html and admin layouts", () => {
  const rootLayoutSource = readFileSync(
    new URL("../../src/app/layout.jsx", import.meta.url),
    "utf8"
  );
  const hubAdminLayoutSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/layout.jsx", import.meta.url),
    "utf8"
  );
  const platformLayoutSource = readFileSync(
    new URL("../../src/app/(platform)/platform/layout.jsx", import.meta.url),
    "utf8"
  );
  const themeScopeSource = readFileSync(
    new URL("../../src/components/primitives/theme-scope/ThemeScope.jsx", import.meta.url),
    "utf8"
  );
  const baseStylesSource = readFileSync(
    new URL("../../src/app/styles/base.css", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(rootLayoutSource, /data-template=/);
  assert.doesNotMatch(hubAdminLayoutSource, /template=/);
  assert.doesNotMatch(platformLayoutSource, /template=/);
  assert.match(themeScopeSource, /data-template=\{template \? normalizeTemplate\(template\) : undefined\}/);
  assert.match(baseStylesSource, /body \{\s+background: var\(--bg-canvas\);/s);
  assert.match(baseStylesSource, /\[data-template\] \{\s+min-height: 100%;\s+background: var\(--template-shell-bg\);/s);
});
