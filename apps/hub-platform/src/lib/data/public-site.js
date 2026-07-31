try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { headers } from "next/headers";
import { requireHubCoreBySlug } from "@/lib/data/hubs";
import { getCachedSiteSettingsByHub } from "@/lib/data/site-settings";
import {
  getEventBySlugForHub,
  getVisibleEventBySlugForHub,
  listVisibleEventsByHub,
} from "@/lib/data/events";
import {
  getVisibleEventSeriesBySlugBaseForHub,
  listEventSeriesByHub,
  listEventSeriesOccurrences,
} from "@/lib/data/event-series";
import {
  getCourseBySlugForHub,
  getVisibleCourseBySlugForHub,
  listVisibleCoursesByHub,
} from "@/lib/data/courses";
import { listPublicTestimonialsByHub } from "@/lib/data/testimonials";
import { listPublicWhatWeDoItemsByHub } from "@/lib/data/what-we-do";
import { getCurrentMemberSessionForHub } from "@/lib/auth/member-session";
import {
  countActiveEventBookingAttendees,
  getActiveOrWaitlistedEventBookingByBooker,
  getLatestEventBookingByBooker,
  listEventBookingsByBooker,
} from "@/lib/data/event-bookings";
import { getNativePaymentTransactionById } from "@/lib/data/native-payment-transactions";
import {
  countEnrolledCourseRegistrations,
  getCourseRegistrationByUser,
  getLatestCourseRegistrationByUser,
} from "@/lib/data/course-registrations";
import { canViewPublishedEvent } from "@/lib/domain/events";
import { groupPublicEventListings } from "@/lib/domain/public-events";
import { getRequestHostFromHeaders, resolveHubRuntimeRouteMode } from "@/lib/domain/hub-hosts";

function canViewPublishedEventSeries(series, { isMember = false } = {}) {
  if (!series || String(series.status || "").trim() !== "published") {
    return false;
  }

  const visibility = String(series.visibility || "").trim() || "public";
  return visibility === "public" || (visibility === "members-only" && isMember);
}

export async function getPublicSiteContext(hubSlug) {
  const hubRecord = await requireHubCoreBySlug(hubSlug);
  const requestHeaders = await headers();
  const routeMode = resolveHubRuntimeRouteMode(getRequestHostFromHeaders(requestHeaders));
  const siteSettings = await getCachedSiteSettingsByHub(hubRecord, { routeMode });

  return {
    hub: { ...hubRecord, routeMode },
    siteSettings,
  };
}

export async function getPublicLandingShellData(hubSlug) {
  return getPublicSiteContext(hubSlug);
}

export async function getPublicLandingDeferredData(hub) {
  const [testimonials, whatWeDoItems] = await Promise.all([
    listPublicTestimonialsByHub(hub),
    listPublicWhatWeDoItemsByHub(hub),
  ]);

  return {
    testimonials,
    whatWeDoItems,
  };
}

export async function getPublicLandingData(hubSlug) {
  const context = await getPublicSiteContext(hubSlug);
  const deferredData = await getPublicLandingDeferredData(context.hub);

  return {
    ...context,
    ...deferredData,
  };
}

export async function getPublicEventsShellData(hubSlug) {
  return getPublicSiteContext(hubSlug);
}

export async function getPublicEventsDeferredData(hub) {
  const currentMemberSession = await getCurrentMemberSessionForHub(hub);
  const isMember = Boolean(currentMemberSession);
  const [events, eventSeries] = await Promise.all([
    listVisibleEventsByHub(hub, { isMember }),
    listEventSeriesByHub(hub),
  ]);

  return {
    events: groupPublicEventListings(
      events,
      eventSeries.filter((series) => canViewPublishedEventSeries(series, { isMember })),
      hub.locale
    ),
  };
}

export async function getPublicEventsData(hubSlug) {
  const context = await getPublicSiteContext(hubSlug);
  const deferredData = await getPublicEventsDeferredData(context.hub);

  return {
    ...context,
    ...deferredData,
  };
}

export async function getPublicCoursesShellData(hubSlug) {
  return getPublicSiteContext(hubSlug);
}

