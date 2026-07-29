import "server-only";

import { getServerEnv } from "@/lib/config/env";
import { createAdminInviteToken } from "@/lib/auth/admin-invite-token";
import { buildHubAdminInviteAcceptUrl } from "@/lib/domain/admin-invite-links";
import {
  getFallbackRegionalMarket,
  resolveLaunchFormattingLocale,
} from "@/lib/domain/regional-markets";

function normalizeString(value) {
  return String(value || "").trim();
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatInviteExpiry(value, locale = getFallbackRegionalMarket().defaultLocale) {
  const normalizedValue = normalizeString(value);
  const resolvedLocale = resolveLaunchFormattingLocale(locale);

  if (!normalizedValue) {
    return "";
  }

  const parsed = new Date(normalizedValue);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(resolvedLocale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function buildInviteEmailHtml({ hub, invite, acceptanceUrl }) {
  const safeHubName = escapeHtml(hub?.name || "your hub");
  const safeAcceptanceUrl = escapeHtml(acceptanceUrl);
  const expiryLabel = formatInviteExpiry(
    invite?.expiresAt,
    resolveLaunchFormattingLocale(hub?.locale, hub?.country)
  );

  return `
    <div style="background:#0b1020;padding:32px;font-family:Inter,Segoe UI,Arial,sans-serif;color:#e8eefc;">
      <div style="max-width:600px;margin:0 auto;background:#121a2d;border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:32px;">
        <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#8ca0d7;">Hubforj admin</p>
        <h1 style="margin:0 0 16px;font-size:28px;line-height:1.1;color:#ffffff;">You've been invited to help manage ${safeHubName}.</h1>
        <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#c5d1f3;">Accept this invite to create or sign in to your Hubforj admin account and access the hub workspace.</p>
        ${
          expiryLabel
            ? `<p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#c5d1f3;">This invite expires on ${escapeHtml(expiryLabel)}.</p>`
            : ""
        }
        <p style="margin:0 0 28px;">
          <a href="${safeAcceptanceUrl}" style="display:inline-block;background:#7c9bff;color:#0b1020;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:999px;">Accept admin invite</a>
        </p>
        <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#92a4cf;">If the button does not work, paste this link into your browser:</p>
        <p style="margin:0;font-size:14px;line-height:1.6;color:#92a4cf;word-break:break-word;">${safeAcceptanceUrl}</p>
      </div>
    </div>
  `;
}

function buildInviteEmailText({ hub, invite, acceptanceUrl }) {
  const expiryLabel = formatInviteExpiry(
    invite?.expiresAt,
    resolveLaunchFormattingLocale(hub?.locale, hub?.country)
  );

  return [
    `You've been invited to help manage ${normalizeString(hub?.name) || "your hub"} on Hubforj.`,
    "",
    "Accept this invite to create or sign in to your Hubforj admin account:",
    acceptanceUrl,
    expiryLabel ? "" : null,
    expiryLabel ? `This invite expires on ${expiryLabel}.` : null,
  ]
    .filter((value) => value !== null)
    .join("\n");
}

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
    throw new Error(String(payload?.message || payload?.error || "Unable to send admin invite email."));
  }

  return payload;
}

export async function sendHubAdminInviteEmail({ hub, invite } = {}) {
  if (!hub?.slug || !hub?.id) {
    throw new Error("Hub admin invite email delivery requires a valid hub.");
  }

  if (!invite?.id || !normalizeString(invite?.email)) {
    throw new Error("Hub admin invite email delivery requires a valid invite.");
  }

  const env = getServerEnv();
  const acceptanceUrl = buildHubAdminInviteAcceptUrl(
    hub,
    createAdminInviteToken(invite, env.sessionHmacSecret),
    {
      hubPlatformBaseUrl: env.hubPlatformBaseUrl,
      productSiteBaseUrl: env.productSiteBaseUrl,
    }
  );

  if (!acceptanceUrl) {
    throw new Error("Unable to build the admin invite acceptance link.");
  }

  const attemptedAt = new Date().toISOString();

  if (!env.resendApiKey || !env.resendFromEmail) {
    console.warn(
      `[hub-platform] admin invite email not sent because Resend is not configured yet. Acceptance link for ${invite.email}: ${acceptanceUrl}`
    );

    return {
      status: "logged",
      attemptedAt,
      acceptanceUrl,
      provider: "resend",
      messageId: "",
    };
  }

  const payload = await sendResendEmail({
    resendApiKey: env.resendApiKey,
    from: env.resendFromEmail,
    to: invite.email,
    subject: `You've been invited to manage ${normalizeString(hub.name) || "a hub"} on Hubforj`,
    html: buildInviteEmailHtml({ hub, invite, acceptanceUrl }),
    text: buildInviteEmailText({ hub, invite, acceptanceUrl }),
  });

  return {
    status: "sent",
    attemptedAt,
    sentAt: attemptedAt,
    acceptanceUrl,
    provider: "resend",
    messageId: normalizeString(payload?.id),
  };
}
