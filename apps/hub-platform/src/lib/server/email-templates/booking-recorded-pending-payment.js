import {
  buildCommonTemplateContext,
  buildEmailHtmlShell,
  buildEmailTextShell,
  normalizeString,
} from "./shared.js";

export function renderBookingRecordedPendingPaymentEmail(payload = {}) {
  const context = buildCommonTemplateContext(payload);
  const payment = payload?.payment || {};
  const isCourse = context.offeringLabel === "course";
  const paymentInstructions = normalizeString(payment?.instructions);
  const paymentUrl = normalizeString(payment?.paymentUrl);
  const title = isCourse
    ? `We received your enrolment for ${context.offeringTitle}`
    : `We received your booking for ${context.offeringTitle}`;
  const intro = [
    `Hi ${context.greetingName}, your ${context.bookingLabel} has been recorded.`,
    "Payment still needs to be completed or confirmed before this is treated as fully paid.",
  ];
  const details = [
    { label: isCourse ? "Course" : "Event", value: context.offeringTitle },
    { label: "Schedule", value: context.scheduleLabel },
    { label: isCourse ? "Delivery" : "Location", value: context.locationLabel },
    { label: "Price", value: context.priceLabel },
  ];
  const notice = paymentInstructions
    ? paymentInstructions
    : "Follow the payment steps provided by the hub. A separate confirmation will be sent once payment is confirmed.";

  return {
    subject: title,
    html: buildEmailHtmlShell({
      eyebrow: context.communityEyebrow,
      title,
      intro,
      details,
      notice,
      actionLabel: paymentUrl ? "Continue to payment" : "View My Bookings",
      actionHref: paymentUrl || context.bookingsHref,
      fallbackHref: paymentUrl || context.bookingsHref,
      footer: context.platformFooter,
    }),
    text: buildEmailTextShell({
      title,
      intro,
      details,
      notice,
      actionLabel: paymentUrl ? "Continue to payment" : "View My Bookings",
      actionHref: paymentUrl || context.bookingsHref,
      footer: context.platformFooter,
    }),
  };
}
