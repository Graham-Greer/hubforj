import { buildHubRuntimeHref } from "@/lib/domain/hub-runtime-paths";
import {
  getFallbackRegionalMarket,
  resolveLaunchFormattingLocale,
} from "@/lib/domain/regional-markets";
import {
  evaluateCourseRefundEligibility,
  formatCourseDateRange,
  getCourseFormatLabel,
  resolveCourseRefundWindowHours,
} from "@/lib/domain/courses";
import { evaluateEventRefundEligibility, resolveEventRefundWindowHours } from "@/lib/domain/events";
import {
  getCourseAttendanceStatusLabel,
  getCourseAttendanceStatusTone,
  getCoursePaymentStatusLabel,
  getCoursePaymentStatusTone,
  getCourseRegistrationStatusLabel,
  getCourseRegistrationStatusTone,
  splitCourseRegistrationsByTimeline,
} from "@/lib/domain/course-registrations";
import {
  getEventBookingPaymentStatusLabel,
  getEventBookingPaymentStatusTone,
  getEventBookingStatusLabel,
  getEventBookingStatusTone,
} from "@/lib/domain/event-bookings";
import { formatEventDateRange } from "@/lib/domain/events";
import {
  deriveMembershipStatus,
  formatMembershipDate,
  formatMoney,
  formatMoneyFromMinor,
  getMembershipPaymentStatusLabel,
  getMembershipPaymentStatusTone,
  getMembershipStatusLabel,
  getMembershipStatusTone,
} from "@/lib/domain/memberships";

function normalizeString(value) {
  return String(value || "").trim();
}

