import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("courses barrel preserves the public query and mutation API", () => {
  const barrelSource = readFileSync(
    new URL("../../src/lib/data/courses.js", import.meta.url),
    "utf8"
  );

  assert.match(barrelSource, /getCourseById/);
  assert.match(barrelSource, /getCourseBySlug/);
  assert.match(barrelSource, /getPublicCourseBySlug/);
  assert.match(barrelSource, /listCoursesByHubSlug/);
  assert.match(barrelSource, /listPublicCoursesByHubSlug/);
  assert.match(barrelSource, /createCourseByHubSlug/);
  assert.match(barrelSource, /updateCourseById/);
  assert.match(barrelSource, /\.\/course-queries\.js/);
  assert.match(barrelSource, /\.\/course-mutations\.js/);
});

test("course shared module keeps normalization and media attachment explicit", () => {
  const sharedSource = readFileSync(
    new URL("../../src/lib/data/course-shared.js", import.meta.url),
    "utf8"
  );

  assert.match(sharedSource, /export function normalizeCourseRecord/);
  assert.match(sharedSource, /status: normalizeString\(course\.status\) \|\| "draft"/);
  assert.match(sharedSource, /pricingMode: normalizeString\(course\.pricingMode\) \|\| "free"/);
  assert.match(sharedSource, /externalPaymentUrl: normalizeString\(course\.externalPaymentUrl\)/);
  assert.match(sharedSource, /paymentInstructions: normalizeString\(course\.paymentInstructions\)/);
  assert.match(sharedSource, /refundWindowMode: normalizeCourseRefundWindowMode\(course\.refundWindowMode\)/);
  assert.match(sharedSource, /refundWindowHours: normalizeCourseRefundWindowHours\(course\.refundWindowHours\)/);
  assert.match(sharedSource, /refundPolicy: normalizeCourseRefundPolicy\(course\.refundPolicy\)/);
  assert.match(sharedSource, /registrationEligibility: normalizeString\(course\.registrationEligibility\) \|\| "members-only"/);
  assert.match(sharedSource, /visibility: normalizeString\(course\.visibility\) \|\| "public"/);
  assert.match(sharedSource, /export function attachCourseMedia/);
  assert.match(sharedSource, /imageAsset: course\.imageAssetId \? byId\.get\(course\.imageAssetId\) \|\| null : null/);
});

test("course mutations keep uniqueness and paid-pricing invariants explicit", () => {
  const mutationSource = readFileSync(
    new URL("../../src/lib/data/course-mutations.js", import.meta.url),
    "utf8"
  );

  assert.match(mutationSource, /assertUniqueCourseSlug/);
  assert.match(mutationSource, /A course with this slug already exists for this hub\./);
  assert.match(mutationSource, /price: next\.pricingMode === "paid" \? next\.price : ""/);
  assert.match(mutationSource, /resolveCoursePaymentConfiguration/);
  assert.match(mutationSource, /externalPaymentUrl: paymentConfiguration\.externalPaymentUrl/);
  assert.match(mutationSource, /refundWindowMode: next\.refundWindowMode/);
  assert.match(mutationSource, /refundWindowHours: next\.refundWindowHours/);
  assert.match(mutationSource, /refundPolicy: next\.refundPolicy/);
});
