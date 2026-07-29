import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("public events and courses listing pages render the faq section after the listing workspace", () => {
  const eventsPageSource = readFileSync(
    new URL("../../src/app/(hub)/[hubSlug]/events/page.jsx", import.meta.url),
    "utf8"
  );
  const coursesPageSource = readFileSync(
    new URL("../../src/app/(hub)/[hubSlug]/courses/page.jsx", import.meta.url),
    "utf8"
  );

  assert.match(eventsPageSource, /EventsListingSection/);
  assert.match(eventsPageSource, /FAQSection/);
  assert.match(eventsPageSource, /buildPublicEventFaqItems/);
  assert.match(eventsPageSource, /Booking FAQs/);

  assert.match(coursesPageSource, /CoursesListingSection/);
  assert.match(coursesPageSource, /FAQSection/);
  assert.match(coursesPageSource, /buildPublicCourseFaqItems/);
  assert.match(coursesPageSource, /Course enrolment FAQs/);
});
