import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateEventRefundEligibility,
  formatEventCapacity,
  formatEventDateRange,
  formatEventPrice,
  getEventEligibilityLabel,
  getEventStatusLabel,
  getEventStatusTone,
  getEventVisibilityLabel,
  isEventPubliclyVisible,
  normalizeCreateEventPayload,
  normalizeEventCurrency,
  normalizeEventInteger,
  normalizeEventSlug,
} from "../../src/lib/domain/events.js";

test("event status helpers map supported states", () => {
  assert.equal(getEventStatusLabel("draft"), "Draft");
  assert.equal(getEventStatusTone("published"), "success");
  assert.equal(getEventStatusTone("unknown"), "neutral");
});

test("formatEventDateRange returns fallback when dates are invalid", () => {
  assert.equal(formatEventDateRange("", ""), "Date to be confirmed");
});

test("event create payload normalizes slug numbers and defaults", () => {
  const payload = normalizeCreateEventPayload({
    title: "Community Welcome Evening",
    slug: "",
    description: [{ type: "paragraph", children: [{ text: "Event description" }] }],
    location: "Main hall",
    startDate: "2026-03-09",
    endDate: "2026-03-09",
    startTime: "18:00",
    endTime: "20:00",
    capacity: "24",
    pricingMode: "free",
    currency: "usd",
    externalPaymentUrl: "",
    paymentInstructions: "",
    category: "Workshop",
  });

  assert.equal(normalizeEventSlug(" Community Welcome Evening "), "community-welcome-evening");
  assert.equal(normalizeEventInteger("24"), 24);
  assert.equal(normalizeEventCurrency("usd"), "USD");
  assert.equal(payload.slug, "community-welcome-evening");
  assert.equal(payload.capacity, 24);
  assert.equal(payload.currency, "USD");
  assert.equal(payload.externalPaymentUrl, "");
  assert.equal(payload.paymentInstructions, "");
  assert.equal(payload.refundWindowMode, "default");
  assert.equal(payload.refundWindowHours, 48);
  assert.equal(payload.refundPolicy, "full_refund_before_window");
  assert.equal(payload.visibility, "public");
  assert.equal(payload.registrationEligibility, "members-only");
  assert.equal(payload.bookingMode, "single_attendee");
  assert.equal(payload.maxAttendeesPerBooking, 1);
  assert.equal(payload.guestDetailsMode, "name_only");
  assert.equal(payload.status, "draft");
});

test("event create payload preserves group-booking configuration when guests are allowed", () => {
  const payload = normalizeCreateEventPayload({
    title: "Family Workshop",
    description: [{ type: "paragraph", children: [{ text: "Event description" }] }],
    location: "Main hall",
    startDate: "2026-03-09",
    endDate: "2026-03-09",
    startTime: "18:00",
    endTime: "20:00",
    category: "Workshop",
    registrationEligibility: "guests-allowed",
    bookingMode: "group_booking",
    maxAttendeesPerBooking: "5",
    guestDetailsMode: "name_only",
  });

  assert.equal(payload.registrationEligibility, "guests-allowed");
  assert.equal(payload.bookingMode, "group_booking");
  assert.equal(payload.maxAttendeesPerBooking, 5);
  assert.equal(payload.guestDetailsMode, "name_only");
});

