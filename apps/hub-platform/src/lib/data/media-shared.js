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

export function collectSiteSettingsMediaUsageReferences(siteSettings = {}, assetId = "") {
  const normalizedAssetId = normalizeString(assetId);
  const refs = [];
  const pushIfMatches = (candidateAssetId, usageRef) => {
    const normalizedCandidateAssetId = normalizeString(candidateAssetId);

    if (!normalizedCandidateAssetId || (normalizedAssetId && normalizedCandidateAssetId !== normalizedAssetId)) {
      return;
    }

    refs.push({
      assetId: normalizedCandidateAssetId,
      usageRef: normalizeUsageRef(usageRef),
    });
  };

  pushIfMatches(siteSettings?.logoAssetId, {
    entityType: "branding",
    entityId: "primary",
    field: "logo",
    label: "Branding logo",
    href: "",
  });

  pushIfMatches(siteSettings?.homePage?.hero?.mediaAssetId, {
    entityType: "page",
    entityId: "home",
    field: "heroMedia",
    label: "Homepage hero media",
    href: "",
  });

  pushIfMatches(siteSettings?.homePage?.info?.mediaAssetId, {
    entityType: "page",
    entityId: "home",
    field: "infoMedia",
    label: "Homepage about section media",
    href: "",
  });

  Object.entries(siteSettings?.pages || {}).forEach(([pageKey, page]) => {
    pushIfMatches(page?.hero?.mediaAssetId, {
      entityType: "page",
      entityId: normalizeString(pageKey),
      field: "heroMedia",
      label: `${normalizeString(pageKey) || "Page"} hero media`,
      href: "",
    });
  });

  return refs;
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

  const [siteSettingsDoc, testimonialsSnapshot, eventsSnapshot, coursesSnapshot, eventSeriesSnapshot, usersSnapshot] = await Promise.all([
    hubRef(normalizedHubId).collection("siteSettings").doc("primary").get(),
    hubRef(normalizedHubId).collection("testimonials").get(),
    hubRef(normalizedHubId).collection("events").get(),
    hubRef(normalizedHubId).collection("courses").get(),
    hubRef(normalizedHubId).collection("eventSeries").get(),
    getFirebaseAdminDb().collection("users").where("hubId", "==", normalizedHubId).get(),
  ]);

  if (siteSettingsDoc.exists) {
    collectSiteSettingsMediaUsageReferences(siteSettingsDoc.data()).forEach(({ assetId, usageRef }) => {
      pushUsage(assetId, usageRef);
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

  eventSeriesSnapshot.docs.forEach((doc) => {
    const series = doc.data();
    pushUsage(series?.imageAssetId, {
      entityType: "eventSeries",
      entityId: doc.id,
      field: "image",
      label: normalizeString(series?.title) || "Event series image",
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

export async function buildMediaUsageReportForAssetId(hubId, assetId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedAssetId = normalizeString(assetId);

  if (!normalizedHubId || !normalizedAssetId) {
    return {
      usageRefs: [],
      complete: true,
      failedSources: [],
    };
  }

  const usageRefs = [];
  const pushUsage = (usageRef) => {
    usageRefs.push(normalizeUsageRef(usageRef));
  };

  const sourceQueries = [
    {
      source: "siteSettings",
      task: hubRef(normalizedHubId).collection("siteSettings").doc("primary").get(),
    },
    {
      source: "testimonials",
      task: hubRef(normalizedHubId)
        .collection("testimonials")
        .where("authorImageAssetId", "==", normalizedAssetId)
        .get(),
    },
    {
      source: "events",
      task: hubRef(normalizedHubId)
        .collection("events")
        .where("imageAssetId", "==", normalizedAssetId)
        .get(),
    },
    {
      source: "courses",
      task: hubRef(normalizedHubId)
        .collection("courses")
        .where("imageAssetId", "==", normalizedAssetId)
        .get(),
    },
    {
      source: "eventSeries",
      task: hubRef(normalizedHubId)
        .collection("eventSeries")
        .where("imageAssetId", "==", normalizedAssetId)
        .get(),
    },
    {
      source: "users",
      task: getFirebaseAdminDb()
        .collection("users")
        .where("hubId", "==", normalizedHubId)
        .where("avatarAssetId", "==", normalizedAssetId)
        .get(),
    },
  ];
  const [siteSettingsResult, testimonialsResult, eventsResult, coursesResult, eventSeriesResult, usersResult] = await Promise.allSettled(
    sourceQueries.map((query) => query.task)
  );
  const failedSources = [siteSettingsResult, testimonialsResult, eventsResult, coursesResult, eventSeriesResult, usersResult]
    .map((result, index) => {
      if (result.status === "fulfilled") {
        return null;
      }

      return {
        source: sourceQueries[index].source,
        message: normalizeString(result.reason?.message) || "Unknown Firestore query failure.",
      };
    })
    .filter(Boolean);

  const siteSettingsDoc = siteSettingsResult.status === "fulfilled" ? siteSettingsResult.value : null;
  const testimonialsSnapshot = testimonialsResult.status === "fulfilled" ? testimonialsResult.value : null;
  const eventsSnapshot = eventsResult.status === "fulfilled" ? eventsResult.value : null;
  const coursesSnapshot = coursesResult.status === "fulfilled" ? coursesResult.value : null;
  const eventSeriesSnapshot = eventSeriesResult.status === "fulfilled" ? eventSeriesResult.value : null;
  const usersSnapshot = usersResult.status === "fulfilled" ? usersResult.value : null;

  if (siteSettingsDoc?.exists) {
    collectSiteSettingsMediaUsageReferences(siteSettingsDoc.data(), normalizedAssetId).forEach(({ usageRef }) => {
      pushUsage(usageRef);
    });
  }

  testimonialsSnapshot?.docs.forEach((doc) => {
    const testimonial = doc.data();
    pushUsage({
      entityType: "testimonial",
      entityId: doc.id,
      field: "authorImage",
      label: normalizeString(testimonial?.authorName) || "Testimonial image",
      href: "",
    });
  });

  eventsSnapshot?.docs.forEach((doc) => {
    const event = doc.data();
    pushUsage({
      entityType: "event",
      entityId: doc.id,
      field: "image",
      label: normalizeString(event?.title) || "Event image",
      href: "",
    });
  });

  coursesSnapshot?.docs.forEach((doc) => {
    const course = doc.data();
    pushUsage({
      entityType: "course",
      entityId: doc.id,
      field: "image",
      label: normalizeString(course?.title) || "Course image",
      href: "",
    });
  });

  eventSeriesSnapshot?.docs.forEach((doc) => {
    const series = doc.data();
    pushUsage({
      entityType: "eventSeries",
      entityId: doc.id,
      field: "image",
      label: normalizeString(series?.title) || "Event series image",
      href: "",
    });
  });

  usersSnapshot?.docs.forEach((doc) => {
    const user = doc.data();
    pushUsage({
      entityType: "user",
      entityId: doc.id,
      field: "avatar",
      label: normalizeString(user?.name) || normalizeString(user?.email) || "User avatar",
      href: "",
    });
  });

  return {
    usageRefs,
    complete: failedSources.length === 0,
    failedSources,
  };
}

export async function buildMediaUsageForAssetId(hubId, assetId) {
  const report = await buildMediaUsageReportForAssetId(hubId, assetId);

  if (!report.complete) {
    throw new Error(`Media usage could not be fully verified: ${report.failedSources.map((source) => source.source).join(", ")}`);
  }

  return report.usageRefs;
}

export function attachUsageToAsset(asset, usageByAssetId) {
  const usageRefs = (usageByAssetId.get(asset.id) || []).map(normalizeUsageRef);

  return {
    ...asset,
    usageRefs,
    usageCount: usageRefs.length,
    usageLoaded: true,
  };
}

export function normalizeActiveMediaAsset(record, hubId) {
  const asset = normalizeMediaAssetRecord({ id: record.id, hubId, ...record.data() });
  return asset.status === "active" ? asset : null;
}
