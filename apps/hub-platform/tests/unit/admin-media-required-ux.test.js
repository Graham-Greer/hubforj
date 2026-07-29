import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("required media fields surface the shared Required label pattern", () => {
  const mediaFieldSource = readFileSync(
    new URL("../../src/components/patterns/media-asset-field/MediaAssetField.jsx", import.meta.url),
    "utf8"
  );
  const pageHeroSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/settings/PageHeroFieldGroup.jsx", import.meta.url),
    "utf8"
  );
  const homepageSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/settings/homepage/HomepageSettingsForm.jsx", import.meta.url),
    "utf8"
  );

  assert.match(mediaFieldSource, /requiredIndicator = false/);
  assert.match(mediaFieldSource, /fieldStyles\.requiredMark/);
  assert.match(mediaFieldSource, /styles\.labelWrap/);
  assert.doesNotMatch(mediaFieldSource, /<p className=\{fieldStyles\.labelWrap\}>/);
  assert.match(pageHeroSource, /mediaRequiredIndicator = false/);
  assert.match(pageHeroSource, /requiredIndicator=\{mediaRequiredIndicator\}/);
  assert.match(homepageSource, /mediaRequiredIndicator[\s\S]*mediaLabel="Hero media"/);
  assert.match(homepageSource, /mediaRequiredIndicator[\s\S]*mediaLabel="About section media"/);
});
