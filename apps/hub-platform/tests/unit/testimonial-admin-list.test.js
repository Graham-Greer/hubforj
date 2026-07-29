import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("testimonial admin list source uses a compact menu for edit and delete actions", () => {
  const source = readFileSync(
    new URL("../../src/components/patterns/testimonial-admin-list/TestimonialAdminList.jsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /import CompactMenu from "\@\/components\/ui\/compact-menu\/CompactMenu"/);
  assert.match(source, /label: "Edit"/);
  assert.match(source, /label: "Delete"/);
  assert.match(source, /router\.push\(`\/\$\{hub\.slug\}\/admin\/testimonials\/\$\{testimonial\.id\}`\)/);
  assert.match(source, /<Icon name="more_vert" size="sm" decorative \/>/);
  assert.doesNotMatch(source, /Open testimonial/);
});

test("testimonial admin routes wire a delete action into the list and data layer", () => {
  const pageSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/testimonials/page.jsx", import.meta.url),
    "utf8"
  );
  const actionSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/testimonials/actions.js", import.meta.url),
    "utf8"
  );
  const dataSource = readFileSync(
    new URL("../../src/lib/data/testimonials.js", import.meta.url),
    "utf8"
  );

  assert.match(pageSource, /deleteTestimonialAction/);
  assert.match(pageSource, /deleteTestimonialAction=\{deleteTestimonialAction\}/);
  assert.match(actionSource, /export async function deleteTestimonialAction/);
  assert.match(actionSource, /Unable to delete testimonial\./);
  assert.match(dataSource, /export async function deleteTestimonial/);
});
