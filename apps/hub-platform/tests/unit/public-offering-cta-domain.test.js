import test from "node:test";
import assert from "node:assert/strict";
import { buildPublicEventBookingCta } from "../../src/lib/domain/public-events.js";
import { buildPublicCourseEnrolmentCta } from "../../src/lib/domain/public-courses.js";

test("public event CTA routes Starter paid events through a booking form before payment", () => {
  const cta = buildPublicEventBookingCta({
    hubSlug: "oak-hill",
    event: {
      slug: "spring-gala",
      pricingMode: "paid",
      externalPaymentUrl: "https://payments.example.com/events/spring-gala",
      paymentInstructions: "Complete payment first. We will confirm your booking shortly after.",
      capacity: 50,
      allowWaitlist: true,
    },
    registeredCount: 12,
    currentMemberSession: { user: { id: "member_1" } },
    currentRegistration: null,
  });

  assert.deepEqual(cta, {
    heading: "Register for this event",
    buttonLabel: "Book now",
    requiresForm: true,
  });
});

test("public event CTA still uses the booking form for guest-capable single-attendee events", () => {
  const cta = buildPublicEventBookingCta({
    hubSlug: "oak-hill",
    event: {
      slug: "family-workshop",
      pricingMode: "free",
      registrationEligibility: "guests-allowed",
      bookingMode: "single_attendee",
      capacity: 20,
      allowWaitlist: true,
    },
    registeredCount: 4,
    currentMemberSession: { user: { id: "member_1" } },
    currentRegistration: null,
  });

  assert.deepEqual(cta, {
    heading: "Register for this event",
    buttonLabel: "Book now",
    requiresForm: true,
  });
});

test("public event CTA still sends full paid Starter events to the waitlist flow", () => {
  const cta = buildPublicEventBookingCta({
    hubSlug: "oak-hill",
    event: {
      slug: "spring-gala",
      pricingMode: "paid",
      externalPaymentUrl: "https://payments.example.com/events/spring-gala",
      capacity: 2,
      allowWaitlist: true,
    },
    registeredCount: 2,
    currentMemberSession: { user: { id: "member_1" } },
    currentRegistration: null,
  });

  assert.deepEqual(cta, {
    heading: "Join the waitlist",
    supportingText: "This event is currently full, but you can still join the waitlist.",
    buttonLabel: "Join waitlist",
    requiresForm: true,
  });
});

test("public event CTA asks signed-out visitors to sign in before the booking and payment flow", () => {
  const cta = buildPublicEventBookingCta({
    hubSlug: "oak-hill",
    event: {
      slug: "spring-gala",
      pricingMode: "paid",
      externalPaymentUrl: "https://payments.example.com/events/spring-gala",
      capacity: 50,
      allowWaitlist: true,
    },
    registeredCount: 12,
    currentMemberSession: null,
    currentRegistration: null,
  });

  assert.equal(cta.heading, "Register for this event");
  assert.equal(cta.buttonLabel, "Sign in to continue");
  assert.equal(cta.requiresForm, false);
  assert.match(cta.href, /\/oak-hill\/sign-in\?next=/);
});

test("public event CTA can stay host-local on subdomains and custom domains", () => {
  const cta = buildPublicEventBookingCta({
    hubSlug: "oak-hill",
    routeMode: "host",
    event: {
      slug: "spring-gala",
      pricingMode: "paid",
      externalPaymentUrl: "https://payments.example.com/events/spring-gala",
      capacity: 50,
      allowWaitlist: true,
    },
    registeredCount: 12,
    currentMemberSession: null,
    currentRegistration: null,
  });

  assert.equal(cta.href, "/sign-in?next=%2Fevents%2Fspring-gala");
});

test("public course CTA routes Starter paid courses through an enrolment form before payment", () => {
  const cta = buildPublicCourseEnrolmentCta({
    hubSlug: "oak-hill",
    course: {
      slug: "leadership-cohort",
      pricingMode: "paid",
      externalPaymentUrl: "https://payments.example.com/courses/leadership-cohort",
      paymentInstructions: "Payment happens externally. The hub team will confirm your enrolment after payment.",
      registrationOpenDate: "",
      registrationCloseDate: "",
      capacity: 20,
      allowWaitlist: true,
    },
    enrolledCount: 4,
    currentMemberSession: { user: { id: "member_1" } },
    currentRegistration: null,
  });

  assert.deepEqual(cta, {
    heading: "Enrol on this course",
    buttonLabel: "Enrol now",
    requiresForm: true,
  });
});

