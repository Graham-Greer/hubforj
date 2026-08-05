import { NextResponse } from "next/server";
import { requireHubOperatorRouteAccess } from "@/lib/auth/action-access";
import { listMemberDirectoryExportRowsByHubId, normalizeMemberDirectoryFilters } from "@/lib/data/member-directory";
import {
  getFallbackRegionalMarket,
  resolveLaunchFormattingLocale,
} from "@/lib/domain/regional-markets";

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
    "Name",
    "Email",
    "Status",
    "Membership",
    "Membership Status",
    "Attention",
    "Payment Attention Count",
    "Last Sign In",
    "Joined",
  ];
  const rows = items.map((item) => [
    item.displayName || item.email || "Unknown member",
    item.email || "",
    item.status || "",
    item.membershipPlanName || "No membership assigned",
    item.membershipStatus || "",
    item.attentionStatus || "",
    item.paymentAttentionCount || 0,
    formatCsvDateTime(item.lastSignedInAt, locale),
    formatCsvDateTime(item.joinedAt, locale),
  ]);

  return [headers, ...rows].map((row) => row.map(escapeCsvValue).join(",")).join("\n");
}

export async function GET(request, { params }) {
  const { hubSlug } = await params;
  const { hub, errorResponse } = await requireHubOperatorRouteAccess(request, hubSlug, {
    unauthorizedMessage: "You are not authorized to export members for this hub.",
  });

  if (errorResponse) {
    return errorResponse;
  }

  try {
    const filters = normalizeMemberDirectoryFilters({
      q: request.nextUrl.searchParams.get("q") || "",
      status: request.nextUrl.searchParams.get("status") || "",
      membership: request.nextUrl.searchParams.get("membership") || "",
      attention: request.nextUrl.searchParams.get("attention") || "",
    });
    const items = await listMemberDirectoryExportRowsByHubId(hub.id, {
      ...filters,
      maxRows: 10000,
    });
    const csv = buildCsv(items, resolveLaunchFormattingLocale(hub.locale, hub.country));
    const filename = `${normalizeString(hub.slug) || "hub"}-members-export.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error?.message || "Unable to export member records.") },
      { status: 500 }
    );
  }
}
