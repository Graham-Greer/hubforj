import { Suspense } from "react";
import LockedFeatureState from "@/components/patterns/locked-feature-state/LockedFeatureState";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import HubPaymentsWorkspace from "@/components/patterns/hub-payments-workspace/HubPaymentsWorkspace";
import {
  AdminMembershipPlansFallback,
  AdminPaymentRecordsFallback,
  AdminPaymentSetupFallback,
} from "@/components/patterns/admin-route-fallbacks/AdminRouteFallbacks";
import { getCurrentHubOperatorAccess } from "@/lib/auth/hub-access";
import { requireHubCoreBySlug } from "@/lib/data/hubs";
import { getHubPaymentConfigurationByHubId } from "@/lib/data/hub-payment-configurations";
import { getHubPaymentLedgerSyncStatus } from "@/lib/data/payment-ledger-sync";
import { getHubPaymentReconciliationReport } from "@/lib/data/payment-reconciliation";
import {
  getHubPaymentProjectionReportByHub,
  getHubPaymentReportByHub,
  isPaymentItemsReadModelEnabled,
} from "@/lib/data/hub-payments";
import { listMembershipPlansByHub, listPendingMembershipUpgradeRequestsByHub } from "@/lib/data/memberships";
import { getHubPaymentSetupState } from "@/lib/domain/hub-payment-configuration";
import { hasHubCapability } from "@/lib/domain/package-guards";
import { formatMoney } from "@/lib/domain/memberships";
import { getRequestHostFromHeaders, resolveHubRuntimeRouteMode } from "@/lib/domain/hub-hosts";
import { buildHubRuntimeHref } from "@/lib/domain/hub-runtime-paths";
import { getStripeConnectEnvironmentState } from "@/lib/server/stripe";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { approveMembershipUpgradeRequestAction } from "../members/[memberId]/actions";
import {
  beginHubPaymentSetupAction,
  createMembershipPlanAction,
  deleteMembershipPlanAction,
  refreshHubPaymentSetupAction,
  repairHubPaymentReconciliationAction,
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
        : success === "paymentReconciliationRepaired"
          ? "Safe payment reconciliation repairs completed."
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
  if (selectedView === "payments") {
    return <AdminPaymentRecordsFallback />;
  }

  if (selectedView === "plans") {
    return <AdminMembershipPlansFallback />;
  }

  return <AdminPaymentSetupFallback />;
}

function getPaymentsHeaderCopy(selectedView) {
  if (selectedView === "payments") {
    return {
      eyebrow: "Payments",
      title: "Payments and reporting",
      description: "Review membership, event, and course payments in one place.",
    };
  }

  if (selectedView === "plans") {
    return {
      eyebrow: "Memberships",
      title: "Membership plans",
      description: "Create and manage the plans members can use to access your community.",
    };
  }

  return {
    eyebrow: "Payments",
    title: "Payment setup",
    description: "Connect Stripe and review the setup steps needed for native hub payments.",
  };
}

function buildAdminHref(hubSlug, pathname, routeMode) {
  return buildHubRuntimeHref(hubSlug, pathname, routeMode);
}

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizePaymentStatusFilter(value) {
  const normalizedValue = normalizeString(value);
  const allowedValues = new Set(["paid", "unpaid", "overdue", "failed", "refunded", "partially_refunded"]);

  return allowedValues.has(normalizedValue) ? normalizedValue : "all";
}

function normalizePaymentTypeFilter(value) {
  const normalizedValue = normalizeString(value);
  const allowedValues = new Set(["membership", "event", "course"]);

  return allowedValues.has(normalizedValue) ? normalizedValue : "all";
}

function normalizePaymentPageSize(value) {
  const parsed = Number.parseInt(String(value || ""), 10);
  const allowedValues = new Set([10, 20, 50]);

  return allowedValues.has(parsed) ? parsed : 20;
}

function decodeCursorStack(value) {
  const normalizedValue = normalizeString(value);

  if (!normalizedValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(normalizedValue);
    return Array.isArray(parsed) ? parsed.map(normalizeString) : [];
  } catch {
    try {
      const parsed = JSON.parse(decodeURIComponent(normalizedValue));
      return Array.isArray(parsed) ? parsed.map(normalizeString) : [];
    } catch {
      return [];
    }
  }
}

