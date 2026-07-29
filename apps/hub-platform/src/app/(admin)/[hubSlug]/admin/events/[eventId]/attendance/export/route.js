import { NextResponse } from "next/server";
import { requireHubOperatorRouteAccess } from "@/lib/auth/action-access";
import { getEventById } from "@/lib/data/events";
import { listEventAdminAttendanceRows } from "@/lib/data/event-bookings";
import {
  getEventBookingAttendanceStatusLabel,
  getEventBookingAttendeeStatusLabel,
  getEventBookingStatusLabel,
} from "@/lib/domain/event-bookings";
import { assertHubCapability } from "@/lib/domain/package-guards";
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

function getAttendedValue(attendee) {
  return normalizeString(attendee?.attendanceStatus) === "present" ? "Yes" : "No";
}

function buildCsv(attendees = [], locale = fallbackRegionalMarket.defaultLocale) {
  const headers = [
    "Attendee name",
    "Attendee email",
    "Booker name",
    "Booker email",
    "Booking status",
    "Attendee status",
    "Attendance status",
    "Attended",
    "Attendance marked at",
  ];

  const rows = attendees.map((attendee) => [
    attendee.userName || attendee.userEmail || "Unknown attendee",
    attendee.userEmail || "",
    attendee.bookerName || attendee.bookerEmail || "Unknown booker",
    attendee.bookerEmail || "",
    getEventBookingStatusLabel(attendee.bookingStatus),
    getEventBookingAttendeeStatusLabel(attendee.status),
    getEventBookingAttendanceStatusLabel(attendee.attendanceStatus),
    getAttendedValue(attendee),
    formatCsvDateTime(attendee.attendanceMarkedAt, locale),
  ]);

  return [headers, ...rows].map((row) => row.map(escapeCsvValue).join(",")).join("\n");
}

export async function GET(request, { params }) {
  const { hubSlug, eventId } = await params;
  const { hub, errorResponse } = await requireHubOperatorRouteAccess(request, hubSlug, {
    unauthorizedMessage: "You are not authorized to export attendance for this hub.",
  });
  if (errorResponse) {
    return errorResponse;
  }

  try {
    assertHubCapability(hub, "reportingEnabled", "Attendance CSV export is available on the Growth package.");

    const [event, attendees] = await Promise.all([
      getEventById(hub.id, eventId),
      listEventAdminAttendanceRows(hub.id, eventId),
    ]);

    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    const csv = buildCsv(attendees, resolveLaunchFormattingLocale(hub.locale, hub.country));
    const filename = `${normalizeString(hub.slug) || "hub"}-${normalizeString(event.slug || event.id) || "event"}-attendance.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error?.message || "Unable to export event attendance.") },
      { status: 500 }
    );
  }
}