export async function getPublicCoursesDeferredData(hub) {
  const currentMemberSession = await getCurrentMemberSessionForHub(hub);
  const courses = await listVisibleCoursesByHub(hub, {
    isMember: Boolean(currentMemberSession),
  });
  const enrolledCounts = await Promise.all(
    courses.map(async (course) => ({
      courseId: course.id,
      enrolledCount: await countEnrolledCourseRegistrations(hub.id, course.id),
    }))
  );
  const enrolledCountByCourseId = new Map(
    enrolledCounts.map(({ courseId, enrolledCount }) => [courseId, enrolledCount])
  );

  return {
    courses: courses.map((course) => ({
      ...course,
      enrolledCount: enrolledCountByCourseId.get(course.id) || 0,
    })),
  };
}

export async function getPublicCoursesData(hubSlug) {
  const context = await getPublicSiteContext(hubSlug);
  const deferredData = await getPublicCoursesDeferredData(context.hub);

  return {
    ...context,
    ...deferredData,
  };
}

export async function getPublicEventDetailData(hubSlug, eventSlug) {
  const context = await getPublicSiteContext(hubSlug);
  const currentMemberSession = await getCurrentMemberSessionForHub(context.hub);
  const isMember = Boolean(currentMemberSession);
  const visibleEvent = await getVisibleEventBySlugForHub(context.hub, eventSlug, {
    isMember,
  });
  let event = visibleEvent;
  let detailAccessMode = "public";

  if (!event && currentMemberSession) {
    const historicalEvent = await getEventBySlugForHub(context.hub, eventSlug);

    if (historicalEvent) {
      const historicalBooking = await getActiveOrWaitlistedEventBookingByBooker(
        context.hub.id,
        historicalEvent.id,
        currentMemberSession.user.id
      );
      const latestHistoricalBooking = historicalBooking
        ? historicalBooking
        : await getLatestEventBookingByBooker(context.hub.id, historicalEvent.id, currentMemberSession.user.id);

      if (latestHistoricalBooking) {
        event = historicalEvent;
        detailAccessMode = "history_member";
      }
    }
  }

  if (!event) {
    const visibleSeries = await getVisibleEventSeriesBySlugBaseForHub(context.hub, eventSlug, { isMember });

    if (visibleSeries) {
      const occurrences = (await listEventSeriesOccurrences(context.hub.id, visibleSeries.id))
        .filter((occurrence) => canViewPublishedEvent(occurrence, { isMember }))
        .sort((left, right) => String(left.startAt || "").localeCompare(String(right.startAt || "")));
      const bookingsByEventId = currentMemberSession
        ? new Map(
            (await listEventBookingsByBooker(context.hub.id, currentMemberSession.user.id))
              .filter((booking) => booking.status === "active" || booking.status === "waitlisted")
              .map((booking) => [booking.eventId, booking])
          )
        : new Map();

      return {
        ...context,
        event: null,
        series: visibleSeries,
        occurrences: occurrences.map((occurrence) => ({
          ...occurrence,
          currentBooking: bookingsByEventId.get(occurrence.id) || null,
        })),
        currentBooking: null,
        currentMemberSession,
        registeredCount: 0,
        detailAccessMode: "public",
      };
    }
  }

  if (!event) {
    return {
      ...context,
      event: null,
      series: null,
      occurrences: [],
      currentBooking: null,
      currentMemberSession: null,
      registeredCount: 0,
      detailAccessMode: "public",
    };
  }

  const [registeredCount, currentBooking] = await Promise.all([
    countActiveEventBookingAttendees(context.hub.id, event.id),
    currentMemberSession
      ? getActiveOrWaitlistedEventBookingByBooker(context.hub.id, event.id, currentMemberSession.user.id)
      : Promise.resolve(null),
  ]);

  return {
    ...context,
    event,
    series: null,
    occurrences: [],
    currentBooking,
    currentMemberSession,
    registeredCount,
    detailAccessMode,
  };
}

