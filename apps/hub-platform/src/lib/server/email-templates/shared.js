import {
  formatMoney,
  formatMoneyFromMinor,
} from "@/lib/domain/memberships";
import { formatEventDateRange } from "@/lib/domain/events";
import { formatCourseDateRange } from "@/lib/domain/courses";
import {
  getFallbackRegionalMarket,
  resolveLaunchFormattingLocale,
} from "@/lib/domain/regional-markets";
import { buildHubRuntimeHref } from "@/lib/domain/hub-runtime-paths";

function normalizeString(value) {
  return String(value || "").trim();
}

export { normalizeString };

export function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function resolveEmailLocale(hub = {}) {
  return resolveLaunchFormattingLocale(hub?.locale, hub?.country) || getFallbackRegionalMarket().defaultLocale;
}

export function resolveRecipientGreeting(recipient = {}) {
  return normalizeString(recipient?.name) || "there";
}

export function resolveCommunityDisplayName(hub = {}) {
  return normalizeString(hub?.name) || "Your community";
}

export function resolveOfferingLabel(offering = {}) {
  return normalizeString(offering?.kind).toLowerCase() === "course" ? "course" : "event";
}

export function resolveBookingLabel(offering = {}) {
  return normalizeString(offering?.kind).toLowerCase() === "course" ? "enrolment" : "booking";
}

export function buildOfferingHref(hub = {}, offering = {}) {
  const hubSlug = normalizeString(hub?.slug);
  const routeMode = normalizeString(hub?.routeMode) || "path";
  const offeringSlug = normalizeString(offering?.slug);
  const kind = resolveOfferingLabel(offering);

  if (!hubSlug || !offeringSlug) {
    return "";
  }

  return buildHubRuntimeHref(hubSlug, kind === "course" ? `/courses/${offeringSlug}` : `/events/${offeringSlug}`, routeMode);
}

export function buildBookingsHref(hub = {}) {
  const hubSlug = normalizeString(hub?.slug);
  const routeMode = normalizeString(hub?.routeMode) || "path";

  if (!hubSlug) {
    return "";
  }

  return buildHubRuntimeHref(hubSlug, "/account/bookings", routeMode);
}

