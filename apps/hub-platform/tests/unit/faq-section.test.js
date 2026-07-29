import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("faq section composes the shared public section primitives with accordion content", () => {
  const source = readFileSync(
    new URL("../../src/components/sections/faq-section/FAQSection.jsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /SectionShell/);
  assert.match(source, /SectionContainer/);
  assert.match(source, /SectionHeader/);
  assert.match(source, /Accordion/);
  assert.match(source, /item\?\.question && item\?\.answer/);
});
