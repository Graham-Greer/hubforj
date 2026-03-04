import test from "node:test";
import assert from "node:assert/strict";
import { getMemoryDb } from "../../src/lib/data/shared/memory-db.js";
import { getPageById, publishPage, savePageDraft } from "../../src/lib/data/pages/page-repository.js";

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
