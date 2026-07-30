try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import {
  buildNotificationParentDescriptor,
  buildSourceTypeForBookingNotification,
  getSuppressedNotificationKindsForCancelledSource,
  resolveCancellationNotificationKind,
  resolveOfferingCancelledNotificationKind,
  resolveInitialBookingNotificationKind,
  resolveReminderNotificationKind,
  resolveReminderScheduledFor,
  resolveRecurringReminderTarget,
  resolveEventBookingNotificationRecipients,
  resolveEventRegistrationNotificationRecipients,
  resolveCourseRegistrationNotificationRecipients,
  resolveConfirmedNotificationKind,
  isReminderEligible,
  shouldSkipReminderSchedulingForLateBooking,
} from "@/lib/domain/booking-notifications";
import {
  createOrUpdateNotificationOutboxByDedupeKey,
  listNotificationOutboxRecordsBySource,
  markNotificationOutboxRecordSuppressed,
} from "@/lib/data/notification-outbox";
import { getUserById } from "@/lib/data/user-queries";
import { getHubById } from "@/lib/data/hubs";
import { getEventById } from "@/lib/data/events";
import { getCourseById } from "@/lib/data/courses";
import { getEventBookingById, listEventBookings } from "@/lib/data/event-bookings";
import { getCourseRegistrationById, listCourseRegistrations } from "@/lib/data/course-registrations";
import { getEventRegistrationById } from "@/lib/data/legacy-event-registrations";
import { getPublicCourseDeliveryLabel } from "@/lib/domain/public-courses";

function normalizeString(value) {
  return String(value || "").trim();
}

function buildHubPayload(hub = {}) {
  return {
    id: normalizeString(hub?.id),
    name: normalizeString(hub?.name),
    slug: normalizeString(hub?.slug),
    domain: normalizeString(hub?.domain),
    customDomain: hub?.customDomain || null,
    country: normalizeString(hub?.country),
    locale: normalizeString(hub?.locale),
    routeMode: normalizeString(hub?.routeMode || "path"),
  };
}

function buildEventOfferingPayload(event = {}) {
  return {
    id: normalizeString(event?.id),
    kind: "event",
    title: normalizeString(event?.title),
    slug: normalizeString(event?.slug),
    eventKind: normalizeString(event?.eventKind),
    seriesId: normalizeString(event?.seriesId),
    occurrenceDate: normalizeString(event?.occurrenceDate),
    occurrenceOrdinal: Number.parseInt(String(event?.occurrenceOrdinal || ""), 10) || 0,
    startDate: normalizeString(event?.startDate),
    endDate: normalizeString(event?.endDate),
    startTime: normalizeString(event?.startTime),
    endTime: normalizeString(event?.endTime),
    startAt: normalizeString(event?.startAt),
    endAt: normalizeString(event?.endAt),
    location: normalizeString(event?.location),
    pricingMode: normalizeString(event?.pricingMode) || "free",
    price: normalizeString(event?.price),
    currency: normalizeString(event?.currency),
    externalPaymentUrl: normalizeString(event?.externalPaymentUrl),
    paymentInstructions: normalizeString(event?.paymentInstructions),
    status: normalizeString(event?.status),
  };
}

function buildCourseOfferingPayload(course = {}) {
  return {
    id: normalizeString(course?.id),
    kind: "course",
    title: normalizeString(course?.title),
    slug: normalizeString(course?.slug),
    startDate: normalizeString(course?.startDate),
    endDate: normalizeString(course?.endDate),
    startTime: normalizeString(course?.startTime),
    endTime: normalizeString(course?.endTime),
    startAt: normalizeString(course?.startAt),
    endAt: normalizeString(course?.endAt),
    location: normalizeString(course?.location),
    deliveryLabel: getPublicCourseDeliveryLabel(course),
    pricingMode: normalizeString(course?.pricingMode) || "free",
    price: normalizeString(course?.price),
    currency: normalizeString(course?.currency),
    externalPaymentUrl: normalizeString(course?.externalPaymentUrl),
    paymentInstructions: normalizeString(course?.paymentInstructions),
    status: normalizeString(course?.status),
  };
}

