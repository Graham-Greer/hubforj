import test from "node:test";
import assert from "node:assert/strict";
import {
  getTestimonialStatusLabel,
  getTestimonialStatusTone,
  normalizeCreateTestimonialPayload,
  normalizeTestimonialInteger,
  summarizeTestimonials,
} from "../../src/lib/domain/testimonials.js";

test("testimonial status helpers map supported states", () => {
  assert.equal(getTestimonialStatusLabel("draft"), "Draft");
  assert.equal(getTestimonialStatusTone("published"), "success");
  assert.equal(getTestimonialStatusTone("unknown"), "neutral");
});

test("testimonial payload normalizes optional fields and booleans", () => {
  const payload = normalizeCreateTestimonialPayload({
    quote: "This changed the way we organise volunteers.",
    authorName: "Priya Shah",
    authorRole: "Volunteer lead",
    authorImageAssetId: "asset_headshot",
    authorImageAlt: "Priya Shah portrait",
    featured: "true",
    sortOrder: "4",
  });

  assert.equal(normalizeTestimonialInteger("4"), 4);
  assert.equal(payload.authorImageAssetId, "asset_headshot");
  assert.equal(payload.authorImageAlt, "Priya Shah portrait");
  assert.equal(payload.featured, true);
  assert.equal(payload.sortOrder, 4);
  assert.equal(payload.status, "draft");
});

test("testimonial payload rejects missing required fields and unsupported status", () => {
  assert.throws(
    () => normalizeCreateTestimonialPayload({ authorName: "Priya Shah" }),
    /Testimonial quote is required\./
  );

  assert.throws(
    () => normalizeCreateTestimonialPayload({ quote: "Great experience", status: "live" }),
    /Author name is required\./
  );

  assert.throws(
    () => normalizeCreateTestimonialPayload({ quote: "Great experience", authorName: "Priya Shah", status: "live" }),
    /Unsupported testimonial status\./
  );
});

test("testimonial summary tracks published drafts and featured state", () => {
  const summary = summarizeTestimonials([
    { status: "published", featured: true },
    { status: "published", featured: false },
    { status: "draft", featured: false },
    { status: "archived", featured: true },
  ]);

  assert.deepEqual(summary, {
    total: 4,
    published: 2,
    drafts: 1,
    featured: 2,
  });
});