test("public course CTA keeps current registrations authoritative over external payment mode", () => {
  const cta = buildPublicCourseEnrolmentCta({
    hubSlug: "oak-hill",
    course: {
      slug: "leadership-cohort",
      pricingMode: "paid",
      externalPaymentUrl: "https://payments.example.com/courses/leadership-cohort",
      registrationOpenDate: "",
      registrationCloseDate: "",
      capacity: 20,
      allowWaitlist: true,
    },
    enrolledCount: 4,
    currentMemberSession: { user: { id: "member_1" } },
    currentRegistration: { id: "registration_1" },
  });

  assert.deepEqual(cta, {
    heading: "You already have an enrolment",
    buttonLabel: "View enrolment",
    href: "/oak-hill/courses/leadership-cohort/enrolment/next-steps",
    requiresForm: false,
  });
});

test("public course CTA can stay host-local on subdomains and custom domains", () => {
  const cta = buildPublicCourseEnrolmentCta({
    hubSlug: "oak-hill",
    routeMode: "host",
    course: {
      slug: "leadership-cohort",
      pricingMode: "paid",
      externalPaymentUrl: "https://payments.example.com/courses/leadership-cohort",
      registrationOpenDate: "",
      registrationCloseDate: "",
      capacity: 20,
      allowWaitlist: true,
    },
    enrolledCount: 4,
    currentMemberSession: { user: { id: "member_1" } },
    currentRegistration: { id: "registration_1" },
  });

  assert.equal(cta.href, "/courses/leadership-cohort/enrolment/next-steps");
});

test("public event CTA becomes read-only for historical member access", () => {
  const cta = buildPublicEventBookingCta({
    hubSlug: "oak-hill",
    event: {
      slug: "spring-gala",
      pricingMode: "paid",
    },
    currentMemberSession: { user: { id: "member_1" } },
    currentRegistration: { id: "registration_1" },
    detailAccessMode: "history_member",
  });

  assert.deepEqual(cta, {
    heading: "This event has ended",
    supportingText: "You can still review the event details here, but bookings are now closed.",
    buttonLabel: "View bookings",
    href: "/oak-hill/account/bookings",
    requiresForm: false,
  });
});

test("public event CTA lets members rebook after a cancelled registration", () => {
  const cta = buildPublicEventBookingCta({
    hubSlug: "oak-hill",
    event: {
      slug: "spring-gala",
      pricingMode: "paid",
      capacity: 50,
      allowWaitlist: true,
    },
    registeredCount: 12,
    currentMemberSession: { user: { id: "member_1" } },
    currentRegistration: { id: "registration_1", status: "cancelled" },
  });

  assert.deepEqual(cta, {
    heading: "Register for this event",
    buttonLabel: "Book now",
    requiresForm: true,
  });
});

test("public course CTA becomes read-only for historical member access", () => {
  const cta = buildPublicCourseEnrolmentCta({
    hubSlug: "oak-hill",
    course: {
      slug: "leadership-cohort",
      pricingMode: "paid",
    },
    currentMemberSession: { user: { id: "member_1" } },
    currentRegistration: { id: "registration_1" },
    detailAccessMode: "history_member",
  });

  assert.deepEqual(cta, {
    heading: "This course has finished",
    supportingText: "You can still review the course details here, but enrolment is now closed.",
    buttonLabel: "View bookings",
    href: "/oak-hill/account/bookings",
    requiresForm: false,
  });
});

test("public course CTA lets members re-enrol after a cancelled registration", () => {
  const cta = buildPublicCourseEnrolmentCta({
    hubSlug: "oak-hill",
    course: {
      slug: "leadership-cohort",
      pricingMode: "paid",
      capacity: 20,
      allowWaitlist: true,
    },
    enrolledCount: 4,
    currentMemberSession: { user: { id: "member_1" } },
    currentRegistration: { id: "registration_1", status: "cancelled" },
  });

  assert.deepEqual(cta, {
    heading: "Enrol on this course",
    buttonLabel: "Enrol now",
    requiresForm: true,
  });
});
