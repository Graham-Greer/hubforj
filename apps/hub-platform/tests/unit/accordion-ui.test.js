import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("accordion ui uses semantic button disclosure patterns without fixed trigger heights", () => {
  const source = readFileSync(
    new URL("../../src/components/ui/accordion/Accordion.jsx", import.meta.url),
    "utf8"
  );
  const cssSource = readFileSync(
    new URL("../../src/components/ui/accordion/Accordion.module.css", import.meta.url),
    "utf8"
  );

  assert.match(source, /type="button"/);
  assert.match(source, /aria-expanded/);
  assert.match(source, /aria-controls/);
  assert.match(source, /role="region"/);
  assert.match(source, /allowMultiple/);
  assert.match(source, /defaultOpenIds/);
  assert.match(cssSource, /--accordion-trigger-pad-y/);
  assert.match(cssSource, /--accordion-trigger-pad-x/);
  assert.doesNotMatch(cssSource, /min-height/);
});
