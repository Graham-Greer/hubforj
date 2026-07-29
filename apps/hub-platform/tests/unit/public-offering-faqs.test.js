import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPublicCourseFaqItems,
  buildPublicEventFaqItems,
} from "../../src/lib/domain/public-offering-faqs.js";

test("public event faq items explain booking flow with external payments", () => {
  const items = buildPublicEventFaqItems({
    hub: { packagePaymentProcessingMode: "external" },
  });

  assert.equal(items.length, 5);
  assert.equal(items[0].question, "How do I book an event?");
  assert.match(items[3].answer, /payment instructions or payment button/i);
  assert.match(items[4].answer, /My Bookings/);
});

test("public course faq items explain enrolment flow with internal payments", () => {
  const items = buildPublicCourseFaqItems({
    hub: { packagePaymentProcessingMode: "internal" },
  });

  assert.equal(items.length, 5);
  assert.equal(items[0].question, "How do I enrol on a course?");
  assert.match(items[3].answer, /hub team manages payment follow-up directly/i);
  assert.match(items[2].answer, /waitlist/i);
});
