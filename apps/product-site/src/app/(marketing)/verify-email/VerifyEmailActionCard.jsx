"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { applyActionCode } from "firebase/auth";
import { getFirebaseClientAuth } from "@/lib/firebase/client";

function normalizeString(value) {
  return String(value || "").trim();
}

function resolveContinuePath(continueUrl, defaultPath) {
  const fallbackPath = normalizeString(defaultPath) || "/sign-in?verified=1";
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

function mapVerificationError(error) {
  const code = normalizeString(error?.code).toLowerCase();

  if (code === "auth/expired-action-code") {
    return "This verification link has expired. Sign in to your account and send a fresh verification email.";
  }

  if (code === "auth/invalid-action-code") {
    return "This verification link is no longer valid. If you already used it, continue to sign in. Otherwise, request a fresh verification email.";
  }

  if (code === "auth/user-disabled") {
    return "This account is currently unavailable. Contact support if you need help restoring access.";
  }

  return "We could not verify this email just now. Please try the link again or request a new verification email from your account.";
}

export default function VerifyEmailActionCard({ mode = "", oobCode = "", continueUrl = "", hasAccountSession = false }) {
  const normalizedMode = normalizeString(mode);
  const normalizedOobCode = normalizeString(oobCode);
  const setupErrorMessage =
    normalizedMode !== "verifyEmail"
      ? "This action is not supported on this page. Use the verification link from your onboarding email."
      : !normalizedOobCode
        ? "The verification code is missing from this link. Open the latest email and try again."
        : "";
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const verificationAttemptRef = useRef("");
  const continuePath = useMemo(
    () => (hasAccountSession ? "/account" : resolveContinuePath(continueUrl, "/sign-in?verified=1")),
    [continueUrl, hasAccountSession]
  );

  useEffect(() => {
    if (setupErrorMessage) {
      return;
    }

    const attemptKey = `${normalizedMode}:${normalizedOobCode}`;

    if (verificationAttemptRef.current === attemptKey) {
      return;
    }

    verificationAttemptRef.current = attemptKey;

    let isActive = true;

    async function verifyEmail() {
      setStatus("loading");
      setErrorMessage("");

      try {
        const auth = getFirebaseClientAuth();
        await applyActionCode(auth, oobCode);

        if (auth.currentUser && typeof auth.currentUser.reload === "function") {
          await auth.currentUser.reload().catch(() => {});
        }

        if (isActive) {
          setStatus("success");
        }
      } catch (error) {
        if (isActive) {
          setStatus("error");
          setErrorMessage(mapVerificationError(error));
        }
      }
    }

    verifyEmail();

    return () => {
      isActive = false;
    };
  }, [normalizedMode, normalizedOobCode, oobCode, setupErrorMessage]);

  if (status === "loading" || status === "idle") {
    return (
      <article className="route-card">
        <div className="section-heading">
          <span className="eyebrow">Verifying email</span>
          <h2 className="section-title">We’re confirming your email now.</h2>
          <p className="section-copy">This usually takes a moment. Keep this page open while we verify the link from your email.</p>
        </div>
      </article>
    );
  }

  if (status === "success") {
    return (
      <article className="route-card">
        <div className="section-heading">
          <span className="eyebrow">Email verified</span>
          <h2 className="section-title">Your email is confirmed.</h2>
          <p className="section-copy">
            {hasAccountSession
              ? "Your email is confirmed. Return to your account and continue setting up your community."
              : "Your email is confirmed. Sign in to your account and continue setting up your community."}
          </p>
        </div>
        <div className="button-row">
          <Link href={continuePath} className="button-link" data-variant="primary">
            {hasAccountSession ? "Open your account" : "Continue to sign in"}
          </Link>
          {!hasAccountSession ? (
            <Link href="/account" className="button-link" data-variant="secondary">
              Open your account
            </Link>
          ) : null}
        </div>
      </article>
    );
  }

  if (setupErrorMessage) {
    return (
      <article className="route-card">
        <div className="section-heading">
          <span className="eyebrow">Verification issue</span>
          <h2 className="section-title">We could not confirm this email.</h2>
          <p className="section-copy">{setupErrorMessage}</p>
        </div>
        <div className="button-row">
          <Link href={hasAccountSession ? "/account" : "/sign-in"} className="button-link" data-variant="primary">
            {hasAccountSession ? "Open your account" : "Continue to sign in"}
          </Link>
          {!hasAccountSession ? (
            <Link href="/account" className="button-link" data-variant="secondary">
              Open your account
            </Link>
          ) : null}
        </div>
      </article>
    );
  }

  return (
    <article className="route-card">
      <div className="section-heading">
        <span className="eyebrow">Verification issue</span>
        <h2 className="section-title">We could not confirm this email.</h2>
        <p className="section-copy">{errorMessage}</p>
      </div>
      <div className="button-row">
        <Link href={hasAccountSession ? "/account" : "/sign-in"} className="button-link" data-variant="primary">
          {hasAccountSession ? "Open your account" : "Continue to sign in"}
        </Link>
        {!hasAccountSession ? (
          <Link href="/account" className="button-link" data-variant="secondary">
            Open your account
          </Link>
        ) : null}
      </div>
    </article>
  );
}
