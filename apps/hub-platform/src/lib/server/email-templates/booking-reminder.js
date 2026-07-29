import {
  buildCommonTemplateContext,
  buildEmailHtmlShell,
  buildEmailTextShell,
  formatNotificationDate,
  normalizeString,
} from "./shared.js";

export function renderBookingReminderEmail(payload = {}) {
  const context = buildCommonTemplateContext(payload);
  const reminder = payload?.reminder || {};
  const title = `Reminder: ${context.offeringTitle} starts soon`;
  const reminderLeadLabel =
    normalizeString(reminder?.leadLabel) ||
    (reminder?.scheduledFor ? `Scheduled for ${formatNotificationDate(reminder.scheduledFor, context.locale)}` : "");
  const intro = [
    `Hi ${context.greetingName}, this is a reminder about your ${context.bookingLabel}.`,
    reminderLeadLabel || "Your scheduled start time is approaching.",
  ];
  const details = [
    { label: context.offeringLabel === "course" ? "Course" : "Event", value: context.offeringTitle },
    { label: "Schedule", value: context.scheduleLabel },
    { label: context.offeringLabel === "course" ? "Delivery" : "Location", value: context.locationLabel },
    { label: "Price", value: context.priceLabel },
  ];

  return {
    subject: title,
    html: buildEmailHtmlShell({
      eyebrow: context.communityEyebrow,
      title,
      intro,
      details,
      actionLabel: context.offeringHref ? (context.offeringLabel === "course" ? "View course" : "View event") : "View My Bookings",
      actionHref: context.offeringHref || context.bookingsHref,
      fallbackHref: context.offeringHref || context.bookingsHref,
      footer: context.platformFooter,
    }),
    text: buildEmailTextShell({
      title,
      intro,
      details,
      actionLabel: context.offeringHref ? (context.offeringLabel === "course" ? "View course" : "View event") : "View My Bookings",
      actionHref: context.offeringHref || context.bookingsHref,
      footer: context.platformFooter,
    }),
  };
}
