import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("badge design system defines tone-specific semantic tokens", () => {
  const semanticSource = readFileSync(
    new URL("../../src/app/styles/semantic.css", import.meta.url),
    "utf8"
  );

  assert.match(semanticSource, /--badge-neutral-bg:/);
  assert.match(semanticSource, /--badge-accent-bg:/);
  assert.match(semanticSource, /--badge-success-bg:/);
  assert.match(semanticSource, /--badge-warning-bg:/);
  assert.match(semanticSource, /--badge-danger-bg:/);
  assert.match(semanticSource, /--badge-success-border:/);
  assert.match(semanticSource, /--badge-danger-text:/);
});

test("badge design system overrides badge surfaces for dark mode", () => {
  const themeModesSource = readFileSync(
    new URL("../../src/app/styles/theme-modes.css", import.meta.url),
    "utf8"
  );

  assert.match(themeModesSource, /--badge-accent-bg:/);
  assert.match(themeModesSource, /--badge-success-bg:/);
  assert.match(themeModesSource, /--badge-warning-bg:/);
  assert.match(themeModesSource, /--badge-danger-bg:/);
  assert.match(themeModesSource, /var\(--surface-secondary\)/);
});

test("badge component consumes tone-specific background, border, and text tokens", () => {
  const badgeSource = readFileSync(
    new URL("../../src/components/ui/badge/Badge.module.css", import.meta.url),
    "utf8"
  );

  assert.match(badgeSource, /background: var\(--badge-accent-bg\);/);
  assert.match(badgeSource, /border-color: var\(--badge-success-border\);/);
  assert.match(badgeSource, /color: var\(--badge-warning-text\);/);
  assert.doesNotMatch(badgeSource, /\.toneSuccess\s*\{[^}]*background:\s*var\(--surface-secondary\)/s);
  assert.doesNotMatch(badgeSource, /\.toneDanger\s*\{[^}]*background:\s*var\(--surface-secondary\)/s);
});