export async function getPublicEventNextStepsData(hubSlug, eventSlug, userId) {
  const context = await getPublicSiteContext(hubSlug);
  const visibleEvent = await getVisibleEventBySlugForHub(context.hub, eventSlug, { isMember: true });
  let event = visibleEvent;

  let fallbackBooking = null;

  if (!event) {
    const historicalEvent = await getEventBySlugForHub(context.hub, eventSlug);

    if (historicalEvent) {
      fallbackBooking = await getLatestEventBookingByBooker(context.hub.id, historicalEvent.id, userId);

      if (fallbackBooking) {
        event = historicalEvent;
      }
    }
  }

  if (!event) {
    return {
      ...context,
      event: null,
      currentBooking: null,
    };
  }

  const currentBooking = await getActiveOrWaitlistedEventBookingByBooker(context.hub.id, event.id, userId);
  fallbackBooking = currentBooking
    ? currentBooking
    : (fallbackBooking || await getLatestEventBookingByBooker(context.hub.id, event.id, userId));
  const nativePaymentTransaction = fallbackBooking?.nativePaymentTransactionId
    ? await getNativePaymentTransactionById(context.hub.id, fallbackBooking.nativePaymentTransactionId)
    : null;

  return {
    ...context,
    event,
    currentBooking: fallbackBooking,
    nativePaymentTransaction,
  };
}

export async function getPublicCourseDetailData(hubSlug, courseSlug) {
  const context = await getPublicSiteContext(hubSlug);
  const currentMemberSession = await getCurrentMemberSessionForHub(context.hub);
  const visibleCourse = await getVisibleCourseBySlugForHub(context.hub, courseSlug, {
    isMember: Boolean(currentMemberSession),
  });
  let course = visibleCourse;
  let detailAccessMode = "public";

  if (!course && currentMemberSession) {
    const historicalCourse = await getCourseBySlugForHub(context.hub, courseSlug);

    if (historicalCourse) {
      const historicalRegistration = await getCourseRegistrationByUser(
        context.hub.id,
        historicalCourse.id,
        currentMemberSession.user.id
      );
      const latestHistoricalRegistration = historicalRegistration
        ? historicalRegistration
        : await getLatestCourseRegistrationByUser(context.hub.id, historicalCourse.id, currentMemberSession.user.id);

      if (latestHistoricalRegistration) {
        course = historicalCourse;
        detailAccessMode = "history_member";
      }
    }
  }

  if (!course) {
    return {
      ...context,
      course: null,
      currentRegistration: null,
      currentMemberSession: null,
      enrolledCount: 0,
      detailAccessMode: "public",
    };
  }

  const [enrolledCount, currentRegistration] = await Promise.all([
    countEnrolledCourseRegistrations(context.hub.id, course.id),
    currentMemberSession
      ? getCourseRegistrationByUser(context.hub.id, course.id, currentMemberSession.user.id)
      : Promise.resolve(null),
  ]);

  return {
    ...context,
    course,
    currentRegistration,
    currentMemberSession,
    enrolledCount,
    detailAccessMode,
  };
}

export async function getPublicCourseNextStepsData(hubSlug, courseSlug, userId) {
  const context = await getPublicSiteContext(hubSlug);
  const course = await getVisibleCourseBySlugForHub(context.hub, courseSlug, { isMember: true });

  if (!course) {
    return {
      ...context,
      course: null,
      currentRegistration: null,
    };
  }

  const currentRegistration = await getCourseRegistrationByUser(context.hub.id, course.id, userId);
  const fallbackRegistration = currentRegistration
    ? currentRegistration
    : await getLatestCourseRegistrationByUser(context.hub.id, course.id, userId);
  const nativePaymentTransaction = fallbackRegistration?.nativePaymentTransactionId
    ? await getNativePaymentTransactionById(context.hub.id, fallbackRegistration.nativePaymentTransactionId)
    : null;

  return {
    ...context,
    course,
    currentRegistration: fallbackRegistration,
    nativePaymentTransaction,
  };
}

export async function getPublicAboutData(hubSlug) {
  const context = await getPublicSiteContext(hubSlug);
  const testimonials = await listPublicTestimonialsByHub(context.hub);

  return {
    ...context,
    testimonials,
  };
}

export async function getPublicTestimonialsData(hubSlug) {
  const context = await getPublicSiteContext(hubSlug);
  const testimonials = await listPublicTestimonialsByHub(context.hub);

  return {
    ...context,
    testimonials,
  };
}
