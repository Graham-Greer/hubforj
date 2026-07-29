import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("event and course admin update actions queue whole-offering cancellation fan-out only on transition to cancelled", () => {
  const eventSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/events/[eventId]/actions.js", import.meta.url),
    "utf8"
  );
  const courseSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/courses/[courseId]/actions.js", import.meta.url),
    "utf8"
  );

  assert.match(eventSource, /getEventById/);
  assert.match(eventSource, /queueEventCancelledByAdminNotifications/);
  assert.match(eventSource, /previousEvent\?\.status/);
  assert.match(eventSource, /event\?\.status/);

  assert.match(courseSource, /getCourseById/);
  assert.match(courseSource, /queueCourseCancelledByAdminNotifications/);
  assert.match(courseSource, /previousCourse\?\.status/);
  assert.match(courseSource, /course\?\.status/);
});

test("whole-offering cancellation fan-out queues from offering source type and suppresses stale booking lifecycle records", () => {
  const source = readFileSync(
    new URL("../../src/lib/server/booking-notification-outbox.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /queueEventCancelledByAdminNotifications/);
  assert.match(source, /queueCourseCancelledByAdminNotifications/);
  assert.match(source, /resolveOfferingCancelledNotificationKind/);
  assert.match(source, /sourceKind: "offering"/);
  assert.match(source, /listEventBookings/);
  assert.match(source, /listCourseRegistrations/);
  assert.match(source, /isWaitlisted:/);
});
