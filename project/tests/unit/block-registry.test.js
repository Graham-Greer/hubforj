import test from "node:test";
import assert from "node:assert/strict";
import {
  buildDefaultBlock,
  evaluateBlockReadiness,
  getCmsBlockDefinition,
  listCmsBlocks,
  normalizeBlockProps,
  normalizeVariant,
} from "../../src/lib/data/pages/block-registry.js";

test("listCmsBlocks includes optional MVP blocks", () => {
  const blocks = listCmsBlocks();
  const types = new Set(blocks.map((block) => block.type));

  assert.equal(types.has("AccordionSection"), true);
  assert.equal(types.has("PricingSection"), true);
  assert.equal(types.has("StatsSection"), true);
  assert.equal(types.has("TeamSection"), true);
  assert.equal(types.has("TestimonialsSection"), true);
  assert.equal(types.has("LegalDocumentSection"), true);
});

test("buildDefaultBlock returns constrained default variant", () => {
  const block = buildDefaultBlock("HeroSection");
  assert.equal(block.type, "HeroSection");
  assert.equal(block.variant, "centered");
});

test("normalizeVariant falls back to definition default", () => {
  assert.equal(normalizeVariant("CTASection", "split"), "split");
  assert.equal(normalizeVariant("CTASection", "unsupported"), "centered");
  assert.equal(normalizeVariant("UnknownSection", "anything"), "default");
});

test("getCmsBlockDefinition returns null for unsupported types", () => {
  assert.equal(getCmsBlockDefinition("DoesNotExist"), null);
});

test("AccordionSection defaults are cloned per block instance", () => {
  const a = buildDefaultBlock("AccordionSection");
  const b = buildDefaultBlock("AccordionSection");

  a.props.items[0].title = "Changed";
  assert.equal(b.props.items[0].title, "");
});

test("normalizeBlockProps applies AccordionSection contract rules", () => {
  const props = normalizeBlockProps("AccordionSection", {
    eyebrow: "  Need to know ",
    description: "x".repeat(500),
    items: [{ id: "", title: " First ", content: " Body " }],
  });

  assert.equal(props.eyebrow, "Need to know");
  assert.equal(props.description.length, 240);
  assert.equal(props.items.length, 1);
  assert.equal(props.items[0].title, "First");
});

test("evaluateBlockReadiness reports required fields for AccordionSection", () => {
  const result = evaluateBlockReadiness({
    type: "AccordionSection",
    props: { items: [{ id: "a", title: "", content: "" }] },
  });

  assert.equal(result.readyForDraft, false);
  assert.equal(result.readyForPublish, false);
  assert.equal(result.missingCount, 2);
});

test("normalizeBlockProps validates CTA href contract for HeroSection", () => {
  assert.throws(
    () => normalizeBlockProps("HeroSection", {
      heading: "Hello",
      ctas: [{ label: "Read", href: "javascript:alert(1)" }],
    }),
    /HeroSection\.ctas\[0\]\.href/
  );
});

test("normalizeBlockProps enforces max two CTAs for CTASection", () => {
  assert.throws(
    () => normalizeBlockProps("CTASection", {
      title: "Join",
      ctas: [
        { label: "A", href: "/a" },
        { label: "B", href: "/b" },
        { label: "C", href: "/c" },
      ],
    }),
    /CTASection\.ctas supports up to two items/
  );
});

test("evaluateBlockReadiness marks section invalid when CTA row is added but empty", () => {
  const result = evaluateBlockReadiness({
    type: "HeroSection",
    props: {
      heading: "Welcome",
      ctas: [{ label: "", href: "" }],
    },
  });

  assert.equal(result.readyForDraft, false);
  assert.equal(result.missingCount, 2);
});