function formatDateTime(value, locale = getFallbackRegionalMarket().defaultLocale) {
  const date = new Date(String(value || ""));
  const resolvedLocale = resolveLaunchFormattingLocale(locale);

  if (Number.isNaN(date.getTime())) {
    return "To be confirmed";
  }

  return new Intl.DateTimeFormat(resolvedLocale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function sortByDateDesc(items, getValue) {
  return [...items].sort((left, right) => String(getValue(right) || "").localeCompare(String(getValue(left) || "")));
}

function splitEventBookingsByTimeline(bookings = []) {
  const timeline = {
    upcoming: [],
    history: [],
  };

  for (const booking of bookings) {
    const row = {
      status: booking?.status,
      dateSortValue: booking?.eventStartAt || booking?.eventStartDate || "",
      endSortValue: booking?.eventEndAt || booking?.eventEndDate || "",
    };

    if (isUpcomingOrCurrentBooking(row)) {
      timeline.upcoming.push(booking);
    } else {
      timeline.history.push(booking);
    }
  }

  return timeline;
}

function isUpcomingOrCurrentBooking(item) {
  if (normalizeString(item?.status) === "cancelled") {
    return false;
  }

  const endTimestamp = Date.parse(String(item?.endSortValue || ""));

  if (!Number.isNaN(endTimestamp)) {
    return endTimestamp >= Date.now();
  }

  const startTimestamp = Date.parse(String(item?.dateSortValue || ""));

  if (Number.isNaN(startTimestamp)) {
    return true;
  }

  return startTimestamp >= Date.now();
}

function getBillingStatusLabel(item) {
  if (normalizeString(item?.paymentStatus) === "not_required") {
    return "Free";
  }

  const kind = normalizeString(item?.kind);

  if (kind === "course") {
    return getCoursePaymentStatusLabel(item?.paymentStatus);
  }

  if (kind === "event") {
    return getEventBookingPaymentStatusLabel(item?.paymentStatus);
  }

  return getMembershipPaymentStatusLabel(item?.paymentStatus);
}

function getMemberBookingPaymentStatusLabel(kind, paymentStatus) {
  if (normalizeString(paymentStatus) === "not_required") {
    return "Free";
  }

  if (normalizeString(kind) === "course") {
    return getCoursePaymentStatusLabel(paymentStatus);
  }

  return getEventBookingPaymentStatusLabel(paymentStatus);
}

function getBillingStatusTone(item) {
  const kind = normalizeString(item?.kind);

  if (kind === "course") {
    return getCoursePaymentStatusTone(item?.paymentStatus);
  }

  if (kind === "event") {
    return getEventBookingPaymentStatusTone(item?.paymentStatus);
  }

  return getMembershipPaymentStatusTone(item?.paymentStatus);
}

function requiresBookingPaymentFollowUp(item) {
  if (!item || !["event", "course"].includes(normalizeString(item.kind))) {
    return false;
  }

  if (["waitlisted", "cancelled"].includes(normalizeString(item.status))) {
    return false;
  }

  return ["unpaid", "overdue", "failed"].includes(normalizeString(item.paymentStatus));
}

function isFreeBillingItem(item) {
  return normalizeString(item?.paymentStatus) === "not_required"
    || normalizeString(item?.pricingMode) === "free"
    || String(item?.amount || "") === "0"
    || Number(item?.amountMinor) === 0;
}

function getBillingDateLabelPrefix(item) {
  const kind = normalizeString(item?.kind);

  if (kind === "event") {
    return "Event date";
  }

  if (kind === "course") {
    return "Course date";
  }

  if (normalizeString(item?.nativePaymentTransactionId)) {
    return "Payment date";
  }

  return "Renewal date";
}

function formatCourseBookingMeta(registration) {
  const location = normalizeString(registration?.courseLocation);
  const format = normalizeString(registration?.courseFormat);
  const formatLabel = normalizeString(registration?.courseFormatLabel) || getCourseFormatLabel(format);

  if (format === "online") {
    return "Online";
  }

  if (format === "hybrid" && location) {
    return `${formatLabel} • ${location}`;
  }

  if (location) {
    return location;
  }

  if (formatLabel) {
    return formatLabel;
  }

  return "Course details to be confirmed";
}

function isRecurringEventBooking(registration) {
  return normalizeString(registration?.eventKind) === "series_occurrence"
    || registration?.isSeriesManaged === true
    || Boolean(normalizeString(registration?.seriesId));
}

function buildEventCancellationPolicySummary(hub, registration) {
  const pricingMode = normalizeString(registration?.pricingMode);
  const paymentProcessingMode = normalizeString(hub?.packagePaymentProcessingMode);
  const paymentStatus = normalizeString(registration?.paymentStatus);
  const nativePaymentStatus = normalizeString(registration?.nativePaymentStatus);

  if (pricingMode === "paid" && paymentProcessingMode === "internal" && paymentStatus === "paid") {
    const refundEvaluation = evaluateEventRefundEligibility(
      {
        pricingMode,
        refundPolicy: registration?.refundPolicy,
        refundWindowMode: registration?.refundWindowMode,
        refundWindowHours: registration?.refundWindowHours,
        startAt: registration?.eventStartAt,
      },
      { paymentStatus }
    );

    if (refundEvaluation.refundable) {
      return `If you cancel now, your payment will be refunded in full. This event allows refunds until ${resolveEventRefundWindowHours(registration)} hours before it starts.`;
    }

    if (refundEvaluation.reason === "policy_non_refundable") {
      return "This event is non-refundable. Cancelling will release your booking, but your payment will not be reimbursed.";
    }

    return "This booking is outside the refund window. Cancelling will release your booking, but your payment will not be reimbursed.";
  }

  if (pricingMode === "paid" && paymentStatus !== "paid" && nativePaymentStatus === "checkout_open") {
    return "Cancelling now will release your booking and close the open checkout session.";
  }

  if (pricingMode === "paid" && ["pending", "failed"].includes(paymentStatus)) {
    return "Cancelling now will release your booking. No refund is needed because payment has not been completed.";
  }

  return `Cancelling will release your ${normalizeString(registration?.eventTitle) ? "booking" : "place"}.`;
}

function buildEventStatusHelpText(hub, registration) {
  const paymentStatus = normalizeString(registration?.paymentStatus);
  const nativePaymentStatus = normalizeString(registration?.nativePaymentStatus);

  if (paymentStatus === "refunded") {
    return "Your payment was refunded after cancellation.";
  }

  if (["pending", "failed"].includes(paymentStatus)) {
    return "Complete payment to secure your booking.";
  }

  if (normalizeString(registration?.pricingMode) === "paid" && normalizeString(hub?.packagePaymentProcessingMode) === "internal") {
    if (nativePaymentStatus === "checkout_open") {
      return "Your checkout is still open. Complete payment or cancel the booking before the event starts.";
    }

    if (paymentStatus === "paid") {
      const refundEvaluation = evaluateEventRefundEligibility(
        {
          pricingMode: registration?.pricingMode,
          refundPolicy: registration?.refundPolicy,
          refundWindowMode: registration?.refundWindowMode,
          refundWindowHours: registration?.refundWindowHours,
          startAt: registration?.eventStartAt,
        },
        { paymentStatus }
      );

      if (refundEvaluation.refundable) {
        return `Cancel before the refund cutoff to receive a full refund.`;
      }
    }
  }

  return "";
}

function buildCourseCancellationPolicySummary(hub, registration) {
  const pricingMode = normalizeString(registration?.pricingMode);
  const paymentProcessingMode = normalizeString(hub?.packagePaymentProcessingMode);
  const paymentStatus = normalizeString(registration?.paymentStatus);
  const nativePaymentStatus = normalizeString(registration?.nativePaymentStatus);

  if (pricingMode === "paid" && paymentProcessingMode === "internal" && paymentStatus === "paid") {
    const refundEvaluation = evaluateCourseRefundEligibility(
      {
        pricingMode,
        refundPolicy: registration?.refundPolicy,
        refundWindowMode: registration?.refundWindowMode,
        refundWindowHours: registration?.refundWindowHours,
        startAt: registration?.courseStartAt,
      },
      { paymentStatus }
    );

    if (refundEvaluation.refundable) {
      return `If you cancel now, your payment will be refunded in full. This course allows refunds until ${resolveCourseRefundWindowHours(registration)} hours before it starts.`;
    }

    if (refundEvaluation.reason === "policy_non_refundable") {
      return "This course is non-refundable. Cancelling will release your enrolment, but your payment will not be reimbursed.";
    }

    return "This enrolment is outside the refund window. Cancelling will release your place, but your payment will not be reimbursed.";
  }

  if (pricingMode === "paid" && paymentStatus !== "paid" && nativePaymentStatus === "checkout_open") {
    return "Cancelling now will release your place and close the open checkout session.";
  }

  if (pricingMode === "paid" && paymentStatus !== "paid") {
    return "Cancelling now will release your place. No refund is needed because payment has not been completed.";
  }

  return "Cancelling will release your course place.";
}

function buildCourseStatusHelpText(hub, registration) {
  const paymentStatus = normalizeString(registration?.paymentStatus);
  const nativePaymentStatus = normalizeString(registration?.nativePaymentStatus);

  if (paymentStatus === "refunded") {
    return "Your payment was refunded after cancellation.";
  }

  if (["unpaid", "overdue", "failed"].includes(paymentStatus)) {
    if (nativePaymentStatus === "checkout_open") {
      return "Your checkout is still open. Complete payment or cancel the enrolment before the course starts.";
    }

    return "Complete payment to secure your booking.";
  }

  if (normalizeString(registration?.pricingMode) === "paid" && normalizeString(hub?.packagePaymentProcessingMode) === "internal" && paymentStatus === "paid") {
    const refundEvaluation = evaluateCourseRefundEligibility(
      {
        pricingMode: registration?.pricingMode,
        refundPolicy: registration?.refundPolicy,
        refundWindowMode: registration?.refundWindowMode,
        refundWindowHours: registration?.refundWindowHours,
        startAt: registration?.courseStartAt,
      },
      { paymentStatus }
    );

    if (refundEvaluation.refundable) {
      return "Cancel before the refund cutoff to receive a full refund.";
    }
  }

  return "";
}

export function buildUnifiedBookingItems({
  hub,
  eventBookings = [],
  registrations = [],
  courseRegistrations = [],
  routeMode = "path",
}) {
  const locale = resolveLaunchFormattingLocale(hub?.locale, hub?.country);
  const resolvedEventBookings = eventBookings.length ? eventBookings : registrations;
  const eventItems = resolvedEventBookings.map((registration) => ({
    id: `event_${registration.id}`,
    kind: "event",
    recordId: registration.id,
    parentId: registration.eventId,
    title: registration.eventTitle || "Event",
    href: registration.eventSlug
      ? buildHubRuntimeHref(hub.slug, `/events/${registration.eventSlug}`, routeMode)
      : buildHubRuntimeHref(hub.slug, "/events", routeMode),
    typeLabel: isRecurringEventBooking(registration) ? "Recurring event" : "Event",
    dateLabel: formatEventDateRange(
      {
        startDate: registration.eventStartDate,
        endDate: registration.eventEndDate,
        startTime: registration.eventStartTime,
        endTime: registration.eventEndTime,
        startAt: registration.eventStartAt,
        endAt: registration.eventEndAt,
      },
      locale
    ),
    dateSortValue: registration.eventStartAt || registration.eventStartDate || "",
    endSortValue: registration.eventEndAt || registration.eventEndDate || "",
    locationLabel: registration.eventLocation || "Location to be confirmed",
    amountLabel: normalizeString(registration.paymentStatus) === "not_required"
      ? "Free"
      : Number.isFinite(Number(registration.amountMinor))
        ? formatMoneyFromMinor(registration.amountMinor, registration.currency || getFallbackRegionalMarket().defaultCurrency, locale)
        : normalizeString(registration.amountDisplay)
          ? formatMoney(registration.amountDisplay, registration.currency || getFallbackRegionalMarket().defaultCurrency, locale)
          : "",
    status: registration.status,
    statusLabel: getEventBookingStatusLabel(registration.status),
    statusTone: getEventBookingStatusTone(registration.status),
    paymentStatus: registration.paymentStatus,
    paymentStatusLabel: getMemberBookingPaymentStatusLabel("event", registration.paymentStatus),
    paymentStatusTone: getEventBookingPaymentStatusTone(registration.paymentStatus),
    showPaymentBadge: normalizeString(registration.paymentStatus) !== "not_required",
    attendanceStatus: "",
    attendanceStatusLabel: "",
    attendanceStatusTone: "neutral",
    showAttendanceBadge: false,
    waitlistStatusLabel: normalizeString(registration.status) === "waitlisted" ? "Waitlisted" : "",
    waitlistStatusTone: normalizeString(registration.status) === "waitlisted" ? "warning" : "",
    canCancel: normalizeString(registration.status) !== "cancelled",
    cancellationPolicySummary: buildEventCancellationPolicySummary(hub, registration),
    imageUrl: registration.eventImageUrl || "",
    imageAlt: registration.eventImageAlt || registration.eventTitle || "Event image",
    statusHelpText: buildEventStatusHelpText(hub, registration),
    attendeeCount: Number.parseInt(String(registration.attendeeCount || registration.activeAttendeeCount || ""), 10) || 1,
    nextStepsHref:
      ["pending", "failed"].includes(normalizeString(registration.paymentStatus)) && registration.eventSlug
        ? buildHubRuntimeHref(hub.slug, `/events/${registration.eventSlug}/booking/next-steps`, routeMode)
        : "",
    primaryAction: {
      label:
        ["pending", "failed"].includes(normalizeString(registration.paymentStatus)) && registration.eventSlug
          ? "View next steps"
          : "View event",
      href:
        ["pending", "failed"].includes(normalizeString(registration.paymentStatus)) && registration.eventSlug
          ? buildHubRuntimeHref(hub.slug, `/events/${registration.eventSlug}/booking/next-steps`, routeMode)
          : registration.eventSlug
            ? buildHubRuntimeHref(hub.slug, `/events/${registration.eventSlug}`, routeMode)
            : buildHubRuntimeHref(hub.slug, "/events", routeMode),
    },
  }));
  const courseItems = courseRegistrations.map((registration) => ({
    id: `course_${registration.id}`,
    kind: "course",
    recordId: registration.id,
    parentId: registration.courseId,
    title: registration.courseTitle || "Course",
    href: registration.courseSlug
      ? buildHubRuntimeHref(hub.slug, `/courses/${registration.courseSlug}`, routeMode)
      : buildHubRuntimeHref(hub.slug, "/courses", routeMode),
    typeLabel: "Course",
    dateLabel: formatCourseDateRange(registration.courseStartAt, registration.courseEndAt, locale),
    dateSortValue: registration.courseStartAt || "",
    endSortValue: registration.courseEndAt || "",
    locationLabel: formatCourseBookingMeta(registration),
    amountLabel: normalizeString(registration.paymentStatus) === "not_required"
      ? "Free"
      : Number.isFinite(Number(registration.amountMinor))
        ? formatMoneyFromMinor(registration.amountMinor, registration.currency || getFallbackRegionalMarket().defaultCurrency, locale)
        : normalizeString(registration.price)
          ? formatMoney(registration.price, registration.currency || getFallbackRegionalMarket().defaultCurrency, locale)
          : "",
    status: registration.status,
    statusLabel: getCourseRegistrationStatusLabel(registration.status),
    statusTone: getCourseRegistrationStatusTone(registration.status),
    paymentStatus: registration.paymentStatus,
    paymentStatusLabel: getMemberBookingPaymentStatusLabel("course", registration.paymentStatus),
    paymentStatusTone: getCoursePaymentStatusTone(registration.paymentStatus),
    showPaymentBadge: normalizeString(registration.paymentStatus) !== "not_required",
    attendanceStatus: registration.attendanceStatus,
    attendanceStatusLabel: getCourseAttendanceStatusLabel(registration.attendanceStatus),
    attendanceStatusTone: getCourseAttendanceStatusTone(registration.attendanceStatus),
    showAttendanceBadge: normalizeString(registration.attendanceStatus) && normalizeString(registration.attendanceStatus) !== "pending",
    waitlistStatusLabel: normalizeString(registration.status) === "waitlisted" ? "Waitlisted" : "",
    waitlistStatusTone: normalizeString(registration.status) === "waitlisted" ? "warning" : "",
    canCancel: normalizeString(registration.status) !== "cancelled",
    cancellationPolicySummary: buildCourseCancellationPolicySummary(hub, registration),
    imageUrl: registration.courseImageUrl || "",
    imageAlt: registration.courseImageAlt || registration.courseTitle || "Course image",
    statusHelpText: buildCourseStatusHelpText(hub, registration),
    nextStepsHref:
      ["unpaid", "overdue", "failed"].includes(normalizeString(registration.paymentStatus)) && registration.courseSlug
        ? buildHubRuntimeHref(hub.slug, `/courses/${registration.courseSlug}/enrolment/next-steps`, routeMode)
        : "",
    primaryAction: {
      label:
        ["unpaid", "overdue", "failed"].includes(normalizeString(registration.paymentStatus)) && registration.courseSlug
          ? "View next steps"
          : "View course",
      href:
        ["unpaid", "overdue", "failed"].includes(normalizeString(registration.paymentStatus)) && registration.courseSlug
          ? buildHubRuntimeHref(hub.slug, `/courses/${registration.courseSlug}/enrolment/next-steps`, routeMode)
          : registration.courseSlug
            ? buildHubRuntimeHref(hub.slug, `/courses/${registration.courseSlug}`, routeMode)
            : buildHubRuntimeHref(hub.slug, "/courses", routeMode),
    },
  }));

  return sortByDateDesc([...eventItems, ...courseItems], (item) => item.dateSortValue);
}

export function splitUnifiedBookingsByTimeline({ eventBookings = [], registrations = [], courseRegistrations = [] }) {
  const resolvedEventBookings = eventBookings.length ? eventBookings : registrations;
  const eventTimeline = splitEventBookingsByTimeline(resolvedEventBookings);
  const courseTimeline = splitCourseRegistrationsByTimeline(courseRegistrations);

  return {
    upcomingEvents: eventTimeline.upcoming,
    historyEvents: eventTimeline.history,
    upcomingCourses: courseTimeline.upcoming,
    historyCourses: courseTimeline.history,
  };
}

export function buildMemberBillingItems({ hub, items = [], routeMode = "path" }) {
  const locale = resolveLaunchFormattingLocale(hub?.locale, hub?.country);

  return sortByDateDesc(
    items.map((item) => ({
      id: item.id,
      kind: item.kind,
      title: item.title || "Payment item",
      typeLabel: item.kind === "membership" ? "Membership" : item.kind === "course" ? "Course" : "Event",
      dateLabel: formatDateTime(item.dueDate, locale),
      dateLabelPrefix: getBillingDateLabelPrefix(item),
      dateSortValue: item.dueDate || "",
      amountLabel:
        isFreeBillingItem(item)
          ? "Free"
          : Number.isFinite(Number(item.amountMinor))
            ? formatMoneyFromMinor(item.amountMinor, item.currency, locale)
            : item.amount
              ? formatMoney(item.amount, item.currency, locale)
              : "Amount to be confirmed",
      status: item.paymentStatus,
      statusLabel: getBillingStatusLabel(item),
      statusTone: getBillingStatusTone(item),
      detail: item.detail || "",
      receiptHref: "",
      primaryAction: {
        label:
          item.kind === "membership"
            ? "View membership"
            : item.kind === "course"
              ? "View course"
              : "View event",
        href:
          item.kind === "membership"
            ? buildHubRuntimeHref(hub.slug, "/account/membership", routeMode)
            : item.kind === "course"
              ? item.courseSlug
                ? buildHubRuntimeHref(hub.slug, `/courses/${item.courseSlug}`, routeMode)
                : buildHubRuntimeHref(hub.slug, "/courses", routeMode)
              : item.eventSlug
                ? buildHubRuntimeHref(hub.slug, `/events/${item.eventSlug}`, routeMode)
                : buildHubRuntimeHref(hub.slug, "/events", routeMode),
      },
    })),
    (item) => item.dateSortValue
  );
}

export function buildMemberOverviewModel({
  hub,
  membership = null,
  eventBookings = [],
  registrations = [],
  courseRegistrations = [],
  paymentItems = [],
  routeMode = "path",
}) {
  const locale = resolveLaunchFormattingLocale(hub?.locale, hub?.country);
  const resolvedEventBookings = eventBookings.length ? eventBookings : registrations;
  const unifiedBookings = buildUnifiedBookingItems({
    hub,
    eventBookings: resolvedEventBookings,
    courseRegistrations,
    routeMode,
  });
  const billingItems = buildMemberBillingItems({ hub, items: paymentItems, routeMode });
  const derivedMembershipStatus = membership ? deriveMembershipStatus(membership) : "";
  const upcomingCount =
    splitEventBookingsByTimeline(resolvedEventBookings).upcoming.length +
    splitCourseRegistrationsByTimeline(courseRegistrations).upcoming.length;
  const paymentAttentionCount = paymentItems.filter((item) => {
    if (["event", "course"].includes(normalizeString(item.kind)) && normalizeString(item.status) === "cancelled") {
      return false;
    }

    return ["pending", "unpaid", "overdue", "failed"].includes(normalizeString(item.paymentStatus));
  }).length;

  return {
    summary: {
      membershipState: membership ? getMembershipStatusLabel(derivedMembershipStatus) : "None",
      upcomingBookingsCount: upcomingCount,
      paymentAttentionCount,
    },
    membership: membership
      ? {
          planTitle: membership.planTitle || "Membership plan",
          statusLabel: getMembershipStatusLabel(derivedMembershipStatus),
          statusTone: getMembershipStatusTone(derivedMembershipStatus),
          renewalLabel: formatMembershipDate(membership.renewalDate, locale),
          paymentStatusLabel: getMembershipPaymentStatusLabel(membership.paymentStatus),
          paymentStatusTone: getMembershipPaymentStatusTone(membership.paymentStatus),
          href: buildHubRuntimeHref(hub.slug, "/account/membership", routeMode),
        }
      : null,
    upcomingBookings: unifiedBookings
      .filter((item) => isUpcomingOrCurrentBooking(item))
      .sort((left, right) => String(left.dateSortValue || "").localeCompare(String(right.dateSortValue || "")))
      .slice(0, 3),
    recentBilling: billingItems.slice(0, 3),
  };
}

export function buildMemberPaymentItems({
  membership = null,
  eventBookings = [],
  registrations = [],
  courseRegistrations = [],
}) {
  const items = [];
  const resolvedEventBookings = eventBookings.length ? eventBookings : registrations;

  if (membership) {
    items.push({
      id: `membership_${membership.id}`,
      recordId: membership.id,
      userId: membership.userId,
      kind: "membership",
      title: membership.planTitle || "Membership",
      paymentStatus: membership.paymentStatus,
      amount: membership.planPrice,
      currency: membership.planCurrency,
      dueDate: membership.renewalDate,
      detail:
        membership.derivedStatus === "expired"
          ? "Membership renewal has passed."
          : "Membership renewal cycle.",
      nativePaymentTransactionId: "",
    });
  }

  for (const registration of resolvedEventBookings) {
    if (!normalizeString(registration.amountDisplay) && registration.paymentStatus === "not_required") {
      continue;
    }

    items.push({
      id: `event_${registration.id}`,
      recordId: registration.id,
      kind: "event",
      title: registration.eventTitle || "Event booking",
      status: registration.status,
      paymentStatus: registration.paymentStatus,
      amountMinor: Number.isFinite(Number(registration.amountMinor)) ? Number(registration.amountMinor) : null,
      amount: registration.amountDisplay || "",
      currency: registration.currency || getFallbackRegionalMarket().defaultCurrency,
      dueDate: registration.eventStartAt,
      detail: registration.eventLocation || "Event booking payment state.",
      eventId: registration.eventId,
      eventSlug: registration.eventSlug,
      userId: registration.bookerUserId || registration.userId,
      nativePaymentTransactionId: registration.nativePaymentTransactionId || "",
    });
  }

  for (const registration of courseRegistrations) {
    if (!normalizeString(registration.price) && registration.paymentStatus === "not_required") {
      continue;
    }

    items.push({
      id: `course_${registration.id}`,
      recordId: registration.id,
      kind: "course",
      title: registration.courseTitle || "Course enrolment",
      status: registration.status,
      paymentStatus: registration.paymentStatus,
      amountMinor: Number.isFinite(Number(registration.amountMinor)) ? Number(registration.amountMinor) : null,
      amount: registration.price || "",
      currency: registration.currency || getFallbackRegionalMarket().defaultCurrency,
      dueDate: registration.courseStartAt,
      detail: registration.courseScheduleSummary || "Course enrolment payment state.",
      courseId: registration.courseId,
      courseSlug: registration.courseSlug,
      userId: registration.userId,
      nativePaymentTransactionId: registration.nativePaymentTransactionId || "",
    });
  }

  return items.sort((left, right) => String(right.dueDate || "").localeCompare(String(left.dueDate || "")));
}

export function buildMemberDetail({
  user,
  hub = null,
  membership = null,
  membershipUpgradeRequest = null,
  eventBookings = [],
  registrations = [],
  courseRegistrations = [],
  paymentItems = [],
  membershipPaymentHistory = [],
}) {
  const resolvedEventBookings = eventBookings.length ? eventBookings : registrations;

  return {
    user,
    overview: hub
      ? buildMemberOverviewModel({
          hub,
          membership,
          eventBookings: resolvedEventBookings,
          courseRegistrations,
          paymentItems,
        })
      : null,
    membership,
    membershipUpgradeRequest,
    eventBookings: resolvedEventBookings,
    registrations: resolvedEventBookings,
    courseRegistrations,
    paymentItems,
    membershipPaymentHistory,
    totals: {
      registrations: resolvedEventBookings.length,
      courses: courseRegistrations.length,
      paymentItems: paymentItems.length,
      actionRequired: paymentItems.filter((item) => {
        if (["event", "course"].includes(normalizeString(item.kind)) && normalizeString(item.status) === "cancelled") {
          return false;
        }

        return ["unpaid", "overdue", "pending"].includes(String(item.paymentStatus || ""));
      }).length,
    },
  };
}
