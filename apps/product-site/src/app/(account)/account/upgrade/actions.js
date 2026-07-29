"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { updateCommercialAccountPackageIntent } from "@/lib/data/commercial-accounts";
import { buildCommercialPackageChangeModel } from "@/lib/domain/commercial-billing";
import {
  cancelScheduledStripePackageChange,
  createStripeBillingPortalForAccount,
  createStripeCheckoutForPackageChange,
  scheduleStripeSubscriptionPackageDowngrade,
  scheduleStripeSubscriptionCancellation,
  updateStripeSubscriptionForPackageChange,
} from "@/lib/server/commercial-billing";
import { requireCommercialAccountContext } from "@/lib/server/commercial-account-context";
import { getStripeBillingEnvironmentState } from "@/lib/server/stripe";

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeTier(value) {
  return normalizeString(value).toLowerCase();
}

function buildUpgradeRedirect(targetTier, stateKey, fallback = "error", message = "") {
  const tier = normalizeTier(targetTier);
  const params = new URLSearchParams();

  if (tier) {
    params.set("tier", tier);
  }

  if (stateKey) {
    params.set("state", stateKey);
  } else {
    params.set("state", fallback);
  }

  if (message) {
    params.set("message", normalizeString(message));
  }

  return `/account/upgrade?${params.toString()}`;
}

function mapUpgradeErrorToState(error) {
  const message = normalizeString(error?.message).toLowerCase();

  if (message.includes("already active")) {
    return "current-package";
  }

  if (message.includes("no scheduled package change")) {
    return "current-package";
  }

  if (message.includes("billing portal")) {
    return "use-billing";
  }

  if (message.includes("no live stripe subscription")) {
    return "billing-not-started";
  }

  if (message.includes("not configured") || message.includes("not mapped")) {
    return "billing-not-configured";
  }

  if (message.includes("cannot be purchased")) {
    return "invalid-package";
  }

  return "error";
}

function hasScheduledPackageChange(account) {
  return (
    normalizeString(account?.pendingPackageStatus).toLowerCase() === "scheduled_downgrade" ||
    account?.stripeCancelAtPeriodEnd === true ||
    Boolean(normalizeString(account?.stripeCancelAt))
  );
}

export async function startPackageCheckoutAction(formData) {
  const accountContext = await requireCommercialAccountContext();
  const { account, currentHub } = accountContext;
  const targetTier = normalizeTier(formData.get("targetTier"));
  const stripeEnvironment = getStripeBillingEnvironmentState();
  const packageChange = buildCommercialPackageChangeModel({
    account,
    currentHub,
    targetTier,
    stripeEnvironment,
  });

  if (packageChange.actionKind !== "checkout") {
    redirect(
      buildUpgradeRedirect(
        targetTier,
        {
          current: "current-package",
          billing_portal: "use-billing",
          unavailable: "billing-not-configured",
        }[packageChange.actionKind] || "error"
      )
    );
  }

  try {
    const session = await createStripeCheckoutForPackageChange({
      account,
      currentHub,
      targetTier,
    });

    redirect(session.url || buildUpgradeRedirect(targetTier, "error"));
  } catch (error) {
    unstable_rethrow(error);
    await updateCommercialAccountPackageIntent(account.id, {
      pendingPackageTier: targetTier,
      pendingPackageStatus: "checkout_setup_failed",
      pendingPackageEffectiveAt: "",
    });
    console.error("startPackageCheckoutAction failed", {
      targetTier,
      accountId: account?.id,
      hubId: currentHub?.id,
      error: String(error?.message || error || "Unknown Stripe checkout error"),
    });
    redirect(buildUpgradeRedirect(targetTier, mapUpgradeErrorToState(error), "error", error?.message));
  }
}

export async function openPackageBillingPortalAction(formData) {
  const accountContext = await requireCommercialAccountContext();
  const { account, currentHub } = accountContext;
  const targetTier = normalizeTier(formData.get("targetTier"));

  try {
    const session = await createStripeBillingPortalForAccount({
      account,
      currentHub,
      returnPath: buildUpgradeRedirect(targetTier, "portal-returned"),
    });

    redirect(session.url || buildUpgradeRedirect(targetTier, "portal-error"));
  } catch (error) {
    unstable_rethrow(error);
    const message = normalizeString(error?.message).toLowerCase();
    const stateKey =
      message.includes("not configured")
        ? "billing-not-configured"
        : message.includes("no stripe customer")
          ? "billing-not-started"
          : "portal-error";

    console.error("openPackageBillingPortalAction failed", {
      targetTier,
      accountId: account?.id,
      hubId: currentHub?.id,
      error: String(error?.message || error || "Unknown Stripe billing portal error"),
    });
    redirect(buildUpgradeRedirect(targetTier, stateKey, "portal-error", error?.message));
  }
}

