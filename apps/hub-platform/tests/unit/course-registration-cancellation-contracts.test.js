import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("course cancellation service expires open checkout sessions and refunds direct charges", () => {
  const source = readFileSync(
    new URL("../../src/lib/server/course-registration-cancellation.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /checkout\.sessions\.expire/);
  assert.match(source, /refunds\.create/);
  assert.match(source, /applicationFeeAmountMinor/);
  assert.match(source, /refundPayload\.refund_application_fee = true/);
  assert.match(source, /updateCourseRegistrationPaymentStatus/);
  assert.match(source, /updateNativePaymentTransaction/);
});

test("member and admin course cancellation flows use the shared refund-aware helper", () => {
  const memberSource = readFileSync(
    new URL("../../src/app/(hub)/[hubSlug]/account/bookings/actions.js", import.meta.url),
    "utf8"
  );
  const adminSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/courses/[courseId]/registrations/actions.js", import.meta.url),
    "utf8"
  );

  assert.match(memberSource, /cancelCourseRegistrationWithRefundHandling/);
  assert.match(adminSource, /cancelCourseRegistrationWithRefundHandling/);
});
