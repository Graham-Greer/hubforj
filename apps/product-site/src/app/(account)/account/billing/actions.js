"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { cancelScheduledStripePackageChange, createStripeBillingPortalForAccount } from "@/lib/server/commercial-billing";
import { requireCommercialAccountContext } from "@/lib/server/commercial-account-context";

function normalizeString(value) {
  return String(value || "").trim().toLowerCase();
}

export async function openBillingPortalAction() {
  const accountContext = await requireCommercialAccountContext();
  const { account, currentHub } = accountContext;

  try {
    const session = await createStripeBillingPortalForAccount({
      account,
      currentHub,
      returnPath: "/account/billing?state=portal-returned",
    });

    redirect(session.url || "/account/billing?state=portal-error");
  } catch (error) {
    unstable_rethrow(error);
    const message = normalizeString(error?.message);
    const stateKey =
      message.includes("not configured")
        ? "billing-not-configured"
        : message.includes("no stripe customer")
          ? "billing-not-started"
          : "portal-error";

    redirect(`/account/billing?state=${encodeURIComponent(stateKey)}`);
  }
}

export async function cancelScheduledPackageChangeFromBillingAction() {
  const accountContext = await requireCommercialAccountContext();
  const { account, currentHub } = accountContext;

  try {
    await cancelScheduledStripePackageChange({
      account,
      currentHub,
    });

    redirect("/account/billing?state=scheduled-change-cancelled");
  } catch (error) {
    unstable_rethrow(error);
    const message = normalizeString(error?.message);
    const stateKey =
      message.includes("not configured")
        ? "billing-not-configured"
        : message.includes("no live stripe subscription")
          ? "billing-not-started"
          : "error";

    redirect(`/account/billing?state=${encodeURIComponent(stateKey)}`);
  }
}
