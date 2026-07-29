import { NextResponse } from "next/server";
import { requireHubOperatorRouteAccess } from "@/lib/auth/action-access";
import { listCourseRegistrations } from "@/lib/data/course-registrations";
import { getCourseById } from "@/lib/data/courses";
import { getCourseAttendanceStatusLabel, getCourseRegistrationStatusLabel } from "@/lib/domain/course-registrations";
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

function getAttendedValue(registration) {
  const status = normalizeString(registration?.attendanceStatus);
  return status === "in_progress" || status === "completed" ? "Yes" : "No";
}

function buildCsv(registrations = [], locale = fallbackRegionalMarket.defaultLocale) {
  const headers = [
    "Name",
    "Email",
    "Registration status",
    "Progress status",
    "Attended",
    "Progress updated at",
  ];

  const rows = registrations.map((registration) => [
    registration.userName || registration.userEmail || "Unknown member",
    registration.userEmail || "",
    getCourseRegistrationStatusLabel(registration.status),
    getCourseAttendanceStatusLabel(registration.attendanceStatus),
    getAttendedValue(registration),
    formatCsvDateTime(registration.attendanceMarkedAt, locale),
  ]);

  return [headers, ...rows].map((row) => row.map(escapeCsvValue).join(",")).join("\n");
}

export async function GET(request, { params }) {
  const { hubSlug, courseId } = await params;
  const { hub, errorResponse } = await requireHubOperatorRouteAccess(request, hubSlug, {
    unauthorizedMessage: "You are not authorized to export attendance for this hub.",
  });
  if (errorResponse) {
    return errorResponse;
  }

  try {
    assertHubCapability(hub, "reportingEnabled", "Attendance CSV export is available on the Growth package.");

    const [course, registrations] = await Promise.all([
      getCourseById(hub.id, courseId),
      listCourseRegistrations(hub.id, courseId),
    ]);

    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    const csv = buildCsv(registrations, resolveLaunchFormattingLocale(hub.locale, hub.country));
    const filename = `${normalizeString(hub.slug) || "hub"}-${normalizeString(course.slug || course.id) || "course"}-attendance.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error?.message || "Unable to export course attendance.") },
      { status: 500 }
    );
  }
}
