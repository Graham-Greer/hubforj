try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import crypto from "node:crypto";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { createPublicContentCache, getPublicContentCacheTags } from "@/lib/cache/public-content";
import { requireHubBySlug } from "@/lib/data/hubs";
import { getMediaAssetById, getMediaAssetsByIds, getPublicMediaAssetsByIds } from "@/lib/data/media";
import { normalizeCreateTestimonialPayload } from "@/lib/domain/testimonials";

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeTestimonialRecord(testimonial) {
  if (!testimonial) {
    return null;
  }

  return {
    id: normalizeString(testimonial.id),
    hubId: normalizeString(testimonial.hubId),
    status: normalizeString(testimonial.status) || "draft",
    quote: normalizeString(testimonial.quote),
    authorName: normalizeString(testimonial.authorName),
    authorRole: normalizeString(testimonial.authorRole),
    authorOrganization: normalizeString(testimonial.authorOrganization),
    authorImageAssetId: normalizeString(testimonial.authorImageAssetId),
    authorImageAlt: normalizeString(testimonial.authorImageAlt),
    authorImageAsset: testimonial.authorImageAsset || null,
    featured: Boolean(testimonial.featured),
    sortOrder: Number.parseInt(String(testimonial.sortOrder || "0"), 10) || 0,
    createdAt: normalizeString(testimonial.createdAt),
    updatedAt: normalizeString(testimonial.updatedAt),
  };
}

async function attachTestimonialMedia(hubId, testimonials) {
  const assetIds = [...new Set(testimonials.map((testimonial) => testimonial.authorImageAssetId).filter(Boolean))];
  if (!assetIds.length) {
    return testimonials;
  }

  const assets = await getMediaAssetsByIds(hubId, assetIds);
  const byId = new Map(assets.map((asset) => [asset.id, asset]));

  return testimonials.map((testimonial) => ({
    ...testimonial,
    authorImageAsset: testimonial.authorImageAssetId ? byId.get(testimonial.authorImageAssetId) || null : null,
  }));
}

async function attachPublicTestimonialMedia(hubId, testimonials) {
  const assetIds = [...new Set(testimonials.map((testimonial) => testimonial.authorImageAssetId).filter(Boolean))];
  if (!assetIds.length) {
    return testimonials;
  }

  const assets = await getPublicMediaAssetsByIds(hubId, assetIds);
  const byId = new Map(assets.map((asset) => [asset.id, asset]));

  return testimonials.map((testimonial) => ({
    ...testimonial,
    authorImageAsset: testimonial.authorImageAssetId ? byId.get(testimonial.authorImageAssetId) || null : null,
  }));
}

function sortTestimonials(rows) {
  return [...rows].sort((left, right) => {
    if (left.featured !== right.featured) {
      return left.featured ? -1 : 1;
    }

    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    return String(right.updatedAt || "").localeCompare(String(left.updatedAt || ""));
  });
}

export async function listTestimonialsByHubSlug(hubSlug) {
  const hub = await requireHubBySlug(hubSlug);
  return listTestimonialsByHub(hub);
}

export async function listTestimonialsByHub(hub) {
  const hubId = normalizeString(hub?.id);

  if (!hubId) {
    return [];
  }

  const snapshot = await getFirebaseAdminDb().collection("hubs").doc(hubId).collection("testimonials").get();
  const testimonials = snapshot.docs.map((doc) => normalizeTestimonialRecord({ id: doc.id, hubId, ...doc.data() }));
  return sortTestimonials(await attachTestimonialMedia(hubId, testimonials));
}

export async function listPublicTestimonialsByHubSlug(hubSlug) {
  const testimonials = await listTestimonialsByHubSlug(hubSlug);
  return testimonials.filter((testimonial) => testimonial.status === "published");
}

export async function listPublicTestimonialsByHub(hub) {
  const hubId = normalizeString(hub?.id);

  if (!hubId) {
    return [];
  }

  const tags = getPublicContentCacheTags(hubId);
  const readCachedPublicTestimonials = createPublicContentCache(
    async (cachedHubId) => {
      const snapshot = await getFirebaseAdminDb()
        .collection("hubs")
        .doc(cachedHubId)
        .collection("testimonials")
        .where("status", "==", "published")
        .get();
      const testimonials = snapshot.docs.map((doc) => normalizeTestimonialRecord({ id: doc.id, hubId: cachedHubId, ...doc.data() }));
      return sortTestimonials(await attachPublicTestimonialMedia(cachedHubId, testimonials));
    },
    ["public-testimonials", hubId],
    {
      tags: [tags.hub, tags.home, tags.testimonials, tags.media],
    }
  );

  return readCachedPublicTestimonials(hubId);
}

export async function getTestimonialById(hubId, testimonialId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedTestimonialId = normalizeString(testimonialId);
  if (!normalizedHubId || !normalizedTestimonialId) {
    return null;
  }

  const doc = await getFirebaseAdminDb().collection("hubs").doc(normalizedHubId).collection("testimonials").doc(normalizedTestimonialId).get();
  if (!doc.exists) {
    return null;
  }

  const testimonial = normalizeTestimonialRecord({ id: doc.id, hubId: normalizedHubId, ...doc.data() });
  if (!testimonial.authorImageAssetId) {
    return testimonial;
  }

  return {
    ...testimonial,
    authorImageAsset: await getMediaAssetById(normalizedHubId, testimonial.authorImageAssetId),
  };
}

export async function createTestimonialByHubSlug(hubSlug, payload, actorId = "system") {
  const hub = await requireHubBySlug(hubSlug);
  const next = normalizeCreateTestimonialPayload(payload);
  const now = new Date().toISOString();
  const ref = getFirebaseAdminDb().collection("hubs").doc(hub.id).collection("testimonials").doc(`testimonial_${crypto.randomUUID().slice(0, 12)}`);

  const writeModel = {
    hubId: hub.id,
    ...next,
    createdAt: now,
    updatedAt: now,
    createdBy: actorId,
    updatedBy: actorId,
  };

  await ref.set(writeModel);
  return normalizeTestimonialRecord({ id: ref.id, ...writeModel });
}

export async function updateTestimonial(hubId, testimonialId, payload, actorId = "system") {
  const normalizedHubId = normalizeString(hubId);
  const normalizedTestimonialId = normalizeString(testimonialId);
  if (!normalizedHubId || !normalizedTestimonialId) {
    throw new Error("Hub and testimonial ids are required.");
  }

  const ref = getFirebaseAdminDb().collection("hubs").doc(normalizedHubId).collection("testimonials").doc(normalizedTestimonialId);
  const existing = await ref.get();
  if (!existing.exists) {
    throw new Error("Testimonial not found.");
  }

  const next = normalizeCreateTestimonialPayload(payload);
  const update = {
    ...next,
    updatedAt: new Date().toISOString(),
    updatedBy: actorId,
  };

  await ref.update(update);
  return normalizeTestimonialRecord({ id: normalizedTestimonialId, hubId: normalizedHubId, ...existing.data(), ...update });
}

export async function deleteTestimonial(hubId, testimonialId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedTestimonialId = normalizeString(testimonialId);
  if (!normalizedHubId || !normalizedTestimonialId) {
    throw new Error("Hub and testimonial ids are required.");
  }

  const ref = getFirebaseAdminDb().collection("hubs").doc(normalizedHubId).collection("testimonials").doc(normalizedTestimonialId);
  const existing = await ref.get();
  if (!existing.exists) {
    throw new Error("Testimonial not found.");
  }

  await ref.delete();
}
