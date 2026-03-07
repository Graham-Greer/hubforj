import test from "node:test";
import assert from "node:assert/strict";
import {
  assertCompositionPublishReady,
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
  assert.equal(result.parentPageId, "");
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

test("validateCompositionInput normalizes AccordionSection props", () => {
  const [block] = validateCompositionInput([
    {
      id: "blk_1",
      type: "AccordionSection",
      variant: "invalid",
      props: {
        eyebrow: "  Help ",
        description: "d".repeat(300),
        items: [{ id: "", title: "Q", content: "A" }],
      },
    },
  ]);

  assert.equal(block.variant, "default");
  assert.equal(block.props.eyebrow, "Help");
  assert.equal(block.props.description.length, 240);
  assert.equal(block.props.items.length, 1);
});

test("assertCompositionPublishReady blocks incomplete AccordionSection blocks", () => {
  assert.throws(
    () =>
      assertCompositionPublishReady([
        {
          id: "blk_1",
          type: "AccordionSection",
          variant: "default",
          label: "Accordion",
          props: {
            items: [{ id: "acc_1", title: "", content: "" }],
          },
        },
      ]),
    /Cannot publish page/
  );
});

test("validateCompositionInput enforces CTA href scheme rules", () => {
  const [block] = validateCompositionInput([
    {
      id: "blk_hero_1",
      type: "HeroSection",
      variant: "centered",
      props: {
        heading: "Welcome",
        ctas: [{ label: "Join", href: "javascript:alert(1)" }],
      },
    },
  ]);

  assert.equal(block.type, "HeroSection");
  assert.throws(
    () => assertCompositionPublishReady([block]),
    /Cannot publish page/
  );
});

test("validateCompositionInput rejects empty CTA rows once added", () => {
  const [block] = validateCompositionInput([
    {
      id: "blk_hero_2",
      type: "HeroSection",
      variant: "centered",
      props: {
        heading: "Welcome",
        ctas: [{ label: "", href: "" }],
      },
    },
  ]);

  assert.equal(block.type, "HeroSection");
  assert.throws(
    () => assertCompositionPublishReady([block]),
    /Cannot publish page/
  );
});

test("assertCompositionPublishReady blocks FeatureSection when centered media mode requires alt", () => {
  const [block] = validateCompositionInput([
    {
      id: "blk_feature_1",
      type: "FeatureSection",
      variant: "centered",
      props: {
        title: "Feature",
        centeredMediaMode: "background",
        media: {
          mediaId: "media_feature",
          kind: "image",
          alt: "",
        },
      },
    },
  ]);

  assert.equal(block.type, "FeatureSection");
  assert.throws(
    () => assertCompositionPublishReady([block]),
    /Cannot publish page/
  );
});

test("assertCompositionPublishReady blocks GridSection when card image alt is missing", () => {
  const [block] = validateCompositionInput([
    {
      id: "blk_grid_1",
      type: "GridSection",
      variant: "default",
      props: {
        items: [
          {
            id: "card_1",
            title: "Card title",
            media: {
              imageMediaId: "media_grid_1",
              alt: "",
            },
          },
        ],
      },
    },
  ]);

  assert.equal(block.type, "GridSection");
  assert.throws(
    () => assertCompositionPublishReady([block]),
    /Cannot publish page/
  );
});

test("assertCompositionPublishReady blocks StatsSection when icon is added without icon name", () => {
  const [block] = validateCompositionInput([
    {
      id: "blk_stats_1",
      type: "StatsSection",
      variant: "cards",
      props: {
        items: [
          {
            id: "stat_1",
            label: "Members",
            value: "2.4k",
            icon: { name: "", tone: "neutral" },
          },
        ],
      },
    },
  ]);

  assert.equal(block.type, "StatsSection");
  assert.throws(
    () => assertCompositionPublishReady([block]),
    /Cannot publish page/
  );
});

test("assertCompositionPublishReady blocks StatsSection with invalid CTA href", () => {
  const [block] = validateCompositionInput([
    {
      id: "blk_stats_2",
      type: "StatsSection",
      variant: "split",
      props: {
        items: [{ id: "stat_1", label: "Programs", value: "18" }],
        ctas: [{ label: "Read report", href: "javascript:alert(1)" }],
      },
    },
  ]);

  assert.equal(block.type, "StatsSection");
  assert.throws(
    () => assertCompositionPublishReady([block]),
    /Cannot publish page/
  );
});

test("assertCompositionPublishReady blocks TeamSection when avatar alt is missing", () => {
  const [block] = validateCompositionInput([
    {
      id: "blk_team_1",
      type: "TeamSection",
      variant: "default",
      props: {
        items: [
          {
            id: "person_1",
            name: "Jordan Lee",
            avatar: {
              imageMediaId: "media_team_1",
              alt: "",
            },
          },
        ],
      },
    },
  ]);

  assert.equal(block.type, "TeamSection");
  assert.throws(
    () => assertCompositionPublishReady([block]),
    /Cannot publish page/
  );
});

test("assertCompositionPublishReady blocks TeamSection when social URL is not https", () => {
  const [block] = validateCompositionInput([
    {
      id: "blk_team_2",
      type: "TeamSection",
      variant: "default",
      props: {
        items: [
          {
            id: "person_1",
            name: "Jordan Lee",
            socialLinks: [
              { id: "social_1", platform: "linkedin", href: "http://linkedin.com/in/jordan" },
            ],
          },
        ],
      },
    },
  ]);

  assert.equal(block.type, "TeamSection");
  assert.throws(
    () => assertCompositionPublishReady([block]),
    /Cannot publish page/
  );
});
