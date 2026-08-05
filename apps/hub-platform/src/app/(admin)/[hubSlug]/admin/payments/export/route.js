import { NextResponse } from "next/server";
import { requireHubOperatorRouteAccess } from "@/lib/auth/action-access";
import { listHubPaymentItemsBySlug } from "@/lib/data/hub-payments";
import { assertHubCapability } from "@/lib/domain/package-guards";
import {
  getFallbackRegionalMarket,
  resolveLaunchFormattingLocale,
} from "@/lib/domain/regional-markets";
import {
  formatPaymentAmount,
  getOperationalPaymentStatus,
} from "@/components/patterns/hub-payments-workspace/hub-payments-helpers";

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

function resolveDateFilterValue(value) {
  const normalized = String(value || "").trim();

  if (!normalized) {
    return "";
  }

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function filterItems(items, search = "", type = "all", status = "all", dateFrom = "", dateTo = "") {
  const normalizedSearchTerm = String(search || "").trim().toLowerCase();

  return items.filter((item) => {
    if (
      normalizedSearchTerm &&
      !String(item.userName || item.userEmail || "")
        .toLowerCase()
        .includes(normalizedSearchTerm)
    ) {
      return false;
    }

    if (type !== "all" && item.kind !== type) {
      return false;
    }

    if (status !== "all" && getOperationalPaymentStatus(item) !== status) {
      return false;
    }

    const itemDate = resolveDateFilterValue(item.lifecycleDate || item.dueDate);

    if (dateFrom && (!itemDate || itemDate < dateFrom)) {
      return false;
    }

    if (dateTo && (!itemDate || itemDate > dateTo)) {
      return false;
    }

    return true;
  });
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

    const { items } = await listHubPaymentItemsBySlug(hubSlug);
    const filteredItems = filterItems(
      items,
      request.nextUrl.searchParams.get("search") || "",
      request.nextUrl.searchParams.get("type") || "all",
      request.nextUrl.searchParams.get("status") || "all",
      request.nextUrl.searchParams.get("date_from") || "",
      request.nextUrl.searchParams.get("date_to") || ""
    );
    const csv = buildCsv(filteredItems, resolveLaunchFormattingLocale(hub.locale, hub.country));
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
