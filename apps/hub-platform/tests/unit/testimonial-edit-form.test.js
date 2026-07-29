import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("testimonial edit form source includes a dirty-aware cancel action back to the list", () => {
  const formSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/testimonials/[testimonialId]/EditTestimonialForm.jsx", import.meta.url),
    "utf8"
  );
  const workspaceSource = readFileSync(
    new URL("../../src/components/patterns/testimonial-detail-workspace/TestimonialDetailWorkspace.jsx", import.meta.url),
    "utf8"
  );

  assert.match(formSource, /import AdminDiscardChangesButton/);
  assert.match(formSource, /href=\{`\/\$\{hub\.slug\}\/admin\/testimonials`\}/);
  assert.match(formSource, /label="Cancel"/);
  assert.match(formSource, /variant="secondary"/);
  assert.match(formSource, /<Button href=\{`\/\$\{hub\.slug\}\/admin\/testimonials`\} variant="secondary">/);
  assert.match(workspaceSource, /AdminFormRuntimeProvider/);
});