export function formatNotificationDate(value, locale) {
  const normalizedValue = normalizeString(value);

  if (!normalizedValue) {
    return "";
  }

  const parsed = new Date(normalizedValue);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(resolveLaunchFormattingLocale(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

export function formatNotificationSchedule(offering = {}, locale = getFallbackRegionalMarket().defaultLocale) {
  return resolveOfferingLabel(offering) === "course"
    ? formatCourseDateRange(offering, locale)
    : formatEventDateRange(offering, locale);
}

export function formatNotificationPrice(offering = {}, locale = getFallbackRegionalMarket().defaultLocale) {
  const rawPriceLabel = normalizeString(offering?.priceLabel);

  if (rawPriceLabel) {
    return rawPriceLabel;
  }

  if (Number.isFinite(Number(offering?.amountMinor))) {
    return formatMoneyFromMinor(
      Number(offering.amountMinor),
      normalizeString(offering?.currency).toUpperCase() || getFallbackRegionalMarket().defaultCurrency,
      locale
    );
  }

  if (normalizeString(offering?.price)) {
    return formatMoney(
      offering.price,
      normalizeString(offering?.currency).toUpperCase() || getFallbackRegionalMarket().defaultCurrency,
      locale
    );
  }

  return normalizeString(offering?.pricingMode).toLowerCase() === "paid"
    ? `Paid • ${normalizeString(offering?.currency).toUpperCase() || getFallbackRegionalMarket().defaultCurrency}`
    : "Free";
}

export function buildEmailHtmlShell({
  eyebrow = "Hubforj",
  title = "",
  intro = [],
  details = [],
  notice = "",
  actionLabel = "",
  actionHref = "",
  fallbackHref = "",
  footer = "",
} = {}) {
  const introHtml = intro
    .map((paragraph) =>
      `<p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#c5d1f3;">${escapeHtml(paragraph)}</p>`
    )
    .join("");
  const detailsHtml = details.length
    ? `<div style="margin:0 0 24px;padding:16px 18px;border-radius:18px;background:#0f1629;border:1px solid rgba(255,255,255,0.06);">
        ${details
          .map(
            (detail) =>
              `<p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#c5d1f3;"><strong style="color:#ffffff;">${escapeHtml(detail.label)}:</strong> ${escapeHtml(detail.value)}</p>`
          )
          .join("")}
      </div>`
    : "";
  const noticeHtml = notice
    ? `<p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#c5d1f3;">${escapeHtml(notice)}</p>`
    : "";
  const actionHtml =
    actionLabel && actionHref
      ? `<p style="margin:0 0 28px;">
          <a href="${escapeHtml(actionHref)}" style="display:inline-block;background:#7c9bff;color:#0b1020;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:999px;">${escapeHtml(actionLabel)}</a>
        </p>`
      : "";
  const fallbackHtml = fallbackHref
    ? `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#92a4cf;">If the button does not work, paste this link into your browser:</p>
       <p style="margin:0;font-size:14px;line-height:1.6;color:#92a4cf;word-break:break-word;">${escapeHtml(fallbackHref)}</p>`
    : "";
  const footerHtml = footer
    ? `<p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#7f8fb8;">${escapeHtml(footer)}</p>`
    : "";

  return `
    <div style="background:#0b1020;padding:32px;font-family:Inter,Segoe UI,Arial,sans-serif;color:#e8eefc;">
      <div style="max-width:600px;margin:0 auto;background:#121a2d;border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:32px;">
        <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#8ca0d7;">${escapeHtml(eyebrow)}</p>
        <h1 style="margin:0 0 16px;font-size:28px;line-height:1.1;color:#ffffff;">${escapeHtml(title)}</h1>
        ${introHtml}
        ${detailsHtml}
        ${noticeHtml}
        ${actionHtml}
        ${fallbackHtml}
        ${footerHtml}
      </div>
    </div>
  `;
}

export function buildEmailTextShell({
  title = "",
  intro = [],
  details = [],
  notice = "",
  actionLabel = "",
  actionHref = "",
  footer = "",
} = {}) {
  return [
    title,
    "",
    ...intro,
    details.length ? "" : null,
    ...details.map((detail) => `${detail.label}: ${detail.value}`),
    notice ? "" : null,
    notice || null,
    actionLabel && actionHref ? "" : null,
    actionLabel && actionHref ? `${actionLabel}: ${actionHref}` : null,
    footer ? "" : null,
    footer || null,
  ]
    .filter((value) => value !== null)
    .join("\n");
}

export function buildCommonTemplateContext(payload = {}) {
  const hub = payload?.hub || {};
  const offering = payload?.offering || {};
  const recipient = payload?.recipient || {};
  const locale = resolveEmailLocale(hub);
  const offeringHref = normalizeString(payload?.actionHref) || buildOfferingHref(hub, offering);
  const bookingsHref = buildBookingsHref(hub);

  return {
    hub,
    offering,
    recipient,
    locale,
    communityName: resolveCommunityDisplayName(hub),
    communityEyebrow: resolveCommunityDisplayName(hub),
    platformFooter: `Sent on behalf of ${resolveCommunityDisplayName(hub)} via Hubforj.`,
    greetingName: resolveRecipientGreeting(recipient),
    offeringLabel: resolveOfferingLabel(offering),
    bookingLabel: resolveBookingLabel(offering),
    scheduleLabel: formatNotificationSchedule(offering, locale),
    priceLabel: formatNotificationPrice(offering, locale),
    offeringHref,
    bookingsHref,
    offeringTitle: normalizeString(offering?.title) || `your ${resolveOfferingLabel(offering)}`,
    locationLabel:
      normalizeString(offering?.location) ||
      normalizeString(offering?.deliveryLabel) ||
      "To be confirmed",
  };
}
