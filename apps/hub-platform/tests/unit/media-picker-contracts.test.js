import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("media asset field applies picker selections for uncontrolled usage and clears picker params", () => {
  const source = readFileSync(
    new URL("../../src/components/patterns/media-asset-field/MediaAssetField.jsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /if \(!isPickedForField\) \{/);
  assert.match(source, /if \(isControlled\) \{/);
  assert.match(source, /setLocalAssetId\(pickedAssetId\)/);
  assert.match(source, /setLocalAssetAlt\(pickedAssetAlt\)/);
  assert.match(source, /nextParams\.delete\("pickedField"\)/);
  assert.match(source, /router\.replace\(nextQuery \? `\$\{pathname\}\?\$\{nextQuery\}` : pathname, \{ scroll: false \}\)/);
  assert.match(source, /Upload from form/);
  assert.match(source, /Use existing media/);
  assert.match(source, /Select media/);
  assert.match(source, /setShowPickerModal\(true\)/);
  assert.match(source, /Choose \$\{label\.toLowerCase\(\)\}/);
  assert.match(source, /pickerFolderOptions\.map/);
  assert.match(source, /applyPickedAsset/);
  assert.doesNotMatch(source, /href=\{pickerHref\}/);
  assert.doesNotMatch(source, /Choose how to add media/);
});

test("media details panel exposes a picker confirmation action", () => {
  const source = readFileSync(
    new URL("../../src/components/patterns/media-library-workspace/MediaAssetDetailsPanel.jsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /isPicker = false/);
  assert.match(source, /Use this media/);
  assert.match(source, /onUseSelectedAsset/);
});
