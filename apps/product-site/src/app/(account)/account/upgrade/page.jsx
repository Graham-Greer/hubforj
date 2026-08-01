import AccountShell from "@/components/patterns/account-shell/AccountShell";
import Link from "next/link";
import PackageCatalog from "@/components/patterns/package-catalog/PackageCatalog";
import {
  AccountActionPanel,
  AccountStatusBanner,
} from "@/components/patterns/account-surfaces/AccountSurfaces";
import { buildCommercialBillingModel, buildCommercialPackageChangeModel } from "@/lib/domain/commercial-billing";
import { getPackageCatalogItem, buildCommercialAccountModel } from "@/lib/domain/package-catalog";
import { getLatestCommercialCheckoutState } from "@/lib/server/commercial-billing";
import { requireCommercialAccountContext } from "@/lib/server/commercial-account-context";
import { getStripeBillingEnvironmentState } from "@/lib/server/stripe";
import PackageChangeConfirmAction from "./PackageChangeConfirmAction";
import {
  applyPackageUpgradeAction,
  cancelScheduledPackageChangeAction,
  openPackageBillingPortalAction,
  schedulePackageDowngradeAction,
  schedulePackageTierChangeAction,
  startPackageCheckoutAction,
} from "./actions";
import UpgradeRouteStateNotice from "./UpgradeRouteStateNotice";

const productSiteBillingLocale = "en-GB";

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeTier(value) {
  return normalizeString(value).toLowerCase();
}

function formatDateLabel(value, locale = productSiteBillingLocale) {
  const normalizedValue = normalizeString(value);

  if (!normalizedValue) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(normalizedValue));
  } catch {
    return normalizedValue;
  }
}

function getSelectedTier({ requestedTier, snapshot, upgradeOptions }) {
  const normalizedRequestedTier = normalizeTier(requestedTier);

  if (normalizedRequestedTier) {
    return normalizedRequestedTier;
  }

  return upgradeOptions[0]?.tier || snapshot.currentTier;
}

function getPackageChangeConfirmation({ snapshot, selectedPackage, packageChange, locale }) {
  const scheduledDateLabel = formatDateLabel(snapshot.scheduledCancellationDate, locale);
  const base = {
    currentTitle: snapshot.currentTitle,
    currentPriceLabel: snapshot.currentPriceLabel,
    targetTitle: selectedPackage.title,
    targetPriceLabel: selectedPackage.priceLabel,
    confirmLabel: packageChange.actionLabel,
  };

  if (packageChange.actionKind === "checkout") {
    return {
      ...base,
      title: "Confirm package upgrade",
      description: `You are moving this workspace from ${snapshot.currentTitle} to ${selectedPackage.title}.`,
      effectiveTiming: "After secure checkout and payment confirmation",
      note: `${snapshot.currentTitle} stays active until checkout is completed successfully.`,
    };
  }

  if (packageChange.actionKind === "subscription_update") {
    return {
      ...base,
      title: "Confirm package change",
      description: `You are changing this workspace from ${snapshot.currentTitle} to ${selectedPackage.title}.`,
      effectiveTiming: "Immediately after the change is applied",
      note: "Stripe may apply prorated billing based on the remaining time in the current cycle.",
    };
  }

  if (packageChange.actionKind === "subscription_schedule") {
    return {
      ...base,
      title: "Confirm scheduled package change",
      description: `You are scheduling this workspace to move from ${snapshot.currentTitle} to ${selectedPackage.title}.`,
      effectiveTiming: scheduledDateLabel ? `On ${scheduledDateLabel}` : "At the end of the current billing period",
      note: scheduledDateLabel
        ? `${snapshot.currentTitle} stays active until ${scheduledDateLabel}, then ${selectedPackage.title} becomes active.`
        : `${snapshot.currentTitle} stays active until renewal, then ${selectedPackage.title} becomes active.`,
    };
  }

  if (packageChange.actionKind === "subscription_cancel") {
    return {
      ...base,
      title: "Confirm move to Free",
      description: `You are scheduling this workspace to move from ${snapshot.currentTitle} to Free.`,
      effectiveTiming: scheduledDateLabel ? `On ${scheduledDateLabel}` : "At the end of the current billing period",
      note: scheduledDateLabel
        ? `${snapshot.currentTitle} stays active until ${scheduledDateLabel}, then the workspace moves to Free.`
        : `${snapshot.currentTitle} stays active until renewal, then the workspace moves to Free.`,
    };
  }

  return null;
}

