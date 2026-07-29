import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("event booking action redirects to the event next-steps page", () => {
  const source = readFileSync(
    new URL("../../src/app/(hub)/[hubSlug]/events/[eventSlug]/actions.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /const nextStepsPath = `\/\$\{hub\.slug\}\/events\/\$\{eventSlug\}\/booking\/next-steps`/);
  assert.match(source, /createEventBookingForMember/);
  assert.match(source, /getActiveOrWaitlistedEventBookingByBooker/);
  assert.match(source, /startEventBookingCheckout/);
  assert.match(source, /getHubPaymentConfigurationByHubId/);
  assert.match(source, /paymentConfiguration\?\.isReady/);
  assert.match(source, /redirect\(nextStepsPath\);/);
  assert.doesNotMatch(source, /redirect\(`\/\$\{hub\.slug\}\/account\/bookings`\)/);
});

test("course enrolment action redirects to the course next-steps page", () => {
  const source = readFileSync(
    new URL("../../src/app/(hub)/[hubSlug]/courses/[courseSlug]/actions.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /const nextStepsPath = `\/\$\{hub\.slug\}\/courses\/\$\{courseSlug\}\/enrolment\/next-steps`/);
  assert.match(source, /startCourseRegistrationCheckout/);
  assert.match(source, /redirect\(nextStepsPath\);/);
  assert.doesNotMatch(source, /redirect\(`\/\$\{hub\.slug\}\/account\/bookings`\)/);
});

test("course enrolment checkout routes follow the shared return and restart pattern", () => {
  const returnRouteSource = readFileSync(
    new URL("../../src/app/(hub)/[hubSlug]/courses/[courseSlug]/enrolment/checkout-return/route.js", import.meta.url),
    "utf8"
  );
  const restartRouteSource = readFileSync(
    new URL("../../src/app/(hub)/[hubSlug]/courses/[courseSlug]/enrolment/restart-checkout/route.js", import.meta.url),
    "utf8"
  );

  assert.match(returnRouteSource, /finalizeCourseRegistrationCheckoutReturn/);
  assert.match(returnRouteSource, /checkoutSubmitted/);
  assert.match(restartRouteSource, /startCourseRegistrationCheckout/);
  assert.match(restartRouteSource, /resolveHubRuntimeRouteMode/);
});

test("event booking checkout routes follow the shared return and restart pattern", () => {
  const returnRouteSource = readFileSync(
    new URL("../../src/app/(hub)/[hubSlug]/events/[eventSlug]/booking/checkout-return/route.js", import.meta.url),
    "utf8"
  );
  const restartRouteSource = readFileSync(
    new URL("../../src/app/(hub)/[hubSlug]/events/[eventSlug]/booking/restart-checkout/route.js", import.meta.url),
    "utf8"
  );

  assert.match(returnRouteSource, /finalizeEventBookingCheckoutReturn/);
  assert.match(returnRouteSource, /checkoutSubmitted/);
  assert.match(restartRouteSource, /startEventBookingCheckout/);
  assert.match(restartRouteSource, /getActiveOrWaitlistedEventBookingByBooker/);
  assert.match(restartRouteSource, /resolveHubRuntimeRouteMode/);
});

test("offering next-steps pages reuse the shared workspace pattern", () => {
  const eventPageSource = readFileSync(
    new URL("../../src/app/(hub)/[hubSlug]/events/[eventSlug]/booking/next-steps/page.jsx", import.meta.url),
    "utf8"
  );
  const coursePageSource = readFileSync(
    new URL("../../src/app/(hub)/[hubSlug]/courses/[courseSlug]/enrolment/next-steps/page.jsx", import.meta.url),
    "utf8"
  );

  assert.match(eventPageSource, /OfferingNextStepsWorkspace/);
  assert.match(eventPageSource, /buildPublicEventNextStepsModel/);
  assert.match(coursePageSource, /OfferingNextStepsWorkspace/);
  assert.match(coursePageSource, /buildPublicCourseNextStepsModel/);
});
