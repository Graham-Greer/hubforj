try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { normalizeMediaAssetRecord } from "@/lib/domain/media";

export function normalizeString(value) {
  return String(value || "").trim();
}

export function normalizeUsageField(value) {
  return normalizeString(value) || "media";
}

export function hubRef(hubId) {
  return getFirebaseAdminDb().collection("hubs").doc(hubId);
}

export function mediaCollection(hubId) {
  return hubRef(hubId).collection("mediaAssets");
}

export function folderCollection(hubId) {
  return hubRef(hubId).collection("mediaFolders");
}

export function normalizeUsageRef(ref = {}) {
  return {
    entityType: normalizeString(ref.entityType),
    entityId: normalizeString(ref.entityId),
    field: normalizeUsageField(ref.field),
    label: normalizeString(ref.label),
    href: normalizeString(ref.href),
  };
}

export async function buildMediaUsageByHubId(hubId) {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    return new Map();
  }

  const usageByAssetId = new Map();

  const pushUsage = (assetId, usageRef) => {
    const normalizedAssetId = normalizeString(assetId);

    if (!normalizedAssetId) {
      return;
    }

    const next = usageByAssetId.get(normalizedAssetId) || [];
    next.push(normalizeUsageRef(usageRef));
    usageByAssetId.set(normalizedAssetId, next);
  };

  const [siteSettingsDoc, testimonialsSnapshot, eventsSnapshot, coursesSnapshot, usersSnapshot] = await Promise.all([
    hubRef(normalizedHubId).collection("siteSettings").doc("primary").get(),
    hubRef(normalizedHubId).collection("testimonials").get(),
    hubRef(normalizedHubId).collection("events").get(),
    hubRef(normalizedHubId).collection("courses").get(),
    getFirebaseAdminDb().collection("users").where("hubId", "==", normalizedHubId).get(),
  ]);

  if (siteSettingsDoc.exists) {
    const siteSettings = siteSettingsDoc.data();
    pushUsage(siteSettings?.logoAssetId, {
      entityType: "branding",
      entityId: "primary",
      field: "logo",
      label: "Branding logo",
      href: "",
    });
  }

  testimonialsSnapshot.docs.forEach((doc) => {
    const testimonial = doc.data();
    pushUsage(testimonial?.authorImageAssetId, {
      entityType: "testimonial",
      entityId: doc.id,
      field: "authorImage",
      label: normalizeString(testimonial?.authorName) || "Testimonial image",
      href: "",
    });
  });

  eventsSnapshot.docs.forEach((doc) => {
    const event = doc.data();
    pushUsage(event?.imageAssetId, {
      entityType: "event",
      entityId: doc.id,
      field: "image",
      label: normalizeString(event?.title) || "Event image",
      href: "",
    });
  });

  coursesSnapshot.docs.forEach((doc) => {
    const course = doc.data();
    pushUsage(course?.imageAssetId, {
      entityType: "course",
      entityId: doc.id,
      field: "image",
      label: normalizeString(course?.title) || "Course image",
      href: "",
    });
  });

  usersSnapshot.docs.forEach((doc) => {
    const user = doc.data();
    pushUsage(user?.avatarAssetId, {
      entityType: "user",
      entityId: doc.id,
      field: "avatar",
      label: normalizeString(user?.name) || normalizeString(user?.email) || "User avatar",
      href: "",
    });
  });

  return usageByAssetId;
}

export function attachUsageToAsset(asset, usageByAssetId) {
  const usageRefs = (usageByAssetId.get(asset.id) || []).map(normalizeUsageRef);

  return {
    ...asset,
    usageRefs,
    usageCount: usageRefs.length,
  };
}

export function normalizeActiveMediaAsset(record, hubId) {
  const asset = normalizeMediaAssetRecord({ id: record.id, hubId, ...record.data() });
  return asset.status === "active" ? asset : null;
}
