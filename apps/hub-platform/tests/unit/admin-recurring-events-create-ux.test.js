import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("event create flow exposes recurring schedule controls and preview within the existing wizard", () => {
  const formSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/events/create/CreateEventForm.jsx", import.meta.url),
    "utf8"
  );
  const fieldsSource = readFileSync(
    new URL("../../src/components/patterns/event-form-fields/EventFormFields.jsx", import.meta.url),
    "utf8"
  );

  assert.match(formSource, /recurringEventsEnabled === true/);
  assert.match(formSource, /Recurring events start on Starter/);
  assert.match(fieldsSource, /name="scheduleMode"/);
  assert.match(fieldsSource, /Repeating event/);
  assert.match(fieldsSource, /name="recurrenceUntilDate"/);
  assert.match(fieldsSource, /name="recurrenceFrequency"/);
  assert.match(fieldsSource, /name="recurrenceInterval"/);
  assert.match(fieldsSource, /name="recurrenceDayOfMonth"/);
  assert.match(fieldsSource, /recurrenceDaysOfWeek/);
  assert.match(fieldsSource, /buildEventSeriesSchedulePreview/);
  assert.match(fieldsSource, /Occurrence preview/);
});

test("event create action routes recurring submissions through the event series path", () => {
  const actionSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/events/create/actions.js", import.meta.url),
    "utf8"
  );
  const mutationSource = readFileSync(
    new URL("../../src/lib/data/event-series-mutations.js", import.meta.url),
    "utf8"
  );

  assert.match(actionSource, /createEventSeriesByHubSlug/);
  assert.match(actionSource, /scheduleMode === "recurring"/);
  assert.match(actionSource, /recurrenceStartDate: values\.startDate/);
  assert.match(actionSource, /recurrenceUntilDate: values\.recurrenceUntilDate/);
  assert.match(actionSource, /admin\/events\/series\/\$\{series\.id\}/);
  assert.match(mutationSource, /firstOccurrenceId/);
  assert.match(mutationSource, /listEventSeriesOccurrences/);
});
