import test from "node:test";
import assert from "node:assert/strict";

import {
  formatPublicRecurringSeriesLabel,
  groupPublicEventListings,
} from "../../src/lib/domain/public-events.js";

test("public event listings collapse recurring occurrences into one series card", () => {
  const grouped = groupPublicEventListings(
    [
      {
        id: "event_1",
        slug: "yoga-flow-2026-06-10",
        title: "Yoga Flow",
        summary: "Occurrence one",
        eventKind: "series_occurrence",
        seriesId: "series_1",
        startDate: "2026-06-10",
        endDate: "2026-06-10",
        startTime: "18:00",
        endTime: "19:00",
        startAt: "2026-06-10T18:00:00.000Z",
        location: "Studio A",
        pricingMode: "free",
        category: "wellness",
      },
      {
        id: "event_2",
        slug: "yoga-flow-2026-06-17",
        title: "Yoga Flow",
        summary: "Occurrence two",
        eventKind: "series_occurrence",
        seriesId: "series_1",
        startDate: "2026-06-17",
        endDate: "2026-06-17",
        startTime: "18:00",
        endTime: "19:00",
        startAt: "2026-06-17T18:00:00.000Z",
        location: "Studio A",
        pricingMode: "free",
        category: "wellness",
      },
      {
        id: "event_3",
        slug: "summer-social",
        title: "Summer social",
        summary: "Standalone event",
        eventKind: "single",
        startDate: "2026-06-12",
        endDate: "2026-06-12",
        startTime: "19:00",
        endTime: "21:00",
        startAt: "2026-06-12T19:00:00.000Z",
        location: "Terrace",
        pricingMode: "free",
        category: "social",
      },
    ],
    [
      {
        id: "series_1",
        slugBase: "yoga-flow",
        title: "Yoga Flow",
        summary: "Weekly evening practice.",
        status: "published",
        visibility: "public",
        location: "Studio A",
        pricingMode: "free",
        category: "wellness",
      },
    ],
    "en-GB"
  );

  assert.equal(grouped.length, 2);
  assert.equal(grouped[0].eventKind, "public_recurring_series");
  assert.equal(grouped[0].slug, "yoga-flow");
  assert.match(grouped[0].displayDateLabel, /Recurring/);
  assert.equal(grouped[1].slug, "summer-social");
});

test("public recurring series labels reflect the next occurrence timing", () => {
  const label = formatPublicRecurringSeriesLabel(
    { id: "series_1", title: "Yoga Flow" },
    {
      startDate: "2026-06-10",
      endDate: "2026-06-10",
      startTime: "18:00",
      endTime: "19:00",
    },
    "en-GB"
  );

  assert.match(label, /Recurring/);
  assert.match(label, /10 Jun/i);
});
