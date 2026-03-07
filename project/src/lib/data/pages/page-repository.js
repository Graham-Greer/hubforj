try {
  await import("server-only");
} catch {
  // Unit tests run in plain Node where this package may not be installed.
}
import crypto from "node:crypto";
import { getDataProvider } from "../shared/provider.js";
import { getMediaByIds } from "../media/media-repository.js";
import { normalizeFooterOverride, normalizeHeaderOverride } from "./layout-config.js";
import { assertCompositionPublishReady } from "../../validation/pages.js";
import { collectMediaIdsForBlock } from "./block-registry.js";

const MAX_PAGE_TREE_DEPTH = 4;
const STALE_DRAFT_ERROR_CODE = "STALE_DRAFT";

function createStaleDraftError() {
  const error = new Error("This page was updated by another session. Reload latest draft and retry.");
  error.code = STALE_DRAFT_ERROR_CODE;
  return error;
}

function pageToViewModel(page) {
  return {
    id: page.id,
    hubId: page.hubId,
    title: page.title,
    slug: page.slug,
    status: page.status || "draft",
    draftComposition: Array.isArray(page.draftComposition) ? page.draftComposition : [],
    publishedComposition: Array.isArray(page.publishedComposition) ? page.publishedComposition : [],
    seo: {
      title: String(page.seo?.title || "").trim(),
      description: String(page.seo?.description || "").trim(),
      imageMediaId: String(page.seo?.imageMediaId || "").trim(),
    },
    parentPageId: String(page.parentPageId || "").trim(),
    headerIdOverride: normalizeHeaderOverride(page.headerIdOverride),
    footerIdOverride: normalizeFooterOverride(page.footerIdOverride),
    createdAt: page.createdAt,
    updatedAt: page.updatedAt,
    publishedAt: page.publishedAt || null,
    createdBy: page.createdBy || null,
    updatedBy: page.updatedBy || null,
  };
}

function computePageDepth(pageId, pageById) {
  let depth = 0;
  let cursor = String(pageId || "").trim();
  const seen = new Set();

  while (cursor) {
    if (seen.has(cursor)) {
      throw new Error("Page hierarchy contains a cycle.");
    }
    seen.add(cursor);
    depth += 1;
    const next = pageById.get(cursor);
    cursor = String(next?.parentPageId || "").trim();
  }

  return depth;
}

async function assertValidParentPageSelection(hubId, pageId, parentPageId) {
  const normalizedParentId = String(parentPageId || "").trim();
  if (!normalizedParentId) return;
  if (pageId && normalizedParentId === pageId) {
    throw new Error("A page cannot be its own parent.");
  }

  const pages = await listPagesByHub(hubId);
  const pageById = new Map(pages.map((page) => [page.id, page]));
  if (!pageById.has(normalizedParentId)) {
    throw new Error("Selected parent page was not found for this hub.");
  }

  if (pageId) {
    let cursor = normalizedParentId;
    const seen = new Set();
    while (cursor) {
      if (cursor === pageId) {
        throw new Error("Cannot set parent page: cyclical hierarchy detected.");
      }
      if (seen.has(cursor)) break;
      seen.add(cursor);
      const node = pageById.get(cursor);
      cursor = String(node?.parentPageId || "").trim();
    }
  }

  const resultingDepth = computePageDepth(normalizedParentId, pageById) + 1;
  if (resultingDepth > MAX_PAGE_TREE_DEPTH) {
    throw new Error(`Page hierarchy depth cannot exceed ${MAX_PAGE_TREE_DEPTH} levels.`);
  }
}

export function collectMediaIdsForPage(pageLike) {
  const ids = new Set();

  const draft = Array.isArray(pageLike?.draftComposition) ? pageLike.draftComposition : [];
  const published = Array.isArray(pageLike?.publishedComposition) ? pageLike.publishedComposition : [];

  draft.forEach((block) => {
    collectMediaIdsForBlock(block).forEach((id) => ids.add(id));
  });
  published.forEach((block) => {
    collectMediaIdsForBlock(block).forEach((id) => ids.add(id));
  });
  const seoImage = String(pageLike?.seo?.imageMediaId || "").trim();
  if (seoImage) ids.add(seoImage);

  return Array.from(ids);
}

function buildPageUsageRef(page) {
  return {
    kind: "pageBlock",
    label: page.title,
    pageId: page.id,
    pageSlug: page.slug,
  };
}

function nextUsageRefs(existingRefs, pageRef, shouldInclude) {
  const refs = Array.isArray(existingRefs) ? existingRefs : [];
  const filtered = refs.filter((ref) => !(ref?.kind === "pageBlock" && ref?.pageId === pageRef.pageId));
  return shouldInclude ? [...filtered, pageRef] : filtered;
}

