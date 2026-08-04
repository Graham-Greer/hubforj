try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

export {
  countEnrolledCourseRegistrations,
  countEnrolledCourseRegistrationsByCourseIds,
  getCourseRegistrationById,
  getCourseRegistrationByUser,
  getCourseRegistrationSummary,
  getLatestCourseRegistrationByUser,
  listCourseRegistrationPaymentAttentionUserIdsByHub,
  listCoursePaymentItemsByHub,
  listCourseRegistrations,
  listCourseRegistrationsByUser,
  resolveCourseRegistrationSummary,
} from "./course-registration-queries.js";
export {
  createCourseRegistrationForMember,
  updateCourseRegistrationNativePaymentState,
  updateCourseRegistrationAttendanceStatus,
  updateCourseRegistrationPaymentStatus,
  updateCourseRegistrationStatus,
} from "./course-registration-mutations.js";
