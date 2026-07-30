try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

export {
  getCourseById,
  getCourseBySlug,
  getCourseBySlugForHub,
  getPublicCourseBySlug,
  getPublicCourseBySlugForHub,
  getVisibleCourseBySlug,
  getVisibleCourseBySlugForHub,
  listCoursesByHub,
  listCoursesByHubSlug,
  listPublicCoursesByHub,
  listPublicCoursesByHubSlug,
  listVisibleCoursesByHub,
  listVisibleCoursesByHubSlug,
} from "./course-queries.js";
export {
  createCourseByHubSlug,
  deleteCourseById,
  updateCourseById,
} from "./course-mutations.js";
