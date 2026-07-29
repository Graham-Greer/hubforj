import {
  buildCommonTemplateContext,
  buildEmailHtmlShell,
  buildEmailTextShell,
  normalizeString,
} from "./shared.js";

export function renderBookingCancelledEmail(payload = {}) {
  const context = buildCommonTemplateContext(payload);
  const cancellation = payload?.cancellation || {};
  const cancellationScope = normalizeString(cancellation?.scope).toLowerCase();
  const cancelledAttendeeName = normalizeString(cancellation?.attendeeName);
  const isCourse = context.offeringLabel === "course";
  const isPartialEventAttendeeCancellation = !isCourse && cancellationScope === "attendee";
  const title = isCourse
    ? `Your enrolment has been cancelled for ${context.offeringTitle}`
    : isPartialEventAttendeeCancellation
      ? `A booked place was cancelled for ${context.offeringTitle}`
      : `Your booking has been cancelled for ${context.offeringTitle}`;
  const intro = [
    `Hi ${context.greetingName}, ${
      isPartialEventAttendeeCancellation ? "one place on your booking was cancelled." : `your ${context.bookingLabel} has been cancelled.`
    }`,
    "This email confirms the cancellation outcome only.",
  ];
  const details = [
    { label: isCourse ? "Course" : "Event", value: context.offeringTitle },
    { label: "Schedule", value: context.scheduleLabel },
    { label: isCourse ? "Delivery" : "Location", value: context.locationLabel },
  ];

  if (isPartialEventAttendeeCancellation && cancelledAttendeeName) {
    details.splice(1, 0, { label: "Cancelled attendee", value: cancelledAttendeeName });
  }

  const notice =
    normalizeString(cancellation?.refundSummary) ||
    "Any payment or refund follow-up will depend on the recorded payment state and hub policy.";

  return {
    subject: title,
    html: buildEmailHtmlShell({
      eyebrow: context.communityEyebrow,
      title,
      intro,
      details,
      notice,
      actionLabel: "View My Bookings",
      actionHref: context.bookingsHref,
      fallbackHref: context.bookingsHref,
      footer: context.platformFooter,
    }),
    text: buildEmailTextShell({
      title,
      intro,
      details,
      notice,
      actionLabel: "View My Bookings",
      actionHref: context.bookingsHref,
      footer: context.platformFooter,
    }),
  };
}
