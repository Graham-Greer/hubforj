import { getPackagePricingForTierAndCurrency, resolvePackagePricingSelection } from "./package-pricing.js";

const productSiteBillingLocale = "en-GB";

const packageCatalogDefinition = [
  {
    tier: "free",
    title: "Free",
    audience: "For communities launching their first professional online presence.",
    summary: "A strong starting point for getting your community online.",
    ctaLabel: "Start free",
    featureHighlights: [
      "Professional website and admin area",
      "Community pages, events, and testimonials",
      "Up to 30 active members",
      "Free memberships and event management",
      "A clear starting point before you add paid offers",
    ],
  },
  {
    tier: "starter",
    title: "Starter",
    audience: "For communities ready to turn demand into revenue.",
    summary: "Start selling memberships, events, and courses with a simple setup.",
    ctaLabel: "Choose Starter",
    featured: true,
    featureHighlights: [
      "Everything in Free plus...",
      "Up to 200 active members",
      "Offer courses in addition to events",
      "Monetise your memberships, events, and courses",
      "Flexible payment options for your members",
      "A cleaner path from audience growth into monetisation",
    ],
  },
  {
    tier: "growth",
    title: "Growth",
    audience: "For communities ready for a more premium, integrated experience.",
    summary: "Unlock deeper control, built-in payments, and a stronger setup for growth.",
    ctaLabel: "Upgrade to Growth",
    featureHighlights: [
      "Everything in Starter plus...",
      "Native platform payments",
      "Use your custom domain",
      "Stronger brand control",
      "Unlimited active members",
      "Smoother payment process for your members",
      "Reporting and premium package capability",
      "Simpler experience for your admin team",
    ],
  },
];

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeTier(value) {
  return normalizeString(value).toLowerCase();
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

function getPackageStatusLabel(status, fallback = "Ready") {
  const normalizedStatus = normalizeTier(status);

  return (
    {
      active: "Active",
      trialing: "Trial in progress",
      past_due: "Payment issue",
      cancelled: "Cancelled",
      canceled: "Cancelled",
    }[normalizedStatus] || formatLabel(status, fallback)
  );
}

function buildPackageCatalogItem(definition, currency) {
  const pricing = getPackagePricingForTierAndCurrency(definition.tier, currency);

  return {
    ...definition,
    priceLabel: pricing.display,
    priceCurrency: pricing.currency,
    priceUnitAmount: pricing.unitAmount,
    priceInterval: pricing.interval,
  };
}

export function getPackageCatalog({ country = "", currency = "" } = {}) {
  void country;
  const selection = resolvePackagePricingSelection({
    tier: "starter",
    currency,
  });

  return packageCatalogDefinition.map((item) => buildPackageCatalogItem(item, selection.currency));
}

export function getPackageCatalogItem(tier, { country = "", currency = "" } = {}) {
  void country;
  const normalizedTier = normalizeTier(tier);
  const definition =
    packageCatalogDefinition.find((item) => item.tier === normalizedTier)
    || packageCatalogDefinition[0];
  const selection = resolvePackagePricingSelection({
    tier: definition.tier,
    currency,
  });

  return buildPackageCatalogItem(definition, selection.currency);
}

export function getCommercialPackageIntent({ account, currentTier = "free" } = {}) {
  const pendingTier = normalizeTier(account?.pendingPackageTier);
  const pendingStatus = normalizeTier(account?.pendingPackageStatus);
  const normalizedCurrentTier = normalizeTier(currentTier) || "free";

  if (!pendingTier || pendingTier === normalizedCurrentTier || !["starter", "growth"].includes(pendingTier)) {
    return {
      hasPendingPackageIntent: false,
      pendingPackage: null,
      pendingStatus: "",
    };
  }

  return {
    hasPendingPackageIntent: true,
    pendingPackage: getPackageCatalogItem(pendingTier, {
      currency: account?.pendingPackageCurrency || account?.packageCurrency || "",
    }),
    pendingStatus,
  };
}

export function buildCommercialPackageSnapshot({
  account,
  currentTier = "starter",
  status = "Ready",
  source = "Product site",
  checkoutState = null,
  locale = productSiteBillingLocale,
  currency = "",
} = {}) {
  const currentPackageCurrency = normalizeString(account?.packageCurrency) || normalizeString(currency);
  const currentPackage = getPackageCatalogItem(currentTier, { currency: currentPackageCurrency });
  const tierIndex = packageCatalogDefinition.findIndex((item) => item.tier === currentPackage.tier);
  const nextPackageDefinition = packageCatalogDefinition[tierIndex + 1] || null;
  const nextPackage = nextPackageDefinition
    ? getPackageCatalogItem(nextPackageDefinition.tier, { currency: currentPackage.priceCurrency })
    : null;
  const { hasPendingPackageIntent, pendingPackage, pendingStatus } = getCommercialPackageIntent({
    account,
    currentTier: currentPackage.tier,
  });
  const scheduledPackageEffectiveAt = normalizeString(account?.pendingPackageEffectiveAt);
  const scheduledCancellationDate =
    pendingStatus === "scheduled_downgrade"
      ? scheduledPackageEffectiveAt || normalizeString(account?.stripeCurrentPeriodEnd)
      : normalizeString(account?.stripeCancelAt) || normalizeString(account?.stripeCurrentPeriodEnd);
  const scheduledDateLabel = formatDateLabel(scheduledCancellationDate, locale);
  const hasScheduledCancellation =
    currentPackage.tier !== "free" &&
    pendingStatus !== "scheduled_downgrade" &&
    (account?.stripeCancelAtPeriodEnd === true || Boolean(scheduledCancellationDate));

  const statusLabel = hasPendingPackageIntent
    ? pendingStatus === "scheduled_downgrade"
      ? `${pendingPackage.title} scheduled`
      : checkoutState?.status === "open" && checkoutState?.paymentStatus === "unpaid"
      ? `${pendingPackage.title} payment not completed`
      : checkoutState?.status === "expired"
        ? `${pendingPackage.title} checkout expired`
        : checkoutState?.status === "complete" && checkoutState?.paymentStatus === "paid"
          ? `${pendingPackage.title} payment received`
          : pendingStatus === "checkout_setup_failed"
            ? `${pendingPackage.title} checkout needs attention`
            : `${pendingPackage.title} selected`
    : hasScheduledCancellation
      ? "Cancellation scheduled"
      : getPackageStatusLabel(status, "Ready");
  const summary = hasPendingPackageIntent
    ? pendingStatus === "scheduled_downgrade"
      ? scheduledDateLabel
        ? `${currentPackage.title} stays active until ${scheduledDateLabel}. ${pendingPackage.title} is scheduled to start on that date.`
        : `${currentPackage.title} stays active until the end of the current billing period. ${pendingPackage.title} is scheduled to start after that.`
      : checkoutState?.status === "open" && checkoutState?.paymentStatus === "unpaid"
      ? `Your last checkout attempt for ${pendingPackage.title} did not complete. ${currentPackage.title} stays active until payment succeeds.`
      : checkoutState?.status === "expired"
        ? `Your checkout for ${pendingPackage.title} expired before payment was completed. ${currentPackage.title} stays active until you start checkout again.`
        : checkoutState?.status === "complete" && checkoutState?.paymentStatus === "paid"
          ? `Payment for ${pendingPackage.title} has been received. ${currentPackage.title} stays active only until the package sync finishes.`
          : `${pendingPackage.title} has been selected for this workspace and will go live once checkout and payment confirmation are complete. ${currentPackage.title} stays active until then.`
    : hasScheduledCancellation
      ? scheduledDateLabel
        ? `${currentPackage.title} is still live, but it is scheduled to end on ${scheduledDateLabel}.`
        : `${currentPackage.title} is still live, but it is scheduled to end at the close of the current billing period.`
    : currentPackage.summary;
  const nextAction = hasPendingPackageIntent
    ? pendingStatus === "scheduled_downgrade"
      ? scheduledDateLabel
        ? `Your current package remains live until ${scheduledDateLabel}. Review billing if you need to change or cancel the scheduled move to ${pendingPackage.title}.`
        : `Your current package remains live until renewal. Review billing if you need to change or cancel the scheduled move to ${pendingPackage.title}.`
      : checkoutState?.status === "open" && checkoutState?.paymentStatus === "unpaid"
      ? `Return to secure checkout to complete payment for ${pendingPackage.title}.`
      : checkoutState?.status === "expired"
        ? `Restart secure checkout to activate ${pendingPackage.title}.`
        : checkoutState?.status === "complete" && checkoutState?.paymentStatus === "paid"
          ? "Give the package a moment to sync, then refresh your account if needed."
          : pendingStatus === "checkout_setup_failed"
            ? `Return to checkout to finish activating ${pendingPackage.title}.`
            : `Complete checkout to activate ${pendingPackage.title} for this workspace.`
    : hasScheduledCancellation
      ? scheduledDateLabel
        ? `Open billing before ${scheduledDateLabel} if you want to keep this paid package running or move to a different package.`
        : "Open billing if you want to keep this paid package running or move to a different package before it ends."
    : currentPackage.tier === "growth"
      ? "You are already on the most complete package. Use billing to manage your plan and payment method."
      : `When you are ready, move up to ${nextPackage?.title || "the next package"} for more ways to sell and more control over the experience.`;

  return {
    currentTier: currentPackage.tier,
    currentTitle: currentPackage.title,
    currentDisplayTitle: hasPendingPackageIntent ? `${currentPackage.title} live now` : currentPackage.title,
    currentPriceLabel: currentPackage.priceLabel,
    currentPriceCurrency: currentPackage.priceCurrency,
    status: statusLabel,
    source: formatLabel(source, "Product site"),
    audience: currentPackage.audience,
    summary,
    featureHighlights: currentPackage.featureHighlights,
    hasPendingPackageIntent,
    pendingPackageTier: pendingPackage?.tier || "",
    pendingPackageTitle: pendingPackage?.title || "",
    pendingPackagePriceLabel: pendingPackage?.priceLabel || "",
    pendingPackagePriceCurrency: pendingPackage?.priceCurrency || "",
    pendingPackageStatus: pendingStatus,
    hasScheduledCancellation,
    scheduledCancellationDate,
    nextPackage,
    nextAction,
  };
}

export function buildCommercialAccountModel({
  account,
  currentTier = "starter",
  status = "Ready",
  source = "Product site",
  checkoutState = null,
  locale = productSiteBillingLocale,
  currency = "",
} = {}) {
  const snapshot = buildCommercialPackageSnapshot({
    account,
    currentTier,
    status,
    source,
    checkoutState,
    locale,
    currency,
  });
  const packages = getPackageCatalog({ currency: snapshot.currentPriceCurrency });
  const currentIndex = packages.findIndex((item) => item.tier === snapshot.currentTier);
  const upgradeOptions = packages.slice(currentIndex + 1);
  const downgradeOptions = packages.slice(0, currentIndex);

  return {
    snapshot,
    packages,
    upgradeOptions,
    downgradeOptions,
    billing: {
      status: snapshot.currentTier === "free" ? "No active subscription" : "Billing managed in account",
      summary:
        snapshot.currentTier === "free"
          ? "You are on the free package, so there is no active subscription to manage."
          : "Use billing to manage your subscription, payment method, and plan changes.",
      nextStep:
        snapshot.currentTier === "free"
          ? "Upgrade when you are ready to start charging or remove package limits."
          : "Open billing to manage invoices, payment methods, and plan changes.",
    },
  };
}