function buildPaymentCursorPageInfo({ pageInfo, currentCursor, cursorStack }) {
  const normalizedCurrentCursor = normalizeString(currentCursor);
  const normalizedStack = Array.isArray(cursorStack) ? cursorStack.map(normalizeString) : [];
  const previousCursor = normalizedStack.length ? normalizedStack[normalizedStack.length - 1] : "";
  const previousCursorStack = normalizedStack.slice(0, -1);
  const nextCursor = normalizeString(pageInfo?.nextCursor);

  return {
    currentCursor: normalizedCurrentCursor,
    nextCursor,
    hasNextPage: Boolean(pageInfo?.hasMore && nextCursor),
    previousCursor,
    previousCursorStack,
    hasPreviousPage: Boolean(normalizedStack.length),
    nextCursorStack: normalizedStack.concat(normalizedCurrentCursor),
  };
}

async function PaymentsWorkspaceLoader({ hubSlug, selectedView, success, error, paymentFilters }) {
  const headerStore = await headers();
  const routeMode = resolveHubRuntimeRouteMode(getRequestHostFromHeaders(headerStore));
  const hub = await requireHubCoreBySlug(hubSlug);

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
        secondaryAction={{ href: buildAdminHref(hub.slug, "/admin/payments?view=plans", routeMode), label: "Open membership plans" }}
        rootOnboardingKey="payments-setup-locked-root"
        unlocksOnboardingKey="payments-setup-locked-unlocks"
        secondaryActionOnboardingKey="payments-setup-locked-action"
      />
    );
  }

  const shouldCheckSupportDiagnostics = selectedView === "setup";
  const access = shouldCheckSupportDiagnostics ? await getCurrentHubOperatorAccess(hub) : null;
  const showSupportDiagnostics = access?.mode === "support";
  const shouldLoadPaymentReport = paymentsEnabled && selectedView === "payments";
  const shouldUsePaymentItemsReadModel = shouldLoadPaymentReport && isPaymentItemsReadModelEnabled();
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
      ? shouldUsePaymentItemsReadModel
        ? getHubPaymentProjectionReportByHub(hub, {
            routeMode,
            cursor: paymentFilters.cursor,
            limit: paymentFilters.pageSize,
            paymentStatus: paymentFilters.status === "all" ? "" : paymentFilters.status,
            type: paymentFilters.type === "all" ? "" : paymentFilters.type,
          })
        : getHubPaymentReportByHub(hub, { routeMode })
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
  const paymentCursorPageInfo = shouldUsePaymentItemsReadModel
    ? buildPaymentCursorPageInfo({
        pageInfo: paymentReport.pageInfo,
        currentCursor: paymentFilters.cursor,
        cursorStack: paymentFilters.cursorStack,
      })
    : null;

  return (
    <HubPaymentsWorkspace
      key={`${selectedView}:${typeof success === "string" ? success : ""}:${typeof error === "string" ? error : ""}`}
      hub={hub}
      adminBasePath={buildAdminHref(hub.slug, "/admin/payments", routeMode)}
      items={paymentReport.items}
      summary={paymentReport.summary}
      paymentReadModelEnabled={shouldUsePaymentItemsReadModel}
      paymentFilters={paymentFilters}
      paymentPageInfo={paymentCursorPageInfo}
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
      repairHubPaymentReconciliationAction={repairHubPaymentReconciliationAction}
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
  const resolvedSearchParams = await searchParams;
  const {
    success = "",
    error = "",
    view = "setup",
    status = "all",
    type = "all",
    pageSize = "20",
    cursor = "",
    cursorStack = "",
  } = resolvedSearchParams;
  const selectedView = view === "plans" ? "plans" : view === "payments" ? "payments" : "setup";
  const normalizedStatus = normalizePaymentStatusFilter(status);
  const normalizedType = normalizedStatus === "all" ? normalizePaymentTypeFilter(type) : "all";
  const paymentFilters = {
    status: normalizedStatus,
    type: normalizedType,
    pageSize: normalizePaymentPageSize(pageSize),
    cursor: normalizeString(cursor),
    cursorStack: decodeCursorStack(cursorStack),
  };

  return (
    <div className={styles.layout}>
      <PageHeader {...getPaymentsHeaderCopy(selectedView)} />

      <Suspense fallback={<PaymentsWorkspaceFallback selectedView={selectedView} />}>
        <PaymentsWorkspaceLoader
          hubSlug={hubSlug}
          selectedView={selectedView}
          success={success}
          error={error}
          paymentFilters={paymentFilters}
        />
      </Suspense>
    </div>
  );
}
