import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function readProductSiteSource(path) {
  return readFileSync(new URL(`../../../product-site/${path}`, import.meta.url), "utf8");
}

test("product-site package model lets customers keep the current paid tier when a change is scheduled", () => {
  const source = readProductSiteSource("src/lib/domain/commercial-billing.js");
  const scheduledChangeIndex = source.indexOf("const hasScheduledPackageChange =");
  const sameTierBranchIndex = source.indexOf("if (normalizedTargetTier === currentTier)");
  const scheduledSameTierGuardIndex = source.indexOf("if (hasScheduledPackageChange && isPaidPackageTier(currentTier))");
  const currentPackageReturnIndex = source.indexOf('actionKind: "current"', sameTierBranchIndex);

  assert.ok(scheduledChangeIndex > 0, "scheduled package changes should be modelled explicitly");
  assert.ok(sameTierBranchIndex > scheduledChangeIndex, "same-tier decisions should know about scheduled changes");
  assert.ok(
    scheduledSameTierGuardIndex > sameTierBranchIndex && scheduledSameTierGuardIndex < currentPackageReturnIndex,
    "same-tier paid selections should offer to cancel scheduled changes before returning current package",
  );
  assert.match(source, /actionLabel: `Keep \$\{formatLabel\(currentTier, "current package"\)\}`/);
  assert.match(source, /Cancel the scheduled change to keep/);
});
