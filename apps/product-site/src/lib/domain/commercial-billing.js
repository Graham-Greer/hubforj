import { getCommercialPackageIntent } from "@/lib/domain/package-catalog";

const productSiteBillingLocale = "en-GB";

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeBoolean(value) {
  return value === true;
}

function formatLabel(value, fallback) {
  const normalized = normalizeString(value);

  if (!normalized) {
    return fallback;
  }

  return normalized
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDateLabel(value, locale = productSiteBillingLocale) {
  const normalized = normalizeString(value);

  if (!normalized) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(normalized));
  } catch {
    return normalized;
  }
}

function getPackageTierRank(tier) {
  return (
    {
      free: 0,
      starter: 1,
      growth: 2,
    }[normalizeString(tier).toLowerCase()] || 0
  );
}

export function isPaidPackageTier(tier) {
  return ["starter", "growth"].includes(normalizeString(tier).toLowerCase());
}

function hasManageableStripeSubscription(status) {
  return ["trialing", "active", "past_due", "unpaid", "incomplete", "paused"].includes(
    normalizeStripeSubscriptionStatus(status)
  );
}

export function normalizeStripeSubscriptionStatus(value) {
  return normalizeString(value).toLowerCase();
}

export function getStripeSubscriptionStatusLabel(status) {
  const normalizedStatus = normalizeStripeSubscriptionStatus(status);

  return (
    {
      trialing: "Trial in progress",
      active: "Subscription active",
      past_due: "Payment issue",
      unpaid: "Payment issue",
      incomplete: "Awaiting payment",
      incomplete_expired: "Payment incomplete",
      canceled: "Cancelled",
      cancelled: "Cancelled",
      paused: "Paused",
    }[normalizedStatus] || "Billing not started"
  );
}

export function mapStripeSubscriptionStatusToPackageStatus(status) {
  const normalizedStatus = normalizeStripeSubscriptionStatus(status);

  if (normalizedStatus === "trialing") {
    return "trialing";
  }

  if (normalizedStatus === "active") {
    return "active";
  }

  if (["past_due", "unpaid", "incomplete", "paused"].includes(normalizedStatus)) {
    return "past_due";
  }

  return "cancelled";
}

