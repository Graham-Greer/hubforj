import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("hub package mutation source exposes a canonical package-authority update path", () => {
  const source = readFileSync(
    new URL("../../src/lib/data/hub-mutations.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /export async function updateHubPackageAuthorityById/);
  assert.match(source, /const normalizedPayload = normalizeUpdateHubPackageAuthorityPayload\(payload\)/);
  assert.match(source, /const writeModel = buildHubPackageAuthorityWriteModel\(currentHub, normalizedPayload, actorId, now\)/);
  assert.match(source, /await ref\.update\(writeModel\)/);
});

test("hub package mutation source keeps package writes scoped to authority fields and legacy compatibility flags", () => {
  const source = readFileSync(
    new URL("../../src/lib/data/hub-mutations.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /packageTier: normalizedPayload\.packageTier/);
  assert.match(source, /packageStatus: normalizedPayload\.packageStatus/);
  assert.match(source, /packageSource: normalizedPayload\.packageSource/);
  assert.match(source, /packageOverrides: normalizedPayload\.packageOverrides/);
  assert.match(source, /packageAssignedAt/);
  assert.match(source, /packageUpdatedAt: now/);
  assert.match(source, /features: normalizedPayload\.features/);
  assert.doesNotMatch(source, /name: normalizedPayload\./);
  assert.doesNotMatch(source, /contactEmail: normalizedPayload\./);
  assert.doesNotMatch(source, /customDomain: normalizedPayload\./);
});
