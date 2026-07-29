import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("event cancellation service expires open checkout sessions and refunds direct charges", () => {
  const source = readFileSync(
    new URL("../../src/lib/server/event-registration-cancellation.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /checkout\.sessions\.expire/);
  assert.match(source, /refunds\.create/);
  assert.match(source, /applicationFeeAmountMinor/);
  assert.match(source, /refundPayload\.refund_application_fee = true/);
  assert.match(source, /updateEventRegistrationPaymentStatus/);
  assert.match(source, /updateNativePaymentTransaction/);
});

test("member and admin event cancellation flows use the shared refund-aware helper", () => {
  const memberSource = readFileSync(
    new URL("../../src/app/(hub)/[hubSlug]/account/bookings/actions.js", import.meta.url),
    "utf8"
  );
  const adminSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/events/[eventId]/registrations/actions.js", import.meta.url),
    "utf8"
  );

  assert.match(memberSource, /cancelEventBookingWithRefundHandling/);
  assert.match(memberSource, /getEventBookingById/);
  assert.match(adminSource, /cancelEventBookingAttendeeWithRefundHandlingById/);
  assert.match(adminSource, /attendeeId && status === "cancelled"/);
  assert.match(adminSource, /updateEventBookingAttendeeStatus/);
  assert.match(adminSource, /updateEventBookingStatus/);
  assert.match(adminSource, /updateEventBookingPaymentState/);
});
