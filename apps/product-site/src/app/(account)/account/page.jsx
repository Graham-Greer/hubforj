import AccountShell from "@/components/patterns/account-shell/AccountShell";
import {
  AccountStatusBanner,
} from "@/components/patterns/account-surfaces/AccountSurfaces";
import Link from "next/link";
import { buildCommercialAccountModel } from "@/lib/domain/package-catalog";
import { buildCommercialBillingModel } from "@/lib/domain/commercial-billing";
import { requireCommercialAccountContext } from "@/lib/server/commercial-account-context";
import { getStripeBillingEnvironmentState } from "@/lib/server/stripe";
import { getLatestCommercialCheckoutState } from "@/lib/server/commercial-billing";
import { activateHubAdminAccessAction, resendCommercialAccountVerificationEmailAction } from "./actions";

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

export default async function AccountOverviewPage({ searchParams }) {
  const accountContext = await requireCommercialAccountContext();
  const params = await searchParams;
  const verification = String(params?.verification || "");
  const adminActivation = String(params?.adminActivation || "");
  const { account } = accountContext;
  const { currentHub } = accountContext;
  const locale = productSiteBillingLocale;
  const checkoutState = await getLatestCommercialCheckoutState({ account });
  const { snapshot, upgradeOptions } = buildCommercialAccountModel({
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
    stripeEnvironment: getStripeBillingEnvironmentState(),
    checkoutState,
  });
  const isScheduledPackageChange = snapshot.pendingPackageStatus === "scheduled_downgrade";
  const scheduledEndLabel = formatDateLabel(snapshot.scheduledCancellationDate, locale);
  const renewalDateLabel = formatDateLabel(billing.currentPeriodEnd, locale);
  const nextMoveLabel = snapshot.hasPendingPackageIntent
    ? isScheduledPackageChange
      ? "Manage scheduled change"
      : "Finish checkout"
    : snapshot.hasScheduledCancellation
      ? "Review billing"
      : upgradeOptions[0]?.title || "Stay on Growth";
  const primaryBanner = !account.emailVerified
    ? {
        title: "Verify your email",
        description: `Confirm ${account.ownerEmail} before you open the admin area for your community.`,
        tone: "attention",
        actions: (
          <>
            <form action={resendCommercialAccountVerificationEmailAction}>
              <button type="submit" className="button-link" data-variant="primary">
                Resend verification email
              </button>
            </form>
            <Link href="/sign-in" className="button-link" data-variant="secondary">
              Return to sign in
            </Link>
          </>
        ),
        messages: (
          <>
            {verification === "sent" || verification === "logged" ? (
              <div className="form-message" data-tone="success">
                {verification === "logged"
                  ? "A verification link was created in this test environment instead of being emailed."
                  : "A fresh verification email has been sent."}
              </div>
            ) : null}
            {verification === "retry" ? <div className="form-message" data-tone="danger">We could not send the verification email just now. Please try again.</div> : null}
          </>
        ),
      }
    : {
        title: "Open your admin area",
        description: `Your email is verified. You can now open the admin area for ${currentHub.name || "this community"} using the same email and password you already created.`,
        actions: (
          <form action={activateHubAdminAccessAction}>
            <button type="submit" className="button-link" data-variant="primary">
              Open admin area
            </button>
          </form>
        ),
        messages: (
          <>
            {adminActivation === "error" ? <div className="form-message" data-tone="danger">We could not open your admin area just now. Please try again.</div> : null}
            {adminActivation === "missing-auth" ? <div className="form-message" data-tone="danger">We could not confirm your account details. Sign out and sign back in, then try again.</div> : null}
            {adminActivation === "missing-hub" ? <div className="form-message" data-tone="danger">We could not find your community yet.</div> : null}
          </>
        ),
      };

  return (
    <AccountShell
      accountContext={accountContext}
      eyebrow="Your account"
      title="Account overview"
      description="See your package, billing, and next steps as your community grows."
    >
      <div className="content-stack">
        {primaryBanner ? (
          <AccountStatusBanner
            title={primaryBanner.title}
            description={primaryBanner.description}
            tone={primaryBanner.tone}
            actions={primaryBanner.actions}
          >
            {primaryBanner.messages || null}
          </AccountStatusBanner>
        ) : null}
        <section className="account-workspace-layout">
          <div className="account-workspace-main">
            <article className="route-card account-focus-panel">
              <div className="account-focus-panel__header">
                <div>
                  <span className="eyebrow">Workspace</span>
                  <h2>{currentHub.name || "Your community workspace"}</h2>
                </div>
              </div>
              <p className="account-focus-panel__lede">
                {account.emailVerified
                  ? `Your account is ready. Open the admin area to continue setting up ${currentHub.name || "your community"}, or review package and billing before you make your next move.`
                  : "Your workspace is provisioned. Verify your email first, then you can open the admin area and complete setup."}
              </p>
              <div className="status-row account-focus-panel__status">
                <span className="status-chip" data-tone="accent">
                  {snapshot.currentTitle}
                </span>
                <span className="status-chip">{billing.status}</span>
                {isScheduledPackageChange ? <span className="status-chip">{snapshot.pendingPackageTitle} scheduled</span> : null}
                {scheduledEndLabel && billing.hasScheduledCancellation ? (
                  <span className="status-chip">Ends {scheduledEndLabel}</span>
                ) : null}
              </div>
              <div className="account-metric-strip">
                <div className="account-metric-item">
                  <span className="stat-label">Current package</span>
                  <strong>{snapshot.currentTitle}</strong>
                  <span>
                    {isScheduledPackageChange
                      ? `${snapshot.currentPriceLabel}/month until ${scheduledEndLabel || "renewal"}.`
                      : `${snapshot.currentPriceLabel}/month`}
                  </span>
                </div>
                <div className="account-metric-item">
                  <span className="stat-label">Billing</span>
                  <strong>{billing.status}</strong>
                  <span>
                    {billing.hasScheduledCancellation
                      ? scheduledEndLabel
                        ? `Scheduled to end on ${scheduledEndLabel}.`
                        : "Scheduled to end at the close of the current billing period."
                      : isScheduledPackageChange
                        ? scheduledEndLabel
                          ? `${snapshot.pendingPackageTitle} is scheduled to begin on ${scheduledEndLabel}.`
                          : `${snapshot.pendingPackageTitle} is scheduled for the next billing cycle.`
                      : billing.requiresPaymentAction
                        ? "Needs attention before the package continues cleanly."
                        : renewalDateLabel
                          ? `Next billing cycle renews on ${renewalDateLabel}.`
                          : "Manage invoices, payment methods, and future package timing here."}
                  </span>
                </div>
                <div className="account-metric-item">
                  <span className="stat-label">Next move</span>
                  <strong>{nextMoveLabel}</strong>
                  <span>
                    {isScheduledPackageChange
                      ? `Open the upgrade page if you need to change or cancel the scheduled move to ${snapshot.pendingPackageTitle}.`
                      : snapshot.nextAction}
                  </span>
                </div>
              </div>
              <div className="button-row">
                <Link href="/account/package" className="button-link" data-variant="secondary">
                  View package
                </Link>
                <Link href="/account/billing" className="button-link" data-variant="secondary">
                  View billing
                </Link>
              </div>
            </article>
          </div>
          <aside className="account-workspace-side">
            <article className="route-card account-side-panel">
              <h2>At a glance</h2>
              <div className="account-side-list">
                <div>
                  <span>Account email</span>
                  <strong>{account.ownerEmail}</strong>
                </div>
                <div>
                  <span>Package</span>
                  <strong>{isScheduledPackageChange ? `${snapshot.currentTitle} live now` : snapshot.currentTitle}</strong>
                </div>
                <div>
                  <span>Billing</span>
                  <strong>{billing.status}</strong>
                </div>
              </div>
              <div className="button-row">
                {!snapshot.hasPendingPackageIntent ? (
                  <Link href="/account/upgrade" className="button-link" data-variant="primary">
                    Review upgrade options
                  </Link>
                ) : isScheduledPackageChange ? (
                  <Link
                    href={`/account/upgrade?tier=${encodeURIComponent(snapshot.pendingPackageTier)}`}
                    className="button-link"
                    data-variant="primary"
                  >
                    Manage scheduled change
                  </Link>
                ) : (
                  <Link
                    href={`/account/upgrade?tier=${encodeURIComponent(snapshot.pendingPackageTier)}`}
                    className="button-link"
                    data-variant="primary"
                  >
                    Continue secure checkout
                  </Link>
                )}
              </div>
            </article>
          </aside>
        </section>
      </div>
    </AccountShell>
  );
}
