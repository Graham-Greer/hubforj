import "server-only";

import { getAuth as getFirebaseAdminAuth } from "firebase-admin/auth";
import { Resend } from "resend";
import { getServerEnv } from "@/lib/config/env";
import { markCommercialAccountVerificationEmailSent } from "@/lib/data/commercial-accounts";
import { getFirebaseAdminApp } from "@/lib/firebase/admin";

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

function resolveProductSiteBaseUrl() {
  const { productSiteBaseUrl } = getServerEnv();

  if (productSiteBaseUrl) {
    return productSiteBaseUrl;
  }

  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:3000";
  }

  throw new Error("PRODUCT_SITE_BASE_URL is required in production.");
}

function buildBrandedActionLink(pathname, actionLink) {
  const brandedUrl = new URL(pathname, resolveProductSiteBaseUrl());
  const rawActionUrl = new URL(actionLink);

  rawActionUrl.searchParams.forEach((value, key) => {
    brandedUrl.searchParams.set(key, value);
  });

  return brandedUrl.toString();
}

function buildBrandedVerificationActionLink(verificationLink) {
  return buildBrandedActionLink("/verify-email", verificationLink);
}

function buildBrandedPasswordResetActionLink(resetLink) {
  return buildBrandedActionLink("/reset-password", resetLink);
}

async function buildVerificationLink(email) {
  const auth = getFirebaseAdminAuth(getFirebaseAdminApp());
  const continueUrl = `${resolveProductSiteBaseUrl()}/sign-in?verified=1`;
  const rawVerificationLink = await auth.generateEmailVerificationLink(email, {
    url: continueUrl,
    handleCodeInApp: false,
  });

  return buildBrandedVerificationActionLink(rawVerificationLink);
}

async function buildPasswordResetLink(email) {
  const auth = getFirebaseAdminAuth(getFirebaseAdminApp());
  const continueUrl = `${resolveProductSiteBaseUrl()}/sign-in?reset=1`;
  const rawResetLink = await auth.generatePasswordResetLink(email, {
    url: continueUrl,
    handleCodeInApp: false,
  });

  return buildBrandedPasswordResetActionLink(rawResetLink);
}

function buildVerificationEmailHtml({ ownerFullName, communityName, verificationLink }) {
  const safeName = escapeHtml(ownerFullName || "there");
  const safeCommunityName = escapeHtml(communityName || "your community");
  const safeLink = escapeHtml(verificationLink);

  return `
    <div style="background:#0b1020;padding:32px;font-family:Inter,Segoe UI,Arial,sans-serif;color:#e8eefc;">
      <div style="max-width:600px;margin:0 auto;background:#121a2d;border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:32px;">
        <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#8ca0d7;">Hubforj</p>
        <h1 style="margin:0 0 16px;font-size:28px;line-height:1.1;color:#ffffff;">Verify your email to finish setting up ${safeCommunityName}.</h1>
        <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#c5d1f3;">Hi ${safeName}, confirm this email address so we know the right owner is activating the commercial account and upcoming admin access.</p>
        <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#c5d1f3;">Once verified, sign back in to continue with your account and the next setup steps.</p>
        <p style="margin:0 0 28px;">
          <a href="${safeLink}" style="display:inline-block;background:#7c9bff;color:#0b1020;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:999px;">Verify email</a>
        </p>
        <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#92a4cf;">If the button does not work, paste this link into your browser:</p>
        <p style="margin:0;font-size:14px;line-height:1.6;color:#92a4cf;word-break:break-word;">${safeLink}</p>
      </div>
    </div>
  `;
}

function buildVerificationEmailText({ ownerFullName, communityName, verificationLink }) {
  return [
    `Hi ${normalizeString(ownerFullName) || "there"},`,
    "",
    `Verify your email to finish setting up ${normalizeString(communityName) || "your community"}.`,
    "",
    "Open the link below to confirm this email address and continue:",
    verificationLink,
    "",
    "Once verified, sign back in to continue with your account and the next setup steps.",
  ].join("\n");
}

