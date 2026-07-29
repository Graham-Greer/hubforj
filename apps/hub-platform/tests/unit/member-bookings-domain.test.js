import test from "node:test";
import assert from "node:assert/strict";
import { buildUnifiedBookingItems } from "../../src/lib/domain/member-account.js";

test("buildUnifiedBookingItems routes unpaid event bookings to event next steps", () => {
  const items = buildUnifiedBookingItems({
    hub: { slug: "oak-hill", locale: "en-GB" },
    eventBookings: [
      {
        id: "r1",
        eventId: "e1",
        eventTitle: "Spring Gala",
        eventSlug: "spring-gala",
        eventStartDate: "2026-05-10",
        eventEndDate: "2026-05-10",
        eventLocation: "Town Hall",
        eventImageUrl: "https://example.test/event.jpg",
        eventImageAlt: "Spring Gala poster",
        status: "active",
        paymentStatus: "pending",
      },
    ],
    courseRegistrations: [],
  });

  assert.equal(items.length, 1);
  assert.equal(items[0].primaryAction.label, "View next steps");
  assert.equal(items[0].primaryAction.href, "/oak-hill/events/spring-gala/booking/next-steps");
  assert.equal(items[0].statusHelpText, "Complete payment to secure your booking.");
  assert.equal(items[0].imageUrl, "https://example.test/event.jpg");
  assert.equal(items[0].showPaymentBadge, true);
  assert.equal(items[0].showAttendanceBadge, false);
});

test("buildUnifiedBookingItems can generate host-local event next steps links", () => {
  const items = buildUnifiedBookingItems({
    hub: { slug: "oak-hill", locale: "en-GB" },
    routeMode: "host",
    eventBookings: [
      {
        id: "r1",
        eventId: "e1",
        eventTitle: "Spring Gala",
        eventSlug: "spring-gala",
        eventStartDate: "2026-05-10",
        eventEndDate: "2026-05-10",
        eventLocation: "Town Hall",
        status: "active",
        paymentStatus: "pending",
      },
    ],
    courseRegistrations: [],
  });

  assert.equal(items[0].primaryAction.href, "/events/spring-gala/booking/next-steps");
});

test("buildUnifiedBookingItems routes unpaid course enrolments to course next steps", () => {
  const items = buildUnifiedBookingItems({
    hub: { slug: "oak-hill", locale: "en-GB" },
    registrations: [],
    courseRegistrations: [
      {
        id: "c1",
        courseId: "course_1",
        courseTitle: "Leadership Cohort",
        courseSlug: "leadership-cohort",
        courseStartAt: "2026-06-01T10:00:00.000Z",
        courseEndAt: "2026-06-01T16:00:00.000Z",
        courseFormat: "in-person",
        courseFormatLabel: "In person",
        courseLocation: "Studio One",
        courseImageUrl: "https://example.test/course.jpg",
        courseImageAlt: "Leadership Cohort cover",
        status: "enrolled",
        paymentStatus: "overdue",
        attendanceStatus: "in_progress",
      },
    ],
  });

  assert.equal(items.length, 1);
  assert.equal(items[0].primaryAction.label, "View next steps");
  assert.equal(items[0].primaryAction.href, "/oak-hill/courses/leadership-cohort/enrolment/next-steps");
  assert.equal(items[0].statusHelpText, "Complete payment to secure your booking.");
  assert.equal(items[0].locationLabel, "Studio One");
  assert.equal(items[0].showPaymentBadge, true);
  assert.equal(items[0].showAttendanceBadge, true);
});

test("buildUnifiedBookingItems explains refundable Growth course cancellations", () => {
  const items = buildUnifiedBookingItems({
    hub: { slug: "oak-hill", locale: "en-GB", packagePaymentProcessingMode: "internal" },
    registrations: [],
    courseRegistrations: [
      {
        id: "c3",
        courseId: "course_3",
        courseTitle: "Leadership Cohort",
        courseSlug: "leadership-cohort",
        courseStartAt: "2099-06-01T10:00:00.000Z",
        courseEndAt: "2099-06-01T16:00:00.000Z",
        courseFormat: "online",
        courseFormatLabel: "Online",
        status: "enrolled",
        paymentStatus: "paid",
        attendanceStatus: "pending",
        pricingMode: "paid",
        refundWindowMode: "custom",
        refundWindowHours: 24,
        refundPolicy: "full_refund_before_window",
      },
    ],
  });

  assert.match(items[0].cancellationPolicySummary, /refunded in full/i);
  assert.match(items[0].statusHelpText, /refund cutoff/i);
});

