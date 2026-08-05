"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CompactMenu from "@/components/ui/compact-menu/CompactMenu";
import EmptyState from "@/components/patterns/empty-state/EmptyState";
import FormMessage from "@/components/ui/form-message/FormMessage";
import fieldStyles from "@/components/ui/field-control/FieldControl.module.css";
import Icon from "@/components/ui/icon/Icon";
import PaginationControls from "@/components/patterns/pagination-controls/PaginationControls";
import SearchField from "@/components/ui/search-field/SearchField";
import Button from "@/components/ui/button/Button";
import MembershipPlanManager from "@/components/patterns/hub-payments-workspace/MembershipPlanManager";
import PaymentItemsTable from "@/components/patterns/hub-payments-workspace/PaymentItemsTable";
import PaymentSetupWorkspace from "@/components/patterns/hub-payments-workspace/PaymentSetupWorkspace";
import StatCard from "@/components/ui/stat-card/StatCard";
import { useHubPaymentsWorkspace } from "@/hooks/use-hub-payments-workspace";
import { formatMoney } from "@/lib/domain/memberships";
import {
  summarizePaymentItemCollectedRevenue,
  summarizePaymentItemRefundedRevenue,
} from "@/lib/domain/payments";
import { getFallbackRegionalMarket } from "@/lib/domain/regional-markets";
import {
  getActionRequiredCount,
  getStatusFilterLabel,
  getTypeFilterLabel,
  statusFilters,
  typeFilters,
} from "./hub-payments-helpers";
import styles from "./HubPaymentsWorkspace.module.css";

const fallbackRegionalMarket = getFallbackRegionalMarket();

function buildVisibleReportingSummary(
  items = [],
  locale = fallbackRegionalMarket.defaultLocale,
  fallbackCurrency = fallbackRegionalMarket.defaultCurrency,
) {
  let overdueItems = 0;

  for (const item of items) {
    const paymentStatus = String(item?.paymentStatus || "");

    if (paymentStatus === "overdue") {
      overdueItems += 1;
    }
  }

  return {
    actionRequired: getActionRequiredCount(items),
    collectedRevenueLabel: summarizePaymentItemCollectedRevenue(
      items,
      (amount, currency) => formatMoney(amount, currency, locale),
      fallbackCurrency
    ).formatted,
    refundedRevenueLabel: summarizePaymentItemRefundedRevenue(
      items,
      (amount, currency) => formatMoney(amount, currency, locale),
      fallbackCurrency
    ).formatted,
    overdueItems,
  };
}