function buildPendingPaymentPayload({
  offering = {},
  paymentUrl = "",
  paymentInstructions = "",
}) {
  const normalizedPaymentUrl =
    normalizeString(paymentUrl) || normalizeString(offering?.externalPaymentUrl);
  const normalizedInstructions =
    normalizeString(paymentInstructions) || normalizeString(offering?.paymentInstructions);

  return {
    paymentUrl: normalizedPaymentUrl,
    instructions: normalizedInstructions,
  };
}

function shouldSuppressQueuedRecord(record = {}) {
  const normalizedStatus = normalizeString(record?.status).toLowerCase();
  return !new Set(["sent", "cancelled", "suppressed"]).has(normalizedStatus);
}

async function suppressNotificationsForCancelledSource({
  hubId,
  sourceType,
  sourceId,
  offeringKind,
  actorId = "system",
} = {}) {
  const records = await listNotificationOutboxRecordsBySource(
    normalizeString(hubId),
    normalizeString(sourceType),
    normalizeString(sourceId)
  );
  const suppressedKinds = new Set(getSuppressedNotificationKindsForCancelledSource(offeringKind));
  const suppressedRecords = [];

  for (const record of records) {
    if (!suppressedKinds.has(normalizeString(record?.kind)) || !shouldSuppressQueuedRecord(record)) {
      continue;
    }

    suppressedRecords.push(
      await markNotificationOutboxRecordSuppressed(record.hubId, record.id, actorId)
    );
  }

  return suppressedRecords;
}

function buildEventCancellationSummary({
  message = "",
  scope = "booking",
  refunded = false,
  refundState = null,
} = {}) {
  const normalizedMessage = normalizeString(message);
  const normalizedScope = normalizeString(scope).toLowerCase() || "booking";

  if (normalizedMessage) {
    return normalizedMessage;
  }

  if (refunded) {
    return normalizedScope === "attendee"
      ? "This attendee place was cancelled and refund initiated."
      : "Booking cancelled and refund initiated.";
  }

  const refundReason = normalizeString(refundState?.reason);

  if (refundReason === "policy_non_refundable") {
    return normalizedScope === "attendee"
      ? "This attendee place was cancelled. This event is non-refundable."
      : "Booking cancelled. This event is non-refundable.";
  }

  if (refundReason === "outside_refund_window" || refundReason === "event_started") {
    return normalizedScope === "attendee"
      ? "This attendee place was cancelled. This place was outside the refund window, so no refund was issued."
      : "Booking cancelled. This booking was outside the refund window, so no refund was issued.";
  }

  return normalizedScope === "attendee"
    ? "This attendee place was cancelled."
    : "Booking cancelled.";
}

function buildCourseCancellationSummary({
  message = "",
} = {}) {
  return normalizeString(message) || "Enrolment cancelled.";
}

function isActiveOrWaitlistedStatus(status) {
  return new Set(["active", "registered", "enrolled", "waitlisted"]).has(
    normalizeString(status).toLowerCase()
  );
}

function buildReminderPayload(scheduledFor, leadHours = 24) {
  return {
    scheduledFor: normalizeString(scheduledFor),
    leadHours,
    leadLabel: leadHours === 24 ? "This starts in 24 hours." : `This starts in ${leadHours} hours.`,
  };
}

async function queueImmediateNotification({
  hub,
  offering,
  sourceType,
  sourceId,
  kind,
  recipients,
  actorId = "system",
  payment = {},
  cancellation = {},
  extraPayload = {},
  scheduledFor = "",
} = {}) {
  const normalizedHub = buildHubPayload(hub);
  const normalizedSourceType = normalizeString(sourceType);
  const normalizedSourceId = normalizeString(sourceId);
  const normalizedKind = normalizeString(kind);
  const resolvedParentDescriptor =
    normalizeString(offering?.kind) === "event"
      ? resolveRecurringReminderTarget("event", offering)
      : buildNotificationParentDescriptor({ offeringKind: "course", offering });

  const queuedRecords = [];

  for (const recipient of recipients || []) {
    if (!normalizeString(recipient?.email)) {
      continue;
    }

    const record = await createOrUpdateNotificationOutboxByDedupeKey(
      normalizedHub.id,
      {
        kind: normalizedKind,
        sourceType: normalizedSourceType,
        sourceId: normalizedSourceId,
        parentType: normalizeString(resolvedParentDescriptor.parentType),
        parentId: normalizeString(resolvedParentDescriptor.parentId),
        recipientRole: normalizeString(recipient.role) || "member",
        recipientUserId: normalizeString(recipient.userId),
        recipientEmail: normalizeString(recipient.email),
        payloadVersion: 1,
        scheduledFor,
        payload: {
          hub: normalizedHub,
          recipient: {
            role: normalizeString(recipient.role) || "member",
            userId: normalizeString(recipient.userId),
            email: normalizeString(recipient.email),
            name: normalizeString(recipient.name),
          },
          offering,
          payment,
          cancellation,
          ...extraPayload,
        },
      },
      actorId
    );

    queuedRecords.push(record);
  }

  return queuedRecords;
}

