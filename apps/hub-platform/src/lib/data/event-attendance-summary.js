try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { listEventBookingAttendees, listEventBookings } from "./event-booking-queries.js";
import { normalizeString } from "./event-booking-shared.js";

export const EVENT_ATTENDANCE_SUMMARY_SCHEMA_VERSION = 1;

function normalizeInteger(value, fallback = 0) {
  const next = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(next) ? next : fallback;
}

function emptyEventAttendanceSummary() {
  return {
    attendancePresentCount: 0,
    attendanceAbsentCount: 0,
    attendancePendingCount: 0,
    attendanceMarkedCount: 0,
  };
}

function normalizeAttendanceStatus(value) {
  const normalized = normalizeString(value) || "pending";
  return ["present", "absent", "pending"].includes(normalized) ? normalized : "pending";
}

export function summarizeEventAttendanceCounterRows(rows = []) {
  return rows.reduce((summary, row) => {
    if (normalizeString(row?.status) !== "registered") {
      return summary;
    }

    const attendanceStatus = normalizeAttendanceStatus(row?.attendanceStatus);

    if (attendanceStatus === "present") {
      summary.attendancePresentCount += 1;
      summary.attendanceMarkedCount += 1;
    } else if (attendanceStatus === "absent") {
      summary.attendanceAbsentCount += 1;
      summary.attendanceMarkedCount += 1;
    } else {
      summary.attendancePendingCount += 1;
    }

    return summary;
  }, emptyEventAttendanceSummary());
}

export function getEventAttendanceSummaryFromEvent(event = {}) {
  return {
    attendancePresentCount: normalizeInteger(event.attendancePresentCount, 0),
    attendanceAbsentCount: normalizeInteger(event.attendanceAbsentCount, 0),
    attendancePendingCount: normalizeInteger(event.attendancePendingCount, 0),
    attendanceMarkedCount: normalizeInteger(event.attendanceMarkedCount, 0),
  };
}

export function isEventAttendanceSummaryProjectionCurrent(event = {}) {
  return (
    normalizeInteger(event.attendanceSummarySchemaVersion, 0) === EVENT_ATTENDANCE_SUMMARY_SCHEMA_VERSION &&
    Boolean(normalizeString(event.attendanceSummaryUpdatedAt))
  );
}

export function getEventAttendanceCounterDelta(previousRows = [], nextRows = []) {
  const previous = summarizeEventAttendanceCounterRows(previousRows);
  const next = summarizeEventAttendanceCounterRows(nextRows);

  return Object.fromEntries(Object.keys(next).map((key) => [key, next[key] - previous[key]]));
}

function applyCounterDelta(currentValue, delta) {
  const current = normalizeInteger(currentValue, 0);
  return Math.max(0, current + (normalizeInteger(delta, 0)));
}

function summariesAreEqual(left = {}, right = {}) {
  return (
    normalizeInteger(left.attendancePresentCount, 0) === normalizeInteger(right.attendancePresentCount, 0) &&
    normalizeInteger(left.attendanceAbsentCount, 0) === normalizeInteger(right.attendanceAbsentCount, 0) &&
    normalizeInteger(left.attendancePendingCount, 0) === normalizeInteger(right.attendancePendingCount, 0) &&
    normalizeInteger(left.attendanceMarkedCount, 0) === normalizeInteger(right.attendanceMarkedCount, 0)
  );
}

function buildEventAttendanceIssue(type, title, description, event, expected, actual) {
  return {
    type,
    title,
    description,
    eventId: normalizeString(event?.id),
    eventTitle: normalizeString(event?.title),
    expected,
    actual,
  };
}

async function listHubEventAttendanceProjectionRows(hubId) {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    return [];
  }

  const snapshot = await getFirebaseAdminDb()
    .collection("hubs")
    .doc(normalizedHubId)
    .collection("events")
    .select(
      "title",
      "attendancePresentCount",
      "attendanceAbsentCount",
      "attendancePendingCount",
      "attendanceMarkedCount",
      "attendanceSummarySchemaVersion",
      "attendanceSummaryUpdatedAt"
    )
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export function applyEventAttendanceCounterDelta(event = {}, delta = {}, options = {}) {
  const attendancePresentCount = applyCounterDelta(event.attendancePresentCount, delta.attendancePresentCount);
  const attendanceAbsentCount = applyCounterDelta(event.attendanceAbsentCount, delta.attendanceAbsentCount);
  const attendancePendingCount = applyCounterDelta(event.attendancePendingCount, delta.attendancePendingCount);
  const attendanceMarkedCount = attendancePresentCount + attendanceAbsentCount;
  const update = {
    attendancePresentCount,
    attendanceAbsentCount,
    attendancePendingCount,
    attendanceMarkedCount,
  };

  if (options.markProjectionCurrent !== false) {
    update.attendanceSummarySchemaVersion = EVENT_ATTENDANCE_SUMMARY_SCHEMA_VERSION;
    update.attendanceSummaryUpdatedAt = normalizeString(options.updatedAt) || new Date().toISOString();
    update.attendanceSummaryUpdatedBy = normalizeString(options.actorId) || "system";
  }

  return update;
}

