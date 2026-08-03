"use client";

import { useEffect, useState } from "react";

function normalizeString(value) {
  return String(value || "").trim();
}

export default function AdminHandoffLauncher() {
  const [state, setState] = useState("opening");

  useEffect(() => {
    let cancelled = false;

    async function openAdminArea() {
      setState("opening");

      try {
        const response = await fetch("/account/admin/handoff", {
          method: "POST",
          cache: "no-store",
        });
        const payload = await response.json().catch(() => ({}));
        const redirectTo = normalizeString(payload?.redirectTo);

        if (cancelled) {
          return;
        }

        if (payload?.ok && redirectTo) {
          window.location.assign(redirectTo);
          return;
        }

        setState("error");
      } catch {
        if (!cancelled) {
          setState("error");
        }
      }
    }

    openAdminArea();

    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "error") {
    return (
      <div className="content-stack">
        <article className="route-card account-action-panel">
          <div className="subsection-heading">
            <span className="eyebrow">Action needed</span>
            <h2 className="section-title">We could not open your admin area just now.</h2>
            <p className="section-copy">
              Your account is still signed in. Return to your account overview and try opening the admin area again.
            </p>
          </div>
          <div className="button-row">
            <a href="/account" className="button-link" data-variant="primary">
              Back to account
            </a>
            <button type="button" className="button-link" data-variant="secondary" onClick={() => window.location.reload()}>
              Try again
            </button>
          </div>
        </article>
      </div>
    );
  }

  return (
    <article className="route-card account-action-panel" role="status" aria-live="polite">
      <div className="subsection-heading">
        <span className="eyebrow">Opening workspace</span>
        <h2 className="section-title">Preparing your admin area</h2>
        <p className="section-copy">
          We are securely connecting your product account to your hub admin workspace.
        </p>
      </div>
      <div className="skeleton-text" aria-hidden="true">
        <span className="skeleton-block skeleton-text-line" />
        <span className="skeleton-block skeleton-text-line" data-line="2" />
        <span className="skeleton-block skeleton-text-line" data-line="3" />
      </div>
    </article>
  );
}
