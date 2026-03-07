import test from "node:test";
import assert from "node:assert/strict";
import { getMemoryDb } from "../../src/lib/data/shared/memory-db.js";
import { collectMediaIdsForPage, publishPage, savePageDraft } from "../../src/lib/data/pages/page-repository.js";

function seedHubPage(hubId, pageId) {
  const db = getMemoryDb();
  const now = new Date().toISOString();

  db.hubs.set(hubId, {
    id: hubId,
    name: "Test Hub",
    slug: hubId,
    templateKey: "templateA",
    tokenOverrides: {},
    globalHeaderId: "standard",
    globalFooterId: "simple",
    features: { cmsPages: true, stripePayments: false, emailNotifications: false },
    customDomains: [],
    themeRevision: 1,
    themeCssPath: `hubs/${hubId}/theme/theme-overrides.css`,
    createdAt: now,
    updatedAt: now,
  });

  db.media.set(hubId, []);
  db.pages.set(hubId, [
    {
      id: pageId,
      hubId,
      title: "Test page",
      slug: "test-page",
      status: "draft",
      draftComposition: [],
      publishedComposition: [],
      seo: {
        title: "",
        description: "",
        imageMediaId: "",
      },
      parentPageId: "",
      headerIdOverride: "",
      footerIdOverride: "",
      createdAt: now,
      updatedAt: now,
      publishedAt: null,
      createdBy: "seed",
      updatedBy: "seed",
    },
  ]);
}

test("savePageDraft rejects stale updates when expectedUpdatedAt mismatches", async () => {
  const hubId = `hub_pages_repo_${Date.now()}_a`;
  const pageId = `page_${Date.now()}_a`;
  seedHubPage(hubId, pageId);

  await assert.rejects(
    () =>
      savePageDraft(
        hubId,
        pageId,
        { title: "First update", slug: "test-page" },
        "tester",
        { expectedUpdatedAt: "1970-01-01T00:00:00.000Z" }
      ),
    (error) => {
      assert.equal(error.code, "STALE_DRAFT");
      return true;
    }
  );
});

test("publishPage rejects stale publish when expectedUpdatedAt mismatches", async () => {
  const hubId = `hub_pages_repo_${Date.now()}_b`;
  const pageId = `page_${Date.now()}_b`;
  seedHubPage(hubId, pageId);

  await assert.rejects(
    () => publishPage(hubId, pageId, "tester", { expectedUpdatedAt: "1970-01-01T00:00:00.000Z" }),
    (error) => {
      assert.equal(error.code, "STALE_DRAFT");
      return true;
    }
  );
});

test("collectMediaIdsForPage includes hero media and poster refs", () => {
  const ids = collectMediaIdsForPage({
    draftComposition: [
      {
        id: "blk_hero_1",
        type: "HeroSection",
        variant: "split",
        props: {
          title: "Welcome",
          media: {
            mediaId: "media_hero",
            kind: "video",
            alt: "Hero video",
            posterMediaId: "media_poster",
          },
        },
      },
    ],
    publishedComposition: [],
    seo: { imageMediaId: "media_seo" },
  });

  const unique = new Set(ids);
  assert.equal(unique.has("media_hero"), true);
  assert.equal(unique.has("media_poster"), true);
  assert.equal(unique.has("media_seo"), true);
});

test("collectMediaIdsForPage excludes centered FeatureSection media when centered mode is none", () => {
  const ids = collectMediaIdsForPage({
    draftComposition: [
      {
        id: "blk_feature_1",
        type: "FeatureSection",
        variant: "centered",
        props: {
          title: "Feature",
          centeredMediaMode: "none",
          media: {
            mediaId: "media_hidden_feature",
            kind: "image",
            alt: "Hidden feature media",
          },
        },
      },
    ],
    publishedComposition: [],
    seo: { imageMediaId: "" },
  });

  const unique = new Set(ids);
  assert.equal(unique.has("media_hidden_feature"), false);
});

test("collectMediaIdsForPage includes GridSection card image refs", () => {
  const ids = collectMediaIdsForPage({
    draftComposition: [
      {
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
      },
    ],
    publishedComposition: [],
    seo: { imageMediaId: "" },
  });

  const unique = new Set(ids);
  assert.equal(unique.has("media_grid_1"), true);
});

test("savePageDraft does not require media-library alt text for draft saves", async () => {
  const hubId = `hub_pages_repo_${Date.now()}_c`;
  const pageId = `page_${Date.now()}_c`;
  seedHubPage(hubId, pageId);

  const db = getMemoryDb();
  db.media.set(hubId, [
    {
      id: "media_hero",
      hubId,
      filename: "hero.jpg",
      storagePath: `hubs/${hubId}/media/media_hero/hero.jpg`,
      publicUrl: "https://example.invalid/hero.jpg",
      type: "image",
      contentType: "image/jpeg",
      sizeBytes: 1200,
      folderId: "all-assets",
      alt: "",
      usageCount: 0,
      usageRefs: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "active",
    },
  ]);

  const saved = await savePageDraft(
    hubId,
    pageId,
    {
      title: "Updated",
      slug: "test-page",
      draftComposition: [
        {
          id: "blk_hero_1",
          type: "HeroSection",
          variant: "centered",
          props: {
            title: "Welcome",
            media: {
              mediaId: "media_hero",
              kind: "image",
              alt: "Hero usage alt",
            },
          },
        },
      ],
    },
    "tester"
  );

  assert.equal(saved?.title, "Updated");
});

test("publishPage accepts section usage alt when media-library alt is empty", async () => {
  const hubId = `hub_pages_repo_${Date.now()}_d`;
  const pageId = `page_${Date.now()}_d`;
  seedHubPage(hubId, pageId);

  const db = getMemoryDb();
  const now = new Date().toISOString();

  db.media.set(hubId, [
    {
      id: "media_hero_usage_alt",
      hubId,
      filename: "hero.jpg",
      storagePath: `hubs/${hubId}/media/media_hero_usage_alt/hero.jpg`,
      publicUrl: "https://example.invalid/hero.jpg",
      type: "image",
      contentType: "image/jpeg",
      sizeBytes: 1200,
      folderId: "all-assets",
      alt: "",
      usageCount: 0,
      usageRefs: [],
      createdAt: now,
      updatedAt: now,
      status: "active",
    },
  ]);

  db.pages.set(hubId, [
    {
      ...db.pages.get(hubId)[0],
      draftComposition: [
        {
          id: "blk_hero_publish_1",
          type: "HeroSection",
          variant: "centered",
          props: {
            title: "Welcome",
            media: {
              mediaId: "media_hero_usage_alt",
              kind: "image",
              alt: "Hero usage alt",
            },
          },
        },
      ],
    },
  ]);

  const published = await publishPage(hubId, pageId, "tester");
  assert.equal(published?.status, "published");
  assert.equal(Array.isArray(published?.publishedComposition), true);
  assert.equal(published?.publishedComposition.length, 1);
});
