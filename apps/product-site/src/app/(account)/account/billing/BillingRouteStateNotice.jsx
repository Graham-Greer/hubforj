"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";

function normalizeString(value) {
  return String(value || "").trim();
}

function getBillingStateMessage(state) {
  const normalizedState = normalizeString(state).toLowerCase();

  return (
    {
      success: "Checkout completed. Your plan details are being updated now.",
      "portal-returned": "You’re back from billing. We’ve refreshed your latest package and payment details below.",
      "scheduled-change-cancelled": "Your scheduled package change has been cancelled. Your current package will stay in place unless you make another change.",
      "billing-not-configured": "Billing is not available in this environment yet.",
      "billing-not-started": "There is no paid plan linked to this account yet. Start with checkout before using billing.",
      "portal-error": "We could not open billing just now. Please try again.",
      error: "We could not update that scheduled package change just now. Please try again.",
    }[normalizedState] || ""
  );
}

function getBillingStateTone(state) {
  const normalizedState = normalizeString(state).toLowerCase();

  if (normalizedState === "success" || normalizedState === "portal-returned" || normalizedState === "scheduled-change-cancelled") {
    return "success";
  }

  if (normalizedState === "portal-error" || normalizedState === "error") {
    return "danger";
  }

  return "warning";
}

export default function BillingRouteStateNotice() {
  const searchParams = useSearchParams();
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const state = normalizeString(searchParams.get("state") || searchParams.get("checkout") || "");
  const message = useMemo(() => getBillingStateMessage(state), [state]);
  const tone = useMemo(() => getBillingStateTone(state), [state]);

  if (!isMounted || !message) {
    return null;
  }

  return (
    <div className="form-message" data-tone={tone}>
      {message}
    </div>
  );
}
