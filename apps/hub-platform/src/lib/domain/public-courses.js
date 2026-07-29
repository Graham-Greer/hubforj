import { buildHubAuthHref } from "@/lib/auth/hub-auth-redirects";
import { buildHubRuntimeHref } from "@/lib/domain/hub-runtime-paths";
import {
  getFallbackRegionalMarket,
  resolveLaunchFormattingLocale,
} from "@/lib/domain/regional-markets";
import {
  formatCourseDateRange,
  formatCoursePrice,
  getCourseLevelLabel,
  getCourseTypeLabel,
} from "./courses.js";
import { getSectionRichTextPlainText } from "./section-rich-text.js";

export const ALL_COURSES_FILTER = "all";

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeQuery(value) {
  return normalizeString(value).toLowerCase();
}

function parseDateString(value) {
  const normalized = normalizeString(value);

  if (!normalized) {
    return null;
  }

  const date = new Date(`${normalized}T00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getDefaultCoursesPageHero(siteName) {
  const normalizedSiteName = normalizeString(siteName) || "this community";

  return {
    eyebrow: "Courses",
    title: `Courses at ${normalizedSiteName}`,
    description: `Explore upcoming programmes, workshops, and training from ${normalizedSiteName}. Use search and course type filters to find the right fit.`,
  };
}

export function getPublicCourseTypeOptions(courses = []) {
  const presentTypes = new Set(
    courses
      .map((course) => normalizeString(course?.courseType))
      .filter(Boolean)
  );

  return [
    { value: ALL_COURSES_FILTER, label: "All" },
    ...Array.from(presentTypes)
      .sort((left, right) => left.localeCompare(right))
      .map((type) => ({ value: type, label: type })),
  ];
}

export function filterPublicCourses(courses = [], { query = "", courseType = ALL_COURSES_FILTER } = {}) {
  const normalizedQuery = normalizeQuery(query);
  const normalizedCourseType = normalizeString(courseType) || ALL_COURSES_FILTER;

  return courses.filter((course) => {
    const matchesType =
      normalizedCourseType === ALL_COURSES_FILTER
      || normalizeString(course.courseType) === normalizedCourseType;

    if (!matchesType) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      course.title,
      course.summary,
      course.subtypeLabel,
      course.courseType,
      getCourseLevelLabel(course),
      course.customLevelLabel,
      course.location,
    ]
      .map(normalizeString)
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function buildPublicCoursesContextText({
  totalCount = 0,
  resultCount = 0,
  activeCourseTypeLabel = "All",
  query = "",
}) {
  if (!totalCount) {
    return "";
  }

  const normalizedQuery = normalizeString(query);
  const normalizedTypeLabel = normalizeString(activeCourseTypeLabel) || "All";
  const resultLabel = resultCount === 1 ? "course" : "courses";

  if (normalizedQuery && normalizedTypeLabel !== "All") {
    return `${resultCount} ${resultLabel} for "${normalizedQuery}" in ${normalizedTypeLabel}`;
  }

  if (normalizedQuery) {
    return `${resultCount} ${resultLabel} for "${normalizedQuery}"`;
  }

  if (normalizedTypeLabel !== "All") {
    return `Showing ${normalizedTypeLabel} • ${resultCount} ${resultLabel}`;
  }

  return `${resultCount} upcoming ${resultLabel}`;
}

export function formatPublicCourseListingDateTime(course, locale = getFallbackRegionalMarket().defaultLocale) {
  return formatCourseDateRange(course, resolveLaunchFormattingLocale(locale));
}

export function formatPublicCoursePriceLabel(course, locale = getFallbackRegionalMarket().defaultLocale) {
  return formatCoursePrice(course, resolveLaunchFormattingLocale(locale));
}

export function getPublicCourseDeliveryLabel(course) {
  const format = normalizeString(course?.format);
  const location = normalizeString(course?.location);

  if (format === "online") {
    return "Online";
  }

  if (format === "hybrid") {
    return "Hybrid";
  }

  return location || "Location to be confirmed";
}

export function getPublicCourseRegistrationWindowState(course, now = new Date()) {
  const today = startOfDay(now);
  const registrationOpenDate = parseDateString(course?.registrationOpenDate);
  const registrationCloseDate = parseDateString(course?.registrationCloseDate);

  if (registrationOpenDate && registrationOpenDate > today) {
    return "not-open";
  }

  if (registrationCloseDate && registrationCloseDate < today) {
    return "closed";
  }

  return "open";
}

export function getPublicCourseAvailabilityState(course, enrolledCount = 0, now = new Date()) {
  const registrationWindowState = getPublicCourseRegistrationWindowState(course, now);

  if (registrationWindowState === "not-open") {
    return "not-open";
  }

  if (registrationWindowState === "closed") {
    return "closed";
  }

  const capacity = Number.parseInt(String(course?.capacity || ""), 10);

  if (!Number.isFinite(capacity) || capacity <= 0) {
    return "open";
  }

  const normalizedEnrolledCount = Number.isFinite(Number(enrolledCount))
    ? Math.max(0, Number(enrolledCount))
    : 0;
  const remaining = Math.max(0, capacity - normalizedEnrolledCount);

  if (remaining > 0) {
    return "open";
  }

  return course?.allowWaitlist === false ? "sold-out" : "waitlist";
}

export function formatPublicCourseSpacesLeft(course, enrolledCount = 0, now = new Date()) {
  const availabilityState = getPublicCourseAvailabilityState(course, enrolledCount, now);

  if (availabilityState === "not-open") {
    return "Registration not yet open";
  }

  if (availabilityState === "closed") {
    return "Registration closed";
  }

  const capacity = Number.parseInt(String(course?.capacity || ""), 10);

  if (!Number.isFinite(capacity) || capacity <= 0) {
    return "Open enrolment";
  }

  const normalizedEnrolledCount = Number.isFinite(Number(enrolledCount))
    ? Math.max(0, Number(enrolledCount))
    : 0;
  const remaining = Math.max(0, capacity - normalizedEnrolledCount);

  if (remaining <= 0) {
    return availabilityState === "sold-out" ? "Sold out" : "Waitlist only";
  }

  return remaining === 1 ? "1 space left" : `${remaining} spaces left`;
}

export function getPublicCourseSummary(course) {
  const summary = normalizeString(course?.summary);

  if (summary) {
    return summary;
  }

  return getSectionRichTextPlainText(course?.description);
}

export function getPublicCourseIdentity(course) {
  const hasLevel = normalizeString(course?.courseLevel) || normalizeString(course?.customLevelLabel);

  return {
    typeLabel: getCourseTypeLabel(course),
    levelLabel: hasLevel ? getCourseLevelLabel(course) : "",
  };
}

export function buildPublicCourseEnrolmentCta({
  course,
  hubSlug,
  routeMode = "path",
  enrolledCount = 0,
  currentMemberSession = null,
  currentRegistration = null,
  detailAccessMode = "public",
}) {
  const courseSlug = normalizeString(course?.slug);
  const detailPath = buildHubRuntimeHref(hubSlug, `/courses/${courseSlug}`, routeMode);
  const nextStepsPath = buildHubRuntimeHref(hubSlug, `/courses/${courseSlug}/enrolment/next-steps`, routeMode);
  const availabilityState = getPublicCourseAvailabilityState(course, enrolledCount);
  const registrationWindowState = getPublicCourseRegistrationWindowState(course);
  const hasExternalPaymentStep =
    normalizeString(course?.pricingMode) === "paid" &&
    (normalizeString(course?.externalPaymentUrl) || normalizeString(course?.paymentInstructions));

  if (detailAccessMode === "history_member") {
    return {
      heading: "This course has finished",
      supportingText: "You can still review the course details here, but enrolment is now closed.",
      buttonLabel: "View bookings",
      href: buildHubRuntimeHref(hubSlug, "/account/bookings", routeMode),
      requiresForm: false,
    };
  }

  if (currentRegistration && normalizeString(currentRegistration.status) !== "cancelled") {
    return {
      heading: "You already have an enrolment",
      buttonLabel: "View enrolment",
      href: nextStepsPath,
      requiresForm: false,
    };
  }

  if (registrationWindowState === "not-open") {
    return {
      heading: "Registration opens soon",
      supportingText: "This course is visible now, but enrolment has not opened yet.",
      buttonLabel: "Registration not open",
      requiresForm: false,
      disabled: true,
    };
  }

  if (registrationWindowState === "closed") {
    return {
      heading: "Registration is closed",
      supportingText: "Enrolment for this course has now closed.",
      buttonLabel: "Registration closed",
      requiresForm: false,
      disabled: true,
    };
  }

  if (availabilityState === "sold-out") {
    return {
      heading: "This course is sold out",
      supportingText: "No further enrolments are being accepted for this course.",
      buttonLabel: "Sold out",
      requiresForm: false,
      disabled: true,
    };
  }

  if (!currentMemberSession) {
    return {
      heading: "Enrol on this course",
      supportingText: hasExternalPaymentStep
        ? "Sign in as a member first so the hub can connect your enrolment and payment with the right account."
        : "Sign in as a member to enrol and manage your course progress.",
      buttonLabel:
        availabilityState === "waitlist" ? "Join waitlist" : "Sign in to continue",
      href: buildHubAuthHref(hubSlug, "sign-in", detailPath, routeMode),
      requiresForm: false,
    };
  }

  if (availabilityState === "waitlist") {
    return {
      heading: "Join the waitlist",
      supportingText: "This course is currently full, but you can still join the waitlist.",
      buttonLabel: "Join waitlist",
      requiresForm: true,
    };
  }

  if (hasExternalPaymentStep) {
    return {
      heading: "Enrol on this course",
      buttonLabel: "Enrol now",
      requiresForm: true,
    };
  }

  return {
    heading: "Enrol on this course",
    buttonLabel: "Enrol now",
    requiresForm: true,
  };
}
