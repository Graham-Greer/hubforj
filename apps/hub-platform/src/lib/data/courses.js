try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

export {
  getCourseById,
  getCourseBySlug,
  getPublicCourseBySlug,
  getVisibleCourseBySlug,
  listCoursesByHubSlug,
  listPublicCoursesByHubSlug,
  listVisibleCoursesByHubSlug,
} from "./course-queries.js";
export {
  createCourseByHubSlug,
  deleteCourseById,
  updateCourseById,
} from "./course-mutations.js";
