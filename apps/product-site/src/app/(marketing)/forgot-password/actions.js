"use server";

import { sendCommercialAccountPasswordResetEmail } from "@/lib/server/commercial-account-email";
import { assertProductPasswordResetAllowed, isPublicAbuseRateLimitError } from "@/lib/server/public-abuse-controls";

function normalizeString(value) {
  return String(value || "").trim();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeString(value));
}

export async function requestPasswordResetAction(_previousState, formData) {
  const email = normalizeString(formData.get("email")).toLowerCase();

  if (!isValidEmail(email)) {
    return {
      status: "error",
      message: "Enter the email address linked to your account.",
      values: { email },
    };
  }

  try {
    await assertProductPasswordResetAllowed({ email });
  } catch (error) {
    if (isPublicAbuseRateLimitError(error)) {
      return {
        status: "error",
        message: error.userMessage,
        values: { email },
      };
    }

    return {
      status: "error",
      message: "We could not process this password reset safely right now. Please try again.",
      values: { email },
    };
  }

  try {
    const result = await sendCommercialAccountPasswordResetEmail({ email });

    return {
      status: result?.status === "logged" ? "logged" : "success",
      message:
        result?.status === "logged"
          ? "In this environment, the reset link was logged instead of being emailed."
          : "If that account exists, a password reset email has been sent.",
      values: { email },
    };
  } catch {
    return {
      status: "error",
      message: "We could not send a password reset email right now. Please try again.",
      values: { email },
    };
  }
}
