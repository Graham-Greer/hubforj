import test from "node:test";
import assert from "node:assert/strict";
import {
  buildFirebasePublicUrl,
  buildMediaStoragePath,
  formatMediaFileSize,
  getMediaFilterType,
  inferMediaType,
  normalizeMediaAssetRecord,
  normalizeMediaFolderInput,
  normalizeMediaUploadInput,
} from "../../src/lib/domain/media.js";

test("inferMediaType maps supported media types", () => {
  assert.equal(inferMediaType("image/png", "logo.png"), "image");
  assert.equal(inferMediaType("video/mp4", "clip.mp4"), "video");
  assert.equal(inferMediaType("application/pdf", "guide.pdf"), "pdf");
  assert.equal(inferMediaType("application/octet-stream", "archive.zip"), "file");
});

test("normalizeMediaUploadInput sanitizes upload values", () => {
  const payload = normalizeMediaUploadInput({
    filename: "Hub Logo Final!.PNG",
    contentType: "image/png",
    sizeBytes: "2048",
    folderId: "folder_brand",
    alt: " Hub logo ",
  });

  assert.equal(payload.filename, "hub-logo-final.png");
  assert.equal(payload.type, "image");
  assert.equal(payload.alt, "Hub logo");
  assert.equal(payload.folderId, "folder_brand");
  assert.equal(payload.sizeBytes, 2048);
});

test("normalizeMediaFolderInput normalizes and validates folder names", () => {
  const folder = normalizeMediaFolderInput({ name: " Homepage Banners " });

  assert.equal(folder.name, "Homepage Banners");
  assert.equal(folder.slug, "homepage-banners");

  assert.throws(() => normalizeMediaFolderInput({ name: "" }), /Folder name is required/);
});

test("normalizeMediaUploadInput rejects empty and oversized uploads", () => {
  assert.throws(
    () => normalizeMediaUploadInput({ filename: "logo.png", contentType: "image/png", sizeBytes: "0" }),
    /must not be empty/
  );

  assert.throws(
    () => normalizeMediaUploadInput({ filename: "logo.png", contentType: "image/png", sizeBytes: String(11 * 1024 * 1024) }),
    /10 MB or smaller/
  );
});

test("media path and public url builders are deterministic", () => {
  const storagePath = buildMediaStoragePath("hub_1", "asset_1", "logo.png");
  const publicUrl = buildFirebasePublicUrl("bucket.example", storagePath, "token_123");

  assert.equal(storagePath, "hubs/hub_1/media/asset_1/logo.png");
  assert.match(publicUrl, /token_123/);
});

test("normalizeMediaAssetRecord keeps optional metadata stable", () => {
  const asset = normalizeMediaAssetRecord({
    id: "asset_1",
    hubId: "hub_1",
    filename: "logo.png",
    contentType: "image/png",
    publicUrl: "https://example.test/logo.png",
    sizeBytes: "4096",
    alt: "Hub logo",
    usageRefs: ["siteSettings.logo"],
  });

  assert.equal(asset.type, "image");
  assert.equal(asset.sizeBytes, 4096);
  assert.equal(asset.alt, "Hub logo");
  assert.deepEqual(asset.usageRefs, ["siteSettings.logo"]);
});

test("media helpers normalize filter type and file-size display", () => {
  assert.equal(getMediaFilterType("image"), "image");
  assert.equal(getMediaFilterType("video"), "video");
  assert.equal(getMediaFilterType("pdf"), "doc");
  assert.equal(getMediaFilterType("file"), "doc");
  assert.equal(getMediaFilterType("unknown"), "all");

  assert.equal(formatMediaFileSize(0), "0 B");
  assert.equal(formatMediaFileSize(2048), "2 KB");
  assert.equal(formatMediaFileSize(2.5 * 1024 * 1024), "2.5 MB");
});