export function buildCommercialBillingModel({ account, currentHub, stripeEnvironment, checkoutState = null } = {}) {
  const currentTier = normalizeString(currentHub?.packageTier).toLowerCase() || "free";
  const locale = productSiteBillingLocale;
  const stripeStatus = normalizeStripeSubscriptionStatus(account?.stripeSubscriptionStatus);
  const customerExists = Boolean(account?.stripeCustomerId);
  const subscriptionExists = Boolean(account?.stripeSubscriptionId);
  const stripeReady = Boolean(stripeEnvironment?.configuredForCheckout);
  const isFree = currentTier === "free";
  const { hasPendingPackageIntent, pendingPackage, pendingStatus } = getCommercialPackageIntent({
    account,
    currentTier,
  });

  let status = "Billing not started";
  let summary = "Choose a paid package when you are ready to start taking payments for your plan.";
  let nextStep = stripeReady
    ? "Upgrade to Starter or Growth when you are ready to start plan billing."
    : "Plan checkout is not available in this environment yet.";
  let requiresPaymentAction = false;
  let isAwaitingPayment = false;
  const cancelAtPeriodEnd = normalizeBoolean(account?.stripeCancelAtPeriodEnd);
  const cancelAt = normalizeString(account?.stripeCancelAt);
  const currentPeriodEnd = normalizeString(account?.stripeCurrentPeriodEnd);
  const scheduledPackageEffectiveAt = normalizeString(account?.pendingPackageEffectiveAt);
  const scheduledEndDate =
    pendingStatus === "scheduled_downgrade"
      ? scheduledPackageEffectiveAt || currentPeriodEnd
      : cancelAt || currentPeriodEnd;
  const scheduledEndLabel = formatDateLabel(scheduledEndDate, locale);
  const hasScheduledCancellation =
    !isFree &&
    pendingStatus !== "scheduled_downgrade" &&
    (cancelAtPeriodEnd || Boolean(cancelAt));

  if (subscriptionExists && stripeStatus) {
    status = getStripeSubscriptionStatusLabel(stripeStatus);

    if (stripeStatus === "active" || stripeStatus === "trialing") {
      if (hasScheduledCancellation) {
        status = "Cancellation scheduled";
        summary = scheduledEndLabel
          ? `Your paid package is still active, but it is scheduled to end on ${scheduledEndLabel}.`
          : "Your paid package is still active, but it is scheduled to end at the close of the current billing period.";
        nextStep = customerExists
          ? scheduledEndLabel
            ? `Open billing before ${scheduledEndLabel} if you want to keep the plan active, change the package, or review the cancellation timing.`
            : "Open billing if you want to keep the plan active, change the package, or review the cancellation timing."
          : "Your payment setup is still being linked to this account.";
      } else {
        summary = "Your plan is active and your payments are set up correctly.";
        nextStep = customerExists
          ? "Open billing to manage your payment method, invoices, or future plan changes."
          : "Your payment setup is still being linked to this account.";
      }
    } else if (stripeStatus === "incomplete") {
      status = "Awaiting payment";
      summary = "Your paid package has been selected, but the payment still needs to be completed.";
      nextStep = customerExists
        ? "Open billing to complete payment or update your payment details."
        : "Your payment setup needs to be reconnected before you can continue.";
      requiresPaymentAction = true;
      isAwaitingPayment = true;
    } else if (["past_due", "unpaid"].includes(stripeStatus)) {
      summary = "There is a payment issue on this plan that needs attention.";
      nextStep = customerExists
        ? "Open billing to fix the payment issue or update your payment details."
        : "Your payment setup needs to be reconnected before you can continue.";
      requiresPaymentAction = true;
    } else if (stripeStatus === "paused") {
      status = "Billing paused";
      summary = "This package is paused until billing is brought back into a healthy state.";
      nextStep = customerExists
        ? "Open billing to review the subscription and restart payments."
        : "Your payment setup needs to be reconnected before you can continue.";
      requiresPaymentAction = true;
    } else {
      summary = "This paid plan is no longer active. You can start again whenever you are ready.";
      nextStep = stripeReady
        ? "Choose a paid package again when you want to restart billing."
        : "Plan checkout is not available in this environment yet.";
    }
  } else if (hasPendingPackageIntent) {
    status =
      pendingStatus === "scheduled_downgrade"
        ? `${pendingPackage.title} scheduled`
        : checkoutState?.status === "open" && checkoutState?.paymentStatus === "unpaid"
        ? "Payment not completed"
        : checkoutState?.status === "expired"
          ? "Checkout expired"
          : pendingStatus === "checkout_setup_failed"
            ? "Checkout needs attention"
            : `${pendingPackage.title} selected`;
    summary =
      pendingStatus === "scheduled_downgrade"
        ? scheduledEndLabel
          ? `${pendingPackage.title} is scheduled for this workspace and will take effect on ${scheduledEndLabel}.`
          : `${pendingPackage.title} is scheduled for this workspace and will take effect when the current billing period ends.`
        : checkoutState?.status === "open" && checkoutState?.paymentStatus === "unpaid"
        ? `Your last checkout attempt for ${pendingPackage.title} did not complete. Your workspace is still on the free package until payment succeeds.`
        : checkoutState?.status === "expired"
          ? `Your checkout for ${pendingPackage.title} expired before payment was completed. Your workspace is still on the free package until you start checkout again.`
          : pendingStatus === "checkout_setup_failed"
            ? `${pendingPackage.title} was selected, but checkout did not open cleanly. Your workspace is still on the free package until payment is completed.`
            : `${pendingPackage.title} has been selected and is waiting for checkout or payment confirmation before it becomes active.`;
    nextStep =
      pendingStatus === "scheduled_downgrade"
        ? scheduledEndLabel
          ? `Your current paid package stays active until ${scheduledEndLabel}. Open billing if you need to review the schedule or keep the current package instead.`
          : "Your current paid package stays active until renewal. Open billing if you need to review the schedule or keep the current package instead."
        : checkoutState?.status === "open" && checkoutState?.paymentStatus === "unpaid"
        ? `Return to secure checkout to complete payment for ${pendingPackage.title}.`
        : checkoutState?.status === "expired"
          ? `Restart secure checkout to activate ${pendingPackage.title}.`
          : pendingStatus === "checkout_setup_failed"
            ? `Return to the upgrade page and restart checkout to activate ${pendingPackage.title}.`
            : `Complete checkout or give Stripe a moment to finish syncing before ${pendingPackage.title} becomes active.`;
  } else if (isFree) {
    status = "No active subscription";
    summary = "You are on the free package, so there is no paid plan to manage yet.";
  } else if (stripeReady) {
    status = "Awaiting checkout";
    summary = "This paid package has not been fully confirmed yet.";
    nextStep = "Start checkout from the upgrade page or try again if you expected billing to be live already.";
  } else {
    status = "Checkout unavailable";
    summary = "Paid plan checkout is not available in this environment yet.";
  }

  return {
    providerLabel: stripeReady ? "Secure payments ready" : "Checkout unavailable",
    status,
    summary,
    nextStep,
    requiresPaymentAction,
    isAwaitingPayment,
    customerExists,
    subscriptionExists,
    canOpenBillingPortal: stripeReady && customerExists && subscriptionExists,
    canStartCheckout: stripeReady && !subscriptionExists,
    stripeStatus,
    cancelAt,
    cancelAtPeriodEnd,
    hasScheduledCancellation,
    currentPeriodEnd,
    scheduledEndDate,
    missingConfiguration: Array.isArray(stripeEnvironment?.missingCheckout) ? stripeEnvironment.missingCheckout : [],
  };
}