export async function updateEventAttendanceSummaryProjection(hubId, eventId, summary, options = {}) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedEventId = normalizeString(eventId);

  if (!normalizedHubId || !normalizedEventId) {
    return emptyEventAttendanceSummary();
  }

  const nextSummary = {
    ...emptyEventAttendanceSummary(),
    ...summary,
  };
  nextSummary.attendanceMarkedCount =
    normalizeInteger(nextSummary.attendancePresentCount, 0) + normalizeInteger(nextSummary.attendanceAbsentCount, 0);

  await getFirebaseAdminDb()
    .collection("hubs")
    .doc(normalizedHubId)
    .collection("events")
    .doc(normalizedEventId)
    .set({
      ...nextSummary,
      attendanceSummarySchemaVersion: EVENT_ATTENDANCE_SUMMARY_SCHEMA_VERSION,
      attendanceSummaryUpdatedAt: normalizeString(options.updatedAt) || new Date().toISOString(),
      attendanceSummaryUpdatedBy: normalizeString(options.actorId) || "system",
    }, { merge: true });

  return nextSummary;
}

export async function repairEventAttendanceSummaryProjection(hubId, eventId, options = {}) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedEventId = normalizeString(eventId);

  if (!normalizedHubId || !normalizedEventId) {
    return emptyEventAttendanceSummary();
  }

  const bookings = await listEventBookings(normalizedHubId, normalizedEventId);
  const attendeeLists = await Promise.all(
    bookings.map((booking) => listEventBookingAttendees(normalizedHubId, normalizedEventId, booking.id))
  );
  const summary = summarizeEventAttendanceCounterRows(attendeeLists.flat());

  await updateEventAttendanceSummaryProjection(normalizedHubId, normalizedEventId, summary, {
    actorId: options.actorId || "event-attendance-summary-repair",
    updatedAt: options.updatedAt,
  });

  return summary;
}

export async function calculateEventAttendanceSummaryFromSource(hubId, eventId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedEventId = normalizeString(eventId);

  if (!normalizedHubId || !normalizedEventId) {
    return emptyEventAttendanceSummary();
  }

  const bookings = await listEventBookings(normalizedHubId, normalizedEventId);
  const attendeeLists = await Promise.all(
    bookings.map((booking) => listEventBookingAttendees(normalizedHubId, normalizedEventId, booking.id))
  );

  return summarizeEventAttendanceCounterRows(attendeeLists.flat());
}

export async function getHubEventAttendanceReconciliationReport(hubId, options = {}) {
  const normalizedHubId = normalizeString(hubId);
  const issueLimit = Math.min(Math.max(normalizeInteger(options.issueLimit, 25), 1), 100);
  const generatedAt = new Date().toISOString();
  const events = await listHubEventAttendanceProjectionRows(normalizedHubId);
  const issues = [];

  for (const event of events) {
    const expected = await calculateEventAttendanceSummaryFromSource(normalizedHubId, event.id);
    const actual = getEventAttendanceSummaryFromEvent(event);
    const isCurrent = isEventAttendanceSummaryProjectionCurrent(event);

    if (!isCurrent) {
      issues.push(buildEventAttendanceIssue(
        "missing_or_stale_projection",
        "Event attendance projection is missing or stale",
        `Event ${event.id} does not have current event attendance projection metadata.`,
        event,
        expected,
        actual
      ));
    } else if (!summariesAreEqual(expected, actual)) {
      issues.push(buildEventAttendanceIssue(
        "counter_mismatch",
        "Event attendance counters differ from source rows",
        `Event ${event.id} attendance projection does not match attendee source rows.`,
        event,
        expected,
        actual
      ));
    }
  }

  return {
    generatedAt,
    totalEvents: events.length,
    totalIssues: issues.length,
    summary: issues.slice(0, issueLimit),
  };
}

export async function rebuildHubEventAttendanceSummaryProjections(hubId, actorId = "event-attendance-reconciliation") {
  const normalizedHubId = normalizeString(hubId);
  const startedAt = new Date().toISOString();
  const events = await listHubEventAttendanceProjectionRows(normalizedHubId);
  let projectionsWritten = 0;

  for (const event of events) {
    await repairEventAttendanceSummaryProjection(normalizedHubId, event.id, {
      actorId,
      updatedAt: new Date().toISOString(),
    });
    projectionsWritten += 1;
  }

  return {
    startedAt,
    completedAt: new Date().toISOString(),
    eventsScanned: events.length,
    projectionsWritten,
  };
}