function getScheduledChangeCancellationConfirmation({ snapshot, selectedPackage, locale }) {
  const scheduledDateLabel = formatDateLabel(snapshot.scheduledCancellationDate, locale);
  const targetTitle = snapshot.pendingPackageTitle || selectedPackage?.title || "Scheduled package";
  const fallbackPriceLabel = getPackageCatalogItem("free", {
    currency: snapshot.currentPriceCurrency,
  }).priceLabel;
  const targetPriceLabel = snapshot.pendingPackagePriceLabel || selectedPackage?.priceLabel || fallbackPriceLabel;

  return {
    eyebrow: "Confirm cancellation",
    currentLabel: "Current package",
    currentTitle: snapshot.currentTitle,
    currentPriceLabel: snapshot.currentPriceLabel,
    targetLabel: "Scheduled package",
    targetTitle,
    targetPriceLabel,
    title: "Cancel this scheduled change",
    description: `You are removing the scheduled move from ${snapshot.currentTitle} to ${targetTitle}.`,
    effectiveTiming: "Immediately",
    note: scheduledDateLabel
      ? `${snapshot.currentTitle} will stay active, and the scheduled move on ${scheduledDateLabel} will be removed.`
      : `${snapshot.currentTitle} will stay active, and the scheduled move will be removed.`,
    confirmLabel: "Cancel scheduled change",
  };
}