test("event create payload rejects invalid date order and missing paid price", () => {
  assert.throws(
    () =>
      normalizeCreateEventPayload({
        title: "Bad Event",
        description: [{ type: "paragraph", children: [{ text: "Event description" }] }],
        location: "Main hall",
        startDate: "2026-03-10",
        endDate: "2026-03-09",
        category: "Workshop",
      }),
    /Event end date must be on or after the start date\./
  );

  assert.throws(
    () =>
      normalizeCreateEventPayload({
        title: "Paid Event",
        description: [{ type: "paragraph", children: [{ text: "Event description" }] }],
        location: "Main hall",
        startDate: "2026-03-09",
        endDate: "2026-03-09",
        startTime: "18:00",
        endTime: "20:00",
        pricingMode: "paid",
        price: "",
        category: "Workshop",
      }),
    /Paid events require a price\./
  );

  assert.throws(
    () =>
      normalizeCreateEventPayload({
        title: "Same Time Event",
        description: [{ type: "paragraph", children: [{ text: "Event description" }] }],
        location: "Main hall",
        startDate: "2026-03-09",
        endDate: "2026-03-09",
        startTime: "18:00",
        endTime: "18:00",
        category: "Workshop",
      }),
    /For a single-day event, end time must be after start time\./
  );

  assert.throws(
    () =>
      normalizeCreateEventPayload({
        title: "Linked Event",
        description: [{ type: "paragraph", children: [{ text: "Event description" }] }],
        location: "Main hall",
        startDate: "2026-03-09",
        endDate: "2026-03-09",
        startTime: "18:00",
        endTime: "20:00",
        pricingMode: "paid",
        price: "12.00",
        externalPaymentUrl: "ftp://payments.example.com/checkout",
        category: "Workshop",
      }),
    /External payment link must use http or https\./
  );

  assert.throws(
    () =>
      normalizeCreateEventPayload({
        title: "Refund Window Event",
        description: [{ type: "paragraph", children: [{ text: "Event description" }] }],
        location: "Main hall",
        startDate: "2026-03-09",
        endDate: "2026-03-09",
        startTime: "18:00",
        endTime: "20:00",
        pricingMode: "paid",
        price: "12.00",
        refundWindowMode: "custom",
        refundWindowHours: "0",
        category: "Workshop",
      }),
    /Custom refund window hours must be greater than zero\./
  );
});

test("formatEventPrice distinguishes free paid and invalid paid pricing", () => {
  assert.equal(formatEventPrice({ pricingMode: "free" }), "Free");
  assert.match(formatEventPrice({ pricingMode: "paid", price: "12.50", currency: "GBP" }), /£12\.50/);
  assert.match(formatEventPrice({ pricingMode: "paid", price: "12.50", currency: "EUR" }, "es-ES"), /^€\s?12\.50$/);
  assert.equal(formatEventPrice({ pricingMode: "paid", price: "abc", currency: "usd" }), "Paid • USD");
});

test("event capacity and visibility labels use operational defaults", () => {
  assert.equal(formatEventCapacity(0), "Open capacity");
  assert.equal(formatEventCapacity(24), "24/24 places left");
  assert.equal(formatEventCapacity(24, 17), "7/24 places left");
  assert.equal(getEventVisibilityLabel("members-only"), "Members only");
  assert.equal(getEventVisibilityLabel("public"), "Public");
  assert.equal(getEventEligibilityLabel("guests-allowed"), "Members may book guests");
  assert.equal(getEventEligibilityLabel("members-only"), "Members only");
});

test("isEventPubliclyVisible only exposes published events", () => {
  assert.equal(
    isEventPubliclyVisible({ status: "published", startAt: "2099-03-10T18:00", endAt: "2099-03-10T20:00" }),
    true
  );
  assert.equal(
    isEventPubliclyVisible({ status: "published", startAt: "2020-03-10T18:00", endAt: "2020-03-10T20:00" }),
    false
  );
  assert.equal(isEventPubliclyVisible({ status: "draft", startAt: "2099-03-10T18:00" }), false);
});

test("event refund eligibility distinguishes refundable cutoff and non-refundable policies", () => {
  const refundable = evaluateEventRefundEligibility(
    {
      pricingMode: "paid",
      startAt: "2099-03-10T18:00:00.000Z",
      refundWindowMode: "custom",
      refundWindowHours: 24,
      refundPolicy: "full_refund_before_window",
    },
    {
      paymentStatus: "paid",
      now: "2099-03-09T17:00:00.000Z",
    }
  );
  const outsideWindow = evaluateEventRefundEligibility(
    {
      pricingMode: "paid",
      startAt: "2099-03-10T18:00:00.000Z",
      refundWindowMode: "custom",
      refundWindowHours: 24,
      refundPolicy: "full_refund_before_window",
    },
    {
      paymentStatus: "paid",
      now: "2099-03-09T19:00:00.000Z",
    }
  );
  const nonRefundable = evaluateEventRefundEligibility(
    {
      pricingMode: "paid",
      startAt: "2099-03-10T18:00:00.000Z",
      refundPolicy: "non_refundable",
    },
    {
      paymentStatus: "paid",
      now: "2099-03-09T12:00:00.000Z",
    }
  );

  assert.equal(refundable.refundable, true);
  assert.equal(refundable.reason, "before_cutoff");
  assert.equal(outsideWindow.refundable, false);
  assert.equal(outsideWindow.reason, "outside_refund_window");
  assert.equal(nonRefundable.refundable, false);
  assert.equal(nonRefundable.reason, "policy_non_refundable");
});