async function resolveUser(hubId, userOrId) {
  if (userOrId && typeof userOrId === "object") {
    return userOrId;
  }

  const normalizedUserId = normalizeString(userOrId);
  return normalizedUserId ? getUserById(hubId, normalizedUserId) : null;
}

async function queueReminderNotification({
  hub,
  offering,
  offeringKind,
  sourceType,
  sourceId,
  sourceStatus,
  paymentStatus,
  recipients,
  createdAt = "",
  actorId = "system",
  leadHours = 24,
} = {}) {
  if (
    !isReminderEligible({
      offeringKind,
      status: sourceStatus,
      paymentStatus,
      parentStatus: offering?.status,
    })
  ) {
    return [];
  }

  const scheduledFor = resolveReminderScheduledFor(offering?.startAt, leadHours);

  if (!scheduledFor || shouldSkipReminderSchedulingForLateBooking(createdAt, scheduledFor)) {
    return [];
  }

  return queueImmediateNotification({
    hub,
    offering,
    sourceType,
    sourceId,
    kind: resolveReminderNotificationKind(offeringKind),
    recipients,
    actorId,
    extraPayload: {
      reminder: buildReminderPayload(scheduledFor, leadHours),
    },
    scheduledFor,
  });
}

export async function queueInitialEventBookingNotification({
  hub,
  event,
  booking,
  bookerUser = null,
  actorId = "system",
  paymentUrl = "",
  paymentInstructions = "",
} = {}) {
  const recipients = resolveEventBookingNotificationRecipients({
    booking,
    bookerUser,
    includeGuestRecipients: false,
  });
  const kind = resolveInitialBookingNotificationKind({
    offeringKind: "event",
    status: booking?.status,
    pricingMode: event?.pricingMode,
    paymentProcessingMode: hub?.packagePaymentProcessingMode,
    paymentStatus: booking?.paymentStatus,
  });
  const offeringPayload = buildEventOfferingPayload(event);
  const sourceType = buildSourceTypeForBookingNotification({ offeringKind: "event", sourceKind: "booking" });
  const sourceId = normalizeString(booking?.id);
  const lifecycleRecords = await queueImmediateNotification({
    hub,
    offering: offeringPayload,
    sourceType,
    sourceId,
    kind,
    recipients,
    actorId,
    payment: buildPendingPaymentPayload({
      offering: event,
      paymentUrl,
      paymentInstructions,
    }),
  });

  const reminderRecords = await queueReminderNotification({
    hub,
    offering: offeringPayload,
    offeringKind: "event",
    sourceType,
    sourceId,
    sourceStatus: booking?.status,
    paymentStatus: booking?.paymentStatus,
    recipients,
    createdAt: booking?.createdAt,
    actorId,
  });

  return [...lifecycleRecords, ...reminderRecords];
}

export async function queueInitialCourseRegistrationNotification({
  hub,
  course,
  registration,
  user = null,
  actorId = "system",
  paymentUrl = "",
  paymentInstructions = "",
} = {}) {
  const resolvedUser = user || await resolveUser(hub?.id, registration?.userId);
  const recipients = resolveCourseRegistrationNotificationRecipients({
    registration,
    user: resolvedUser,
  });
  const kind = resolveInitialBookingNotificationKind({
    offeringKind: "course",
    status: registration?.status,
    pricingMode: course?.pricingMode,
    paymentProcessingMode: hub?.packagePaymentProcessingMode,
    paymentStatus: registration?.paymentStatus,
  });
  const offeringPayload = buildCourseOfferingPayload(course);
  const sourceType = buildSourceTypeForBookingNotification({ offeringKind: "course", sourceKind: "booking" });
  const sourceId = normalizeString(registration?.id);
  const lifecycleRecords = await queueImmediateNotification({
    hub,
    offering: offeringPayload,
    sourceType,
    sourceId,
    kind,
    recipients,
    actorId,
    payment: buildPendingPaymentPayload({
      offering: course,
      paymentUrl,
      paymentInstructions,
    }),
  });

  const reminderRecords = await queueReminderNotification({
    hub,
    offering: offeringPayload,
    offeringKind: "course",
    sourceType,
    sourceId,
    sourceStatus: registration?.status,
    paymentStatus: registration?.paymentStatus,
    recipients,
    createdAt: registration?.createdAt,
    actorId,
  });

  return [...lifecycleRecords, ...reminderRecords];
}

