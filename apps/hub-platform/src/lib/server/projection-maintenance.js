try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { listHubCoresForProjectionMaintenance } from "@/lib/data/hubs";
import { syncHubPaymentLedger } from "@/lib/data/payment-ledger-sync";
import { getHubPaymentReconciliationReport } from "@/lib/data/payment-reconciliation";
import { getHubMemberDirectoryReconciliationReport } from "@/lib/data/member-directory";
import { getHubAdminDashboardProjectionReconciliationReport } from "@/lib/data/hub-dashboard-stats";
import {
  getHubEventAttendanceReconciliationReport,
  rebuildHubEventAttendanceSummaryProjections,
} from "@/lib/data/event-bookings";
import {
  getHubMediaUsageReconciliationReport,
  rebuildHubMediaUsageProjections,
} from "@/lib/data/media-usage-projection";

function normalizeString(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function normalizeBoolean(value, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  const normalizedValue = normalizeString(value).toLowerCase();

  if (["1", "true", "yes"].includes(normalizedValue)) {
    return true;
  }

  if (["0", "false", "no"].includes(normalizedValue)) {
    return false;
  }

  return fallback;
}

function normalizeInteger(value, fallback = 1, max = 10) {
  const parsed = Number.parseInt(String(value || ""), 10);
  const resolved = Number.isFinite(parsed) ? parsed : fallback;

  return Math.min(Math.max(resolved, 1), max);
}

function summarizeReport(report) {
  return {
    totalIssues: Number.parseInt(String(report?.totalIssues || ""), 10) || 0,
    generatedAt: normalizeString(report?.generatedAt),
    summary: Array.isArray(report?.summary) ? report.summary : [],
  };
}

function summarizeLedgerSync(result) {
  return {
    status: result?.status || null,
    membershipPayments: result?.membershipPayments || null,
    nativeMembershipUpgrades: result?.nativeMembershipUpgrades || null,
    eventBookingPayments: result?.eventBookingPayments || null,
    courseRegistrationPayments: result?.courseRegistrationPayments || null,
    paymentItems: result?.paymentItems || null,
    memberDirectory: result?.memberDirectory || null,
    memberActivity: result?.memberActivity || null,
    dashboardStatsStatus: result?.dashboardStats ? "reconciled" : "not_rebuilt",
    dashboardOverviewStatus: result?.dashboardOverview ? "reconciled" : "not_rebuilt",
  };
}

export function normalizeProjectionMaintenanceRequest(input = {}) {
  return {
    hubSlug: normalizeString(input.hubSlug),
    cursor: normalizeString(input.cursor),
    limit: normalizeInteger(input.limit, 1, 10),
    dryRun: normalizeBoolean(input.dryRun, true),
    includePayments: normalizeBoolean(input.includePayments, true),
    includeMembers: normalizeBoolean(input.includeMembers, true),
    includeDashboard: normalizeBoolean(input.includeDashboard, true),
    includeMedia: normalizeBoolean(input.includeMedia, true),
    includeEventAttendance: normalizeBoolean(input.includeEventAttendance, true),
  };
}

export async function runProjectionMaintenance(input = {}) {
  const options = normalizeProjectionMaintenanceRequest(input);
  const startedAt = new Date().toISOString();
  const actorId = options.dryRun
    ? "internal-projection-maintenance-dry-run"
    : "internal-projection-maintenance";
  const hubPage = await listHubCoresForProjectionMaintenance({
    hubSlug: options.hubSlug,
    cursor: options.cursor,
    limit: options.limit,
  });
  const results = [];

  for (const hub of hubPage.hubs) {
    const hubResult = {
      hubId: hub.id,
      hubSlug: hub.slug,
      dryRun: options.dryRun,
      status: "completed",
      startedAt: new Date().toISOString(),
      completedAt: "",
      reports: {},
      repairs: {},
      error: "",
    };

    try {
      if (options.dryRun) {
        const [paymentReport, memberDirectoryReport, dashboardReport, mediaReport, eventAttendanceReport] = await Promise.all([
          options.includePayments ? getHubPaymentReconciliationReport(hub.id, { issueLimit: 25 }) : Promise.resolve(null),
          options.includeMembers ? getHubMemberDirectoryReconciliationReport(hub.id, { issueLimit: 25 }) : Promise.resolve(null),
          options.includeDashboard ? getHubAdminDashboardProjectionReconciliationReport(hub, { issueLimit: 25 }) : Promise.resolve(null),
          options.includeMedia ? getHubMediaUsageReconciliationReport(hub.id) : Promise.resolve(null),
          options.includeEventAttendance ? getHubEventAttendanceReconciliationReport(hub.id, { issueLimit: 25 }) : Promise.resolve(null),
        ]);

        if (paymentReport) hubResult.reports.payments = summarizeReport(paymentReport);
        if (memberDirectoryReport) hubResult.reports.memberDirectory = summarizeReport(memberDirectoryReport);
        if (dashboardReport) hubResult.reports.dashboard = summarizeReport(dashboardReport);
        if (mediaReport) hubResult.reports.mediaUsage = summarizeReport(mediaReport);
        if (eventAttendanceReport) hubResult.reports.eventAttendance = summarizeReport(eventAttendanceReport);
      } else {
        if (options.includePayments || options.includeMembers || options.includeDashboard) {
          hubResult.repairs.paymentLedger = summarizeLedgerSync(
            await syncHubPaymentLedger(hub.id, actorId)
          );
        }

        if (options.includeMedia) {
          hubResult.repairs.mediaUsage = await rebuildHubMediaUsageProjections(hub.id, actorId);
        }

        if (options.includeEventAttendance) {
          hubResult.repairs.eventAttendance = await rebuildHubEventAttendanceSummaryProjections(hub.id, actorId);
        }

        const [paymentReport, memberDirectoryReport, dashboardReport, mediaReport, eventAttendanceReport] = await Promise.all([
          options.includePayments ? getHubPaymentReconciliationReport(hub.id, { issueLimit: 25 }) : Promise.resolve(null),
          options.includeMembers ? getHubMemberDirectoryReconciliationReport(hub.id, { issueLimit: 25 }) : Promise.resolve(null),
          options.includeDashboard ? getHubAdminDashboardProjectionReconciliationReport(hub, { issueLimit: 25 }) : Promise.resolve(null),
          options.includeMedia ? getHubMediaUsageReconciliationReport(hub.id) : Promise.resolve(null),
          options.includeEventAttendance ? getHubEventAttendanceReconciliationReport(hub.id, { issueLimit: 25 }) : Promise.resolve(null),
        ]);

        if (paymentReport) hubResult.reports.payments = summarizeReport(paymentReport);
        if (memberDirectoryReport) hubResult.reports.memberDirectory = summarizeReport(memberDirectoryReport);
        if (dashboardReport) hubResult.reports.dashboard = summarizeReport(dashboardReport);
        if (mediaReport) hubResult.reports.mediaUsage = summarizeReport(mediaReport);
        if (eventAttendanceReport) hubResult.reports.eventAttendance = summarizeReport(eventAttendanceReport);
      }
    } catch (error) {
      hubResult.status = "failed";
      hubResult.error = String(error?.message || "Projection maintenance failed.");
      console.error("[hub-platform] projection maintenance hub failed", {
        hubId: hub.id,
        hubSlug: hub.slug,
        error,
      });
    }

    hubResult.completedAt = new Date().toISOString();
    results.push(hubResult);
  }

  const failed = results.filter((result) => result.status === "failed").length;

  return {
    ok: failed === 0,
    startedAt,
    completedAt: new Date().toISOString(),
    dryRun: options.dryRun,
    processed: results.length,
    failed,
    nextCursor: hubPage.nextCursor,
    hasMore: hubPage.hasMore,
    results,
  };
}
