try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { getHubBySlug } from "@/lib/data/hubs";
import { hasHubCapability } from "@/lib/domain/package-guards";
import {
  canViewPublishedCourse,
  isCoursePubliclyVisible,
  normalizeCourseSlug,
} from "@/lib/domain/courses";
import { normalizeCourseRecord, normalizeString, withCourseMedia } from "./course-shared.js";

function toSortableTimestamp(course) {
  const timestamp = Date.parse(String(course?.startAt || ""));
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
}

function sortCoursesByUpcoming(courses) {
  return [...courses].sort((left, right) => {
    const leftTimestamp = toSortableTimestamp(left);
    const rightTimestamp = toSortableTimestamp(right);

    if (leftTimestamp !== rightTimestamp) {
      return leftTimestamp - rightTimestamp;
    }

    return String(left.title || "").localeCompare(String(right.title || ""));
  });
}

async function listFirestoreCoursesByHubId(hubId) {
  const snapshot = await getFirebaseAdminDb()
    .collection("hubs")
    .doc(hubId)
    .collection("courses")
    .get();

  const courses = snapshot.docs.map((doc) => normalizeCourseRecord({ id: doc.id, hubId, ...doc.data() }));
  const coursesWithMedia = await withCourseMedia(hubId, courses);
  return sortCoursesByUpcoming(coursesWithMedia);
}

async function getFirestoreCourseBySlug(hubId, courseSlug) {
  const snapshot = await getFirebaseAdminDb()
    .collection("hubs")
    .doc(hubId)
    .collection("courses")
    .where("slug", "==", courseSlug)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  const [course] = await withCourseMedia(hubId, [normalizeCourseRecord({ id: doc.id, hubId, ...doc.data() })]);
  return course || null;
}

export async function listCoursesByHubSlug(hubSlug) {
  const hub = await getHubBySlug(hubSlug);

  if (!hub || !hasHubCapability(hub, "coursesEnabled")) {
    return [];
  }

  return listCoursesByHub(hub);
}

export async function listCoursesByHub(hub) {
  const hubId = normalizeString(hub?.id);

  if (!hubId || !hasHubCapability(hub, "coursesEnabled")) {
    return [];
  }

  return listFirestoreCoursesByHubId(hubId);
}

export async function listPublicCoursesByHubSlug(hubSlug) {
  const courses = await listCoursesByHubSlug(hubSlug);
  return courses.filter(isCoursePubliclyVisible);
}

export async function listPublicCoursesByHub(hub) {
  const courses = await listCoursesByHub(hub);
  return courses.filter(isCoursePubliclyVisible);
}

export async function getCourseById(hubId, courseId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedCourseId = normalizeString(courseId);

  if (!normalizedHubId || !normalizedCourseId) {
    return null;
  }

  const doc = await getFirebaseAdminDb()
    .collection("hubs")
    .doc(normalizedHubId)
    .collection("courses")
    .doc(normalizedCourseId)
    .get();

  if (!doc.exists) {
    return null;
  }

  const [course] = await withCourseMedia(
    normalizedHubId,
    [normalizeCourseRecord({ id: doc.id, hubId: normalizedHubId, ...doc.data() })]
  );
  return course || null;
}

export async function getCourseBySlug(hubSlug, courseSlug) {
  const hub = await getHubBySlug(hubSlug);
  const normalizedCourseSlug = normalizeCourseSlug(courseSlug);

  if (!hub || !normalizedCourseSlug || !hasHubCapability(hub, "coursesEnabled")) {
    return null;
  }

  return getCourseBySlugForHub(hub, normalizedCourseSlug);
}

export async function getCourseBySlugForHub(hub, courseSlug) {
  const hubId = normalizeString(hub?.id);
  const normalizedCourseSlug = normalizeCourseSlug(courseSlug);

  if (!hubId || !normalizedCourseSlug || !hasHubCapability(hub, "coursesEnabled")) {
    return null;
  }

  return getFirestoreCourseBySlug(hubId, normalizedCourseSlug);
}

export async function getPublicCourseBySlug(hubSlug, courseSlug) {
  const course = await getCourseBySlug(hubSlug, courseSlug);
  return isCoursePubliclyVisible(course) ? course : null;
}

export async function getPublicCourseBySlugForHub(hub, courseSlug) {
  const course = await getCourseBySlugForHub(hub, courseSlug);
  return isCoursePubliclyVisible(course) ? course : null;
}

export async function listVisibleCoursesByHubSlug(hubSlug, { isMember = false } = {}) {
  const courses = await listCoursesByHubSlug(hubSlug);
  return courses.filter((course) => canViewPublishedCourse(course, { isMember }));
}

export async function listVisibleCoursesByHub(hub, { isMember = false } = {}) {
  const courses = await listCoursesByHub(hub);
  return courses.filter((course) => canViewPublishedCourse(course, { isMember }));
}

export async function getVisibleCourseBySlug(hubSlug, courseSlug, { isMember = false } = {}) {
  const course = await getCourseBySlug(hubSlug, courseSlug);
  return canViewPublishedCourse(course, { isMember }) ? course : null;
}

export async function getVisibleCourseBySlugForHub(hub, courseSlug, { isMember = false } = {}) {
  const course = await getCourseBySlugForHub(hub, courseSlug);
  return canViewPublishedCourse(course, { isMember }) ? course : null;
}