export async function queueEventBookingConfirmedAfterPayment({
  hub,
  event,
  booking,
  bookerUser = null,
  actorId = "system",
} = {}) {
  if (normalizeString(booking?.status) !== "active" || normalizeString(booking?.paymentStatus) !== "paid") {
    return [];
  }

  const resolvedBookerUser = bookerUser || await resolveUser(hub?.id, booking?.bookerUserId);
  const recipients = resolveEventBookingNotificationRecipients({
    booking,
    bookerUser: resolvedBookerUser,
    includeGuestRecipients: false,
  });
  const offeringPayload = buildEventOfferingPayload(event);
  const sourceType = buildSourceTypeForBookingNotification({ offeringKind: "event", sourceKind: "booking" });
  const sourceId = normalizeString(booking?.id);
  const lifecycleRecords = await queueImmediateNotification({
    hub,
    offering: offeringPayload,
    sourceType,
    sourceId,
    kind: resolveConfirmedNotificationKind("event"),
    recipients,
    actorId,
  });

  const reminderRecords = await queueReminderNotification({
    hub,
    offering: offeringPayload,
    offeringKind: "event",
    sourceType,
    sourceId,
    sourceStatus: booking?.status,
    paymentStatus: booking?.paymentStatus,
    recipients,
    createdAt: booking?.createdAt,
    actorId,
  });

  return [...lifecycleRecords, ...reminderRecords];
}

export async function queueEventBookingCancellationNotification({
  hub,
  event,
  booking,
  attendee = null,
  bookerUser = null,
  actorId = "system",
  cancellation = {},
} = {}) {
  const normalizedScope = normalizeString(cancellation?.scope).toLowerCase() || "booking";
  const sourceType = buildSourceTypeForBookingNotification({
    offeringKind: "event",
    sourceKind: "booking",
  });
  const sourceId = normalizeString(booking?.id);

  if (!hub || !event || !booking || !sourceId) {
    return [];
  }

  if (normalizeString(booking?.status) === "cancelled") {
    await suppressNotificationsForCancelledSource({
      hubId: hub.id,
      sourceType,
      sourceId,
      offeringKind: "event",
      actorId,
    });
  }

  const resolvedBookerUser = bookerUser || await resolveUser(hub?.id, booking?.bookerUserId);
  const recipients = resolveEventBookingNotificationRecipients({
    booking,
    bookerUser: resolvedBookerUser,
    includeGuestRecipients: false,
  });

  return queueImmediateNotification({
    hub,
    offering: buildEventOfferingPayload(event),
    sourceType,
    sourceId,
    kind: resolveCancellationNotificationKind("event"),
    recipients,
    actorId,
    cancellation: {
      scope: normalizedScope,
      attendeeName: normalizeString(attendee?.displayName || attendee?.name),
      refundSummary: buildEventCancellationSummary({
        message: cancellation?.refundSummary,
        scope: normalizedScope,
        refunded: cancellation?.refunded,
        refundState: cancellation?.refundState,
      }),
    },
  });
}

