import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("shared input fields support danger-toned helper text for inline validation", () => {
  const inputSource = readFileSync(
    new URL("../../src/components/ui/input/Input.jsx", import.meta.url),
    "utf8"
  );
  const fieldStylesSource = readFileSync(
    new URL("../../src/components/ui/field-control/FieldControl.module.css", import.meta.url),
    "utf8"
  );

  assert.match(inputSource, /hintTone = "neutral"/);
  assert.match(inputSource, /danger: fieldStyles\.hintDanger/);
  assert.match(inputSource, /const hintClassName = \[fieldStyles\.hint, hintToneClassNames\[hintTone\]\]/);
  assert.match(fieldStylesSource, /\.hintDanger/);
  assert.match(fieldStylesSource, /color: var\(--accent-danger\);/);
});
