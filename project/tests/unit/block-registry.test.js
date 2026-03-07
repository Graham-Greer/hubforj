import test from "node:test";
import assert from "node:assert/strict";
import {
  buildDefaultBlock,
  collectMediaIdsForBlock,
  evaluateBlockReadiness,
  getCmsBlockDefinition,
  listCmsBlocks,
  normalizeBlockProps,
  normalizeVariant,
} from "../../src/lib/data/pages/block-registry.js";

test("listCmsBlocks includes optional MVP blocks", () => {
  const blocks = listCmsBlocks();
  const types = new Set(blocks.map((block) => block.type));

  assert.equal(types.has("FeatureSection"), true);
  assert.equal(types.has("GridSection"), true);
  assert.equal(types.has("AccordionSection"), true);
  assert.equal(types.has("PricingSection"), true);
  assert.equal(types.has("StatsSection"), true);
  assert.equal(types.has("TeamSection"), true);
  assert.equal(types.has("TestimonialsSection"), true);
});

test("buildDefaultBlock returns constrained default variant", () => {
  const block = buildDefaultBlock("HeroSection");
  assert.equal(block.type, "HeroSection");
  assert.equal(block.variant, "centered");
});

test("normalizeVariant falls back to definition default", () => {
  assert.equal(normalizeVariant("HeroSection", "split"), "split");
  assert.equal(normalizeVariant("HeroSection", "unsupported"), "centered");
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

test("normalizeBlockProps keeps hero CTA rows for readiness evaluation", () => {
  const props = normalizeBlockProps("HeroSection", {
    title: "Hello",
    ctas: [{ label: "Read", href: "javascript:alert(1)" }],
  });

  assert.equal(props.ctas.length, 1);
  assert.equal(props.ctas[0].href, "javascript:alert(1)");
});

test("normalizeBlockProps enforces max two CTAs for HeroSection", () => {
  assert.throws(
    () => normalizeBlockProps("HeroSection", {
      title: "Join",
      ctas: [
        { label: "A", href: "/a" },
        { label: "B", href: "/b" },
        { label: "C", href: "/c" },
      ],
    }),
    /HeroSection\.ctas supports up to two items/
  );
});

test("evaluateBlockReadiness allows draft save when CTA row is empty but blocks publish", () => {
  const result = evaluateBlockReadiness({
    type: "HeroSection",
    props: {
      title: "Welcome",
      ctas: [{ label: "", href: "" }],
    },
  });

  assert.equal(result.readyForDraft, true);
  assert.equal(result.readyForPublish, false);
  assert.equal(result.missingCount, 2);
});

test("evaluateBlockReadiness blocks publish when hero CTA href scheme is invalid", () => {
  const result = evaluateBlockReadiness({
    type: "HeroSection",
    props: {
      title: "Welcome",
      ctas: [{ label: "Read", href: "javascript:alert(1)" }],
    },
  });

  assert.equal(result.readyForDraft, true);
  assert.equal(result.readyForPublish, false);
  assert.match(result.missingRequiredFields[0], /internal/);
});

test("evaluateBlockReadiness requires media for split hero", () => {
  const result = evaluateBlockReadiness({
    type: "HeroSection",
    variant: "split",
    props: {
      title: "Welcome",
      media: {
        mediaId: "",
        kind: "image",
        alt: "",
      },
    },
  });

  assert.equal(result.readyForDraft, false);
  assert.match(result.missingRequiredFields[0], /Split hero requires/);
});

test("evaluateBlockReadiness reports both title and media missing for split hero", () => {
  const result = evaluateBlockReadiness({
    type: "HeroSection",
    variant: "split",
    props: {
      title: "",
      media: {
        mediaId: "",
        kind: "image",
        alt: "",
      },
    },
  });

  assert.equal(result.readyForDraft, false);
  assert.equal(result.missingCount, 2);
});

test("evaluateBlockReadiness requires alt when hero media is selected", () => {
  const result = evaluateBlockReadiness({
    type: "HeroSection",
    variant: "centered",
    props: {
      title: "Welcome",
      media: {
        mediaId: "media_preview_hero",
        kind: "image",
        alt: "",
      },
    },
  });

  assert.equal(result.readyForDraft, false);
  assert.match(result.missingRequiredFields[0], /Alt text is required/);
});

test("evaluateBlockReadiness allows centered FeatureSection without media when mode is none", () => {
  const result = evaluateBlockReadiness({
    type: "FeatureSection",
    variant: "centered",
    props: {
      title: "Feature highlight",
      centeredMediaMode: "none",
      media: {
        mediaId: "",
        kind: "image",
        alt: "",
      },
    },
  });

  assert.equal(result.readyForDraft, true);
  assert.equal(result.readyForPublish, true);
});

test("evaluateBlockReadiness requires media and alt when centered FeatureSection mode enables media", () => {
  const result = evaluateBlockReadiness({
    type: "FeatureSection",
    variant: "centered",
    props: {
      title: "Feature highlight",
      centeredMediaMode: "background",
      media: {
        mediaId: "media_feature_1",
        kind: "image",
        alt: "",
      },
    },
  });

  assert.equal(result.readyForDraft, false);
  assert.match(result.missingRequiredFields[0], /Alt text is required for feature media/);
});

test("evaluateBlockReadiness requires media for split FeatureSection", () => {
  const result = evaluateBlockReadiness({
    type: "FeatureSection",
    variant: "split",
    props: {
      title: "Feature highlight",
      media: {
        mediaId: "",
        kind: "image",
        alt: "",
      },
    },
  });

  assert.equal(result.readyForDraft, false);
  assert.match(result.missingRequiredFields[0], /Split feature requires/);
});

test("evaluateBlockReadiness blocks publish when FeatureSection CTA href scheme is invalid", () => {
  const result = evaluateBlockReadiness({
    type: "FeatureSection",
    variant: "centered",
    props: {
      title: "Feature highlight",
      centeredMediaMode: "none",
      ctas: [{ label: "Read more", href: "javascript:alert(1)" }],
    },
  });

  assert.equal(result.readyForDraft, true);
  assert.equal(result.readyForPublish, false);
  assert.match(result.missingRequiredFields[0], /internal/);
});

test("collectMediaIdsForBlock ignores centered FeatureSection media when mode is none", () => {
  const ids = collectMediaIdsForBlock({
    id: "blk_feature_media_1",
    type: "FeatureSection",
    variant: "centered",
    props: {
      title: "Feature highlight",
      centeredMediaMode: "none",
      media: {
        mediaId: "media_feature_hidden",
        kind: "image",
        alt: "Hidden media",
      },
    },
  });

  assert.equal(ids.includes("media_feature_hidden"), false);
});

test("evaluateBlockReadiness requires at least one GridSection item", () => {
  const result = evaluateBlockReadiness({
    type: "GridSection",
    variant: "default",
    props: {
      title: "Grid",
      items: [],
    },
  });

  assert.equal(result.readyForDraft, false);
  assert.match(result.missingRequiredFields[0], /Add at least one card item/);
});

test("evaluateBlockReadiness counts missing GridSection fields across items", () => {
  const result = evaluateBlockReadiness({
    type: "GridSection",
    variant: "default",
    props: {
      items: [
        {
          id: "card_1",
          title: "",
          media: {
            imageMediaId: "media_grid_1",
            alt: "",
          },
        },
      ],
    },
  });

  assert.equal(result.readyForDraft, false);
  assert.equal(result.missingCount, 2);
});

test("evaluateBlockReadiness accepts valid GridSection card items", () => {
  const result = evaluateBlockReadiness({
    type: "GridSection",
    variant: "default",
    props: {
      items: [
        {
          id: "card_1",
          title: "Card one",
          media: {
            imageMediaId: "media_grid_1",
            alt: "Card image",
          },
        },
      ],
    },
  });

  assert.equal(result.readyForDraft, true);
  assert.equal(result.readyForPublish, true);
});

test("collectMediaIdsForBlock includes GridSection item image media refs", () => {
  const ids = collectMediaIdsForBlock({
    id: "blk_grid_1",
    type: "GridSection",
    variant: "default",
    props: {
      items: [
        {
          id: "card_1",
          title: "Card one",
          media: {
            imageMediaId: "media_grid_1",
            alt: "Card image",
          },
        },
      ],
    },
  });

  assert.equal(ids.includes("media_grid_1"), true);
});

test("normalizeBlockProps normalizes StatsSection to fragment-composed contract", () => {
  const props = normalizeBlockProps("StatsSection", {
    description: "d".repeat(400),
    columns: "5",
    align: "sideways",
    density: "dense",
    items: [{ id: "", label: " Members ", value: " 2.4k " }],
  }, "cards");

  assert.equal(props.description.length, 180);
  assert.equal(props.columns, "3");
  assert.equal(props.align, "left");
  assert.equal(props.density, "comfortable");
  assert.equal(props.items[0].label, "Members");
  assert.equal(props.items[0].value, "2.4k");
});

test("evaluateBlockReadiness requires at least one StatsSection item", () => {
  const result = evaluateBlockReadiness({
    type: "StatsSection",
    variant: "cards",
    props: { items: [] },
  });

  assert.equal(result.readyForDraft, false);
  assert.match(result.missingRequiredFields[0], /Add at least one stat item/);
});

test("evaluateBlockReadiness counts missing StatsSection fields including icon name", () => {
  const result = evaluateBlockReadiness({
    type: "StatsSection",
    variant: "cards",
    props: {
      items: [
        {
          id: "stat_1",
          label: "",
          value: "",
          icon: { name: "", tone: "neutral" },
        },
      ],
    },
  });

  assert.equal(result.readyForDraft, false);
  assert.equal(result.missingCount, 3);
});

test("evaluateBlockReadiness allows draft save but blocks publish for invalid StatsSection CTA", () => {
  const result = evaluateBlockReadiness({
    type: "StatsSection",
    variant: "split",
    props: {
      items: [{ id: "stat_1", label: "Members", value: "2.4k" }],
      ctas: [{ label: "Read report", href: "javascript:alert(1)" }],
    },
  });

  assert.equal(result.readyForDraft, true);
  assert.equal(result.readyForPublish, false);
  assert.match(result.missingRequiredFields[0], /internal/);
});

test("normalizeBlockProps normalizes PricingSection to fragment-composed contract", () => {
  const props = normalizeBlockProps("PricingSection", {
    description: "d".repeat(500),
    columns: "9",
    align: "sideways",
    density: "dense",
    items: [
      {
        id: "",
        name: " Starter ",
        isFree: false,
        price: { amountMinor: "1999", currency: "cad" },
        features: [{ id: "", text: "  Feature one  " }],
      },
    ],
  }, "tiers");

  assert.equal(props.description.length, 240);
  assert.equal(props.columns, "3");
  assert.equal(props.align, "left");
  assert.equal(props.density, "comfortable");
  assert.equal(props.items[0].name, "Starter");
  assert.equal(props.items[0].price.currency, "GBP");
  assert.equal(props.items[0].features[0].text, "Feature one");
});

test("evaluateBlockReadiness requires at least one PricingSection tier", () => {
  const result = evaluateBlockReadiness({
    type: "PricingSection",
    variant: "tiers",
    props: { items: [] },
  });

  assert.equal(result.readyForDraft, false);
  assert.match(result.missingRequiredFields[0], /Add at least one pricing tier/);
});

test("evaluateBlockReadiness enforces paid tier money and publish feature gate for PricingSection", () => {
  const result = evaluateBlockReadiness({
    type: "PricingSection",
    variant: "tiers",
    props: {
      items: [
        {
          id: "tier_1",
          name: "Growth",
          isFree: false,
          price: { amountMinor: 1999, currency: "GBP" },
          features: [],
        },
      ],
    },
  });

  assert.equal(result.readyForDraft, true);
  assert.equal(result.readyForPublish, false);
  assert.match(result.missingRequiredFields[0], /add at least one feature/i);
});

test("evaluateBlockReadiness rejects invalid tier CTA href in PricingSection", () => {
  const result = evaluateBlockReadiness({
    type: "PricingSection",
    variant: "tiers",
    props: {
      items: [
        {
          id: "tier_1",
          name: "Growth",
          isFree: true,
          features: [{ id: "feature_1", text: "Support included" }],
          cta: { label: "Join", href: "javascript:alert(1)" },
        },
      ],
    },
  });

  assert.equal(result.readyForDraft, false);
  assert.equal(result.readyForPublish, false);
  assert.match(result.missingRequiredFields[0], /internal/);
});

test("normalizeBlockProps normalizes TeamSection to fragment-composed contract", () => {
  const props = normalizeBlockProps("TeamSection", {
    description: "d".repeat(400),
    columns: "7",
    align: "sideways",
    density: "dense",
    items: [{ id: "", name: " Jordan Lee ", role: " Director " }],
  }, "default");

  assert.equal(props.description.length, 240);
  assert.equal(props.columns, "3");
  assert.equal(props.align, "left");
  assert.equal(props.density, "comfortable");
  assert.equal(props.items[0].name, "Jordan Lee");
  assert.equal(props.items[0].role, "Director");
});

test("evaluateBlockReadiness requires at least one TeamSection item", () => {
  const result = evaluateBlockReadiness({
    type: "TeamSection",
    variant: "default",
    props: { items: [] },
  });

  assert.equal(result.readyForDraft, false);
  assert.match(result.missingRequiredFields[0], /Add at least one team member/);
});

test("evaluateBlockReadiness counts missing TeamSection required fields", () => {
  const result = evaluateBlockReadiness({
    type: "TeamSection",
    variant: "default",
    props: {
      items: [
        {
          id: "person_1",
          name: "",
          avatar: {
            imageMediaId: "media_team_1",
            alt: "",
          },
          socialLinks: [{ id: "social_1", platform: "linkedin", href: "http://linkedin.com/in/user" }],
        },
      ],
    },
  });

  assert.equal(result.readyForDraft, false);
  assert.equal(result.missingCount, 3);
});

test("collectMediaIdsForBlock includes TeamSection avatar media refs", () => {
  const ids = collectMediaIdsForBlock({
    id: "blk_team_1",
    type: "TeamSection",
    variant: "default",
    props: {
      items: [
        {
          id: "person_1",
          name: "Jordan",
          avatar: {
            imageMediaId: "media_team_1",
            alt: "Jordan portrait",
          },
        },
      ],
    },
  });

  assert.equal(ids.includes("media_team_1"), true);
});

test("normalizeBlockProps normalizes TestimonialsSection to fragment-composed contract", () => {
  const props = normalizeBlockProps("TestimonialsSection", {
    description: "d".repeat(500),
    columns: "9",
    align: "sideways",
    density: "dense",
    items: [{ id: "", quote: "q".repeat(500), authorName: " Casey " }],
  }, "lead");

  assert.equal(props.description.length, 240);
  assert.equal(props.columns, "3");
  assert.equal(props.align, "left");
  assert.equal(props.density, "comfortable");
  assert.equal(props.items[0].quote.length, 360);
  assert.equal(props.items[0].authorName, "Casey");
  assert.equal(Object.hasOwn(props.items[0], "rating"), false);
});

test("evaluateBlockReadiness requires at least one TestimonialsSection item", () => {
  const result = evaluateBlockReadiness({
    type: "TestimonialsSection",
    variant: "grid",
    props: { items: [] },
  });

  assert.equal(result.readyForDraft, false);
  assert.match(result.missingRequiredFields[0], /Add at least one testimonial item/);
});

test("evaluateBlockReadiness counts missing TestimonialsSection required fields", () => {
  const result = evaluateBlockReadiness({
    type: "TestimonialsSection",
    variant: "lead",
    props: {
      items: [
        {
          id: "quote_1",
          quote: "",
          avatar: {
            imageMediaId: "media_testimonial_1",
            alt: "",
          },
          rating: 5,
        },
      ],
    },
  });

  assert.equal(result.readyForDraft, false);
  assert.equal(result.readyForPublish, false);
  assert.equal(result.missingCount, 2);
});

test("collectMediaIdsForBlock includes TestimonialsSection avatar media refs", () => {
  const ids = collectMediaIdsForBlock({
    id: "blk_testimonials_1",
    type: "TestimonialsSection",
    variant: "grid",
    props: {
      items: [
        {
          id: "quote_1",
          quote: "Great delivery experience.",
          avatar: {
            imageMediaId: "media_testimonial_1",
            alt: "Portrait of testimonial author",
          },
        },
      ],
    },
  });

  assert.equal(ids.includes("media_testimonial_1"), true);
});