export function buildCommercialPackageChangeModel({ account, currentHub, targetTier, stripeEnvironment } = {}) {
  const currentTier = normalizeString(currentHub?.packageTier).toLowerCase() || "free";
  const locale = productSiteBillingLocale;
  const normalizedTargetTier = normalizeString(targetTier).toLowerCase() || currentTier;
  const stripeReady = Boolean(stripeEnvironment?.configuredForCheckout);
  const customerExists = Boolean(account?.stripeCustomerId);
  const subscriptionExists = Boolean(account?.stripeSubscriptionId);
  const stripeStatus = normalizeStripeSubscriptionStatus(account?.stripeSubscriptionStatus);
  const hasLiveStripeSubscription = subscriptionExists && hasManageableStripeSubscription(stripeStatus);
  const isUpgrade = getPackageTierRank(normalizedTargetTier) > getPackageTierRank(currentTier);
  const isPaidToPaidChange =
    isPaidPackageTier(currentTier) &&
    isPaidPackageTier(normalizedTargetTier) &&
    normalizedTargetTier !== currentTier;
  const { hasPendingPackageIntent, pendingPackage, pendingStatus } = getCommercialPackageIntent({
    account,
    currentTier,
  });
  const hasScheduledCancellation =
    !hasPendingPackageIntent &&
    (account?.stripeCancelAtPeriodEnd === true || Boolean(normalizeString(account?.stripeCancelAt)));
  const hasScheduledPackageChange =
    pendingStatus === "scheduled_downgrade" ||
    hasScheduledCancellation;
  const scheduledDateLabel = formatDateLabel(
    normalizeString(account?.pendingPackageEffectiveAt) ||
      normalizeString(account?.stripeCancelAt) ||
      normalizeString(account?.stripeCurrentPeriodEnd),
    locale
  );

  if (normalizedTargetTier === currentTier) {
    if (hasScheduledPackageChange && isPaidPackageTier(currentTier)) {
      const scheduledTargetLabel = pendingPackage?.title || "Free";

      return {
        targetTier: normalizedTargetTier,
        currentTier,
        actionKind: "scheduled",
        actionLabel: `Keep ${formatLabel(currentTier, "current package")}`,
        title: `Keep ${formatLabel(currentTier, "your current package")} active`,
        description: scheduledDateLabel
          ? `${scheduledTargetLabel} is scheduled to replace ${formatLabel(currentTier, "your current package")} on ${scheduledDateLabel}. Cancel the scheduled change to keep ${formatLabel(currentTier, "your current package")} active.`
          : `${scheduledTargetLabel} is scheduled to replace ${formatLabel(currentTier, "your current package")} at renewal. Cancel the scheduled change to keep ${formatLabel(currentTier, "your current package")} active.`,
      };
    }

    return {
      targetTier: normalizedTargetTier,
      currentTier,
      actionKind: "current",
      actionLabel: "Current package",
      title: "This package is already active",
      description: "You are already on this package.",
    };
  }

  if (normalizedTargetTier === "free") {
    if (hasScheduledCancellation) {
      return {
        targetTier: normalizedTargetTier,
        currentTier,
        actionKind: "scheduled",
        actionLabel: scheduledDateLabel ? `Free scheduled on ${scheduledDateLabel}` : "Free scheduled",
        title: "Free is already scheduled",
        description: scheduledDateLabel
          ? `Free is already scheduled and will replace ${formatLabel(currentTier, "your current package")} on ${scheduledDateLabel}.`
          : `Free is already scheduled and will replace ${formatLabel(currentTier, "your current package")} when the current billing period ends.`,
      };
    }

    if (stripeReady && hasLiveStripeSubscription) {
      return {
        targetTier: normalizedTargetTier,
        currentTier,
        actionKind: "subscription_cancel",
        actionLabel: scheduledDateLabel ? `Move to Free on ${scheduledDateLabel}` : "Move to Free at renewal",
        title: "Schedule a move to Free",
        description:
          scheduledDateLabel
            ? `Your paid package will stay active until ${scheduledDateLabel}, then move down to Free automatically.`
            : "Your paid package will stay active for the rest of the billing period, then move down to Free automatically.",
      };
    }

    return {
      targetTier: normalizedTargetTier,
      currentTier,
      actionKind: "unavailable",
      actionLabel: "Unavailable",
      title: "No billing action is available for this change yet",
      description:
        "There is no paid plan linked to this account yet, so there is nothing to change here.",
    };
  }

  if (!isPaidPackageTier(normalizedTargetTier)) {
    return {
      targetTier: normalizedTargetTier,
      currentTier,
      actionKind: "unavailable",
      actionLabel: "Unavailable",
      title: "This package cannot be selected",
      description: "Only Starter and Growth can be selected here.",
    };
  }

  if (!stripeReady) {
    return {
      targetTier: normalizedTargetTier,
      currentTier,
      actionKind: "unavailable",
      actionLabel: "Billing not configured",
      title: "Checkout is not available in this environment",
      description: "Paid plan checkout is not available here right now.",
    };
  }

  if (hasPendingPackageIntent && normalizedTargetTier === pendingPackage?.tier) {
    return {
      targetTier: normalizedTargetTier,
      currentTier,
      actionKind: pendingStatus === "scheduled_downgrade" ? "scheduled" : "checkout",
      actionLabel:
        pendingStatus === "scheduled_downgrade"
          ? `${formatLabel(normalizedTargetTier, "selected package")} scheduled`
          : pendingStatus === "checkout_setup_failed"
            ? "Restart secure checkout"
            : "Continue secure checkout",
      title:
        pendingStatus === "scheduled_downgrade"
          ? `${pendingPackage.title} is scheduled for renewal`
          : `${pendingPackage.title} is waiting to be activated`,
      description:
        pendingStatus === "scheduled_downgrade"
          ? scheduledDateLabel
            ? `${pendingPackage.title} is scheduled and will replace ${formatLabel(currentTier, "your current package")} on ${scheduledDateLabel}.`
            : `${pendingPackage.title} is scheduled and will replace ${formatLabel(currentTier, "your current package")} when the current billing period ends.`
          : pendingStatus === "checkout_setup_failed"
          ? `${pendingPackage.title} is still pending on this workspace. Restart checkout to finish turning it on.`
          : `${pendingPackage.title} is selected for this workspace. Complete checkout to make it live.`,
    };
  }

  if (hasLiveStripeSubscription || (customerExists && currentTier !== "free")) {
    if (isPaidToPaidChange) {
      if (!isUpgrade) {
        return {
          targetTier: normalizedTargetTier,
          currentTier,
          actionKind: "subscription_schedule",
          actionLabel: scheduledDateLabel
            ? `Move to ${formatLabel(normalizedTargetTier, "selected package")} on ${scheduledDateLabel}`
            : `Move to ${formatLabel(normalizedTargetTier, "selected package")} at renewal`,
          title: "Schedule this package change",
          description:
            scheduledDateLabel
              ? `Your current paid package stays active until ${scheduledDateLabel}. The lower paid package starts automatically on that date.`
              : "Your current paid package stays active for the rest of the billing cycle. The lower paid package starts automatically on the renewal date.",
        };
      }

      return {
        targetTier: normalizedTargetTier,
        currentTier,
        actionKind: "subscription_update",
        actionLabel: `${isUpgrade ? "Upgrade" : "Move"} to ${formatLabel(normalizedTargetTier, "selected package")}`,
        title: `${isUpgrade ? "Upgrade" : "Change"} this paid package now`,
        description:
          "Your workspace already has a paid plan, so this package change can be applied directly here without sending you into Stripe billing to find the right option.",
      };
    }

    return {
      targetTier: normalizedTargetTier,
      currentTier,
      actionKind: "billing_portal",
      actionLabel: "Manage billing",
      title: "Change this package in billing",
      description:
        "You already have a paid plan, so package changes should be made in billing rather than starting a second checkout.",
    };
  }

  return {
    targetTier: normalizedTargetTier,
    currentTier,
    actionKind: "checkout",
    actionLabel: "Start secure checkout",
    title: "Start package checkout",
    description: "Checkout will start your paid plan for this community.",
  };
}
