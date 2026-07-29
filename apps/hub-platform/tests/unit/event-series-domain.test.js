import test from "node:test";
import assert from "node:assert/strict";
import {
  buildEventSeriesSchedulePreview,
  buildRecurringEventOccurrenceSlug,
  generateEventSeriesOccurrenceSchedules,
  normalizeCreateEventSeriesPayload,
} from "../../src/lib/domain/event-series.js";

function buildBasePayload(overrides = {}) {
  return {
    title: "Morning Yoga",
    description: [{ type: "paragraph", children: [{ text: "Bring a mat." }] }],
    location: "Studio one",
    category: "Workshop",
    recurrenceFrequency: "weekly",
    recurrenceInterval: "1",
    recurrenceStartDate: "2026-06-01",
    recurrenceUntilDate: "2026-06-30",
    recurrenceDaysOfWeek: ["2", "4"],
    startTime: "18:30",
    endTime: "19:30",
    ...overrides,
  };
}

test("normalizeCreateEventSeriesPayload validates and normalizes recurring series payloads", () => {
  const payload = normalizeCreateEventSeriesPayload(buildBasePayload(), {
    hubTimezone: "Europe/London",
  });

  assert.equal(payload.slugBase, "morning-yoga");
  assert.equal(payload.timezone, "Europe/London");
  assert.equal(payload.recurrenceFrequency, "weekly");
  assert.equal(payload.recurrenceInterval, 1);
  assert.deepEqual(payload.recurrenceDaysOfWeek, [2, 4]);
  assert.equal(payload.occurrenceGenerationWindowStartDate, "2026-06-01");
  assert.equal(payload.occurrenceGenerationWindowEndDate, "2026-06-30");
});

test("normalizeCreateEventSeriesPayload uses the USD-first timezone fallback when no hub timezone is provided", () => {
  const payload = normalizeCreateEventSeriesPayload(buildBasePayload());

  assert.equal(payload.timezone, "America/New_York");
});

test("normalizeCreateEventSeriesPayload rejects until dates beyond six months and missing weekly weekdays", () => {
  assert.throws(
    () =>
      normalizeCreateEventSeriesPayload(
        buildBasePayload({
          recurrenceUntilDate: "2026-12-31",
        }),
        { hubTimezone: "Europe/London" }
      ),
    /Recurring event until date cannot be more than 6 months after the start date\./
  );

  assert.throws(
    () =>
      normalizeCreateEventSeriesPayload(
        buildBasePayload({
          recurrenceDaysOfWeek: [],
        }),
        { hubTimezone: "Europe/London" }
      ),
    /Weekly recurring events require at least one weekday\./
  );
});

test("generateEventSeriesOccurrenceSchedules creates daily occurrences on the configured interval", () => {
  const occurrences = generateEventSeriesOccurrenceSchedules(
    normalizeCreateEventSeriesPayload(
      buildBasePayload({
        recurrenceFrequency: "daily",
        recurrenceInterval: "2",
        recurrenceUntilDate: "2026-06-07",
      }),
      { hubTimezone: "Europe/London" }
    )
  );

  assert.deepEqual(
    occurrences.map((occurrence) => occurrence.occurrenceDate),
    ["2026-06-01", "2026-06-03", "2026-06-05", "2026-06-07"]
  );
});

test("generateEventSeriesOccurrenceSchedules creates weekly occurrences on selected weekdays", () => {
  const occurrences = generateEventSeriesOccurrenceSchedules(
    normalizeCreateEventSeriesPayload(buildBasePayload(), {
      hubTimezone: "Europe/London",
    })
  );

  assert.deepEqual(
    occurrences.map((occurrence) => occurrence.occurrenceDate),
    ["2026-06-02", "2026-06-04", "2026-06-09", "2026-06-11", "2026-06-16", "2026-06-18", "2026-06-23", "2026-06-25", "2026-06-30"]
  );
});

test("generateEventSeriesOccurrenceSchedules creates monthly occurrences and skips invalid dates", () => {
  const occurrences = generateEventSeriesOccurrenceSchedules(
    normalizeCreateEventSeriesPayload(
      buildBasePayload({
        recurrenceFrequency: "monthly",
        recurrenceInterval: "1",
        recurrenceStartDate: "2026-01-31",
        recurrenceUntilDate: "2026-05-31",
        recurrenceDayOfMonth: "31",
      }),
      { hubTimezone: "Europe/London" }
    )
  );

  assert.deepEqual(
    occurrences.map((occurrence) => occurrence.occurrenceDate),
    ["2026-01-31", "2026-03-31", "2026-05-31"]
  );
});

test("schedule preview and generated slug helpers are deterministic", () => {
  const series = normalizeCreateEventSeriesPayload(buildBasePayload(), {
    hubTimezone: "Europe/London",
  });
  const preview = buildEventSeriesSchedulePreview(series, { previewCount: 3 });

  assert.equal(preview.totalOccurrences, 9);
  assert.deepEqual(preview.previewDates, ["2026-06-02", "2026-06-04", "2026-06-09"]);
  assert.equal(buildRecurringEventOccurrenceSlug("morning-yoga", "2026-06-04"), "morning-yoga-2026-06-04");
  assert.equal(buildRecurringEventOccurrenceSlug("morning-yoga", "2026-06-04", 2), "morning-yoga-2026-06-04-2");
});
