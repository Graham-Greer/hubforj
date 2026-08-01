"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { getFirebaseClientAuth } from "@/lib/firebase/client";

function normalizeString(value) {
  return String(value || "").trim();
}

function resolveContinuePath(continueUrl, defaultPath) {
  const fallbackPath = normalizeString(defaultPath) || "/sign-in?reset=1";
  const normalizedValue = normalizeString(continueUrl);

  if (!normalizedValue || typeof window === "undefined") {
    return fallbackPath;
  }

  try {
    const resolvedUrl = new URL(normalizedValue, window.location.origin);

    if (resolvedUrl.origin !== window.location.origin) {
      return fallbackPath;
    }

    return `${resolvedUrl.pathname}${resolvedUrl.search}${resolvedUrl.hash}`;
  } catch {
    return fallbackPath;
  }
}

function mapResetError(error) {
  const code = normalizeString(error?.code).toLowerCase();

  if (code === "auth/expired-action-code") {
    return "This reset link has expired. Request a fresh password reset email to continue.";
  }

  if (code === "auth/invalid-action-code") {
    return "This reset link is no longer valid. If you already used it, sign in with your new password. Otherwise, request a fresh password reset email.";
  }

  if (code === "auth/weak-password") {
    return "Choose a stronger password with at least 8 characters.";
  }

  if (code === "auth/user-disabled") {
    return "This account is currently unavailable. Contact support if you need help restoring access.";
  }

  return "We could not reset this password just now. Please try again or request a fresh reset email.";
}

export default function ResetPasswordActionCard({ mode = "", oobCode = "", continueUrl = "" }) {
  const normalizedMode = normalizeString(mode);
  const normalizedOobCode = normalizeString(oobCode);
  const setupErrorMessage =
    normalizedMode !== "resetPassword"
      ? "This action is not supported on this page. Use the password reset link from your email."
      : !normalizedOobCode
        ? "The reset code is missing from this link. Open the latest password reset email and try again."
        : "";
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const resetAttemptRef = useRef("");
  const continuePath = useMemo(() => resolveContinuePath(continueUrl, "/sign-in?reset=1"), [continueUrl]);

  useEffect(() => {
    if (setupErrorMessage) {
      return;
    }

    const attemptKey = `${normalizedMode}:${normalizedOobCode}`;

    if (resetAttemptRef.current === attemptKey) {
      return;
    }

    resetAttemptRef.current = attemptKey;

    let isActive = true;

    async function verifyCode() {
      setStatus("loading");
      setErrorMessage("");

      try {
        const auth = getFirebaseClientAuth();
        const resolvedEmail = await verifyPasswordResetCode(auth, oobCode);

        if (isActive) {
          setEmail(resolvedEmail);
          setStatus("ready");
        }
      } catch (error) {
        if (isActive) {
          setStatus("error");
          setErrorMessage(mapResetError(error));
        }
      }
    }

    verifyCode();

    return () => {
      isActive = false;
    };
  }, [normalizedMode, normalizedOobCode, oobCode, setupErrorMessage]);

  function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const password = normalizeString(formData.get("password"));
    const passwordConfirm = normalizeString(formData.get("passwordConfirm"));

    if (password.length < 8) {
      setErrorMessage("Choose a stronger password with at least 8 characters.");
      return;
    }

    if (password !== passwordConfirm) {
      setErrorMessage("Make sure both password fields match.");
      return;
    }

    setErrorMessage("");

    startTransition(async () => {
      try {
        await confirmPasswordReset(getFirebaseClientAuth(), oobCode, password);
        setStatus("success");
      } catch (error) {
        setErrorMessage(mapResetError(error));
        setStatus("ready");
      }
    });
  }

  if (status === "loading" || status === "idle") {
    return (
      <article className="route-card">
        <div className="section-heading">
          <span className="eyebrow">Checking reset link</span>
          <h2 className="section-title">We’re preparing your password reset.</h2>
          <p className="section-copy">Keep this page open while we verify the secure reset link from your email.</p>
        </div>
      </article>
    );
  }

  if (status === "success") {
    return (
      <article className="route-card signup-form-card">
        <div className="section-heading">
          <span className="eyebrow">Password updated</span>
          <h2 className="section-title">Your password has been reset.</h2>
          <p className="section-copy">Sign in with your new password to get back into your Hubforj account.</p>
        </div>
        <div className="button-row">
          <Link href={continuePath} prefetch={false} className="button-link" data-variant="primary">
            Continue to sign in
          </Link>
          <Link href="/forgot-password" prefetch={false} className="button-link" data-variant="secondary">
            Request another reset email
          </Link>
        </div>
      </article>
    );
  }

  if (setupErrorMessage || status === "error") {
    return (
      <article className="route-card signup-form-card">
        <div className="section-heading">
          <span className="eyebrow">Reset issue</span>
          <h2 className="section-title">We could not use this reset link.</h2>
          <p className="section-copy">{setupErrorMessage || errorMessage}</p>
        </div>
        <div className="button-row">
          <Link href="/forgot-password" prefetch={false} className="button-link" data-variant="primary">
            Request another reset email
          </Link>
          <Link href="/sign-in" prefetch={false} className="button-link" data-variant="secondary">
            Return to sign in
          </Link>
        </div>
      </article>
    );
  }

  return (
    <article className="route-card signup-form-card">
      <div className="section-heading">
        <span className="eyebrow">Reset password</span>
        <h2 className="section-title">Choose your new password.</h2>
        <p className="section-copy">
          {email ? `You’re resetting the password for ${email}.` : "Choose a new password for your account."}
        </p>
      </div>
      {errorMessage ? <div className="form-message" data-tone="danger">{errorMessage}</div> : null}
      <form onSubmit={handleSubmit} className="signup-form-shell">
        <div className="signup-form-grid">
          <label className="form-field">
            <span className="form-label">New password</span>
            <input
              className="form-input"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              required
            />
            <span className="form-helper">Choose a password you can use the next time you sign in.</span>
          </label>
          <label className="form-field">
            <span className="form-label">Confirm new password</span>
            <input
              className="form-input"
              name="passwordConfirm"
              type="password"
              autoComplete="new-password"
              placeholder="Repeat your new password"
              required
            />
            <span className="form-helper">Repeat the same password so we can confirm it is correct.</span>
          </label>
        </div>
        <div className="form-actions">
          <button type="submit" className="button-link" data-variant="primary" disabled={isPending}>
            {isPending ? "Saving new password..." : "Save new password"}
          </button>
        </div>
      </form>
    </article>
  );
}
