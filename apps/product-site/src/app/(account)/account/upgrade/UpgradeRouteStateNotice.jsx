"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";

function normalizeString(value) {
  return String(value || "").trim();
}

function getUpgradeStateMessage(state) {
  const normalizedState = normalizeString(state).toLowerCase();

  return (
    {
      "checkout-cancelled": "Checkout was cancelled. Your package will stay the same until payment is completed.",
      "checkout-required": "This package needs checkout because there is no active paid subscription on the workspace yet.",
      "checkout-setup-failed": "Your community was created, but we could not open checkout automatically. You can continue from this page.",
      "move-to-free-scheduled": "Your workspace will move to the Free package at the end of the current billing period.",
      "package-change-applied": "Your package change has been applied. Review the updated package details below.",
      "package-change-scheduled": "Your package change has been scheduled for the end of the current billing period.",
      "scheduled-change-cancelled": "Your scheduled package change has been cancelled. Your current package will stay in place unless you make another change.",
      "portal-returned": "You’re back from billing. Review your latest package details below.",
      "current-package": "That package is already active for the current hub.",
      "use-billing": "This account already has billing set up. Manage the change in billing instead of starting checkout again.",
      "billing-not-configured": "Checkout is not available in this environment yet.",
      "billing-not-started": "There is no paid plan linked to this account yet. Start with checkout before using billing.",
      "invalid-package": "Only paid packages can be started from this page.",
      "portal-error": "We could not open billing just now. Please try again.",
      error: "We could not start that package change just now. Please try again.",
    }[normalizedState] || ""
  );
}

function getUpgradeStateTone(state) {
  const normalizedState = normalizeString(state).toLowerCase();

  if (["portal-error", "error", "billing-not-configured", "checkout-setup-failed"].includes(normalizedState)) {
    return "danger";
  }

  if (["portal-returned", "package-change-applied", "move-to-free-scheduled", "package-change-scheduled", "scheduled-change-cancelled"].includes(normalizedState)) {
    return "success";
  }

  if (["use-billing", "billing-not-started", "invalid-package", "checkout-required"].includes(normalizedState)) {
    return "warning";
  }

  return "success";
}

export default function UpgradeRouteStateNotice() {
  const searchParams = useSearchParams();
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const state = normalizeString(searchParams.get("state") || "");
  const messageDetail = normalizeString(searchParams.get("message") || "");
  const message = useMemo(() => getUpgradeStateMessage(state), [state]);
  const tone = useMemo(() => getUpgradeStateTone(state), [state]);

  if (!isMounted || !message) {
    return null;
  }

  return (
    <div className="form-message" data-tone={tone}>
      <strong>{message}</strong>
      {messageDetail ? <div>{messageDetail}</div> : null}
    </div>
  );
}
