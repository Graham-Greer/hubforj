import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("recurring event series workspace exposes series editing and occurrence management together", () => {
  const pageSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/events/series/[seriesId]/page.jsx", import.meta.url),
    "utf8"
  );
  const workspaceSource = readFileSync(
    new URL("../../src/components/patterns/event-series-workspace/EventSeriesWorkspace.jsx", import.meta.url),
    "utf8"
  );
  const formSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/events/series/[seriesId]/EditEventSeriesForm.jsx", import.meta.url),
    "utf8"
  );
  const actionSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/events/series/[seriesId]/actions.js", import.meta.url),
    "utf8"
  );

  assert.match(pageSource, /getEventSeriesById/);
  assert.match(pageSource, /listEventSeriesOccurrences/);
  assert.match(pageSource, /EventSeriesWorkspace/);
  assert.match(workspaceSource, /Open recurring series|Edit recurring event/);
  assert.match(workspaceSource, /Occurrences/);
  assert.match(workspaceSource, /PaginationControls/);
  assert.match(workspaceSource, /type="date"/);
  assert.match(workspaceSource, /Has bookings/);
  assert.match(workspaceSource, /getOccurrenceBookingState/);
  assert.match(workspaceSource, /No occurrences match the current filters\./);
  assert.match(workspaceSource, /Attending/);
  assert.match(workspaceSource, /Manage bookings/);
  assert.match(workspaceSource, /Manage attendance/);
  assert.match(formSource, /scheduleMode: "recurring"/);
  assert.match(formSource, /lockScheduleModeToRecurring/);
  assert.match(formSource, /updateEventSeriesAction/);
  assert.match(actionSource, /updateEventSeriesById/);
  assert.match(actionSource, /formatRecurringSaveSuccessMessage/);
});

test("series occurrences stay operational while settings changes remain on the parent series", () => {
  const eventDetailPageSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/events/[eventId]/page.jsx", import.meta.url),
    "utf8"
  );
  const eventDetailWorkspaceSource = readFileSync(
    new URL("../../src/components/patterns/event-detail-workspace/EventDetailWorkspace.jsx", import.meta.url),
    "utf8"
  );
  const eventsPageSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/events/page.jsx", import.meta.url),
    "utf8"
  );

  assert.match(eventDetailPageSource, /event\?\.eventKind !== "series_occurrence"/);
  assert.match(eventDetailWorkspaceSource, /Open recurring series/);
  assert.match(eventDetailWorkspaceSource, /Recurring occurrence/);
  assert.match(eventsPageSource, /listEventSeriesByHubSlug/);
  assert.match(eventsPageSource, /Open series/);
  assert.match(eventsPageSource, /const seriesItems = eventSeries\.map/);
});