export default function HubPaymentsWorkspace({
  hub,
  adminBasePath = "",
  items,
  summary,
  paymentReadModelEnabled = false,
  paymentFilters = null,
  paymentPageInfo = null,
  view = "setup",
  paymentSetupState = null,
  stripeConnectEnvironment = null,
  paymentLedgerSyncStatus = null,
  paymentReconciliationReport = null,
  showSupportDiagnostics = false,
  membershipPlans = [],
  pendingUpgradeRequests = [],
  beginHubPaymentSetupAction = null,
  refreshHubPaymentSetupAction = null,
  syncHubPaymentLedgerAction = null,
  repairHubPaymentReconciliationAction = null,
  createMembershipPlanAction = null,
  updateMembershipPlanAction = null,
  deleteMembershipPlanAction = null,
  approveMembershipUpgradeRequestAction = null,
  successMessage = "",
  errorMessage = "",
}) {
  const router = useRouter();
  const workspace = useHubPaymentsWorkspace(items);
  const [exportError, setExportError] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const hubFallbackCurrency = hub?.defaultCurrency || fallbackRegionalMarket.defaultCurrency;
  const activeItems = paymentReadModelEnabled ? items : workspace.filteredItems;
  const visibleItems = workspace.filteredItems;
  const activeTypeFilter = paymentReadModelEnabled ? paymentFilters?.type || "all" : workspace.typeFilter;
  const activeStatusFilter = paymentReadModelEnabled ? paymentFilters?.status || "all" : workspace.statusFilter;
  const activePageSize = paymentReadModelEnabled ? Number(paymentFilters?.pageSize || 20) : workspace.pageSize;
  const reportingSummary = buildVisibleReportingSummary(
    visibleItems,
    hub?.locale || fallbackRegionalMarket.defaultLocale,
    hubFallbackCurrency,
  );
  const statSummary = paymentReadModelEnabled
    ? {
        actionRequired: Number(summary?.actionRequired || 0),
        collectedRevenueLabel:
          summary?.collectedRevenue?.formatted ||
          formatMoney(0, hubFallbackCurrency, hub?.locale || fallbackRegionalMarket.defaultLocale),
        refundedRevenueLabel:
          summary?.refundedRevenue?.formatted ||
          formatMoney(0, hubFallbackCurrency, hub?.locale || fallbackRegionalMarket.defaultLocale),
        overdueItems: Number(summary?.overdueItems || 0),
      }
    : reportingSummary;
  const exportParams = new URLSearchParams();

  if (workspace.searchTerm) {
    exportParams.set("search", workspace.searchTerm);
  }
  if (activeTypeFilter !== "all") {
    exportParams.set("type", activeTypeFilter);
  }
  if (activeStatusFilter !== "all") {
    exportParams.set("status", activeStatusFilter);
  }
  if (workspace.dateFrom) {
    exportParams.set("date_from", workspace.dateFrom);
  }
  if (workspace.dateTo) {
    exportParams.set("date_to", workspace.dateTo);
  }
  const paymentsBasePath = adminBasePath || `/${hub.slug}/admin/payments`;
  const exportHref = `${paymentsBasePath}/export${exportParams.toString() ? `?${exportParams.toString()}` : ""}`;

  function encodeCursorStack(stack = []) {
    return JSON.stringify(stack.map((value) => String(value || "").trim()));
  }

  function buildPaymentsHref(overrides = {}) {
    const params = new URLSearchParams();
    const nextType = overrides.type !== undefined ? overrides.type : activeTypeFilter;
    const nextStatus = overrides.status !== undefined ? overrides.status : activeStatusFilter;
    const nextPageSize = overrides.pageSize !== undefined ? overrides.pageSize : activePageSize;
    const nextCursor = overrides.cursor !== undefined ? overrides.cursor : paymentPageInfo?.currentCursor || "";
    const nextCursorStack = overrides.cursorStack !== undefined ? overrides.cursorStack : paymentFilters?.cursorStack || [];

    params.set("view", "payments");

    if (nextType && nextType !== "all") {
      params.set("type", nextType);
    }

    if (nextStatus && nextStatus !== "all") {
      params.set("status", nextStatus);
    }

    if (Number(nextPageSize) && Number(nextPageSize) !== 20) {
      params.set("pageSize", String(nextPageSize));
    }

    if (nextCursor) {
      params.set("cursor", nextCursor);
    }

    if (Array.isArray(nextCursorStack) && nextCursorStack.length) {
      params.set("cursorStack", encodeCursorStack(nextCursorStack));
    }

    return `${paymentsBasePath}?${params.toString()}`;
  }

  function navigatePayments(overrides = {}) {
    router.push(buildPaymentsHref(overrides));
  }

  async function handleExportCsv() {
    setExportError("");
    setIsExporting(true);

    try {
      const response = await fetch(exportHref, {
        method: "GET",
        credentials: "same-origin",
      });

      if (!response.ok) {
        const contentType = response.headers.get("Content-Type") || "";
        let message = "Unable to export payment records right now.";

        if (contentType.includes("application/json")) {
          const payload = await response.json().catch(() => null);
          message = payload?.error || message;
        } else {
          const text = await response.text().catch(() => "");
          if (text) {
            message = text;
          }
        }

        throw new Error(message);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition") || "";
      const filenameMatch = contentDisposition.match(/filename="([^"]+)"/i);
      const filename = filenameMatch?.[1] || `${hub.slug}-payments-export.csv`;
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Unable to export payment records right now.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className={styles.root}>
      {errorMessage ? <FormMessage tone="danger">{errorMessage}</FormMessage> : null}
      {successMessage ? <FormMessage tone="success">{successMessage}</FormMessage> : null}
      {exportError ? <FormMessage tone="danger">{exportError}</FormMessage> : null}

      {view === "setup" ? (
        <PaymentSetupWorkspace
          hub={hub}
          setupState={paymentSetupState}
          stripeConnectEnvironment={stripeConnectEnvironment}
          paymentLedgerSyncStatus={paymentLedgerSyncStatus}
          paymentReconciliationReport={paymentReconciliationReport}
          showSupportDiagnostics={showSupportDiagnostics}
          showHeader={false}
          beginHubPaymentSetupAction={beginHubPaymentSetupAction}
          refreshHubPaymentSetupAction={refreshHubPaymentSetupAction}
          syncHubPaymentLedgerAction={syncHubPaymentLedgerAction}
          repairHubPaymentReconciliationAction={repairHubPaymentReconciliationAction}
        />
      ) : view === "plans" ? (
        <MembershipPlanManager
          hub={hub}
          adminBasePath={adminBasePath}
          membershipPlans={membershipPlans}
          pendingUpgradeRequests={pendingUpgradeRequests}
          paymentSetupState={paymentSetupState}
          showHeader={false}
          openPlanId={workspace.openPlanId}
          setOpenPlanId={workspace.setOpenPlanId}
          planDeleteTarget={workspace.planDeleteTarget}
          setPlanDeleteTarget={workspace.setPlanDeleteTarget}
          createFormRef={workspace.createFormRef}
          openCreatePlan={workspace.openCreatePlan}
          createMembershipPlanAction={createMembershipPlanAction}
          updateMembershipPlanAction={updateMembershipPlanAction}
          deleteMembershipPlanAction={deleteMembershipPlanAction}
          approveMembershipUpgradeRequestAction={approveMembershipUpgradeRequestAction}
        />
      ) : (
        <>
          <div className={styles.stats}>
            <StatCard label="Action required" value={String(statSummary.actionRequired)} detail="Unpaid, overdue, or failed items needing follow-up." />
            <StatCard
              label="Collected revenue"
              value={
                statSummary.collectedRevenueLabel ||
                summary?.collectedRevenue?.formatted ||
                formatMoney(0, hubFallbackCurrency, hub?.locale || fallbackRegionalMarket.defaultLocale)
              }
              detail="Visible revenue for the current filtered records."
            />
            <StatCard
              label="Refunded"
              value={
                statSummary.refundedRevenueLabel ||
                summary?.refundedRevenue?.formatted ||
                formatMoney(0, hubFallbackCurrency, hub?.locale || fallbackRegionalMarket.defaultLocale)
              }
              detail="Refunded amount for the current filtered records."
            />
            <StatCard
              label="Overdue items"
              value={String(statSummary.overdueItems)}
              detail="Visible records currently overdue."
            />
          </div>

          <div className={styles.toolbar} data-onboarding="payments-records-toolbar">
            <div className={styles.toolbarControls}>
              <div className={styles.dateFilters}>
                <label className={styles.dateField}>
                  <span className={fieldStyles.label}>From</span>
                  <input
                    type="date"
                    className={`${fieldStyles.control} ${fieldStyles.compactControl}`}
                    value={workspace.dateFrom}
                    onChange={(event) => workspace.setDateFrom(event.target.value)}
                  />
                </label>
                <label className={styles.dateField}>
                  <span className={fieldStyles.label}>To</span>
                  <input
                    type="date"
                    className={`${fieldStyles.control} ${fieldStyles.compactControl}`}
                    value={workspace.dateTo}
                    onChange={(event) => workspace.setDateTo(event.target.value)}
                  />
                </label>
              </div>

              <SearchField
                name="admin-payments-search"
                label="Search payments"
                labelVisibility="hidden"
                size="sm"
                placeholder="Search payments"
                value={workspace.searchTerm}
                onChange={(event) => workspace.setSearchTerm(event.target.value)}
                className={styles.search}
              />

              <div className={styles.toolbarMenus}>
                <CompactMenu
                  triggerAriaLabel="Filter payments by record type"
                  triggerTooltip="Record type"
                  items={typeFilters.map((filter) => ({
                    ...filter,
                    active: activeTypeFilter === filter.value,
                    onSelect: paymentReadModelEnabled
                      ? (value) => navigatePayments({ type: value, status: "all", cursor: "", cursorStack: [] })
                      : workspace.setTypeFilter,
                  }))}
                >
                  <Icon name="filter_alt" size="sm" decorative />
                  <span>{getTypeFilterLabel(activeTypeFilter)}</span>
                </CompactMenu>

                <CompactMenu
                  triggerAriaLabel="Filter payments by payment status"
                  triggerTooltip="Payment status"
                  items={statusFilters.map((filter) => ({
                    ...filter,
                    active: activeStatusFilter === filter.value,
                    onSelect: paymentReadModelEnabled
                      ? (value) => navigatePayments({ status: value, type: "all", cursor: "", cursorStack: [] })
                      : workspace.setStatusFilter,
                  }))}
                >
                  <Icon name="payments" size="sm" decorative />
                  <span>{getStatusFilterLabel(activeStatusFilter)}</span>
                </CompactMenu>

                <Button type="button" variant="secondary" size="sm" onClick={handleExportCsv} disabled={isExporting}>
                  {isExporting ? "Exporting..." : "Export CSV"}
                </Button>
              </div>
            </div>
          </div>

          {visibleItems.length ? (
            <div className={styles.listSection} data-onboarding="payments-records-list">
              {paymentReadModelEnabled ? (
                <PaginationControls
                  totalCount={activeItems.length + (paymentPageInfo?.hasNextPage ? 1 : 0)}
                  currentPage={1}
                  pageSize={activePageSize}
                  pageSizeOptions={[10, 20, 50]}
                  itemLabel="payment records"
                  onPageSizeChange={(value) => navigatePayments({ pageSize: value, cursor: "", cursorStack: [] })}
                  previousHref={
                    paymentPageInfo?.hasPreviousPage
                      ? buildPaymentsHref({
                          cursor: paymentPageInfo.previousCursor,
                          cursorStack: paymentPageInfo.previousCursorStack,
                        })
                      : ""
                  }
                  nextHref={
                    paymentPageInfo?.hasNextPage
                      ? buildPaymentsHref({
                          cursor: paymentPageInfo.nextCursor,
                          cursorStack: paymentPageInfo.nextCursorStack,
                        })
                      : ""
                  }
                  cursorMode
                />
              ) : (
                <PaginationControls
                  totalCount={workspace.filteredItems.length}
                  currentPage={workspace.currentPage}
                  pageSize={workspace.pageSize}
                  pageSizeOptions={[5, 10, 20]}
                  itemLabel="payment records"
                  onPageChange={workspace.setCurrentPage}
                  onPageSizeChange={workspace.setPageSize}
                />
              )}

              <PaymentItemsTable
                hub={hub}
                items={paymentReadModelEnabled ? visibleItems : workspace.paginatedItems}
              />
            </div>
          ) : (
            <div data-onboarding="payments-records-list">
              <EmptyState
                eyebrow="No matching payments"
                title="No payments match the current view"
                description="Try a different search term or widen one of the filters."
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
