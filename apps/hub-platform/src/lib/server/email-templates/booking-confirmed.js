import {
  buildCommonTemplateContext,
  buildEmailHtmlShell,
  buildEmailTextShell,
} from "./shared.js";

export function renderBookingConfirmedEmail(payload = {}) {
  const context = buildCommonTemplateContext(payload);
  const isCourse = context.offeringLabel === "course";
  const title = isCourse
    ? `Your enrolment is confirmed for ${context.offeringTitle}`
    : `Your booking is confirmed for ${context.offeringTitle}`;
  const intro = [
    `Hi ${context.greetingName}, your ${context.bookingLabel} is confirmed.`,
    isCourse
      ? "Everything is in place and no further payment follow-up is needed right now."
      : "Everything is in place and no further payment follow-up is needed right now.",
  ];
  const details = [
    { label: isCourse ? "Course" : "Event", value: context.offeringTitle },
    { label: "Schedule", value: context.scheduleLabel },
    { label: isCourse ? "Delivery" : "Location", value: context.locationLabel },
    { label: "Price", value: context.priceLabel },
  ];

  return {
    subject: title,
    html: buildEmailHtmlShell({
      eyebrow: context.communityEyebrow,
      title,
      intro,
      details,
      actionLabel: context.offeringHref ? (isCourse ? "View course" : "View event") : "View My Bookings",
      actionHref: context.offeringHref || context.bookingsHref,
      fallbackHref: context.offeringHref || context.bookingsHref,
      footer: context.platformFooter,
    }),
    text: buildEmailTextShell({
      title,
      intro,
      details,
      actionLabel: context.offeringHref ? (isCourse ? "View course" : "View event") : "View My Bookings",
      actionHref: context.offeringHref || context.bookingsHref,
      footer: context.platformFooter,
    }),
  };
}
