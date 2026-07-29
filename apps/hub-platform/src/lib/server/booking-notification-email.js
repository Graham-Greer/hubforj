try {
  await import("server-only");
} catch {
  // Plain Node compatibility for unit tests.
}

import { getServerEnv } from "@/lib/config/env";
import {
  bookingNotificationKinds,
  isBookingNotificationKind,
} from "@/lib/domain/booking-notifications";
import { renderBookingConfirmedEmail } from "@/lib/server/email-templates/booking-confirmed.js";
import { renderBookingRecordedPendingPaymentEmail } from "@/lib/server/email-templates/booking-recorded-pending-payment.js";
import { renderBookingWaitlistedEmail } from "@/lib/server/email-templates/booking-waitlisted.js";
import { renderBookingCancelledEmail } from "@/lib/server/email-templates/booking-cancelled.js";
import { renderOfferingCancelledEmail } from "@/lib/server/email-templates/offering-cancelled.js";
import { renderBookingReminderEmail } from "@/lib/server/email-templates/booking-reminder.js";

function normalizeString(value) {
  return String(value || "").trim();
}

function extractEmailAddress(value) {
  const normalizedValue = normalizeString(value);
  const bracketMatch = normalizedValue.match(/<([^>]+)>/);

  if (bracketMatch?.[1]) {
    return normalizeString(bracketMatch[1]);
  }

  return normalizedValue;
}

function buildCommunitySenderAddress(hub = {}, fallbackFrom = "") {
  const emailAddress = extractEmailAddress(fallbackFrom);
  const communityName = normalizeString(hub?.name) || "Your community";

  if (!emailAddress) {
    return fallbackFrom;
  }

  return `${communityName} via Hubforj <${emailAddress}>`;
}

const templateRenderersByKind = {
  [bookingNotificationKinds.eventBookingConfirmed]: renderBookingConfirmedEmail,
  [bookingNotificationKinds.courseEnrolmentConfirmed]: renderBookingConfirmedEmail,
  [bookingNotificationKinds.eventBookingRecordedPendingPayment]: renderBookingRecordedPendingPaymentEmail,
  [bookingNotificationKinds.courseEnrolmentRecordedPendingPayment]: renderBookingRecordedPendingPaymentEmail,
  [bookingNotificationKinds.eventBookingWaitlisted]: renderBookingWaitlistedEmail,
  [bookingNotificationKinds.courseEnrolmentWaitlisted]: renderBookingWaitlistedEmail,
  [bookingNotificationKinds.eventBookingCancelled]: renderBookingCancelledEmail,
  [bookingNotificationKinds.courseEnrolmentCancelled]: renderBookingCancelledEmail,
  [bookingNotificationKinds.eventCancelledByAdmin]: renderOfferingCancelledEmail,
  [bookingNotificationKinds.courseCancelledByAdmin]: renderOfferingCancelledEmail,
  [bookingNotificationKinds.eventBookingReminder]: renderBookingReminderEmail,
  [bookingNotificationKinds.courseEnrolmentReminder]: renderBookingReminderEmail,
};

async function sendResendEmail({ resendApiKey, from, to, subject, html, text }) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      text,
    }),
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(String(payload?.message || payload?.error || "Unable to send booking notification email."));
  }

  return payload;
}

export function renderBookingNotificationEmail(notification = {}) {
  const kind = normalizeString(notification?.kind);

  if (!isBookingNotificationKind(kind)) {
    throw new Error("A valid booking notification kind is required.");
  }

  const renderer = templateRenderersByKind[kind];

  if (typeof renderer !== "function") {
    throw new Error(`No booking notification renderer is registered for ${kind}.`);
  }

  return renderer(notification?.payload || {});
}

export async function sendBookingNotificationEmail(notification = {}) {
  const recipientEmail =
    normalizeString(notification?.recipientEmail) ||
    normalizeString(notification?.payload?.recipient?.email);

  if (!recipientEmail) {
    throw new Error("Booking notification delivery requires a recipient email.");
  }

  const attemptedAt = new Date().toISOString();
  const rendered = renderBookingNotificationEmail(notification);
  const { resendApiKey, resendFromEmail } = getServerEnv();
  const senderAddress = buildCommunitySenderAddress(notification?.payload?.hub, resendFromEmail);

  if (!resendApiKey || !senderAddress) {
    console.warn(
      `[hub-platform] booking notification email not sent because Resend is not configured yet. Kind=${normalizeString(notification?.kind)} to=${recipientEmail}`
    );

    return {
      status: "logged",
      attemptedAt,
      sentAt: "",
      provider: "resend",
      providerMessageId: "",
      error: "",
      subject: rendered.subject,
    };
  }

  try {
    const payload = await sendResendEmail({
      resendApiKey,
      from: senderAddress,
      to: recipientEmail,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });

    return {
      status: "sent",
      attemptedAt,
      sentAt: attemptedAt,
      provider: "resend",
      providerMessageId: normalizeString(payload?.id),
      error: "",
      subject: rendered.subject,
    };
  } catch (error) {
    return {
      status: "failed",
      attemptedAt,
      sentAt: "",
      provider: "resend",
      providerMessageId: "",
      error: normalizeString(error?.message || error),
      subject: rendered.subject,
    };
  }
}
