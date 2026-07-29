import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("admin offering detail workspaces use the shared summary panel pattern", () => {
  const eventSource = readFileSync(
    new URL("../../src/components/patterns/event-detail-workspace/EventDetailWorkspace.jsx", import.meta.url),
    "utf8"
  );
  const courseSource = readFileSync(
    new URL("../../src/components/patterns/course-detail-workspace/CourseDetailWorkspace.jsx", import.meta.url),
    "utf8"
  );
  const eventPageSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/events/[eventId]/page.jsx", import.meta.url),
    "utf8"
  );
  const coursePageSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/courses/[courseId]/page.jsx", import.meta.url),
    "utf8"
  );
  const eventExportRouteSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/events/[eventId]/attendance/export/route.js", import.meta.url),
    "utf8"
  );
  const courseExportRouteSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/courses/[courseId]/attendance/export/route.js", import.meta.url),
    "utf8"
  );
  const summarySource = readFileSync(
    new URL("../../src/components/patterns/offering-admin-summary-panel/OfferingAdminSummaryPanel.jsx", import.meta.url),
    "utf8"
  );
  const summaryCssSource = readFileSync(
    new URL("../../src/components/patterns/offering-admin-summary-panel/OfferingAdminSummaryPanel.module.css", import.meta.url),
    "utf8"
  );

  assert.match(eventSource, /OfferingAdminSummaryPanel/);
  assert.match(courseSource, /OfferingAdminSummaryPanel/);
  assert.match(eventSource, /Export attendance CSV/);
  assert.match(courseSource, /Export attendance CSV/);
  assert.match(eventSource, /label: "Attendance"|label: 'Attendance'/);
  assert.match(eventSource, /hasEventHappened\(event\) \? attendanceCount : registrationCount/);
  assert.match(courseSource, /label: "Attendance"|label: 'Attendance'/);
  assert.match(courseSource, /attendanceCount/);
  assert.match(courseSource, /attendanceLabel/);
  assert.match(eventSource, /Attending/);
  assert.match(courseSource, /Attending/);
  assert.match(eventSource, /eventsQuery/);
  assert.match(courseSource, /coursesQuery/);
  assert.match(eventPageSource, /eventsQuery/);
  assert.match(coursePageSource, /coursesQuery/);
  assert.match(eventPageSource, /listEventAdminAttendanceRows/);
  assert.match(coursePageSource, /listCourseRegistrations/);
  assert.match(eventPageSource, /canExportAttendanceReport=/);
  assert.match(coursePageSource, /canExportAttendanceReport=/);
  assert.match(eventPageSource, /attendanceCount=/);
  assert.match(coursePageSource, /attendanceCount=/);
  assert.match(eventPageSource, /registrationCount=/);
  assert.match(coursePageSource, /registrationCount=/);
  assert.doesNotMatch(eventSource, /InfoCard/);
  assert.doesNotMatch(courseSource, /InfoCard/);
  assert.match(eventExportRouteSource, /Attendance CSV export is available on the Growth package\./);
  assert.match(eventExportRouteSource, /Attendance marked at/);
  assert.match(courseExportRouteSource, /Attendance CSV export is available on the Growth package\./);
  assert.match(courseExportRouteSource, /Progress status/);
  assert.match(courseExportRouteSource, /Progress updated at/);
  assert.match(summarySource, /primaryFacts/);
  assert.match(summarySource, /secondaryFacts/);
  assert.match(summarySource, /summary/);
  assert.match(summaryCssSource, /grid-template-columns: minmax\(0, 22rem\) minmax\(0, 1fr\);/);
  assert.match(summaryCssSource, /secondaryFacts/);
  assert.match(summaryCssSource, /border-top: 1px solid var\(--border-subtle\);/);
});
