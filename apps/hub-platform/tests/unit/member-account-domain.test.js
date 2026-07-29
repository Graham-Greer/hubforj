import test from "node:test";
import assert from "node:assert/strict";
import { buildMemberBillingItems, buildMemberDetail, buildMemberPaymentItems } from "../../src/lib/domain/member-account.js";

test("buildMemberPaymentItems includes membership and payable bookings only", () => {
  const items = buildMemberPaymentItems({
    membership: {
      id: "m1",
      planTitle: "Annual membership",
      paymentStatus: "paid",
      planPrice: "30",
      planCurrency: "GBP",
      renewalDate: "2026-04-01T00:00:00.000Z",
      derivedStatus: "active",
    },
    eventBookings: [
      {
        id: "r1",
        eventTitle: "Paid event",
        status: "active",
        paymentStatus: "pending",
        amountDisplay: "12",
        currency: "GBP",
        eventStartAt: "2026-03-20T10:00:00.000Z",
        eventLocation: "Town hall",
      },
      {
        id: "r2",
        eventTitle: "Free event",
        status: "active",
        paymentStatus: "not_required",
        amountDisplay: "",
        currency: "GBP",
        eventStartAt: "2026-03-21T10:00:00.000Z",
      },
    ],
    courseRegistrations: [
      {
        id: "c1",
        courseTitle: "Course enrolment",
        paymentStatus: "overdue",
        price: "48",
        currency: "GBP",
        courseStartAt: "2026-03-22T10:00:00.000Z",
        courseScheduleSummary: "Weekly",
      },
    ],
  });

  assert.equal(items.length, 3);
  assert.equal(items[0].kind, "membership");
  assert.equal(items[1].kind, "course");
  assert.equal(items[2].kind, "event");
});

test("buildMemberDetail exposes totals and action-required count", () => {
  const detail = buildMemberDetail({
    user: { id: "user_1", name: "Alex" },
    membership: { id: "m1" },
    registrations: [{ id: "r1" }, { id: "r2" }],
    courseRegistrations: [{ id: "c1" }],
    paymentItems: [
      { id: "p1", paymentStatus: "paid" },
      { id: "p2", paymentStatus: "unpaid" },
      { id: "p3", paymentStatus: "overdue" },
    ],
  });

  assert.equal(detail.user.name, "Alex");
  assert.deepEqual(detail.totals, {
    registrations: 2,
    courses: 1,
    paymentItems: 3,
    actionRequired: 2,
  });
});

test("buildMemberBillingItems renders free membership amounts as Free", () => {
  const items = buildMemberBillingItems({
    hub: {
      slug: "test-hub",
      locale: "es-ES",
    },
    items: [
      {
        id: "membership_current",
        kind: "membership",
        title: "Community Membership",
        pricingMode: "free",
        amount: "0",
        currency: "EUR",
        paymentStatus: "not_required",
        dueDate: "2026-03-20T10:00:00.000Z",
      },
    ],
  });

  assert.equal(items[0].amountLabel, "Free");
});

test("buildMemberBillingItems renders free event and course zero-minor records as Free", () => {
  const items = buildMemberBillingItems({
    hub: {
      slug: "test-hub",
      locale: "es-ES",
    },
    items: [
      {
        id: "event_free",
        kind: "event",
        title: "Free event",
        amountMinor: 0,
        currency: "EUR",
        paymentStatus: "not_required",
        dueDate: "2026-03-21T10:00:00.000Z",
      },
      {
        id: "course_free",
        kind: "course",
        title: "Free course",
        amountMinor: 0,
        currency: "EUR",
        paymentStatus: "not_required",
        dueDate: "2026-03-22T10:00:00.000Z",
      },
    ],
  });

  assert.equal(items[0].amountLabel, "Free");
  assert.equal(items[1].amountLabel, "Free");
  assert.equal(items[0].dateLabelPrefix, "Course date");
  assert.equal(items[1].dateLabelPrefix, "Event date");
});

test("buildMemberBillingItems explains membership renewal and native payment dates", () => {
  const items = buildMemberBillingItems({
    hub: {
      slug: "test-hub",
      locale: "en-GB",
    },
    items: [
      {
        id: "membership_current",
        kind: "membership",
        title: "Community Membership",
        amount: "0",
        paymentStatus: "not_required",
        dueDate: "2026-03-20T10:00:00.000Z",
      },
      {
        id: "native_upgrade",
        kind: "membership",
        title: "Membership upgrade",
        amount: "49",
        currency: "GBP",
        paymentStatus: "paid",
        dueDate: "2026-03-21T10:00:00.000Z",
        nativePaymentTransactionId: "txn_123",
      },
    ],
  });

  assert.equal(items[0].dateLabelPrefix, "Payment date");
  assert.equal(items[1].dateLabelPrefix, "Renewal date");
});

test("cancelled booking payment items stay visible but do not count as attention", () => {
  const paymentItems = buildMemberPaymentItems({
    eventBookings: [
      {
        id: "r1",
        status: "cancelled",
        eventTitle: "Cancelled paid event",
        paymentStatus: "pending",
        amountDisplay: "12",
        currency: "GBP",
        eventStartAt: "2026-03-20T10:00:00.000Z",
      },
      {
        id: "r2",
        status: "active",
        eventTitle: "Active paid event",
        paymentStatus: "pending",
        amountDisplay: "10",
        currency: "GBP",
        eventStartAt: "2026-03-21T10:00:00.000Z",
      },
    ],
    courseRegistrations: [],
  });

  assert.equal(paymentItems.length, 2);
  assert.equal(paymentItems[0].status, "active");
  assert.equal(paymentItems[1].status, "cancelled");

  const detail = buildMemberDetail({
    user: { id: "user_1", name: "Alex" },
    registrations: [],
    courseRegistrations: [],
    paymentItems,
  });

  assert.equal(detail.totals.actionRequired, 1);
});

test("member account source now loads event bookings into overview and payment models", async () => {
  const { readFileSync } = await import("node:fs");
  const accountPageSource = readFileSync(
    new URL("../../src/app/(hub)/[hubSlug]/account/page.jsx", import.meta.url),
    "utf8"
  );
  const paymentDataSource = readFileSync(
    new URL("../../src/lib/data/member-payments.js", import.meta.url),
    "utf8"
  );

  assert.match(accountPageSource, /listEventBookingsByBooker/);
  assert.doesNotMatch(accountPageSource, /listRegistrationsByUser/);
  assert.match(paymentDataSource, /listEventBookingsByBooker/);
  assert.doesNotMatch(paymentDataSource, /listRegistrationsByUser/);
});
