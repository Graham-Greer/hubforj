import { NextResponse } from "next/server";
import { requireHubOperatorRouteAccess } from "@/lib/auth/action-access";
import { listHubProjectedPaymentItemsForExport } from "@/lib/data/hub-payments";
import { assertHubCapability } from "@/lib/domain/package-guards";
import {
  getFallbackRegionalMarket,
  resolveLaunchFormattingLocale,
} from "@/lib/domain/regional-markets";
import { formatPaymentAmount } from "@/components/patterns/hub-payments-workspace/hub-payments-helpers";

export const runtime = "nodejs";

const fallbackRegionalMarket = getFallbackRegionalMarket();

function normalizeString(value) {
  return String(value || "").trim();
}

function escapeCsvValue(value) {
  const text = String(value ?? "");

  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function formatCsvDateTime(value, locale = fallbackRegionalMarket.defaultLocale) {
  const normalized = normalizeString(value);
  const resolvedLocale = resolveLaunchFormattingLocale(locale);

  if (!normalized) {
    return "";
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

function buildCsv(items = [], locale = fallbackRegionalMarket.defaultLocale) {
  const headers = [
    "Member",
    "Title",
    "Type",
    "Payment Status",
    "Record Status",
    "Amount",
    "Currency",
    "Paid Date",
    "Status Date Type",
  ];

  const rows = items.map((item) => [
    item.userName || item.userEmail || "Unknown member",
    item.title || "",
    item.kind || "",
    item.paymentStatus || "",
    item.status || "",
    formatPaymentAmount(item, locale),
    item.currency || "",
    formatCsvDateTime(item.lifecycleDate || item.dueDate, locale),
    item.lifecycleLabel || "",
  ]);

  return [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\n");
}

function normalizePaymentStatusFilter(value) {
  const normalizedValue = normalizeString(value);
  const allowedValues = new Set(["paid", "unpaid", "overdue", "failed", "refunded", "partially_refunded"]);

  return allowedValues.has(normalizedValue) ? normalizedValue : "";
}

function normalizePaymentTypeFilter(value) {
  const normalizedValue = normalizeString(value);
  const allowedValues = new Set(["membership", "event", "course"]);

  return allowedValues.has(normalizedValue) ? normalizedValue : "";
}

function normalizeDateFilter(value) {
  const normalizedValue = normalizeString(value);

  return /^\d{4}-\d{2}-\d{2}$/.test(normalizedValue) ? normalizedValue : "";
}

export async function GET(request, { params }) {
  const { hubSlug } = await params;
  const { hub, errorResponse } = await requireHubOperatorRouteAccess(request, hubSlug, {
    unauthorizedMessage: "You are not authorized to export payments for this hub.",
  });
  if (errorResponse) {
    return errorResponse;
  }

  try {
    assertHubCapability(hub, "paymentsEnabled", "Built-in payments are only available on the Growth package.");

    const status = normalizePaymentStatusFilter(request.nextUrl.searchParams.get("status"));
    const type = status ? "" : normalizePaymentTypeFilter(request.nextUrl.searchParams.get("type"));
    const result = await listHubProjectedPaymentItemsForExport(hub, {
      paymentStatus: status,
      type,
      searchTerm: normalizeString(request.nextUrl.searchParams.get("search")).slice(0, 120),
      dateFrom: normalizeDateFilter(request.nextUrl.searchParams.get("date_from")),
      dateTo: normalizeDateFilter(request.nextUrl.searchParams.get("date_to")),
      limit: 10000,
    });

    if (result.truncated) {
      return NextResponse.json(
        { error: "This export is too large. Narrow the date range or filters and try again." },
        { status: 422 }
      );
    }

    const csv = buildCsv(result.items, resolveLaunchFormattingLocale(hub.locale, hub.country));
    const filename = `${normalizeString(hub.slug) || "hub"}-payments-export.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error?.message || "Unable to export payment records.") },
      { status: 500 }
    );
  }
}
