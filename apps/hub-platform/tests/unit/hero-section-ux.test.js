import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("hero section falls back gracefully when split media is missing", () => {
  const source = readFileSync(
    new URL("../../src/components/sections/hero-section/HeroSection.jsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /const shouldRenderSplit = isSplit && hasMedia/);
  assert.match(source, /const resolvedContainerWidth = containerWidth \|\|/);
  assert.match(source, /resolvedVariantClassName/);
  assert.doesNotMatch(source, /requires media/);
});
