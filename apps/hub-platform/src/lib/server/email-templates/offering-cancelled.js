import {
  buildCommonTemplateContext,
  buildEmailHtmlShell,
  buildEmailTextShell,
  normalizeString,
} from "./shared.js";

export function renderOfferingCancelledEmail(payload = {}) {
  const context = buildCommonTemplateContext(payload);
  const cancellation = payload?.cancellation || {};
  const title = `${context.offeringTitle} has been cancelled`;
  const intro = [
    `Hi ${context.greetingName}, the ${context.offeringLabel} you were linked to has been cancelled by the hub team.`,
    normalizeString(payload?.isWaitlisted)
      ? "You were on the waitlist for this offering, so this notice does not imply that a confirmed place or refund existed."
      : "If you had a confirmed place, the hub team will follow the recorded payment and refund outcome separately.",
  ];
  const details = [
    { label: context.offeringLabel === "course" ? "Course" : "Event", value: context.offeringTitle },
    { label: "Schedule", value: context.scheduleLabel },
    { label: context.offeringLabel === "course" ? "Delivery" : "Location", value: context.locationLabel },
  ];
  const notice =
    normalizeString(cancellation?.refundSummary) ||
    "This message confirms the cancellation only and avoids making assumptions about payment or refund outcomes.";

  return {
    subject: title,
    html: buildEmailHtmlShell({
      eyebrow: context.communityEyebrow,
      title,
      intro,
      details,
      notice,
      actionLabel: context.offeringHref ? (context.offeringLabel === "course" ? "View course" : "View event") : "View My Bookings",
      actionHref: context.offeringHref || context.bookingsHref,
      fallbackHref: context.offeringHref || context.bookingsHref,
      footer: context.platformFooter,
    }),
    text: buildEmailTextShell({
      title,
      intro,
      details,
      notice,
      actionLabel: context.offeringHref ? (context.offeringLabel === "course" ? "View course" : "View event") : "View My Bookings",
      actionHref: context.offeringHref || context.bookingsHref,
      footer: context.platformFooter,
    }),
  };
}
