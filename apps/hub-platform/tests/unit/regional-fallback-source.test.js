import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("public-facing event and course surfaces use shared regional fallbacks instead of hardcoded UK defaults", () => {
  const eventDetailsSource = readFileSync(
    new URL("../../src/components/sections/event-details-section/EventDetailsSection.jsx", import.meta.url),
    "utf8"
  );
  const eventBookingSource = readFileSync(
    new URL("../../src/components/sections/event-details-section/EventBookingForm.jsx", import.meta.url),
    "utf8"
  );
  const eventSeriesSelectionSource = readFileSync(
    new URL("../../src/components/sections/event-series-selection-section/EventSeriesSelectionSection.jsx", import.meta.url),
    "utf8"
  );
  const eventsListingSource = readFileSync(
    new URL("../../src/components/sections/events-listing-section/EventsListingSection.jsx", import.meta.url),
    "utf8"
  );
  const courseDetailsSource = readFileSync(
    new URL("../../src/components/sections/course-details-section/CourseDetailsSection.jsx", import.meta.url),
    "utf8"
  );
  const coursesListingSource = readFileSync(
    new URL("../../src/components/sections/courses-listing-section/CoursesListingSection.jsx", import.meta.url),
    "utf8"
  );
  const paymentsWorkspaceSource = readFileSync(
    new URL("../../src/components/patterns/hub-payments-workspace/HubPaymentsWorkspace.jsx", import.meta.url),
    "utf8"
  );
  const publicEventsSource = readFileSync(
    new URL("../../src/lib/domain/public-events.js", import.meta.url),
    "utf8"
  );
  const publicCoursesSource = readFileSync(
    new URL("../../src/lib/domain/public-courses.js", import.meta.url),
    "utf8"
  );
  const membershipsSource = readFileSync(
    new URL("../../src/lib/domain/memberships.js", import.meta.url),
    "utf8"
  );

  for (const source of [
    eventDetailsSource,
    eventBookingSource,
    eventSeriesSelectionSource,
    eventsListingSource,
    courseDetailsSource,
    coursesListingSource,
    paymentsWorkspaceSource,
  ]) {
    assert.match(source, /getFallbackRegionalMarket/);
  }

  assert.match(publicEventsSource, /resolveLaunchFormattingLocale/);
  assert.match(publicCoursesSource, /resolveLaunchFormattingLocale/);
  assert.match(membershipsSource, /resolveLaunchFormattingLocale/);

  assert.doesNotMatch(eventDetailsSource, /locale = "en-GB"/);
  assert.doesNotMatch(eventBookingSource, /locale = "en-GB"/);
  assert.doesNotMatch(eventBookingSource, /\|\| "GBP"/);
  assert.doesNotMatch(eventSeriesSelectionSource, /locale = "en-GB"/);
  assert.doesNotMatch(eventsListingSource, /locale = "en-GB"/);
  assert.doesNotMatch(courseDetailsSource, /locale = "en-GB"/);
  assert.doesNotMatch(coursesListingSource, /locale = "en-GB"/);
  assert.doesNotMatch(paymentsWorkspaceSource, /formatMoney\(0, "GBP"/);
});