function buildPasswordResetEmailHtml({ email, resetLink }) {
  const safeEmail = escapeHtml(email || "your account");
  const safeLink = escapeHtml(resetLink);

  return `
    <div style="background:#0b1020;padding:32px;font-family:Inter,Segoe UI,Arial,sans-serif;color:#e8eefc;">
      <div style="max-width:600px;margin:0 auto;background:#121a2d;border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:32px;">
        <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#8ca0d7;">Hubforj</p>
        <h1 style="margin:0 0 16px;font-size:28px;line-height:1.1;color:#ffffff;">Reset your password.</h1>
        <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#c5d1f3;">We received a request to reset the password for ${safeEmail}.</p>
        <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#c5d1f3;">Use the secure link below to choose a new password and get back into your Hubforj workspace.</p>
        <p style="margin:0 0 28px;">
          <a href="${safeLink}" style="display:inline-block;background:#7c9bff;color:#0b1020;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:999px;">Reset password</a>
        </p>
        <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#92a4cf;">If the button does not work, paste this link into your browser:</p>
        <p style="margin:0;font-size:14px;line-height:1.6;color:#92a4cf;word-break:break-word;">${safeLink}</p>
      </div>
    </div>
  `;
}

function buildPasswordResetEmailText({ email, resetLink }) {
  return [
    `Password reset requested for ${normalizeString(email) || "your account"}.`,
    "",
    "Open the link below to choose a new password:",
    resetLink,
    "",
    "If you did not request this reset, you can ignore this email.",
  ].join("\n");
}

export async function sendCommercialAccountVerificationEmail({ account, communityName = "" } = {}) {
  const ownerEmail = normalizeString(account?.ownerEmail);

  if (!account?.id || !ownerEmail) {
    throw new Error("Commercial account email delivery requires an account with an owner email.");
  }

  const verificationLink = await buildVerificationLink(ownerEmail);
  const sentAt = new Date().toISOString();
  const { resendApiKey, resendFromEmail } = getServerEnv();

  if (!resendApiKey || !resendFromEmail) {
    console.warn(
      `[product-site] verification email not sent because Resend is not configured yet. Verification link for ${ownerEmail}: ${verificationLink}`
    );

    await markCommercialAccountVerificationEmailSent(account.id, sentAt);

    return {
      status: "logged",
      verificationLink,
      sentAt,
    };
  }

  const resend = new Resend(resendApiKey);
  const { error } = await resend.emails.send({
    from: resendFromEmail,
    to: [ownerEmail],
    subject: `Verify your email for ${normalizeString(communityName) || "Hubforj"}`,
    html: buildVerificationEmailHtml({
      ownerFullName: account.ownerFullName,
      communityName,
      verificationLink,
    }),
    text: buildVerificationEmailText({
      ownerFullName: account.ownerFullName,
      communityName,
      verificationLink,
    }),
  });

  if (error) {
    throw new Error(String(error.message || "Unable to send verification email."));
  }

  await markCommercialAccountVerificationEmailSent(account.id, sentAt);

  return {
    status: "sent",
    sentAt,
  };
}

export async function sendCommercialAccountPasswordResetEmail({ email } = {}) {
  const ownerEmail = normalizeString(email).toLowerCase();

  if (!ownerEmail) {
    throw new Error("A password reset email requires an email address.");
  }

  const { resendApiKey, resendFromEmail } = getServerEnv();

  let resetLink = "";

  try {
    resetLink = await buildPasswordResetLink(ownerEmail);
  } catch (error) {
    const code = normalizeString(error?.code).toLowerCase();

    if (code === "auth/user-not-found") {
      return {
        status: "sent",
      };
    }

    throw error;
  }

  if (!resendApiKey || !resendFromEmail) {
    console.warn(
      `[product-site] password reset email not sent because Resend is not configured yet. Reset link for ${ownerEmail}: ${resetLink}`
    );

    return {
      status: "logged",
      resetLink,
    };
  }

  const resend = new Resend(resendApiKey);
  const { error } = await resend.emails.send({
    from: resendFromEmail,
    to: [ownerEmail],
    subject: "Reset your Hubforj password",
    html: buildPasswordResetEmailHtml({
      email: ownerEmail,
      resetLink,
    }),
    text: buildPasswordResetEmailText({
      email: ownerEmail,
      resetLink,
    }),
  });

  if (error) {
    throw new Error(String(error.message || "Unable to send password reset email."));
  }

  return {
    status: "sent",
  };
}
