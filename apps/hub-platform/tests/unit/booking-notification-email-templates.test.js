import test from "node:test";
import assert from "node:assert/strict";
import { renderBookingNotificationEmail } from "../../src/lib/server/booking-notification-email.js";

function buildBaseNotification(kind, overrides = {}) {
  return {
    kind,
    recipientEmail: "member@example.com",
    payload: {
      hub: {
        name: "Madrid Makers",
        slug: "madrid-makers",
        country: "ES",
        locale: "es-ES",
        routeMode: "path",
      },
      recipient: {
        name: "Alex Member",
        email: "member@example.com",
      },
      offering: {
        kind: "event",
        title: "Community Sprint",
        slug: "community-sprint",
        startDate: "2026-06-20",
        endDate: "2026-06-20",
        startTime: "09:00",
        endTime: "10:00",
        location: "Hub Studio",
        pricingMode: "paid",
        price: "19",
        currency: "EUR",
      },
      ...overrides,
    },
  };
}

test("confirmed booking template renders an English launch-format schedule", () => {
  const rendered = renderBookingNotificationEmail(
    buildBaseNotification("event_booking_confirmed")
  );

  assert.match(rendered.subject, /Your booking is confirmed/);
  assert.match(rendered.html, /Madrid Makers/);
  assert.match(rendered.text, /Sent on behalf of Madrid Makers via Hubforj\./);
  assert.match(rendered.text, /View event: https:\/\/community\.hubforj\.com\/madrid-makers\/events\/community-sprint/);
  assert.match(rendered.html, /Sat, 20 Jun 2026/);
  assert.doesNotMatch(rendered.html, /\bjue\b|\bsáb\b|de junio/i);
});

test("booking template uses connected custom domains only for host-mode hubs", () => {
  const rendered = renderBookingNotificationEmail(
    buildBaseNotification("event_booking_confirmed", {
      hub: {
        name: "Madrid Makers",
        slug: "madrid-makers",
        country: "ES",
        locale: "es-ES",
        routeMode: "host",
        customDomain: {
          status: "connected",
          hostname: "members.madridmakers.org",
        },
      },
    })
  );

  assert.match(rendered.text, /View event: https:\/\/members\.madridmakers\.org\/events\/community-sprint/);
});

test("waitlist booking template does not imply a confirmed place", () => {
  const rendered = renderBookingNotificationEmail(
    buildBaseNotification("event_booking_waitlisted")
  );

  assert.match(rendered.subject, /waitlist/i);
  assert.match(rendered.text, /does not confirm a place yet/i);
});

test("pending payment template does not imply successful payment", () => {
  const rendered = renderBookingNotificationEmail(
    buildBaseNotification("course_enrolment_recorded_pending_payment", {
      offering: {
        kind: "course",
        title: "Leadership Intensive",
        slug: "leadership-intensive",
        startDate: "2026-06-24",
        endDate: "2026-06-24",
        startTime: "14:00",
        endTime: "16:00",
        deliveryLabel: "Online",
        pricingMode: "paid",
        price: "49",
        currency: "GBP",
      },
      payment: {
        instructions: "Please transfer payment within 48 hours.",
      },
    })
  );

  assert.match(rendered.subject, /We received your enrolment/);
  assert.match(rendered.text, /Payment still needs to be completed or confirmed/);
  assert.doesNotMatch(rendered.text, /payment has been received/i);
});

test("cancellation template uses factual refund wording only", () => {
  const rendered = renderBookingNotificationEmail(
    buildBaseNotification("event_booking_cancelled", {
      cancellation: {
        refundSummary: "A refund has been initiated and will follow your payment provider timeline.",
      },
    })
  );

  assert.match(rendered.subject, /has been cancelled/);
  assert.match(rendered.text, /refund has been initiated/i);
});

test("event attendee cancellation template avoids claiming the whole booking was cancelled", () => {
  const rendered = renderBookingNotificationEmail(
    buildBaseNotification("event_booking_cancelled", {
      cancellation: {
        scope: "attendee",
        attendeeName: "Jamie Guest",
        refundSummary: "This attendee place was cancelled.",
      },
    })
  );

  assert.match(rendered.subject, /A booked place was cancelled/i);
  assert.match(rendered.text, /Cancelled attendee: Jamie Guest/);
  assert.doesNotMatch(rendered.text, /your booking has been cancelled/i);
});

test("reminder template renders the reminder message and offering schedule", () => {
  const rendered = renderBookingNotificationEmail(
    buildBaseNotification("course_enrolment_reminder", {
      offering: {
        kind: "course",
        title: "Leadership Intensive",
        slug: "leadership-intensive",
        startDate: "2026-06-24",
        endDate: "2026-06-24",
        startTime: "14:00",
        endTime: "16:00",
        deliveryLabel: "Online",
        pricingMode: "free",
      },
      reminder: {
        leadLabel: "This course starts in 24 hours.",
      },
    })
  );

  assert.match(rendered.subject, /Reminder:/);
  assert.match(rendered.text, /starts in 24 hours/i);
  assert.match(rendered.html, /Wed, 24 Jun 2026/);
});

test("whole-offering cancellation template uses waitlist-specific wording when the recipient did not hold a confirmed place", () => {
  const rendered = renderBookingNotificationEmail(
    buildBaseNotification("event_cancelled_by_admin", {
      isWaitlisted: true,
      cancellation: {
        refundSummary: "This message confirms the cancellation only.",
      },
    })
  );

  assert.match(rendered.subject, /has been cancelled/i);
  assert.match(rendered.text, /does not imply that a confirmed place or refund existed/i);
});
