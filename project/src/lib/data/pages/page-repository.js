import "server-only";
import crypto from "node:crypto";
import { getDataProvider } from "@/lib/data/shared/provider";
import { getMediaByIds } from "@/lib/data/media/media-repository";
import { normalizeFooterOverride, normalizeHeaderOverride } from "@/lib/data/pages/layout-config";

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
    headerIdOverride: normalizeHeaderOverride(page.headerIdOverride),
    footerIdOverride: normalizeFooterOverride(page.footerIdOverride),
    createdAt: page.createdAt,
    updatedAt: page.updatedAt,
    publishedAt: page.publishedAt || null,
    createdBy: page.createdBy || null,
    updatedBy: page.updatedBy || null,
  };
}

function collectMediaIdsFromValue(value, ids) {
  if (!value) return;

  if (typeof value === "string") {
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => {
        if (/^media_[a-z0-9_-]+$/i.test(item)) {
          ids.add(item);
        }
      });
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectMediaIdsFromValue(item, ids));
    return;
  }

  if (typeof value === "object") {
    for (const nested of Object.values(value)) {
      collectMediaIdsFromValue(nested, ids);
    }
  }
}

export function collectMediaIdsForPage(pageLike) {
  const ids = new Set();

  const draft = Array.isArray(pageLike?.draftComposition) ? pageLike.draftComposition : [];
  const published = Array.isArray(pageLike?.publishedComposition) ? pageLike.publishedComposition : [];

  draft.forEach((block) => collectMediaIdsFromValue(block?.props, ids));
  published.forEach((block) => collectMediaIdsFromValue(block?.props, ids));
  collectMediaIdsFromValue(pageLike?.seo?.imageMediaId || "", ids);

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
  if (provider.type === "firestore") {
    const snapshot = await provider.db
      .collection("hubs")
      .doc(hubId)
      .collection("pages")
      .where("slug", "==", slug)
      .limit(2)
      .get();

    const conflict = snapshot.docs.find((doc) => doc.id !== excludePageId);
    if (conflict) {
      throw new Error("A page with this slug already exists for this hub.");
    }
    return;
  }

  const rows = provider.db.pages.get(hubId) || [];
  const conflict = rows.find((row) => row.slug === slug && row.id !== excludePageId);
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

function assertReferencedMediaHasAlt(media) {
  const missing = media.find((item) => !String(item.alt || "").trim());
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

export async function savePageDraft(hubId, pageId, patch, actorId = "system") {
  const provider = getDataProvider();
  const existing = await getPageById(hubId, pageId);
  if (!existing) return null;

  await assertPageSlugUnique(provider, hubId, patch.slug, pageId);

  const nextCandidate = {
    ...existing,
    ...patch,
    draftComposition: patch.draftComposition || existing.draftComposition,
  };

  const previousMediaIds = collectMediaIdsForPage(existing);
  const nextMediaIds = collectMediaIdsForPage(nextCandidate);
  const nextMedia = await assertReferencedMediaExists(hubId, nextMediaIds);
  assertReferencedMediaHasAlt(nextMedia);

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

export async function publishPage(hubId, pageId, actorId = "system") {
  const existing = await getPageById(hubId, pageId);
  if (!existing) return null;

  const mediaIds = collectMediaIdsForPage({
    draftComposition: existing.draftComposition,
    publishedComposition: existing.draftComposition,
    seo: existing.seo,
  });

  const media = await assertReferencedMediaExists(hubId, mediaIds);
  assertReferencedMediaHasAlt(media);

  const patch = {
    publishedComposition: existing.draftComposition,
    status: "published",
    publishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    updatedBy: actorId,
  };

  return savePageDraft(hubId, pageId, patch, actorId);
}
