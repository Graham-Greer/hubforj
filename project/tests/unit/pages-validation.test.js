import test from "node:test";
import assert from "node:assert/strict";
import {
  validatePageSlug,
  validatePageSettingsInput,
  validateCompositionInput,
} from "../../src/lib/validation/pages.js";

test("validatePageSlug normalizes and rejects reserved slugs", () => {
  assert.equal(validatePageSlug(" About Us "), "about-us");
  assert.equal(validatePageSlug("contact"), "contact");
  assert.throws(() => validatePageSlug("home"), /reserved/);
  assert.throws(() => validatePageSlug("events"), /reserved/);
});

test("validatePageSettingsInput validates required fields", () => {
  const result = validatePageSettingsInput({
    title: "About",
    slug: "about",
    status: "draft",
    seo: { title: "About SEO", description: "Desc", imageMediaId: "media_1" },
    headerIdOverride: "landing",
    footerIdOverride: "",
  });

  assert.equal(result.title, "About");
  assert.equal(result.slug, "about");
  assert.equal(result.seo.imageMediaId, "media_1");
  assert.equal(result.headerIdOverride, "landing");
  assert.equal(result.footerIdOverride, "");
});

test("validateCompositionInput rejects unsupported block types", () => {
  assert.throws(
    () => validateCompositionInput([{ id: "blk_1", type: "UnknownSection", variant: "default", props: {} }]),
    /unsupported block type/
  );
});

test("validateCompositionInput requires stable block id", () => {
  assert.throws(
    () => validateCompositionInput([{ id: "", type: "HeroSection", variant: "centered", props: {} }]),
    /stable block id/
  );
});

test("validateCompositionInput normalizes unsupported variants to default", () => {
  const [block] = validateCompositionInput([
    { id: "blk_1", type: "HeroSection", variant: "invalid", props: { heading: "x" } },
  ]);

  assert.equal(block.variant, "centered");
});