async function syncPageMediaUsage(provider, page, previousMediaIds, nextMediaIds) {
  const previous = new Set((previousMediaIds || []).map((id) => String(id || "").trim()).filter(Boolean));
  const next = new Set((nextMediaIds || []).map((id) => String(id || "").trim()).filter(Boolean));
  const affected = new Set([...previous, ...next]);
  if (!affected.size) return;

  const pageRef = buildPageUsageRef(page);

  if (provider.type === "firestore") {
    const mediaCollection = provider.db.collection("hubs").doc(page.hubId).collection("media");

    await Promise.all(
      Array.from(affected).map(async (mediaId) => {
        const mediaRef = mediaCollection.doc(mediaId);
        const doc = await mediaRef.get();
        if (!doc.exists) return;

        const current = doc.data() || {};
        const usageRefs = nextUsageRefs(current.usageRefs, pageRef, next.has(mediaId));
        await mediaRef.update({
          usageRefs,
          usageCount: usageRefs.length,
          updatedAt: new Date().toISOString(),
        });
      })
    );

    return;
  }

  const media = provider.db.media.get(page.hubId) || [];
  const updated = media.map((item) => {
    if (!affected.has(item.id)) return item;

    const usageRefs = nextUsageRefs(item.usageRefs, pageRef, next.has(item.id));
    return {
      ...item,
      usageRefs,
      usageCount: usageRefs.length,
      updatedAt: new Date().toISOString(),
    };
  });

  provider.db.media.set(page.hubId, updated);
}

async function assertPageSlugUnique(provider, hubId, slug, excludePageId = null) {
  const normalizedSlug = String(slug || "").trim();
  if (!normalizedSlug) return;

  if (provider.type === "firestore") {
    const snapshot = await provider.db
      .collection("hubs")
      .doc(hubId)
      .collection("pages")
      .where("slug", "==", normalizedSlug)
      .limit(2)
      .get();

    const conflict = snapshot.docs.find((doc) => doc.id !== excludePageId);
    if (conflict) {
      throw new Error("A page with this slug already exists for this hub.");
    }
    return;
  }

  const rows = provider.db.pages.get(hubId) || [];
  const conflict = rows.find((row) => row.slug === normalizedSlug && row.id !== excludePageId);
  if (conflict) {
    throw new Error("A page with this slug already exists for this hub.");
  }
}

async function assertReferencedMediaExists(hubId, mediaIds) {
  const ids = Array.from(new Set((mediaIds || []).filter(Boolean)));
  if (!ids.length) return [];

  const media = await getMediaByIds(hubId, ids);
  if (media.length !== ids.length) {
    throw new Error("One or more selected media assets were not found in this hub.");
  }

  return media;
}

function collectUsageAltMediaIdsFromValue(value, ids) {
  if (!value) return;

  if (Array.isArray(value)) {
    value.forEach((item) => collectUsageAltMediaIdsFromValue(item, ids));
    return;
  }

  if (typeof value !== "object") return;

  const mediaId = String(value.mediaId || "").trim();
  const alt = String(value.alt || "").trim();
  if (mediaId && alt) {
    ids.add(mediaId);
  }

  for (const nested of Object.values(value)) {
    collectUsageAltMediaIdsFromValue(nested, ids);
  }
}

function collectUsageAltMediaIdsForPage(pageLike) {
  const ids = new Set();
  const draft = Array.isArray(pageLike?.draftComposition) ? pageLike.draftComposition : [];
  const published = Array.isArray(pageLike?.publishedComposition) ? pageLike.publishedComposition : [];

  draft.forEach((block) => collectUsageAltMediaIdsFromValue(block?.props, ids));
  published.forEach((block) => collectUsageAltMediaIdsFromValue(block?.props, ids));
  return ids;
}

function assertReferencedMediaHasPublishAlt(media, pageLike) {
  const usageAltMediaIds = collectUsageAltMediaIdsForPage(pageLike);
  const missing = media.find((item) => {
    const mediaId = String(item?.id || "").trim();
    if (!mediaId) return false;
    if (usageAltMediaIds.has(mediaId)) return false;
    return !String(item.alt || "").trim();
  });

  if (missing) {
    throw new Error("Cannot publish page: selected media is missing alt text.");
  }
}

export async function listPagesByHub(hubId) {
  const provider = getDataProvider();

  if (provider.type === "firestore") {
    const snapshot = await provider.db
      .collection("hubs")
      .doc(hubId)
      .collection("pages")
      .orderBy("updatedAt", "desc")
      .get();

    return snapshot.docs.map((doc) => pageToViewModel({ id: doc.id, hubId, ...doc.data() }));
  }

  const rows = provider.db.pages.get(hubId) || [];
  return rows.map(pageToViewModel);
}

export async function getPageById(hubId, pageId) {
  const provider = getDataProvider();

  if (provider.type === "firestore") {
    const doc = await provider.db.collection("hubs").doc(hubId).collection("pages").doc(pageId).get();
    if (!doc.exists) return null;
    return pageToViewModel({ id: doc.id, hubId, ...doc.data() });
  }

  const rows = provider.db.pages.get(hubId) || [];
  const found = rows.find((row) => row.id === pageId);
  return found ? pageToViewModel(found) : null;
}

