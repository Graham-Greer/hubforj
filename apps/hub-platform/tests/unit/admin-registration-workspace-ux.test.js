import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("event registrations use the shared operational records table", () => {
  const source = readFileSync(
    new URL("../../src/components/patterns/event-registration-workspace/EventRegistrationWorkspace.jsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /OperationalRecordsTable/);
  assert.match(source, /RegistrationStatusMenu/);
  assert.match(source, /RegistrationPaymentMenu/);
  assert.match(source, /summarizeEventAdminBookings/);
  assert.match(source, /label: "Partially refunded"/);
  assert.match(source, /label: "Booker"/);
  assert.match(source, /label: "Refunded"/);
});

test("event admin registrations and attendance routes use booking-backed queries and actions", () => {
  const registrationsPage = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/events/[eventId]/registrations/page.jsx", import.meta.url),
    "utf8"
  );
  const registrationsActions = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/events/[eventId]/registrations/actions.js", import.meta.url),
    "utf8"
  );
  const attendancePage = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/events/[eventId]/attendance/page.jsx", import.meta.url),
    "utf8"
  );
  const attendanceActions = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/events/[eventId]/attendance/actions.js", import.meta.url),
    "utf8"
  );

  assert.match(registrationsPage, /listEventAdminBookingRows/);
  assert.match(registrationsActions, /updateEventBookingStatus/);
  assert.match(registrationsActions, /updateEventBookingAttendeeStatus/);
  assert.match(registrationsActions, /updateEventBookingPaymentState/);
  assert.doesNotMatch(registrationsActions, /updateEventRegistrationStatus/);
  assert.match(attendancePage, /listEventAdminAttendanceRows/);
  assert.match(attendanceActions, /updateEventBookingAttendeeAttendanceStatus/);
  assert.doesNotMatch(attendanceActions, /updateEventRegistrationAttendanceStatus/);
});

test("event admin detail and attendance export use attendee-based booking operations", () => {
  const eventDetailPage = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/events/[eventId]/page.jsx", import.meta.url),
    "utf8"
  );
  const eventsPage = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/events/page.jsx", import.meta.url),
    "utf8"
  );
  const attendanceExportRoute = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/events/[eventId]/attendance/export/route.js", import.meta.url),
    "utf8"
  );

  assert.match(eventDetailPage, /listEventAdminAttendanceRows/);
  assert.match(eventDetailPage, /registeredAttendeeCount/);
  assert.doesNotMatch(eventDetailPage, /listEventRegistrations/);
  assert.match(eventsPage, /registeredAttendeeCount/);
  assert.doesNotMatch(eventsPage, /countRegisteredEventRegistrations/);
  assert.match(attendanceExportRoute, /listEventAdminAttendanceRows/);
  assert.match(attendanceExportRoute, /getEventBookingAttendeeStatusLabel/);
  assert.match(attendanceExportRoute, /Booking status/);
  assert.doesNotMatch(attendanceExportRoute, /getRegistrationStatusLabel/);
});

test("course registrations support inline status and payment menus", () => {
  const workspaceSource = readFileSync(
    new URL("../../src/components/patterns/course-registration-workspace/CourseRegistrationWorkspace.jsx", import.meta.url),
    "utf8"
  );
  const paymentSource = readFileSync(
    new URL("../../src/components/patterns/course-registration-workspace/RegistrationPaymentMenu.jsx", import.meta.url),
    "utf8"
  );
  const statusSource = readFileSync(
    new URL("../../src/components/patterns/course-registration-workspace/RegistrationStatusMenu.jsx", import.meta.url),
    "utf8"
  );

  assert.match(workspaceSource, /RegistrationStatusMenu/);
  assert.match(workspaceSource, /RegistrationPaymentMenu/);
  assert.match(paymentSource, /updateCourseRegistrationPaymentStatusAction/);
  assert.match(paymentSource, /OperationalStatusMenu/);
  assert.match(statusSource, /OperationalStatusMenu/);
});

test("shared operational status menu owns the inline menu interaction pattern", () => {
  const source = readFileSync(
    new URL("../../src/components/patterns/operational-status-menu/OperationalStatusMenu.jsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /useActionState/);
  assert.match(source, /CompactMenu/);
  assert.match(source, /buildFormData/);
  assert.match(source, /Modal/);
});

test("operational records table uses compact-menu filters", () => {
  const source = readFileSync(
    new URL("../../src/components/patterns/operational-records-table/OperationalRecordsTable.jsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /CompactMenu/);
  assert.match(source, /triggerAriaLabel=\{`Filter records by/);
  assert.match(source, /triggerTooltip=\{filter\.label\}/);
  assert.doesNotMatch(source, /filterChips/);
});

test("operational records table uses shared admin record inset tokens", () => {
  const cssSource = readFileSync(
    new URL("../../src/components/patterns/operational-records-table/OperationalRecordsTable.module.css", import.meta.url),
    "utf8"
  );
  const tokenSource = readFileSync(
    new URL("../../src/app/styles/semantic.css", import.meta.url),
    "utf8"
  );

  assert.match(tokenSource, /--admin-record-pad-block: var\(--space-2\);/);
  assert.match(tokenSource, /--admin-record-pad-inline: var\(--space-4\);/);
  assert.match(tokenSource, /--admin-record-header-pad-inline: var\(--space-4\);/);
  assert.match(cssSource, /padding: var\(--admin-record-pad-block\) var\(--admin-record-pad-inline\);/);
  assert.match(cssSource, /padding: 0 var\(--admin-record-header-pad-inline\);/);
});
