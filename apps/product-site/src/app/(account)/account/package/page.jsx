import AccountShell from "@/components/patterns/account-shell/AccountShell";
import {
  AccountActionPanel,
} from "@/components/patterns/account-surfaces/AccountSurfaces";
import PackageCatalog from "@/components/patterns/package-catalog/PackageCatalog";
import Link from "next/link";
import { buildCommercialAccountModel } from "@/lib/domain/package-catalog";
import { getLatestCommercialCheckoutState } from "@/lib/server/commercial-billing";
import { requireCommercialAccountContext } from "@/lib/server/commercial-account-context";

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

export default async function AccountPackagePage() {
  const accountContext = await requireCommercialAccountContext();
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
  const isScheduledPackageChange = snapshot.pendingPackageStatus === "scheduled_downgrade";
  const scheduledDateLabel = formatDateLabel(snapshot.scheduledCancellationDate, locale);

  return (
    <AccountShell
      accountContext={accountContext}
      eyebrow="Package"
      title="Package"
      description="See what is included in your current package and compare it with the next options as your community grows."
    >
      <div className="content-stack">
        <AccountActionPanel
          title={snapshot.currentDisplayTitle}
          description={snapshot.summary}
          chips={[
            <span key="price" className="status-chip" data-tone="accent">
              {snapshot.currentPriceLabel}/month
            </span>,
            <span key="status" className="status-chip" data-tone="neutral">
              {snapshot.status}
            </span>,
          ]}
          actions={
            <Link
              href={snapshot.hasPendingPackageIntent ? `/account/upgrade?tier=${encodeURIComponent(snapshot.pendingPackageTier)}` : "/account/upgrade"}
              prefetch={false}
              className="button-link"
              data-variant="primary"
            >
              {snapshot.hasPendingPackageIntent
                ? isScheduledPackageChange
                  ? "Manage scheduled change"
                  : "Continue package checkout"
                : "Review package options"}
            </Link>
          }
        >
          <div className="detail-grid">
            <div className="detail-block">
              <h3>Included</h3>
              <ul className="detail-list">
                {snapshot.featureHighlights.map((feature) => (
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
              <h3>Best next action</h3>
              <p>{snapshot.hasPendingPackageIntent ? snapshot.summary : snapshot.audience}</p>
              <p>
                {isScheduledPackageChange
                  ? `Open the upgrade page to cancel or change the scheduled move to ${snapshot.pendingPackageTitle}.`
                  : snapshot.nextAction}
              </p>
            </div>
          </div>
        </AccountActionPanel>
        <PackageCatalog items={packages} mode="account" currentTier={snapshot.currentTier} />
        {upgradeOptions.length ? (
          <article className="route-card">
            <h2>{snapshot.hasPendingPackageIntent ? "Selected package" : "When to move up"}</h2>
            <p>{snapshot.hasPendingPackageIntent
              ? isScheduledPackageChange
                ? scheduledDateLabel
                  ? `${snapshot.pendingPackageTitle} has been scheduled for this workspace. ${snapshot.currentTitle} stays live until ${scheduledDateLabel}, then the lower package becomes active.`
                  : `${snapshot.pendingPackageTitle} has been scheduled for this workspace. ${snapshot.currentTitle} stays live until the current billing period ends, then the lower package becomes active.`
                : `${snapshot.pendingPackageTitle} has been selected for this workspace. Complete checkout to turn it on, while ${snapshot.currentTitle} stays live in the meantime.`
              : snapshot.currentTier === "free"
                ? `${upgradeOptions[0].title} is the right next step when you are ready to monetise your memberships, events, and courses without adding operational friction for your team.`
                : snapshot.currentTier === "starter"
                  ? `${upgradeOptions[0].title} is the right next step when you want Hubforj to automate payments for your community and members with built-in checkout, billing, and payment management.`
                  : "You are already on the highest package available, so this is where you get the fullest Hubforj platform experience."}
            </p>
            {!snapshot.hasPendingPackageIntent ? (
              <div className="button-row">
                <Link href="/account/upgrade" prefetch={false} className="button-link" data-variant="primary">
                  Review upgrade options
                </Link>
              </div>
            ) : null}
          </article>
        ) : null}
      </div>
    </AccountShell>
  );
}
