import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("media barrel preserves the public query and mutation API", () => {
  const barrelSource = readFileSync(
    new URL("../../src/lib/data/media.js", import.meta.url),
    "utf8"
  );

  assert.match(barrelSource, /getMediaAssetById/);
  assert.match(barrelSource, /getMediaAssetsByIds/);
  assert.match(barrelSource, /listMediaAssetsByHubId/);
  assert.match(barrelSource, /listMediaFoldersByHubId/);
  assert.match(barrelSource, /createMediaFolderForHub/);
  assert.match(barrelSource, /deleteMediaFolderForHub/);
  assert.match(barrelSource, /updateMediaFolderForHub/);
  assert.match(barrelSource, /deleteMediaAssetForHub/);
  assert.match(barrelSource, /updateMediaAssetForHub/);
  assert.match(barrelSource, /uploadMediaAssetForHub/);
  assert.match(barrelSource, /\.\/media-queries\.js/);
  assert.match(barrelSource, /\.\/media-folder-records\.js/);
  assert.match(barrelSource, /\.\/media-asset-records\.js/);
});

test("media shared module keeps usage attachment and active-asset filtering explicit", () => {
  const sharedSource = readFileSync(
    new URL("../../src/lib/data/media-shared.js", import.meta.url),
    "utf8"
  );

  assert.match(sharedSource, /export function normalizeUsageField/);
  assert.match(sharedSource, /return normalizeString\(value\) \|\| "media"/);
  assert.match(sharedSource, /export function normalizeUsageRef/);
  assert.match(sharedSource, /field: normalizeUsageField\(ref\.field\)/);
  assert.match(sharedSource, /export function attachUsageToAsset/);
  assert.match(sharedSource, /usageCount: usageRefs\.length/);
  assert.match(sharedSource, /export function normalizeActiveMediaAsset/);
  assert.match(sharedSource, /return asset\.status === "active" \? asset : null/);
});

test("media asset mutations keep deletion protection and upload invariants explicit", () => {
  const assetMutationsSource = readFileSync(
    new URL("../../src/lib/data/media-asset-records.js", import.meta.url),
    "utf8"
  );

  assert.match(assetMutationsSource, /if \(asset\.usageCount > 0\)/);
  assert.match(assetMutationsSource, /This asset is still in use and cannot be deleted\./);
  assert.match(assetMutationsSource, /const normalized = normalizeMediaUploadInput\(payload\)/);
  assert.match(assetMutationsSource, /Destination folder not found\./);
  assert.match(assetMutationsSource, /firebaseStorageDownloadTokens/);
  assert.match(assetMutationsSource, /cacheControl: "public,max-age=31536000,immutable"/);
});
