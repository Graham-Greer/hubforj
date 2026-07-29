import {
  buildCommonTemplateContext,
  buildEmailHtmlShell,
  buildEmailTextShell,
} from "./shared.js";

export function renderBookingWaitlistedEmail(payload = {}) {
  const context = buildCommonTemplateContext(payload);
  const isCourse = context.offeringLabel === "course";
  const title = isCourse
    ? `You are on the waitlist for ${context.offeringTitle}`
    : `You are on the waitlist for ${context.offeringTitle}`;
  const intro = [
    `Hi ${context.greetingName}, your ${context.bookingLabel} is currently waitlisted.`,
    "This does not confirm a place yet. The hub team can follow up if space becomes available.",
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
      notice: "Please do not treat this email as a confirmed place or as confirmation that payment is complete.",
      actionLabel: "View My Bookings",
      actionHref: context.bookingsHref,
      fallbackHref: context.bookingsHref,
      footer: context.platformFooter,
    }),
    text: buildEmailTextShell({
      title,
      intro,
      details,
      notice: "Please do not treat this as a confirmed place or as confirmation that payment is complete.",
      actionLabel: "View My Bookings",
      actionHref: context.bookingsHref,
      footer: context.platformFooter,
    }),
  };
}
