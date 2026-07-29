import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("event form fields auto-sync slug from title until manually overridden", () => {
  const source = readFileSync(
    new URL("../../src/components/patterns/event-form-fields/EventFormFields.jsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /useAutoSlugField/);
  assert.match(source, /normalizeEventSlug/);
  assert.match(source, /title: values\.title/);
  assert.match(source, /slug: values\.slug/);
  assert.match(source, /value=\{titleValue\}/);
  assert.match(source, /onChange=\{onTitleChange\}/);
  assert.match(source, /value=\{slugValue\}/);
  assert.match(source, /onChange=\{onSlugChange\}/);
  assert.match(source, /onBlur=\{onSlugBlur\}/);
});

test("course form fields auto-sync slug from title until manually overridden", () => {
  const source = readFileSync(
    new URL("../../src/components/patterns/course-form-fields/CourseFormFields.jsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /useAutoSlugField/);
  assert.match(source, /normalizeCourseSlug/);
  assert.match(source, /title: values\.title/);
  assert.match(source, /slug: values\.slug/);
  assert.match(source, /value=\{titleValue\}/);
  assert.match(source, /onChange=\{onTitleChange\}/);
  assert.match(source, /value=\{slugValue\}/);
  assert.match(source, /onChange=\{onSlugChange\}/);
  assert.match(source, /onBlur=\{onSlugBlur\}/);
  assert.match(source, /name="registrationOpenDate"/);
  assert.match(source, /name="registrationCloseDate"/);
  assert.doesNotMatch(source, /name="registrationEligibility"/);
  assert.match(source, /requiredIndicator/);
  assert.match(source, /required=\{isActive\}/);
});
