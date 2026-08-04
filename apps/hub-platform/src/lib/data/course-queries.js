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
import { normalizeCourseRecord, normalizeString, withCourseMedia, withPublicCourseMedia } from "./course-shared.js";

const PUBLIC_COURSES_QUERY_LIMIT = 120;

function isBoundedPublicOfferingQueriesEnabled() {
  return normalizeString(process.env.HUB_PLATFORM_PUBLIC_BOUNDED_OFFERING_QUERIES_ENABLED).toLowerCase() === "true";
}

function normalizeDateForFirestoreBoundary(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 16);
  }

  return date.toISOString().slice(0, 16);
}

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

async function listFirestorePublishedCoursesByHubId(hubId) {
  if (!isBoundedPublicOfferingQueriesEnabled()) {
    const snapshot = await getFirebaseAdminDb()
      .collection("hubs")
      .doc(hubId)
      .collection("courses")
      .where("status", "==", "published")
      .get();

    const courses = snapshot.docs.map((doc) => normalizeCourseRecord({ id: doc.id, hubId, ...doc.data() }));
    const coursesWithMedia = await withPublicCourseMedia(hubId, courses);
    return sortCoursesByUpcoming(coursesWithMedia);
  }

  const coursesCollection = getFirebaseAdminDb().collection("hubs").doc(hubId).collection("courses");
  const cutoff = normalizeDateForFirestoreBoundary();
  const [startingSnapshot, endingSnapshot] = await Promise.all([
    coursesCollection
      .where("status", "==", "published")
      .where("startAt", ">=", cutoff)
      .orderBy("startAt", "asc")
      .limit(PUBLIC_COURSES_QUERY_LIMIT)
      .get(),
    coursesCollection
      .where("status", "==", "published")
      .where("endAt", ">=", cutoff)
      .orderBy("endAt", "asc")
      .limit(PUBLIC_COURSES_QUERY_LIMIT)
      .get(),
  ]);
  const byId = new Map();

  [...startingSnapshot.docs, ...endingSnapshot.docs].forEach((doc) => {
    byId.set(doc.id, normalizeCourseRecord({ id: doc.id, hubId, ...doc.data() }));
  });

  const coursesWithMedia = await withPublicCourseMedia(hubId, [...byId.values()]);
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
  const hubId = normalizeString(hub?.id);

  if (!hubId || !hasHubCapability(hub, "coursesEnabled")) {
    return [];
  }

  const courses = await listFirestorePublishedCoursesByHubId(hubId);
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
