import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("public site event detail loader supports historical member access mode", () => {
  const source = readFileSync(
    new URL("../../src/lib/data/public-site.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /let detailAccessMode = "public"/);
  assert.match(source, /const historicalEvent = await getEventBySlug/);
  assert.match(source, /const historicalBooking = await getActiveOrWaitlistedEventBookingByBooker/);
  assert.match(source, /getLatestEventBookingByBooker/);
  assert.match(source, /detailAccessMode = "history_member"/);
});

test("public site course detail loader supports historical member access mode", () => {
  const source = readFileSync(
    new URL("../../src/lib/data/public-site.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /const historicalCourse = await getCourseBySlug/);
  assert.match(source, /const historicalRegistration = await getCourseRegistrationByUser/);
  assert.match(source, /getLatestCourseRegistrationByUser/);
  assert.match(source, /detailAccessMode = "history_member"/);
});

test("detail pages pass detailAccessMode through to the detail sections", () => {
  const eventPageSource = readFileSync(
    new URL("../../src/app/(hub)/[hubSlug]/events/[eventSlug]/page.jsx", import.meta.url),
    "utf8"
  );
  const coursePageSource = readFileSync(
    new URL("../../src/app/(hub)/[hubSlug]/courses/[courseSlug]/page.jsx", import.meta.url),
    "utf8"
  );

  assert.match(eventPageSource, /detailAccessMode/);
  assert.match(eventPageSource, /detailAccessMode=\{detailAccessMode\}/);
  assert.match(coursePageSource, /detailAccessMode/);
  assert.match(coursePageSource, /detailAccessMode=\{detailAccessMode\}/);
});

test("public event next steps loader supports booked historical occurrences", () => {
  const source = readFileSync(
    new URL("../../src/lib/data/public-site.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /const visibleEvent = await getVisibleEventBySlug/);
  assert.match(source, /const historicalEvent = await getEventBySlug/);
  assert.match(source, /fallbackBooking = await getLatestEventBookingByBooker/);
  assert.match(source, /if \(fallbackBooking\) \{\s*event = historicalEvent;/);
});
