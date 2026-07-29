import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPublicCourseNextStepsModel,
  buildPublicEventNextStepsModel,
} from "../../src/lib/domain/public-offering-next-steps.js";

const hub = {
  slug: "oak-hill",
  locale: "en-GB",
  packagePaymentProcessingMode: "external",
};

test("event next-steps model prioritizes payment instructions for Starter paid events", () => {
  const model = buildPublicEventNextStepsModel({
    hub,
    event: {
      slug: "spring-gala",
      title: "Spring Gala",
      pricingMode: "paid",
      price: "25",
      currency: "GBP",
      startDate: "2026-05-10",
      endDate: "2026-05-10",
      startTime: "19:00",
      endTime: "21:00",
      location: "Town Hall",
      paymentInstructions: "Use your member reference when making the bank transfer.",
      externalPaymentUrl: "https://payments.example.com/events/spring-gala",
    },
    registration: {
      status: "active",
      paymentStatus: "unpaid",
    },
  });

  assert.equal(model.title, "Complete payment for this event");
  assert.equal(model.paymentCard.title, "Payment details");
  assert.equal(model.paymentCard.primaryAction.label, "Continue to payment");
  assert.equal(model.paymentCard.primaryAction.external, true);
  assert.match(model.paymentCard.instructions, /bank transfer/i);
});

test("event next-steps model explains combined link and instructions clearly", () => {
  const model = buildPublicEventNextStepsModel({
    hub,
    event: {
      slug: "spring-gala",
      title: "Spring Gala",
      pricingMode: "paid",
      price: "25",
      currency: "GBP",
      startDate: "2026-05-10",
      endDate: "2026-05-10",
      location: "Town Hall",
      paymentInstructions: "Use your member reference when making the bank transfer.",
      externalPaymentUrl: "https://payments.example.com/events/spring-gala",
    },
    registration: {
      status: "active",
      paymentStatus: "unpaid",
    },
  });

  assert.equal(model.title, "Complete payment for this event");
  assert.match(model.description, /Your booking has been recorded\. Complete the payment step below/i);
  assert.match(model.paymentCard.description, /payment instructions provided below or alternatively via the payment button provided/i);
  assert.equal(model.backAction.label, "Back to event");
});

test("event next-steps model treats free events as confirmed with no payment required", () => {
  const model = buildPublicEventNextStepsModel({
    hub: { ...hub, packagePaymentProcessingMode: "none" },
    event: {
      slug: "community-picnic",
      title: "Community Picnic",
      pricingMode: "free",
      startDate: "2026-05-12",
      endDate: "2026-05-12",
      location: "Riverside Park",
    },
    registration: {
      status: "active",
      paymentStatus: "not_required",
    },
  });

  assert.equal(model.title, "Booking confirmed");
  assert.equal(model.paymentCard.title, "No payment needed");
  assert.equal(model.paymentCard.primaryAction, null);
  assert.equal(model.statusCard.badges.length, 1);
  assert.equal(model.statusCard.badges[0].label, "Active");
});

test("event next-steps model supports Growth native checkout continuation", () => {
  const model = buildPublicEventNextStepsModel({
    hub: { ...hub, packagePaymentProcessingMode: "internal" },
    event: {
      slug: "spring-gala",
      title: "Spring Gala",
      pricingMode: "paid",
      price: "25",
      currency: "GBP",
      startDate: "2026-05-10",
      endDate: "2026-05-10",
      startTime: "19:00",
      endTime: "21:00",
      location: "Town Hall",
    },
    registration: {
      status: "active",
      paymentStatus: "unpaid",
      nativePaymentStatus: "checkout_open",
      nativePaymentCheckoutUrl: "https://checkout.stripe.com/pay/cs_test_123",
    },
  });

  assert.equal(model.title, "Complete payment for this event");
  assert.equal(model.paymentCard.title, "Stripe checkout");
  assert.equal(model.paymentCard.primaryAction.label, "Continue checkout");
  assert.equal(model.paymentCard.primaryAction.href, "https://checkout.stripe.com/pay/cs_test_123");
});

test("event next-steps model labels recurring occurrences explicitly", () => {
  const model = buildPublicEventNextStepsModel({
    hub,
    event: {
      slug: "morning-yoga-2026-05-10",
      title: "Morning Yoga",
      eventKind: "series_occurrence",
      pricingMode: "free",
      startDate: "2026-05-10",
      endDate: "2026-05-10",
      location: "Studio One",
    },
    registration: {
      status: "active",
      paymentStatus: "not_required",
    },
  });

  assert.equal(model.eyebrow, "Recurring event booking");
  assert.equal(model.statusCard.badges[1].label, "Recurring event");
});

test("course next-steps model suppresses payment prompts while waitlisted", () => {
  const model = buildPublicCourseNextStepsModel({
    hub,
    course: {
      slug: "leadership-cohort",
      title: "Leadership Cohort",
      pricingMode: "paid",
      price: "120",
      currency: "GBP",
      startAt: "2026-06-01T10:00",
      endAt: "2026-06-01T16:00",
      format: "in-person",
      location: "Studio One",
      paymentInstructions: "Wait for confirmation before paying.",
      externalPaymentUrl: "https://payments.example.com/courses/leadership-cohort",
    },
    registration: {
      status: "waitlisted",
      paymentStatus: "unpaid",
    },
  });

  assert.equal(model.title, "You're on the waitlist");
  assert.equal(model.paymentCard.title, "No payment needed yet");
  assert.equal(model.paymentCard.primaryAction, null);
});

test("course next-steps model supports Growth native checkout continuation", () => {
  const model = buildPublicCourseNextStepsModel({
    hub: { ...hub, packagePaymentProcessingMode: "internal" },
    course: {
      slug: "leadership-cohort",
      title: "Leadership Cohort",
      pricingMode: "paid",
      price: "120",
      currency: "GBP",
      startAt: "2026-06-01T10:00",
      endAt: "2026-06-01T16:00",
      format: "online",
      location: "",
    },
    registration: {
      status: "enrolled",
      paymentStatus: "unpaid",
      nativePaymentStatus: "checkout_open",
      nativePaymentCheckoutUrl: "https://checkout.stripe.com/pay/cs_test_course_123",
    },
  });

  assert.equal(model.title, "Complete payment for this course");
  assert.equal(model.paymentCard.title, "Stripe checkout");
  assert.equal(model.paymentCard.primaryAction.label, "Continue checkout");
  assert.equal(model.paymentCard.primaryAction.href, "https://checkout.stripe.com/pay/cs_test_course_123");
});

test("course next-steps model supports Growth native checkout restart", () => {
  const model = buildPublicCourseNextStepsModel({
    hub: { ...hub, packagePaymentProcessingMode: "internal" },
    course: {
      slug: "leadership-cohort",
      title: "Leadership Cohort",
      pricingMode: "paid",
      price: "120",
      currency: "GBP",
      startAt: "2026-06-01T10:00",
      endAt: "2026-06-01T16:00",
      format: "online",
      location: "",
    },
    registration: {
      status: "enrolled",
      paymentStatus: "failed",
      nativePaymentStatus: "payment_failed",
    },
  });

  assert.equal(model.title, "Retry payment for this course");
  assert.equal(model.paymentCard.title, "Restart checkout");
  assert.equal(model.paymentCard.primaryAction.label, "Restart checkout");
  assert.equal(model.paymentCard.primaryAction.href, "/oak-hill/courses/leadership-cohort/enrolment/restart-checkout");
});
