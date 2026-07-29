import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("public event detail source surfaces recurring and booking-history context for occurrences", () => {
  const source = readFileSync(
    new URL("../../src/components/sections/event-details-section/EventDetailsSection.jsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /PublicBreadcrumbs/);
  assert.match(source, /label: "Events"/);
  assert.match(source, /seriesSlugBase/);
  assert.match(source, /occurrenceDateLabel/);
  assert.match(source, /Recurring event/);
  assert.match(source, /Booking history access/);
  assert.match(source, /you can still review this occurrence here because you\s+have booking history for it/i);
});

test("public event route supports a recurring-series selector experience", () => {
  const routeSource = readFileSync(
    new URL("../../src/app/(hub)/[hubSlug]/events/[eventSlug]/page.jsx", import.meta.url),
    "utf8"
  );
  const listingSource = readFileSync(
    new URL("../../src/components/sections/events-listing-section/EventsListingSection.jsx", import.meta.url),
    "utf8"
  );
  const selectorSource = readFileSync(
    new URL(
      "../../src/components/sections/event-series-selection-section/EventSeriesSelectionSection.jsx",
      import.meta.url
    ),
    "utf8"
  );
  const breadcrumbSource = readFileSync(
    new URL("../../src/components/patterns/public-breadcrumbs/PublicBreadcrumbs.jsx", import.meta.url),
    "utf8"
  );

  assert.match(routeSource, /EventSeriesSelectionSection/);
  assert.match(routeSource, /if \(!event && !series\)/);
  assert.match(routeSource, /if \(series\)/);
  assert.match(listingSource, /event\.displayDateLabel \|\| formatPublicEventListingDateTime/);
  assert.match(listingSource, /public_recurring_series/);
  assert.match(selectorSource, /PublicBreadcrumbs/);
  assert.match(selectorSource, /Manage booking/);
  assert.match(selectorSource, /booking\/next-steps/);
  assert.match(selectorSource, /currentBooking/);
  assert.match(selectorSource, /label: "Events"/);
  assert.match(selectorSource, /Choose an occurrence/);
  assert.match(selectorSource, /Recurring event/);
  assert.match(breadcrumbSource, /aria-label="Breadcrumb"/);
  assert.match(breadcrumbSource, /item\.href && !isCurrent/);
});