export async function getPublishedPageBySlug(hubId, slug) {
  const provider = getDataProvider();

  if (provider.type === "firestore") {
    const snapshot = await provider.db
      .collection("hubs")
      .doc(hubId)
      .collection("pages")
      .where("slug", "==", slug)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    const page = pageToViewModel({ id: doc.id, hubId, ...doc.data() });
    return page.publishedComposition?.length ? page : null;
  }

  const rows = provider.db.pages.get(hubId) || [];
  const found = rows.find((row) => row.slug === slug);
  if (!found) return null;
  const page = pageToViewModel(found);
  return page.publishedComposition?.length ? page : null;
}

export async function getPublishedLandingPage(hubId) {
  const candidates = ["landing", "home", "index"];

  for (const slug of candidates) {
    const page = await getPublishedPageBySlug(hubId, slug);
    if (page) return page;
  }

  const pages = await listPagesByHub(hubId);
  return pages.find((page) => Array.isArray(page.publishedComposition) && page.publishedComposition.length) || null;
}

export async function createPage(hubId, payload, actorId = "system") {
  const provider = getDataProvider();
  const now = new Date().toISOString();

  await assertPageSlugUnique(provider, hubId, payload.slug);
  await assertValidParentPageSelection(hubId, null, payload.parentPageId);
  const mediaIds = collectMediaIdsForPage(payload);
  await assertReferencedMediaExists(hubId, mediaIds);

  if (provider.type === "firestore") {
    const ref = provider.db.collection("hubs").doc(hubId).collection("pages").doc();
    const next = {
      ...payload,
      hubId,
      createdAt: now,
      updatedAt: now,
      createdBy: actorId,
      updatedBy: actorId,
    };
    await ref.set(next);
    await syncPageMediaUsage(provider, { id: ref.id, ...next }, [], mediaIds);
    return pageToViewModel({ id: ref.id, ...next });
  }

  const row = {
    id: `page_${crypto.randomUUID().slice(0, 8)}`,
    hubId,
    ...payload,
    createdAt: now,
    updatedAt: now,
    createdBy: actorId,
    updatedBy: actorId,
  };

  const rows = provider.db.pages.get(hubId) || [];
  provider.db.pages.set(hubId, [row, ...rows]);
  await syncPageMediaUsage(provider, row, [], mediaIds);
  return pageToViewModel(row);
}

export async function savePageDraft(hubId, pageId, patch, actorId = "system", options = {}) {
  const provider = getDataProvider();
  const existing = await getPageById(hubId, pageId);
  if (!existing) return null;
  const expectedUpdatedAt = String(options?.expectedUpdatedAt || "").trim();
  if (expectedUpdatedAt && String(existing.updatedAt || "").trim() !== expectedUpdatedAt) {
    throw createStaleDraftError();
  }

  const nextSlug = String(patch.slug || existing.slug || "").trim();
  await assertPageSlugUnique(provider, hubId, nextSlug, pageId);
  await assertValidParentPageSelection(hubId, pageId, patch.parentPageId);

  const nextCandidate = {
    ...existing,
    ...patch,
    draftComposition: patch.draftComposition || existing.draftComposition,
  };

  const previousMediaIds = collectMediaIdsForPage(existing);
  const nextMediaIds = collectMediaIdsForPage(nextCandidate);
  await assertReferencedMediaExists(hubId, nextMediaIds);

  const nextPatch = {
    ...patch,
    updatedAt: new Date().toISOString(),
    updatedBy: actorId,
  };

  if (provider.type === "firestore") {
    const ref = provider.db.collection("hubs").doc(hubId).collection("pages").doc(pageId);
    await ref.update(nextPatch);
    const updated = await ref.get();
    const next = { id: updated.id, hubId, ...updated.data() };
    await syncPageMediaUsage(provider, next, previousMediaIds, nextMediaIds);
    return pageToViewModel(next);
  }

  const rows = provider.db.pages.get(hubId) || [];
  const index = rows.findIndex((row) => row.id === pageId);
  if (index === -1) return null;

  const next = { ...rows[index], ...nextPatch };
  const clone = [...rows];
  clone[index] = next;
  provider.db.pages.set(hubId, clone);
  await syncPageMediaUsage(provider, next, previousMediaIds, nextMediaIds);
  return pageToViewModel(next);
}

export async function publishPage(hubId, pageId, actorId = "system", options = {}) {
  const existing = await getPageById(hubId, pageId);
  if (!existing) return null;
  const expectedUpdatedAt = String(options?.expectedUpdatedAt || "").trim();
  if (expectedUpdatedAt && String(existing.updatedAt || "").trim() !== expectedUpdatedAt) {
    throw createStaleDraftError();
  }
  assertCompositionPublishReady(existing.draftComposition || []);

  const mediaIds = collectMediaIdsForPage({
    draftComposition: existing.draftComposition,
    publishedComposition: existing.draftComposition,
    seo: existing.seo,
  });

  const media = await assertReferencedMediaExists(hubId, mediaIds);
  assertReferencedMediaHasPublishAlt(media, {
    draftComposition: existing.draftComposition,
    publishedComposition: existing.draftComposition,
    seo: existing.seo,
  });

  const patch = {
    publishedComposition: existing.draftComposition,
    status: "published",
    publishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    updatedBy: actorId,
  };

  return savePageDraft(hubId, pageId, patch, actorId, { expectedUpdatedAt: String(existing.updatedAt || "") });
}
