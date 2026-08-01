import AccountShell from "@/components/patterns/account-shell/AccountShell";
import {
  AccountStatusBanner,
} from "@/components/patterns/account-surfaces/AccountSurfaces";
import Link from "next/link";
import { buildCommercialBillingModel } from "@/lib/domain/commercial-billing";
import { buildCommercialAccountModel, getPackageCatalogItem } from "@/lib/domain/package-catalog";
import { getLatestCommercialCheckoutState } from "@/lib/server/commercial-billing";
import { requireCommercialAccountContext } from "@/lib/server/commercial-account-context";
import { getStripeBillingEnvironmentState } from "@/lib/server/stripe";
import { cancelScheduledPackageChangeFromBillingAction, openBillingPortalAction } from "./actions";
import BillingRouteStateNotice from "./BillingRouteStateNotice";
import PackageChangeConfirmAction from "../upgrade/PackageChangeConfirmAction";

const productSiteBillingLocale = "en-GB";

function normalizeString(value) {
  return String(value || "").trim();
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

function buildCancelScheduledChangeConfirmation({ snapshot, billing, scheduledDateLabel }) {
  const targetTitle = snapshot.pendingPackageTitle || "Free";
  const targetPriceLabel =
    snapshot.pendingPackagePriceLabel
    || getPackageCatalogItem("free", { currency: snapshot.currentPriceCurrency }).priceLabel;

  return {
    eyebrow: "Confirm cancellation",
    currentLabel: "Current package",
    currentTitle: snapshot.currentTitle,
    currentPriceLabel: snapshot.currentPriceLabel,
    targetLabel: billing.hasScheduledCancellation ? "Scheduled move" : "Scheduled package",
    targetTitle,
    targetPriceLabel,
    title: "Cancel this scheduled change",
    description: billing.hasScheduledCancellation
      ? `You are removing the scheduled move from ${snapshot.currentTitle} to Free.`
      : `You are removing the scheduled move from ${snapshot.currentTitle} to ${targetTitle}.`,
    effectiveTiming: "Immediately",
    note: scheduledDateLabel
      ? `${snapshot.currentTitle} will stay active, and the scheduled change on ${scheduledDateLabel} will be removed.`
      : `${snapshot.currentTitle} will stay active, and the scheduled change will be removed.`,
    confirmLabel: "Cancel scheduled change",
  };
}

export default async function AccountBillingPage({ searchParams }) {
  const accountContext = await requireCommercialAccountContext();
  await searchParams;
  const { account, currentHub } = accountContext;
  const locale = productSiteBillingLocale;
  const stripeEnvironment = getStripeBillingEnvironmentState();
  const checkoutState = await getLatestCommercialCheckoutState({ account });
  const { snapshot } = buildCommercialAccountModel({
    account,
    currentTier: currentHub.packageTier,
    status: currentHub.packageStatus,
    source: currentHub.packageSource,
    checkoutState,
    locale,
  });
  const billing = buildCommercialBillingModel({
    account,
    currentHub,
    stripeEnvironment,
    checkoutState,
  });
  const isScheduledPackageChange = snapshot.pendingPackageStatus === "scheduled_downgrade";
  const periodEndLabel = formatDateLabel(billing.scheduledEndDate || billing.currentPeriodEnd, locale);
  const cycleTimingLabel = periodEndLabel
    ? billing.hasScheduledCancellation || isScheduledPackageChange
      ? `Current paid access continues until ${periodEndLabel}.`
      : `Your current billing period renews on ${periodEndLabel}.`
    : "Your billing cycle date will appear here after the latest Stripe sync completes.";
  const billingOverviewTitle = billing.hasScheduledCancellation
    ? "Cancellation scheduled"
    : billing.requiresPaymentAction
      ? "Billing needs attention"
      : "Plan billing";
  const billingOverviewSummary = billing.hasScheduledCancellation
    ? periodEndLabel
      ? `${snapshot.currentTitle} stays active until ${periodEndLabel}. If you want to keep it running or move to another package, make that change in billing before then.`
      : `${snapshot.currentTitle} is still active, but it is scheduled to end at the close of the current billing period.`
    : periodEndLabel && !billing.requiresPaymentAction
      ? `Your ${snapshot.currentTitle} package is active and renews on ${periodEndLabel}.`
      : billing.summary;
  const topBanner = billing.requiresPaymentAction
    ? {
        title: billing.isAwaitingPayment ? "Complete your payment to activate this package" : "This package needs payment attention",
        description: billing.summary,
        tone: "warning",
        actions: (
          <>
            {billing.canOpenBillingPortal ? (
              <form action={openBillingPortalAction}>
                <button type="submit" className="button-link" data-variant="primary">
                  Open billing portal
                </button>
              </form>
            ) : null}
            <Link href="/account/upgrade" prefetch={false} className="button-link" data-variant="secondary">
              View package options
            </Link>
          </>
        ),
      }
    : !billing.canOpenBillingPortal
      ? {
          title: snapshot.hasPendingPackageIntent ? "Finish secure checkout" : "Billing is not ready on this account yet",
          description: billing.nextStep,
          tone: "attention",
          actions: (
            <>
              <Link
                href={
                  snapshot.hasPendingPackageIntent
                    ? `/account/upgrade?tier=${encodeURIComponent(snapshot.pendingPackageTier)}`
                    : "/account/upgrade"
                }
                prefetch={false}
                className="button-link"
                data-variant="primary"
              >
                {snapshot.hasPendingPackageIntent ? "Continue secure checkout" : "Review paid packages"}
              </Link>
              <Link href="/account/package" prefetch={false} className="button-link" data-variant="secondary">
                View package details
              </Link>
            </>
          ),
        }
      : null;
  const cancelScheduledChangeConfirmation =
    isScheduledPackageChange || billing.hasScheduledCancellation
      ? buildCancelScheduledChangeConfirmation({
          snapshot,
          billing,
          scheduledDateLabel: periodEndLabel,
        })
      : null;

  return (
    <AccountShell
      accountContext={accountContext}
      eyebrow="Billing"
      title="Billing"
      description="Manage your plan payments here. Member payments inside your community stay in your admin area."
    >
      <div className="content-stack">
        <BillingRouteStateNotice />
        {topBanner ? (
          <AccountStatusBanner
            title={topBanner.title}
            description={topBanner.description}
            tone={topBanner.tone}
            actions={topBanner.actions}
          />
        ) : null}
        <section className="account-workspace-layout">
          <div className="account-workspace-main">
            <article className="route-card account-focus-panel">
              <div className="account-focus-panel__header">
                <div>
                  <span className="eyebrow">Billing</span>
                  <h2>{billingOverviewTitle}</h2>
                </div>
              </div>
              <p className="account-focus-panel__lede">{billingOverviewSummary}</p>
              <div className="status-row account-focus-panel__status">
                <span className="status-chip" data-tone="accent">
                  {snapshot.currentTitle}
                </span>
                <span className="status-chip">{billing.status}</span>
                {billing.hasScheduledCancellation ? <span className="status-chip">Cancellation scheduled</span> : null}
              </div>
              <div className="account-metric-strip">
                <div className="account-metric-item">
                  <span className="stat-label">Current package</span>
                  <strong>{snapshot.currentTitle}</strong>
                  <span>{snapshot.currentPriceLabel}/month</span>
                </div>
                <div className="account-metric-item">
                  <span className="stat-label">Billing provider</span>
                  <strong>{billing.providerLabel}</strong>
                  <span>{billing.canOpenBillingPortal ? "Ready for invoices and payment method changes." : "Waiting for checkout or billing setup."}</span>
                </div>
                <div className="account-metric-item">
                  <span className="stat-label">{isScheduledPackageChange ? "Scheduled change" : "Next step"}</span>
                  <strong>{isScheduledPackageChange ? periodEndLabel ? `${snapshot.pendingPackageTitle} on ${periodEndLabel}` : `${snapshot.pendingPackageTitle} at renewal` : billing.requiresPaymentAction ? "Resolve billing" : "Manage plan"}</strong>
                  <span>{isScheduledPackageChange ? periodEndLabel ? `${snapshot.currentTitle} remains active until ${periodEndLabel}.` : `${snapshot.currentTitle} remains active until the current billing period ends.` : billing.nextStep}</span>
                </div>
              </div>
              <div className="button-row">
                {isScheduledPackageChange || billing.hasScheduledCancellation ? (
                  <PackageChangeConfirmAction
                    action={cancelScheduledPackageChangeFromBillingAction}
                    targetTier={snapshot.pendingPackageTier || snapshot.currentTier}
                    triggerLabel="Cancel scheduled change"
                    {...cancelScheduledChangeConfirmation}
                  />
                ) : billing.canOpenBillingPortal ? (
                  <form action={openBillingPortalAction}>
                    <button type="submit" className="button-link" data-variant="primary">
                      Open billing portal
                    </button>
                  </form>
                ) : null}
                <Link href="/account/package" prefetch={false} className="button-link" data-variant="secondary">
                  View package details
                </Link>
              </div>
            </article>
          </div>
          <aside className="account-workspace-side">
            <article className="route-card account-side-panel">
              <h2>Billing snapshot</h2>
              <div className="account-side-list">
                <div>
                  <span>Current package</span>
                  <strong>{snapshot.currentTitle}</strong>
                </div>
                <div>
                  <span>Current monthly price</span>
                  <strong>{snapshot.currentPriceLabel}/month</strong>
                </div>
                <div>
                  <span>Current status</span>
                  <strong>{billing.status}</strong>
                </div>
                <div>
                  <span>Billing cycle</span>
                  <strong>{cycleTimingLabel}</strong>
                </div>
                {isScheduledPackageChange ? (
                  <div>
                    <span>Scheduled package</span>
                    <strong>{periodEndLabel ? `${snapshot.pendingPackageTitle} on ${periodEndLabel}` : `${snapshot.pendingPackageTitle} at renewal`}</strong>
                  </div>
                ) : null}
                {billing.hasScheduledCancellation ? (
                  <div>
                    <span>Plan ending</span>
                    <strong>{periodEndLabel ? `Ends on ${periodEndLabel}` : "Ends at the close of the current billing period"}</strong>
                  </div>
                ) : null}
              </div>
            </article>
          </aside>
        </section>
      </div>
    </AccountShell>
  );
}