export async function queueCourseRegistrationConfirmedAfterPayment({
  hub,
  course,
  registration,
  user = null,
  actorId = "system",
} = {}) {
  if (normalizeString(registration?.status) !== "enrolled" || normalizeString(registration?.paymentStatus) !== "paid") {
    return [];
  }

  const resolvedUser = user || await resolveUser(hub?.id, registration?.userId);
  const recipients = resolveCourseRegistrationNotificationRecipients({
    registration,
    user: resolvedUser,
  });
  const offeringPayload = buildCourseOfferingPayload(course);
  const sourceType = buildSourceTypeForBookingNotification({ offeringKind: "course", sourceKind: "booking" });
  const sourceId = normalizeString(registration?.id);
  const lifecycleRecords = await queueImmediateNotification({
    hub,
    offering: offeringPayload,
    sourceType,
    sourceId,
    kind: resolveConfirmedNotificationKind("course"),
    recipients,
    actorId,
  });

  const reminderRecords = await queueReminderNotification({
    hub,
    offering: offeringPayload,
    offeringKind: "course",
    sourceType,
    sourceId,
    sourceStatus: registration?.status,
    paymentStatus: registration?.paymentStatus,
    recipients,
    createdAt: registration?.createdAt,
    actorId,
  });

  return [...lifecycleRecords, ...reminderRecords];
}

export async function queueCourseRegistrationCancellationNotification({
  hub,
  course,
  registration,
  user = null,
  actorId = "system",
  cancellation = {},
} = {}) {
  const sourceType = buildSourceTypeForBookingNotification({
    offeringKind: "course",
    sourceKind: "booking",
  });
  const sourceId = normalizeString(registration?.id);

  if (!hub || !course || !registration || !sourceId) {
    return [];
  }

  if (normalizeString(registration?.status) === "cancelled") {
    await suppressNotificationsForCancelledSource({
      hubId: hub.id,
      sourceType,
      sourceId,
      offeringKind: "course",
      actorId,
    });
  }

  const resolvedUser = user || await resolveUser(hub?.id, registration?.userId);
  const recipients = resolveCourseRegistrationNotificationRecipients({
    registration,
    user: resolvedUser,
  });

  return queueImmediateNotification({
    hub,
    offering: buildCourseOfferingPayload(course),
    sourceType,
    sourceId,
    kind: resolveCancellationNotificationKind("course"),
    recipients,
    actorId,
    cancellation: {
      scope: "registration",
      refundSummary: buildCourseCancellationSummary({
        message: cancellation?.refundSummary,
      }),
    },
  });
}

export async function queueEventCancelledByAdminNotifications({
  hub,
  event,
  actorId = "system",
  cancellation = {},
} = {}) {
  if (!hub || !event) {
    return [];
  }

  const queuedRecords = [];
  const bookings = await listEventBookings(hub.id, event.id);

  for (const booking of bookings) {
    if (!isActiveOrWaitlistedStatus(booking?.status)) {
      continue;
    }

    await suppressNotificationsForCancelledSource({
      hubId: hub.id,
      sourceType: buildSourceTypeForBookingNotification({
        offeringKind: "event",
        sourceKind: "booking",
      }),
      sourceId: normalizeString(booking?.id),
      offeringKind: "event",
      actorId,
    });

    const bookerUser = await resolveUser(hub.id, booking?.bookerUserId);
    const recipients = resolveEventBookingNotificationRecipients({
      booking,
      bookerUser,
      includeGuestRecipients: false,
    });

    const records = await queueImmediateNotification({
      hub,
      offering: buildEventOfferingPayload(event),
      sourceType: buildSourceTypeForBookingNotification({ offeringKind: "event", sourceKind: "offering" }),
      sourceId: normalizeString(event?.id),
      kind: resolveOfferingCancelledNotificationKind("event"),
      recipients,
      actorId,
      cancellation: {
        refundSummary:
          normalizeString(cancellation?.refundSummary) ||
          "This message confirms the cancellation only and avoids making assumptions about payment or refund outcomes.",
      },
      extraPayload: {
        isWaitlisted: normalizeString(booking?.status).toLowerCase() === "waitlisted",
      },
    });

    queuedRecords.push(...records);
  }

  return queuedRecords;
}

