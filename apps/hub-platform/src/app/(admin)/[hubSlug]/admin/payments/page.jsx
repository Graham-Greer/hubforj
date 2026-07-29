import LockedFeatureState from "@/components/patterns/locked-feature-state/LockedFeatureState";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import HubPaymentsWorkspace from "@/components/patterns/hub-payments-workspace/HubPaymentsWorkspace";
import { getCurrentHubOperatorAccess } from "@/lib/auth/hub-access";
import { requireHubBySlug } from "@/lib/data/hubs";
import { getHubPaymentConfigurationByHubId } from "@/lib/data/hub-payment-configurations";
import { getHubPaymentLedgerSyncStatus } from "@/lib/data/payment-ledger-sync";
import { getHubPaymentReconciliationReport } from "@/lib/data/payment-reconciliation";
import { listHubPaymentItemsBySlug } from "@/lib/data/hub-payments";
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

export default async function PaymentsPage({ params, searchParams }) {
  const { hubSlug } = await params;
  const { success = "", error = "", view = "setup" } = await searchParams;
  const selectedView = view === "plans" ? "plans" : view === "payments" ? "payments" : "setup";
  const hub = await requireHubBySlug(hubSlug);

  if (!hub) {
    notFound();
  }

  const paymentsEnabled = hasHubCapability(hub, "paymentsEnabled");
  const access = await getCurrentHubOperatorAccess(hub);
  const showSupportDiagnostics = access?.mode === "support";

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

  const [{ items, summary }, membershipPlans, pendingUpgradeRequests, paymentConfiguration, paymentLedgerSyncStatus, paymentReconciliationReport] = await Promise.all([
    paymentsEnabled && selectedView === "payments"
      ? listHubPaymentItemsBySlug(hubSlug)
      : Promise.resolve({
          items: [],
          summary: {
            total: 0,
            actionRequired: 0,
            collectedRevenue: {
              amount: 0,
              currency: hub.defaultCurrency || "USD",
              formatted: formatMoney(0, hub.defaultCurrency || "USD", hub.locale || "en-US"),
              isMixedCurrency: false,
            },
          },
        }),
    listMembershipPlansByHub(hub.id),
    listPendingMembershipUpgradeRequestsByHub(hub.id),
    getHubPaymentConfigurationByHubId(hub.id),
    showSupportDiagnostics ? getHubPaymentLedgerSyncStatus(hub.id) : Promise.resolve(null),
    showSupportDiagnostics ? getHubPaymentReconciliationReport(hub.id) : Promise.resolve(null),
  ]);
  const paymentSetupState = getHubPaymentSetupState(hub, paymentConfiguration);
  const stripeConnectEnvironment = getStripeConnectEnvironmentState();
  const successMessage =
    success === "stripeSetupStarted"
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

  return (
    <div className={styles.layout}>
      {selectedView === "payments" ? (
        <PageHeader
          eyebrow="Payments"
          title="Payments and reporting"
          description="Review membership, event, and course payments in one place."
        />
      ) : null}

      <HubPaymentsWorkspace
        key={`${view}:${typeof success === "string" ? success : ""}:${typeof error === "string" ? error : ""}`}
        hub={hub}
        items={items}
        summary={summary}
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
        successMessage={successMessage}
        errorMessage={typeof error === "string" ? error : ""}
      />
    </div>
  );
}