test("buildUnifiedBookingItems explains refunded course enrolments clearly", () => {
  const items = buildUnifiedBookingItems({
    hub: { slug: "oak-hill", locale: "en-GB", packagePaymentProcessingMode: "internal" },
    registrations: [],
    courseRegistrations: [
      {
        id: "c4",
        courseId: "course_4",
        courseTitle: "Leadership Cohort",
        courseSlug: "leadership-cohort",
        courseStartAt: "2099-06-01T10:00:00.000Z",
        courseEndAt: "2099-06-01T16:00:00.000Z",
        courseFormat: "online",
        courseFormatLabel: "Online",
        status: "cancelled",
        paymentStatus: "refunded",
        attendanceStatus: "pending",
        pricingMode: "paid",
      },
    ],
  });

  assert.equal(items[0].statusHelpText, "Your payment was refunded after cancellation.");
});

test("buildUnifiedBookingItems can generate host-local course next steps links", () => {
  const items = buildUnifiedBookingItems({
    hub: { slug: "oak-hill", locale: "en-GB" },
    routeMode: "host",
    registrations: [],
    courseRegistrations: [
      {
        id: "c1",
        courseId: "course_1",
        courseTitle: "Leadership Cohort",
        courseSlug: "leadership-cohort",
        courseStartAt: "2026-06-01T10:00:00.000Z",
        courseEndAt: "2026-06-01T16:00:00.000Z",
        courseFormat: "in-person",
        courseFormatLabel: "In person",
        courseLocation: "Studio One",
        status: "enrolled",
        paymentStatus: "overdue",
        attendanceStatus: "in_progress",
      },
    ],
  });

  assert.equal(items[0].primaryAction.href, "/courses/leadership-cohort/enrolment/next-steps");
});

test("buildUnifiedBookingItems uses course delivery metadata instead of repeating the schedule line", () => {
  const items = buildUnifiedBookingItems({
    hub: { slug: "oak-hill", locale: "en-GB" },
    registrations: [],
    courseRegistrations: [
      {
        id: "c2",
        courseId: "course_2",
        courseTitle: "Remote Facilitation",
        courseSlug: "remote-facilitation",
        courseStartAt: "2026-07-10T09:00:00.000Z",
        courseEndAt: "2026-07-13T15:30:00.000Z",
        courseScheduleSummary: "Fri, 10 Jul 2026 - Mon, 13 Jul 2026 • 09:00 - 15:30",
        courseFormat: "online",
        courseFormatLabel: "Online",
        courseLocation: "",
        status: "enrolled",
        paymentStatus: "not_required",
        attendanceStatus: "pending",
      },
    ],
  });

  assert.equal(items.length, 1);
  assert.notEqual(items[0].locationLabel, items[0].dateLabel);
  assert.equal(items[0].locationLabel, "Online");
});

test("buildUnifiedBookingItems hides payment badges for free bookings", () => {
  const items = buildUnifiedBookingItems({
    hub: { slug: "oak-hill", locale: "en-GB" },
    eventBookings: [
      {
        id: "r1",
        eventId: "e1",
        eventTitle: "Community Picnic",
        eventSlug: "community-picnic",
        eventStartDate: "2099-05-10",
        eventEndDate: "2099-05-10",
        eventLocation: "Riverside Park",
        status: "active",
        paymentStatus: "not_required",
      },
    ],
    courseRegistrations: [],
  });

  assert.equal(items[0].showPaymentBadge, false);
});

test("buildUnifiedBookingItems labels recurring event occurrences distinctly", () => {
  const items = buildUnifiedBookingItems({
    hub: { slug: "oak-hill", locale: "en-GB" },
    eventBookings: [
      {
        id: "r2",
        eventId: "e2",
        eventTitle: "Morning Yoga",
        eventSlug: "morning-yoga-2026-05-10",
        eventKind: "series_occurrence",
        seriesId: "series_1",
        isSeriesManaged: true,
        eventStartDate: "2026-05-10",
        eventEndDate: "2026-05-10",
        eventLocation: "Studio One",
        status: "active",
        paymentStatus: "not_required",
      },
    ],
    courseRegistrations: [],
  });

  assert.equal(items[0].typeLabel, "Recurring event");
  assert.equal(items[0].primaryAction.label, "View event");
});

test("member bookings workspace source shows payment guidance and image-aware layout", async () => {
  const { readFileSync } = await import("node:fs");
  const source = readFileSync(
    new URL("../../src/components/patterns/member-bookings-workspace/MemberBookingsWorkspace.jsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /item\.imageUrl/);
  assert.match(source, /statusHelpText/);
  assert.match(source, /showAttendanceBadge/);
  assert.match(source, /cancellationPolicySummary/);
  assert.doesNotMatch(source, /Refund handling will be confirmed later when payment processing is in place\./);
});

test("member bookings page source now loads event bookings rather than event registrations", async () => {
  const { readFileSync } = await import("node:fs");
  const source = readFileSync(
    new URL("../../src/app/(hub)/[hubSlug]/account/bookings/page.jsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /listEventBookingsByBooker/);
  assert.doesNotMatch(source, /listRegistrationsByUser/);
});