export async function queueCourseCancelledByAdminNotifications({
  hub,
  course,
  actorId = "system",
  cancellation = {},
} = {}) {
  if (!hub || !course) {
    return [];
  }

  const queuedRecords = [];
  const registrations = await listCourseRegistrations(hub.id, course.id);

  for (const registration of registrations) {
    if (!isActiveOrWaitlistedStatus(registration?.status)) {
      continue;
    }

    await suppressNotificationsForCancelledSource({
      hubId: hub.id,
      sourceType: buildSourceTypeForBookingNotification({
        offeringKind: "course",
        sourceKind: "booking",
      }),
      sourceId: normalizeString(registration?.id),
      offeringKind: "course",
      actorId,
    });

    const user = await resolveUser(hub.id, registration?.userId);
    const recipients = resolveCourseRegistrationNotificationRecipients({
      registration,
      user,
    });

    const records = await queueImmediateNotification({
      hub,
      offering: buildCourseOfferingPayload(course),
      sourceType: buildSourceTypeForBookingNotification({ offeringKind: "course", sourceKind: "offering" }),
      sourceId: normalizeString(course?.id),
      kind: resolveOfferingCancelledNotificationKind("course"),
      recipients,
      actorId,
      cancellation: {
        refundSummary:
          normalizeString(cancellation?.refundSummary) ||
          "This message confirms the cancellation only and avoids making assumptions about payment or refund outcomes.",
      },
      extraPayload: {
        isWaitlisted: normalizeString(registration?.status).toLowerCase() === "waitlisted",
      },
    });

    queuedRecords.push(...records);
  }

  return queuedRecords;
}

export async function queueLegacyEventRegistrationConfirmedAfterPayment({
  hub,
  event,
  registration,
  user = null,
  actorId = "system",
} = {}) {
  if (normalizeString(registration?.status) !== "registered" || normalizeString(registration?.paymentStatus) !== "paid") {
    return [];
  }

  const resolvedUser = user || await resolveUser(hub?.id, registration?.userId);
  const recipients = resolveEventRegistrationNotificationRecipients({
    registration,
    user: resolvedUser,
  });
  const offeringPayload = buildEventOfferingPayload(event);
  const sourceType = buildSourceTypeForBookingNotification({ offeringKind: "event", sourceKind: "registration" });
  const sourceId = normalizeString(registration?.id);
  const lifecycleRecords = await queueImmediateNotification({
    hub,
    offering: offeringPayload,
    sourceType,
    sourceId,
    kind: resolveConfirmedNotificationKind("event"),
    recipients,
    actorId,
  });

  const reminderRecords = await queueReminderNotification({
    hub,
    offering: offeringPayload,
    offeringKind: "event",
    sourceType,
    sourceId,
    sourceStatus: registration?.status,
    paymentStatus: registration?.paymentStatus,
    recipients,
    createdAt: registration?.createdAt,
    actorId,
  });

  return [...lifecycleRecords, ...reminderRecords];
}

export async function queueLegacyEventRegistrationConfirmedAfterPaymentByIds({
  hubId,
  eventId,
  registrationId,
  actorId = "system",
} = {}) {
  const [hub, event, registration] = await Promise.all([
    getHubById(hubId),
    getEventById(hubId, eventId),
    getEventRegistrationById(hubId, eventId, registrationId),
  ]);
  const user = await resolveUser(hubId, registration?.userId);

  if (!hub || !event || !registration) {
    return [];
  }

  return queueLegacyEventRegistrationConfirmedAfterPayment({
    hub,
    event,
    registration,
    user,
    actorId,
  });
}

export async function queueCourseRegistrationConfirmedAfterPaymentByIds({
  hubId,
  courseId,
  registrationId,
  actorId = "system",
} = {}) {
  const [hub, course, registration] = await Promise.all([
    getHubById(hubId),
    getCourseById(hubId, courseId),
    getCourseRegistrationById(hubId, courseId, registrationId),
  ]);
  const user = await resolveUser(hubId, registration?.userId);

  if (!hub || !course || !registration) {
    return [];
  }

  return queueCourseRegistrationConfirmedAfterPayment({
    hub,
    course,
    registration,
    user,
    actorId,
  });
}

export async function queueEventBookingConfirmedAfterPaymentByIds({
  hubId,
  eventId,
  bookingId,
  actorId = "system",
} = {}) {
  const [hub, event, booking] = await Promise.all([
    getHubById(hubId),
    getEventById(hubId, eventId),
    getEventBookingById(hubId, eventId, bookingId),
  ]);
  const user = await resolveUser(hubId, booking?.bookerUserId);

  if (!hub || !event || !booking) {
    return [];
  }

  return queueEventBookingConfirmedAfterPayment({
    hub,
    event,
    booking,
    bookerUser: user,
    actorId,
  });
}
