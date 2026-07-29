import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateCourseRefundEligibility,
  formatCourseCapacity,
  formatCourseDateRange,
  formatCoursePrice,
  formatCourseSessionCount,
  getCourseEligibilityLabel,
  getCourseStatusLabel,
  getCourseStatusTone,
  getCourseVisibilityLabel,
  isCoursePubliclyVisible,
  normalizeCourseCurrency,
  normalizeCourseInteger,
  normalizeCourseRefundPolicy,
  normalizeCourseRefundWindowHours,
  normalizeCourseRefundWindowMode,
  normalizeCourseSlug,
  normalizeCreateCoursePayload,
  resolveCourseRefundWindowHours,
} from "../../src/lib/domain/courses.js";

test("course status helpers map supported states", () => {
  assert.equal(getCourseStatusLabel("draft"), "Draft");
  assert.equal(getCourseStatusTone("published"), "success");
  assert.equal(getCourseStatusTone("unknown"), "neutral");
});

test("course payload normalizes slug numbers and defaults", () => {
  const payload = normalizeCreateCoursePayload({
    title: "Community Leadership Programme",
    summary: "A practical leadership course",
    description: [{ type: "paragraph", children: [{ text: "Course description" }] }],
    courseType: "Programme",
    courseLevel: "beginner",
    format: "online",
    onlineMeetingLink: "https://example.com/meet",
    timezone: "Europe/London",
    startDate: "2026-03-10",
    startTime: "10:00",
    endTime: "12:00",
    registrationOpenDate: "2026-02-01",
    registrationCloseDate: "2026-03-01",
    sessionCount: "6",
    capacity: "20",
    currency: "usd",
    externalPaymentUrl: "",
    paymentInstructions: "",
  });

  assert.equal(normalizeCourseSlug(" Community Leadership Programme "), "community-leadership-programme");
  assert.equal(normalizeCourseInteger("20"), 20);
  assert.equal(normalizeCourseCurrency("usd"), "USD");
  assert.equal(payload.slug, "community-leadership-programme");
  assert.equal(payload.sessionCount, 6);
  assert.equal(payload.capacity, 20);
  assert.equal(payload.currency, "USD");
  assert.equal(payload.externalPaymentUrl, "");
  assert.equal(payload.paymentInstructions, "");
  assert.equal(payload.refundWindowMode, "default");
  assert.equal(payload.refundWindowHours, 48);
  assert.equal(payload.refundPolicy, "full_refund_before_window");
  assert.equal(payload.visibility, "public");
  assert.equal(payload.registrationEligibility, "members-only");
  assert.equal(payload.status, "draft");
});

test("course payload rejects invalid date order and missing paid price", () => {
  assert.throws(
    () =>
      normalizeCreateCoursePayload({
        title: "Course Missing Times",
        summary: "A practical leadership course",
        description: [{ type: "paragraph", children: [{ text: "Course description" }] }],
        courseType: "Programme",
        courseLevel: "beginner",
        format: "online",
        onlineMeetingLink: "https://example.com/meet",
        timezone: "Europe/London",
        startDate: "2026-03-10",
        registrationOpenDate: "2026-02-01",
        registrationCloseDate: "2026-02-10",
      }),
    /Course start time is required\./
  );

  assert.throws(
    () =>
      normalizeCreateCoursePayload({
        title: "Course Missing Registration Window",
        summary: "A practical leadership course",
        description: [{ type: "paragraph", children: [{ text: "Course description" }] }],
        courseType: "Programme",
        courseLevel: "beginner",
        format: "online",
        onlineMeetingLink: "https://example.com/meet",
        timezone: "Europe/London",
        startDate: "2026-03-10",
        startTime: "10:00",
        endTime: "12:00",
      }),
    /Course registration open date is required\./
  );

  assert.throws(
    () =>
      normalizeCreateCoursePayload({
        title: "Course Missing Close Window",
        summary: "A practical leadership course",
        description: [{ type: "paragraph", children: [{ text: "Course description" }] }],
        courseType: "Programme",
        courseLevel: "beginner",
        format: "online",
        onlineMeetingLink: "https://example.com/meet",
        timezone: "Europe/London",
        startDate: "2026-03-10",
        registrationOpenDate: "2026-02-01",
        startTime: "10:00",
        endTime: "12:00",
      }),
    /Course registration close date is required\./
  );

  assert.throws(
    () =>
      normalizeCreateCoursePayload({
        title: "Bad Course",
        summary: "A practical leadership course",
        description: [{ type: "paragraph", children: [{ text: "Course description" }] }],
        courseType: "Programme",
        courseLevel: "beginner",
        format: "online",
        onlineMeetingLink: "https://example.com/meet",
        timezone: "Europe/London",
        startDate: "2026-03-10",
        registrationOpenDate: "2026-02-01",
        registrationCloseDate: "2026-02-10",
        endDate: "2026-03-09",
        startTime: "10:00",
        endTime: "12:00",
      }),
    /Course end date must be after the start date\./
  );

  assert.throws(
    () =>
      normalizeCreateCoursePayload({
        title: "Paid Course",
        summary: "A practical leadership course",
        description: [{ type: "paragraph", children: [{ text: "Course description" }] }],
        courseType: "Programme",
        courseLevel: "beginner",
        format: "online",
        onlineMeetingLink: "https://example.com/meet",
        timezone: "Europe/London",
        startDate: "2026-03-10",
        registrationOpenDate: "2026-02-01",
        registrationCloseDate: "2026-02-10",
        startTime: "10:00",
        endTime: "12:00",
        pricingMode: "paid",
        price: "",
      }),
    /Paid courses require a price\./
  );

  assert.throws(
    () =>
      normalizeCreateCoursePayload({
        title: "Paid Course Missing Deadline",
        summary: "A practical leadership course",
        description: [{ type: "paragraph", children: [{ text: "Course description" }] }],
        courseType: "Programme",
        courseLevel: "beginner",
        format: "online",
        onlineMeetingLink: "https://example.com/meet",
        timezone: "Europe/London",
        startDate: "2026-03-10",
        startTime: "10:00",
        endTime: "12:00",
        registrationOpenDate: "2026-02-01",
        registrationCloseDate: "2026-02-10",
        pricingMode: "paid",
        price: "49.00",
      }),
    /Paid courses require a payment deadline\./
  );

  assert.throws(
    () =>
      normalizeCreateCoursePayload({
        title: "Paid Course",
        summary: "A practical leadership course",
        description: [{ type: "paragraph", children: [{ text: "Course description" }] }],
        courseType: "Programme",
        courseLevel: "beginner",
        format: "online",
        onlineMeetingLink: "https://example.com/meet",
        timezone: "Europe/London",
        startDate: "2026-03-10",
        registrationOpenDate: "2026-02-01",
        registrationCloseDate: "2026-02-10",
        startTime: "10:00",
        endTime: "12:00",
        pricingMode: "paid",
        price: "49.00",
        paymentDeadline: "2026-03-01",
        externalPaymentUrl: "mailto:test@example.com",
      }),
    /External payment link must use http or https\./
  );

  assert.throws(
    () =>
      normalizeCreateCoursePayload({
        title: "Paid Course",
        summary: "A practical leadership course",
        description: [{ type: "paragraph", children: [{ text: "Course description" }] }],
        courseType: "Programme",
        courseLevel: "beginner",
        format: "online",
        onlineMeetingLink: "https://example.com/meet",
        timezone: "Europe/London",
        startDate: "2026-03-10",
        registrationOpenDate: "2026-02-01",
        registrationCloseDate: "2026-02-10",
        startTime: "10:00",
        endTime: "12:00",
        pricingMode: "paid",
        price: "49.00",
        paymentDeadline: "2026-03-01",
        refundWindowMode: "custom",
        refundWindowHours: "0",
      }),
    /Custom refund window hours must be greater than zero\./
  );
});

