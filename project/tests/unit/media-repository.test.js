import test from "node:test";
import assert from "node:assert/strict";
import { getMemoryDb } from "../../src/lib/data/shared/memory-db.js";
import {
  SYSTEM_FOLDER_ID,
  createMediaFolder,
  deleteMediaAsset,
  deleteMediaFolder,
  listMediaByHub,
  listMediaFoldersByHub,
  updateMediaAsset,
  uploadMediaAssets,
} from "../../src/lib/data/media/media-repository.js";

function seedHub(hubId) {
  const db = getMemoryDb();
  db.hubs.set(hubId, {
    id: hubId,
    name: "Test Hub",
    slug: hubId,
    templateKey: "templateA",
    tokenOverrides: {},
    features: { cmsPages: true, stripePayments: false, emailNotifications: false },
    customDomains: [],
    themeRevision: 1,
    themeCssPath: `hubs/${hubId}/theme/theme-overrides.css`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  db.media.set(hubId, []);
  db.mediaFolders.set(hubId, []);
}

test("listMediaFoldersByHub always includes system folder", async () => {
  const hubId = `hub_test_${Date.now()}_a`;
  seedHub(hubId);

  const folders = await listMediaFoldersByHub(hubId);
  assert.equal(folders.some((folder) => folder.id === SYSTEM_FOLDER_ID), true);
});

test("deleteMediaFolder moves assets into system folder", async () => {
  const hubId = `hub_test_${Date.now()}_b`;
  seedHub(hubId);

  const createdFolder = await createMediaFolder(hubId, { name: "Campaign" }, "tester");
  const [created] = await uploadMediaAssets(
    hubId,
    [{ filename: "asset.jpg", contentType: "image/jpeg", sizeBytes: 100 }],
    { folderId: createdFolder.id },
    "tester"
  );

  assert.equal(created.folderId, createdFolder.id);

  await deleteMediaFolder(hubId, createdFolder.id);
  const media = await listMediaByHub(hubId);
  const moved = media.find((item) => item.id === created.id);
  assert.equal(moved.folderId, SYSTEM_FOLDER_ID);
});

test("deleteMediaAsset blocks deletion when usageCount > 0", async () => {
  const hubId = `hub_test_${Date.now()}_c`;
  seedHub(hubId);

  const [created] = await uploadMediaAssets(
    hubId,
    [{ filename: "in-use.jpg", contentType: "image/jpeg", sizeBytes: 120 }],
    { folderId: SYSTEM_FOLDER_ID },
    "tester"
  );

  await updateMediaAsset(hubId, created.id, { alt: "Hero" });

  const db = getMemoryDb();
  const rows = db.media.get(hubId) || [];
  const index = rows.findIndex((item) => item.id === created.id);
  rows[index] = {
    ...rows[index],
    usageCount: 2,
    usageRefs: [{ kind: "pageBlock", label: "About - Hero" }],
  };
  db.media.set(hubId, rows);

  await assert.rejects(
    () => deleteMediaAsset(hubId, created.id),
    (error) => {
      assert.equal(error.code, "MEDIA_IN_USE");
      assert.equal(Array.isArray(error.usageRefs), true);
      return true;
    }
  );
});
