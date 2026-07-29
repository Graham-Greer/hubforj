import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("public booking and enrolment actions queue immediate outbox notifications", () => {
  const eventActionSource = readFileSync(
    new URL("../../src/app/(hub)/[hubSlug]/events/[eventSlug]/actions.js", import.meta.url),
    "utf8"
  );
  const courseActionSource = readFileSync(
    new URL("../../src/app/(hub)/[hubSlug]/courses/[courseSlug]/actions.js", import.meta.url),
    "utf8"
  );

  assert.match(eventActionSource, /queueInitialEventBookingNotification/);
  assert.match(eventActionSource, /paymentUrl: checkout\.checkoutUrl/);
  assert.match(courseActionSource, /queueInitialCourseRegistrationNotification/);
  assert.match(courseActionSource, /paymentUrl: checkout\.checkoutUrl/);
});

test("admin external payment confirmations queue confirmed notifications only on transition to paid", () => {
  const eventAdminSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/events/[eventId]/registrations/actions.js", import.meta.url),
    "utf8"
  );
  const courseAdminSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/courses/[courseId]/registrations/actions.js", import.meta.url),
    "utf8"
  );

  assert.match(eventAdminSource, /getEventBookingById/);
  assert.match(eventAdminSource, /queueEventBookingConfirmedAfterPayment/);
  assert.match(eventAdminSource, /previousBooking\?\.paymentStatus/);
  assert.match(courseAdminSource, /getCourseRegistrationById/);
  assert.match(courseAdminSource, /queueCourseRegistrationConfirmedAfterPayment/);
  assert.match(courseAdminSource, /previousRegistration\?\.paymentStatus/);
});

test("native checkout success paths and Stripe webhooks queue confirmed notifications from paid transitions", () => {
  const eventBookingCheckoutSource = readFileSync(
    new URL("../../src/lib/server/event-booking-checkout.js", import.meta.url),
    "utf8"
  );
  const courseCheckoutSource = readFileSync(
    new URL("../../src/lib/server/course-registration-checkout.js", import.meta.url),
    "utf8"
  );
  const eventRegistrationCheckoutSource = readFileSync(
    new URL("../../src/lib/server/event-registration-checkout.js", import.meta.url),
    "utf8"
  );
  const webhookSource = readFileSync(
    new URL("../../src/lib/server/hub-payment-webhooks.js", import.meta.url),
    "utf8"
  );

  assert.match(eventBookingCheckoutSource, /queueEventBookingConfirmedAfterPayment/);
  assert.match(courseCheckoutSource, /queueCourseRegistrationConfirmedAfterPayment/);
  assert.match(eventRegistrationCheckoutSource, /queueLegacyEventRegistrationConfirmedAfterPayment/);
  assert.match(webhookSource, /queueEventBookingConfirmedAfterPaymentByIds/);
  assert.match(webhookSource, /queueCourseRegistrationConfirmedAfterPaymentByIds/);
  assert.match(webhookSource, /queueLegacyEventRegistrationConfirmedAfterPaymentByIds/);
});
