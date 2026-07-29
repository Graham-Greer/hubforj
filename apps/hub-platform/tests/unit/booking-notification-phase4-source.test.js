import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("member self-cancellation actions queue booking cancellation notifications", () => {
  const source = readFileSync(
    new URL("../../src/app/(hub)/[hubSlug]/account/bookings/actions.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /queueEventBookingCancellationNotification/);
  assert.match(source, /queueCourseRegistrationCancellationNotification/);
  assert.match(source, /refundSummary: result\.message/);
});

test("admin event and course cancellation actions queue cancellation notifications after cancellation services", () => {
  const eventSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/events/[eventId]/registrations/actions.js", import.meta.url),
    "utf8"
  );
  const courseSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/courses/[courseId]/registrations/actions.js", import.meta.url),
    "utf8"
  );

  assert.match(eventSource, /cancelEventBookingWithRefundHandling/);
  assert.match(eventSource, /queueEventBookingCancellationNotification/);
  assert.match(eventSource, /scope: "booking"/);
  assert.match(eventSource, /result\?\.booking\?\.status/);
  assert.match(eventSource, /\? "booking" : "attendee"/);
  assert.match(courseSource, /cancelCourseRegistrationWithRefundHandling/);
  assert.match(courseSource, /queueCourseRegistrationCancellationNotification/);
});

test("cancellation queue helpers suppress stale non-cancellation records for fully cancelled sources", () => {
  const source = readFileSync(
    new URL("../../src/lib/server/booking-notification-outbox.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /suppressNotificationsForCancelledSource/);
  assert.match(source, /getSuppressedNotificationKindsForCancelledSource/);
  assert.match(source, /markNotificationOutboxRecordSuppressed/);
  assert.match(source, /resolveCancellationNotificationKind/);
});
