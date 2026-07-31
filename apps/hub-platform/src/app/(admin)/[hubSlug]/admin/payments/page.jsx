import { Suspense } from "react";
import LockedFeatureState from "@/components/patterns/locked-feature-state/LockedFeatureState";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import HubPaymentsWorkspace from "@/components/patterns/hub-payments-workspace/HubPaymentsWorkspace";
import { getCurrentHubOperatorAccess } from "@/lib/auth/hub-access";
import { requireHubBySlug } from "@/lib/data/hubs";
import { getHubPaymentConfigurationByHubId } from "@/lib/data/hub-payment-configurations";
import { getHubPaymentLedgerSyncStatus } from "@/lib/data/payment-ledger-sync";
import { getHubPaymentReconciliationReport } from "@/lib/data/payment-reconciliation";
import { getHubPaymentReportByHub } from "@/lib/data/hub-payments";
import { listMembershipPlansByHub, listPendingMembershipUpgradeRequestsByHub } from "@/lib/data/memberships";
import { getHubPaymentSetupState } from "@/lib/domain/hub-payment-configuration";
import { hasHubCapability } from "@/lib/domain/package-guards";
import { formatMoney } from "@/lib/domain/memberships";
import { getStripeConnectEnvironmentState } from "@/lib/server/stripe";
import { notFound } from "next/navigation";
import { approveMembershipUpgradeRequestAction } from "../members/[memberId]/actions";
import {
  beginHubPaymentSetupAction,
  createMembershipPlanAction,
  deleteMembershipPlanAction,
  refreshHubPaymentSetupAction,
  syncHubPaymentLedgerAction,
  updateMembershipPlanAction,
} from "./actions";
import styles from "./page.module.css";

function buildEmptyPaymentSummary(hub) {
  const currency = hub.defaultCurrency || "USD";

  return {
    total: 0,
    actionRequired: 0,
    collectedRevenue: {
      amount: 0,
      currency,
      formatted: formatMoney(0, currency, hub.locale || "en-US"),
      isMixedCurrency: false,
    },
  };
}

function buildPaymentSuccessMessage(success) {
  return success === "stripeSetupStarted"
    ? "Stripe account created. Continue the embedded onboarding below."
    : success === "stripeStatusRefreshed"
      ? "Stripe setup status refreshed."
      : success === "paymentLedgerSynced"
        ? "Payment ledger sync completed."
        : success === "planCreated"
          ? "Membership plan created."
          : success === "planUpdated"
            ? "Membership plan updated."
            : success === "planDeleted"
              ? "Membership plan deleted."
              : success === "upgradeRequestApproved"
                ? "Membership upgrade request approved."
                : success === "paymentUpdated"
                  ? "Payment status updated."
                  : "";
}

function PaymentsWorkspaceFallback({ selectedView }) {
  const title =
    selectedView === "payments"
      ? "Loading payment records"
      : selectedView === "plans"
        ? "Loading membership plans"
        : "Loading payment setup";

  return (
    <section className={styles.loadingPanel} aria-busy="true" aria-label={title}>
      <div>
        <p className={styles.loadingEyebrow}>{title}</p>
        <div className={`${styles.loadingLine} ${styles.loadingLineWide}`} />
      </div>
      <div className={styles.loadingGrid}>
        <div className={styles.loadingTile} />
        <div className={styles.loadingTile} />
        <div className={styles.loadingTile} />
      </div>
      <div className={styles.loadingLine} />
      <div className={`${styles.loadingLine} ${styles.loadingLineShort}`} />
    </section>
  );
}

