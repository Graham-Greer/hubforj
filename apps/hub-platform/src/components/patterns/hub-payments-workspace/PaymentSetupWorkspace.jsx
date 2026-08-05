"use client";

import Badge from "@/components/ui/badge/Badge";
import SubmitButton from "@/components/ui/submit-button/SubmitButton";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import Surface from "@/components/primitives/surface/Surface";
import {
  getFallbackRegionalMarket,
  resolveLaunchFormattingLocale,
} from "@/lib/domain/regional-markets";
import StripeEmbeddedOnboardingPanel from "./StripeEmbeddedOnboardingPanel";
import styles from "./HubPaymentsWorkspace.module.css";

const fallbackRegionalMarket = getFallbackRegionalMarket();

function DetailRow({ label, value }) {
  return (
    <div className={styles.setupDetailRow}>
      <span className={styles.setupDetailLabel}>{label}</span>
      <strong className={styles.setupDetailValue}>{value}</strong>
    </div>
  );
}

function formatSyncDate(value, locale = fallbackRegionalMarket.defaultLocale) {
  const normalized = String(value || "").trim();
  const resolvedLocale = resolveLaunchFormattingLocale(locale);

  if (!normalized) {
    return "Not run yet";
  }

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return normalized;
  }

  return new Intl.DateTimeFormat(resolvedLocale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getSetupActionContent({ stripeConfigured, setupState }) {
  if (!stripeConfigured) {
    return {
      title: "Stripe is not available in this environment",
      description:
        "Hubforj is missing the Stripe Connect configuration needed to start built-in payments here.",
      action: "blocked",
    };
  }

  if (setupState?.key === "not_configured") {
    return {
      title: "Create the Stripe account",
      description:
        "Start by creating the connected Stripe account for this hub. Once it exists, Stripe onboarding can continue here inside Hubforj.",
      action: "create",
    };
  }

  if (setupState?.key === "ready") {
    return {
      title: "Setup complete",
      description:
        "Stripe is connected and built-in payments are ready to use on eligible flows in this hub.",
      action: "refresh",
    };
  }

  return {
    title: "Finish Stripe setup",
    description:
      "Continue the Stripe onboarding flow below, then refresh the status here to confirm when payments are fully ready.",
    action: "refresh",
  };
}

export default function PaymentSetupWorkspace({
  hub,
  setupState,
  stripeConnectEnvironment,
  paymentLedgerSyncStatus,
  paymentReconciliationReport,
  showSupportDiagnostics = false,
  showHeader = true,
  beginHubPaymentSetupAction,
  refreshHubPaymentSetupAction,
  syncHubPaymentLedgerAction,
}) {
  const configuration = setupState?.configuration || {};
  const hasOutstandingRequirements = configuration.hasOutstandingRequirements === true;
  const stripeConfigured = stripeConnectEnvironment?.configured === true;
  const syncStatus = paymentLedgerSyncStatus || null;
  const reconciliationReport = paymentReconciliationReport || null;
  const setupActionContent = getSetupActionContent({ stripeConfigured, setupState });
  const shouldShowSetupActionPanel = setupState?.key !== "ready" || showSupportDiagnostics;
  const shouldShowOnboarding =
    stripeConfigured
    && configuration.hasConnectedAccount
    && setupState?.key !== "ready"
    && setupState?.key !== "locked";

  return (
    <div className={styles.setupRoot}>
      {showHeader ? (
        <PageHeader
          eyebrow="Payments setup"
          title="Set up built-in payments"
          description="Connect Stripe for this hub and confirm when built-in member payments are ready to use."
        />
      ) : null}

      <Surface padding="md" className={styles.setupHeroPanel} data-onboarding="payments-setup-hero-panel">
        <div className={styles.setupHeroHeader}>
          <div className={styles.setupHeroCopy}>
            <div className={styles.setupStatusRow}>
              <Badge tone={setupState.statusTone}>{setupState.statusLabel}</Badge>
              {configuration.hasConnectedAccount ? <Badge tone="accent">Stripe account connected</Badge> : null}
            </div>
            <h2 className={styles.planAccordionTitle}>{setupState.title}</h2>
            <p className={styles.detail}>{setupState.description}</p>
          </div>
        </div>

        <div className={styles.setupFactsGrid}>
          <DetailRow
            label="Payment mode"
            value={hub.packagePaymentProcessingMode === "internal" ? "Built-in payments on Growth" : "Not on built-in payments"}
          />
          <DetailRow
            label="Connected account"
            value={configuration.hasConnectedAccount ? configuration.stripeAccountId : "Not created yet"}
          />
          <DetailRow
            label="Charges"
            value={configuration.chargesEnabled ? "Enabled" : "Blocked"}
          />
          <DetailRow
            label="Payouts"
            value={configuration.payoutsEnabled ? "Enabled" : "Blocked"}
          />
          <DetailRow
            label="Details submitted"
            value={configuration.detailsSubmitted ? "Submitted" : "Outstanding"}
          />
          <DetailRow
            label="Outstanding requirements"
            value={hasOutstandingRequirements ? "Needs attention" : "Clear"}
          />
        </div>
      </Surface>

      {shouldShowSetupActionPanel ? (
        <Surface tone="muted" padding="md" className={styles.setupGuidancePanel} data-onboarding="payments-setup-guidance-panel">
          <div className={styles.setupGuidanceStack}>
            <h3 className={styles.planAccordionTitle}>{setupActionContent.title}</h3>
            <p className={styles.detail}>{setupActionContent.description}</p>
          </div>

          <div className={styles.setupActions}>
            {setupActionContent.action === "blocked" ? (
              <Badge tone="danger">
                Missing: {Array.isArray(stripeConnectEnvironment?.missing) ? stripeConnectEnvironment.missing.join(", ") : "Stripe env"}
              </Badge>
            ) : setupActionContent.action === "create" ? (
              <form action={beginHubPaymentSetupAction} className={styles.setupActionForm}>
                <input type="hidden" name="hubSlug" value={hub.slug} />
                <SubmitButton
                  idleLabel="Create Stripe account"
                  pendingLabel="Creating Stripe account"
                  onboardingKey="payments-setup-action-button"
                />
              </form>
            ) : (
              <form action={refreshHubPaymentSetupAction} className={styles.setupActionForm}>
                <input type="hidden" name="hubSlug" value={hub.slug} />
                <SubmitButton
                  idleLabel="Refresh Stripe status"
                  pendingLabel="Refreshing Stripe status"
                  variant="secondary"
                  onboardingKey="payments-setup-action-button"
                />
              </form>
            )}
          </div>
        </Surface>
      ) : null}

      {showSupportDiagnostics ? (
        <>
          <Surface tone="muted" padding="md" className={styles.setupGuidancePanel}>
            <div className={styles.setupGuidanceStack}>
              <h3 className={styles.planAccordionTitle}>Ledger sync</h3>
              <p className={styles.detail}>
                Historical payment records are synced into the canonical payment ledger and projected payment read model
                only when an operator runs this maintenance action. Payment and admin read routes no longer perform hidden
                backfill writes.
              </p>
              <p className={styles.detail}>
                Normal hub admins should not see finance-maintenance internals. This diagnostics section is reserved for
                platform support inspections.
              </p>
              <div className={styles.setupFactsGrid}>
                <DetailRow label="Last status" value={syncStatus?.lastStatus || "Not run yet"} />
                <DetailRow label="Last mode" value={syncStatus?.lastMode || "Not run yet"} />
                <DetailRow label="Last started" value={formatSyncDate(syncStatus?.lastStartedAt, hub?.locale || fallbackRegionalMarket.defaultLocale)} />
                <DetailRow label="Last completed" value={formatSyncDate(syncStatus?.lastCompletedAt, hub?.locale || fallbackRegionalMarket.defaultLocale)} />
                <DetailRow
                  label="Membership payments"
                  value={`${Number(syncStatus?.membershipPaymentsSynced || 0)} synced · ${Number(syncStatus?.membershipPaymentsSkipped || 0)} skipped · ${Number(syncStatus?.membershipPaymentsScanned || 0)} scanned`}
                />
                <DetailRow
                  label="Native upgrades"
                  value={`${Number(syncStatus?.nativeMembershipUpgradesSynced || 0)} synced · ${Number(syncStatus?.nativeMembershipUpgradesSkipped || 0)} skipped · ${Number(syncStatus?.nativeMembershipUpgradesScanned || 0)} scanned`}
                />
                <DetailRow
                  label="Payment items"
                  value={`${Number(syncStatus?.paymentItemsSynced || 0)} synced · ${Number(syncStatus?.paymentItemsSkipped || 0)} skipped · ${Number(syncStatus?.paymentItemsScanned || 0)} scanned`}
                />
                <DetailRow
                  label="Payment summary"
                  value={`${Number(syncStatus?.paymentSummaryReportableItems || 0)} reportable · ${Number(syncStatus?.paymentSummaryTotalSourceItems || 0)} source items · ${formatSyncDate(syncStatus?.paymentSummaryRebuiltAt, hub?.locale || fallbackRegionalMarket.defaultLocale)}`}
                />
                <DetailRow label="Last actor" value={syncStatus?.lastActorId || "Not recorded"} />
              </div>
              {syncStatus?.lastSince ? (
                <p className={styles.detail}>Incremental sync baseline: {formatSyncDate(syncStatus.lastSince, hub?.locale || fallbackRegionalMarket.defaultLocale)}</p>
              ) : null}
              {syncStatus?.lastError ? <p className={styles.detail}>Last error: {syncStatus.lastError}</p> : null}
            </div>

            <div className={styles.setupActions}>
              <form action={syncHubPaymentLedgerAction} className={styles.setupActionForm}>
                <input type="hidden" name="hubSlug" value={hub.slug} />
                <SubmitButton idleLabel="Sync payment ledger" pendingLabel="Syncing payment ledger" variant="secondary" />
              </form>
            </div>
          </Surface>

          <Surface tone="muted" padding="md" className={styles.setupGuidancePanel}>
            <div className={styles.setupGuidanceStack}>
              <h3 className={styles.planAccordionTitle}>Reconciliation</h3>
              <p className={styles.detail}>
                Review mismatches between workflow records, native transactions, and ledger records before they turn into
                support incidents or reporting drift.
              </p>
              <div className={styles.setupFactsGrid}>
                <DetailRow label="Generated" value={formatSyncDate(reconciliationReport?.generatedAt, hub?.locale || fallbackRegionalMarket.defaultLocale)} />
                <DetailRow label="Open issues" value={String(Number(reconciliationReport?.totalIssues || 0))} />
              </div>
              {(reconciliationReport?.summary || []).length ? (
                <ul className={styles.setupList}>
                  {reconciliationReport.summary.map((item) => (
                    <li key={item.code}>
                      {item.title}: {item.count}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.detail}>No reconciliation issues are currently flagged.</p>
              )}
              {(reconciliationReport?.issues || []).length ? (
                <ul className={styles.setupList}>
                  {reconciliationReport.issues.slice(0, 8).map((issue, index) => (
                    <li key={`${issue.code}:${index}`}>
                      {issue.title}: {issue.detail}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </Surface>
        </>
      ) : null}

      {shouldShowOnboarding ? (
        <StripeEmbeddedOnboardingPanel
          hubSlug={hub.slug}
          publishableKey={stripeConnectEnvironment.publishableKey}
        />
      ) : null}
    </div>
  );
}