export default async function AccountUpgradePage({ searchParams }) {
  const accountContext = await requireCommercialAccountContext();
  const params = await searchParams;
  const { account, currentHub } = accountContext;
  const locale = productSiteBillingLocale;
  const checkoutState = await getLatestCommercialCheckoutState({ account });
  const { snapshot, packages, upgradeOptions } = buildCommercialAccountModel({
    account,
    currentTier: currentHub.packageTier,
    status: currentHub.packageStatus,
    source: currentHub.packageSource,
    checkoutState,
    locale,
  });
  const stripeEnvironment = getStripeBillingEnvironmentState();
  const billing = buildCommercialBillingModel({
    account,
    currentHub,
    stripeEnvironment,
    checkoutState,
  });
  const selectedTier = getSelectedTier({
    requestedTier: params?.tier,
    snapshot,
    upgradeOptions,
  });
  const selectedPackage = getPackageCatalogItem(selectedTier, { currency: snapshot.currentPriceCurrency });
  const packageChange = buildCommercialPackageChangeModel({
    account,
    currentHub,
    targetTier: selectedPackage.tier,
    stripeEnvironment,
  });
  const isScheduledPackageChange = snapshot.pendingPackageStatus === "scheduled_downgrade";
  const scheduledDateLabel = formatDateLabel(snapshot.scheduledCancellationDate, locale);
  const packageChangeConfirmation = getPackageChangeConfirmation({
    snapshot,
    selectedPackage,
    packageChange,
    locale,
  });
  const cancelScheduledChangeConfirmation = getScheduledChangeCancellationConfirmation({
    snapshot,
    selectedPackage,
    locale,
  });

  return (
    <AccountShell
      accountContext={accountContext}
      eyebrow="Upgrade"
      title="Upgrade or change package"
      description="Review your options, then upgrade directly here or use billing for subscription management when needed."
    >
      <div className="content-stack">
        <UpgradeRouteStateNotice />
        {billing.requiresPaymentAction ? (
          <AccountStatusBanner
            title={billing.isAwaitingPayment ? "Complete payment before changing package again" : "Fix payment before changing package again"}
            description={billing.nextStep}
            tone="warning"
            actions={
              <>
                <Link href="/account/billing" prefetch={false} className="button-link" data-variant="primary">
                  Open billing
                </Link>
                <Link href="/account/package" prefetch={false} className="button-link" data-variant="secondary">
                  View package details
                </Link>
              </>
            }
          />
        ) : null}
        <AccountActionPanel
          title="Selected package"
          description={selectedPackage.summary}
          chips={[
            <span key="selected-tier" className="status-chip" data-tone="accent">
              {selectedPackage.title}
            </span>,
            <span key="selected-price" className="status-chip">{selectedPackage.priceLabel}/month</span>,
            <span key="selected-action" className="status-chip">{packageChange.actionLabel}</span>,
          ]}
        >
          <div className="detail-grid">
            <div className="detail-block">
              <h3>Included</h3>
              <ul className="detail-list">
                {selectedPackage.featureHighlights.map((feature) => (
                  <li key={feature}>
                    <span className="material-symbols-outlined" aria-hidden="true">
                      check_circle
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="detail-block detail-block--flow">
              <h3>Next step</h3>
              <p>{packageChange.description}</p>
            </div>
          </div>
          {packageChange.actionKind === "checkout" ? (
            <div className="button-row">
              <PackageChangeConfirmAction
                action={startPackageCheckoutAction}
                targetTier={selectedPackage.tier}
                {...packageChangeConfirmation}
                triggerLabel={packageChange.actionLabel}
              />
            </div>
          ) : null}
          {packageChange.actionKind === "subscription_update" ? (
            <div className="button-row">
              <PackageChangeConfirmAction
                action={applyPackageUpgradeAction}
                targetTier={selectedPackage.tier}
                {...packageChangeConfirmation}
                triggerLabel={packageChange.actionLabel}
              />
              <Link href="/account/billing" prefetch={false} className="button-link" data-variant="secondary">
                View billing
              </Link>
            </div>
          ) : null}
          {packageChange.actionKind === "billing_portal" ? (
            <form action={openPackageBillingPortalAction}>
              <input type="hidden" name="targetTier" value={selectedPackage.tier} />
              <div className="button-row">
                <button type="submit" className="button-link" data-variant="primary">
                  {packageChange.actionLabel}
                </button>
                <Link href="/account/billing" prefetch={false} className="button-link" data-variant="secondary">
                  View billing
                </Link>
              </div>
            </form>
          ) : null}
          {packageChange.actionKind === "subscription_cancel" ? (
            <div className="button-row">
              <PackageChangeConfirmAction
                action={schedulePackageDowngradeAction}
                targetTier={selectedPackage.tier}
                {...packageChangeConfirmation}
                triggerLabel={packageChange.actionLabel}
              />
              <Link href="/account/billing" prefetch={false} className="button-link" data-variant="secondary">
                View billing
              </Link>
            </div>
          ) : null}
          {packageChange.actionKind === "subscription_schedule" ? (
            <div className="button-row">
              <PackageChangeConfirmAction
                action={schedulePackageTierChangeAction}
                targetTier={selectedPackage.tier}
                {...packageChangeConfirmation}
                triggerLabel={packageChange.actionLabel}
              />
              <Link href="/account/billing" prefetch={false} className="button-link" data-variant="secondary">
                View billing
              </Link>
            </div>
          ) : null}
          {packageChange.actionKind === "current" ? (
            <div className="button-row">
              <Link href="/account/package" prefetch={false} className="button-link" data-variant="secondary">
                View package details
              </Link>
            </div>
          ) : null}
          {packageChange.actionKind === "scheduled" ? (
            <div className="button-row">
              <PackageChangeConfirmAction
                action={cancelScheduledPackageChangeAction}
                targetTier={selectedPackage.tier}
                triggerLabel="Cancel scheduled change"
                {...cancelScheduledChangeConfirmation}
              />
              <Link href="/account/package" prefetch={false} className="button-link" data-variant="secondary">
                View package details
              </Link>
            </div>
          ) : null}
          {packageChange.actionKind === "unavailable" ? (
            <div className="button-row">
              <Link href="/account/billing" prefetch={false} className="button-link" data-variant="secondary">
                View billing status
              </Link>
            </div>
          ) : null}
        </AccountActionPanel>
        <AccountActionPanel
          title="Your current position"
          description={
            snapshot.hasPendingPackageIntent
              ? isScheduledPackageChange
                ? scheduledDateLabel
                  ? `${snapshot.pendingPackageTitle} has been scheduled for this workspace. ${snapshot.currentTitle} stays live until ${scheduledDateLabel}, then the lower package becomes active automatically. You can cancel or change this scheduled move from this page.`
                  : `${snapshot.pendingPackageTitle} has been scheduled for this workspace. ${snapshot.currentTitle} stays live until the current billing period ends, then the lower package becomes active automatically. You can cancel or change this scheduled move from this page.`
                : `${snapshot.pendingPackageTitle} has been selected for this workspace. Complete checkout to activate it while ${snapshot.currentTitle} stays live.`
              : upgradeOptions.length
                ? `Your clearest next move is ${upgradeOptions[0].title} when your community is ready for more ways to sell and a more joined-up experience.`
                : "You are already on the most complete package available."
          }
          chips={[
            <span key="current-tier" className="status-chip" data-tone="accent">
              {snapshot.currentDisplayTitle}
            </span>,
            <span key="current-price" className="status-chip">{snapshot.currentPriceLabel}/month</span>,
            <span key="billing-status" className="status-chip">{billing.status}</span>,
            snapshot.hasPendingPackageIntent ? (
              <span key="pending-tier" className="status-chip">
                {snapshot.pendingPackageTitle} {isScheduledPackageChange ? "scheduled" : "pending"}
              </span>
            ) : null,
          ]}
        />
        <PackageCatalog items={packages} mode="account" currentTier={snapshot.currentTier} />
      </div>
    </AccountShell>
  );
}