async function PaymentsWorkspaceLoader({ hub, selectedView, success, error }) {
  const paymentsEnabled = hasHubCapability(hub, "paymentsEnabled");
  const shouldCheckSupportDiagnostics = selectedView === "setup";
  const access = shouldCheckSupportDiagnostics ? await getCurrentHubOperatorAccess(hub) : null;
  const showSupportDiagnostics = access?.mode === "support";
  const shouldLoadPaymentReport = paymentsEnabled && selectedView === "payments";
  const shouldLoadMembershipPlans = selectedView === "plans";
  const shouldLoadPaymentConfiguration = selectedView !== "payments";

  const [
    paymentReport,
    membershipPlans,
    pendingUpgradeRequests,
    paymentConfiguration,
    paymentLedgerSyncStatus,
    paymentReconciliationReport,
  ] = await Promise.all([
    shouldLoadPaymentReport
      ? getHubPaymentReportByHub(hub)
      : Promise.resolve({
          items: [],
          summary: buildEmptyPaymentSummary(hub),
        }),
    shouldLoadMembershipPlans ? listMembershipPlansByHub(hub.id) : Promise.resolve([]),
    shouldLoadMembershipPlans ? listPendingMembershipUpgradeRequestsByHub(hub.id) : Promise.resolve([]),
    shouldLoadPaymentConfiguration ? getHubPaymentConfigurationByHubId(hub.id) : Promise.resolve(null),
    showSupportDiagnostics ? getHubPaymentLedgerSyncStatus(hub.id) : Promise.resolve(null),
    showSupportDiagnostics ? getHubPaymentReconciliationReport(hub.id) : Promise.resolve(null),
  ]);
  const paymentSetupState = paymentConfiguration ? getHubPaymentSetupState(hub, paymentConfiguration) : null;
  const stripeConnectEnvironment = selectedView === "setup" ? getStripeConnectEnvironmentState() : null;

  return (
    <HubPaymentsWorkspace
      key={`${selectedView}:${typeof success === "string" ? success : ""}:${typeof error === "string" ? error : ""}`}
      hub={hub}
      items={paymentReport.items}
      summary={paymentReport.summary}
      view={selectedView}
      paymentSetupState={paymentSetupState}
      stripeConnectEnvironment={stripeConnectEnvironment}
      paymentLedgerSyncStatus={paymentLedgerSyncStatus}
      paymentReconciliationReport={paymentReconciliationReport}
      showSupportDiagnostics={showSupportDiagnostics}
      membershipPlans={membershipPlans}
      pendingUpgradeRequests={pendingUpgradeRequests}
      beginHubPaymentSetupAction={beginHubPaymentSetupAction}
      refreshHubPaymentSetupAction={refreshHubPaymentSetupAction}
      syncHubPaymentLedgerAction={syncHubPaymentLedgerAction}
      createMembershipPlanAction={createMembershipPlanAction}
      updateMembershipPlanAction={updateMembershipPlanAction}
      deleteMembershipPlanAction={deleteMembershipPlanAction}
      approveMembershipUpgradeRequestAction={approveMembershipUpgradeRequestAction}
      successMessage={buildPaymentSuccessMessage(success)}
      errorMessage={typeof error === "string" ? error : ""}
    />
  );
}

export default async function PaymentsPage({ params, searchParams }) {
  const { hubSlug } = await params;
  const { success = "", error = "", view = "setup" } = await searchParams;
  const selectedView = view === "plans" ? "plans" : view === "payments" ? "payments" : "setup";
  const hub = await requireHubBySlug(hubSlug);

  if (!hub) {
    notFound();
  }

  const paymentsEnabled = hasHubCapability(hub, "paymentsEnabled");

  if (!paymentsEnabled && selectedView !== "plans") {
    return (
      <LockedFeatureState
        eyebrow="Growth feature"
        title="Built-in payments are locked on your current package"
        description="Package tier management with Hubforj stays in your commercial account area. Native member payments inside the hub only unlock on Growth."
        unlocks={[
          "Connect Stripe from the hub admin portal",
          "Complete embedded onboarding inside Hubforj",
          "Operate Stripe-backed member payments from one workspace",
        ]}
        secondaryAction={{ href: `/${hub.slug}/admin/payments?view=plans`, label: "Open membership plans" }}
        rootOnboardingKey="payments-setup-locked-root"
        unlocksOnboardingKey="payments-setup-locked-unlocks"
        secondaryActionOnboardingKey="payments-setup-locked-action"
      />
    );
  }

  return (
    <div className={styles.layout}>
      {selectedView === "payments" ? (
        <PageHeader
          eyebrow="Payments"
          title="Payments and reporting"
          description="Review membership, event, and course payments in one place."
        />
      ) : null}

      <Suspense fallback={<PaymentsWorkspaceFallback selectedView={selectedView} />}>
        <PaymentsWorkspaceLoader
          hub={hub}
          selectedView={selectedView}
          success={success}
          error={error}
        />
      </Suspense>
    </div>
  );
}