export async function applyPackageUpgradeAction(formData) {
  const accountContext = await requireCommercialAccountContext();
  const { account, currentHub } = accountContext;
  const targetTier = normalizeTier(formData.get("targetTier"));
  const stripeEnvironment = getStripeBillingEnvironmentState();
  const packageChange = buildCommercialPackageChangeModel({
    account,
    currentHub,
    targetTier,
    stripeEnvironment,
  });

  if (packageChange.actionKind !== "subscription_update") {
    redirect(
      buildUpgradeRedirect(
        targetTier,
        {
          current: "current-package",
          billing_portal: "use-billing",
          checkout: "checkout-required",
          unavailable: "billing-not-configured",
        }[packageChange.actionKind] || "error"
      )
    );
  }

  try {
    await updateStripeSubscriptionForPackageChange({
      account,
      currentHub,
      targetTier,
    });

    redirect(buildUpgradeRedirect(targetTier, "package-change-applied"));
  } catch (error) {
    unstable_rethrow(error);
    console.error("applyPackageUpgradeAction failed", {
      targetTier,
      accountId: account?.id,
      hubId: currentHub?.id,
      error: String(error?.message || error || "Unknown Stripe subscription change error"),
    });
    redirect(buildUpgradeRedirect(targetTier, mapUpgradeErrorToState(error), "error", error?.message));
  }
}

export async function schedulePackageDowngradeAction(formData) {
  const accountContext = await requireCommercialAccountContext();
  const { account, currentHub } = accountContext;
  const targetTier = normalizeTier(formData.get("targetTier"));
  const stripeEnvironment = getStripeBillingEnvironmentState();
  const packageChange = buildCommercialPackageChangeModel({
    account,
    currentHub,
    targetTier,
    stripeEnvironment,
  });

  if (packageChange.actionKind !== "subscription_cancel") {
    redirect(
      buildUpgradeRedirect(
        targetTier,
        {
          current: "current-package",
          billing_portal: "use-billing",
          checkout: "checkout-required",
          subscription_update: "package-change-applied",
          unavailable: "billing-not-configured",
        }[packageChange.actionKind] || "error"
      )
    );
  }

  try {
    await scheduleStripeSubscriptionCancellation({
      account,
      currentHub,
    });

    redirect(buildUpgradeRedirect(targetTier, "move-to-free-scheduled"));
  } catch (error) {
    unstable_rethrow(error);
    console.error("schedulePackageDowngradeAction failed", {
      targetTier,
      accountId: account?.id,
      hubId: currentHub?.id,
      error: String(error?.message || error || "Unknown Stripe cancellation scheduling error"),
    });
    redirect(buildUpgradeRedirect(targetTier, mapUpgradeErrorToState(error), "error", error?.message));
  }
}

export async function schedulePackageTierChangeAction(formData) {
  const accountContext = await requireCommercialAccountContext();
  const { account, currentHub } = accountContext;
  const targetTier = normalizeTier(formData.get("targetTier"));
  const stripeEnvironment = getStripeBillingEnvironmentState();
  const packageChange = buildCommercialPackageChangeModel({
    account,
    currentHub,
    targetTier,
    stripeEnvironment,
  });

  if (packageChange.actionKind !== "subscription_schedule") {
    redirect(
      buildUpgradeRedirect(
        targetTier,
        {
          current: "current-package",
          billing_portal: "use-billing",
          checkout: "checkout-required",
          subscription_update: "package-change-applied",
          subscription_cancel: "move-to-free-scheduled",
          unavailable: "billing-not-configured",
        }[packageChange.actionKind] || "error"
      )
    );
  }

  try {
    await scheduleStripeSubscriptionPackageDowngrade({
      account,
      currentHub,
      targetTier,
    });

    redirect(buildUpgradeRedirect(targetTier, "package-change-scheduled"));
  } catch (error) {
    unstable_rethrow(error);
    console.error("schedulePackageTierChangeAction failed", {
      targetTier,
      accountId: account?.id,
      hubId: currentHub?.id,
      error: String(error?.message || error || "Unknown Stripe scheduled package change error"),
    });
    redirect(buildUpgradeRedirect(targetTier, mapUpgradeErrorToState(error), "error", error?.message));
  }
}

export async function cancelScheduledPackageChangeAction(formData) {
  const accountContext = await requireCommercialAccountContext();
  const { account, currentHub } = accountContext;
  const targetTier = normalizeTier(formData.get("targetTier"));

  if (!hasScheduledPackageChange(account)) {
    redirect(buildUpgradeRedirect(targetTier || currentHub?.packageTier, "current-package"));
  }

  try {
    await cancelScheduledStripePackageChange({
      account,
      currentHub,
    });

    redirect(buildUpgradeRedirect(targetTier || currentHub?.packageTier, "scheduled-change-cancelled"));
  } catch (error) {
    unstable_rethrow(error);
    console.error("cancelScheduledPackageChangeAction failed", {
      targetTier,
      accountId: account?.id,
      hubId: currentHub?.id,
      error: String(error?.message || error || "Unknown scheduled package change cancellation error"),
    });
    redirect(buildUpgradeRedirect(targetTier || currentHub?.packageTier, mapUpgradeErrorToState(error), "error", error?.message));
  }
}