test("course formatting helpers support public and admin display", () => {
  assert.equal(formatCourseDateRange("", ""), "Schedule to be confirmed");
  assert.equal(formatCourseCapacity(0), "Open enrolment");
  assert.equal(formatCourseCapacity(12), "12/12 places left");
  assert.equal(formatCourseCapacity(12, 5), "7/12 places left");
  assert.equal(formatCourseSessionCount(0), "Session count to be confirmed");
  assert.equal(formatCourseSessionCount(1), "1 session");
  assert.match(formatCoursePrice({ pricingMode: "paid", price: "49.00", currency: "GBP" }), /£49\.00/);
  assert.match(formatCoursePrice({ pricingMode: "paid", price: "49.00", currency: "EUR" }, "es-ES"), /^€\s?49\.00$/);
  assert.equal(formatCoursePrice({ pricingMode: "free" }), "Free");
  assert.equal(getCourseVisibilityLabel("members-only"), "Members only");
  assert.equal(getCourseEligibilityLabel("guests-allowed"), "Guests allowed");
});

test("isCoursePubliclyVisible only exposes published courses", () => {
  assert.equal(
    isCoursePubliclyVisible({
      status: "published",
      visibility: "public",
      startAt: "2099-03-10T18:00",
      endAt: "2099-03-10T20:00",
    }),
    true
  );
  assert.equal(
    isCoursePubliclyVisible({
      status: "published",
      visibility: "public",
      startAt: "2020-03-10T18:00",
      endAt: "2020-03-10T20:00",
    }),
    false
  );
  assert.equal(
    isCoursePubliclyVisible({ status: "published", visibility: "members-only", startAt: "2099-03-10T18:00" }),
    false
  );
  assert.equal(isCoursePubliclyVisible({ status: "draft", startAt: "2099-03-10T18:00" }), false);
});

test("course refund helpers normalize and evaluate paid-course refund policy", () => {
  assert.equal(normalizeCourseRefundWindowMode("custom"), "custom");
  assert.equal(normalizeCourseRefundWindowMode("anything"), "default");
  assert.equal(normalizeCourseRefundPolicy("non_refundable"), "non_refundable");
  assert.equal(normalizeCourseRefundPolicy(""), "full_refund_before_window");
  assert.equal(normalizeCourseRefundWindowHours("24"), 24);
  assert.equal(resolveCourseRefundWindowHours({ refundWindowMode: "custom", refundWindowHours: 24 }), 24);
  assert.equal(resolveCourseRefundWindowHours({ refundWindowMode: "default", refundWindowHours: 24 }), 48);

  const refundable = evaluateCourseRefundEligibility(
    {
      pricingMode: "paid",
      refundWindowMode: "custom",
      refundWindowHours: 24,
      refundPolicy: "full_refund_before_window",
      startAt: "2099-03-10T18:00:00.000Z",
    },
    { paymentStatus: "paid", now: new Date("2099-03-09T12:00:00.000Z") }
  );

  assert.equal(refundable.refundable, true);
  assert.equal(refundable.reason, "before_cutoff");

  const nonRefundable = evaluateCourseRefundEligibility(
    {
      pricingMode: "paid",
      refundPolicy: "non_refundable",
      startAt: "2099-03-10T18:00:00.000Z",
    },
    { paymentStatus: "paid" }
  );

  assert.equal(nonRefundable.refundable, false);
  assert.equal(nonRefundable.reason, "policy_non_refundable");
});
