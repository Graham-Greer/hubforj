import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("public landing page keeps homepage rendering focused on the core section stack", () => {
  const source = readFileSync(
    new URL("../../src/components/patterns/public-landing-page/PublicLandingPage.jsx", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(source, /FAQSection/);
  assert.doesNotMatch(source, /faqSettings/);
  assert.doesNotMatch(source, /visibleFaqItems/);
  assert.match(source, /HeroSection/);
  assert.match(source, /shouldRenderWhatWeDoSection/);
  assert.match(source, /whatWeDoItems\.length > 0/);
  assert.match(source, /shouldRenderTestimonialsSection/);
  assert.match(source, /testimonials\.length > 0/);
  assert.match(source, /CTASection/);
});
