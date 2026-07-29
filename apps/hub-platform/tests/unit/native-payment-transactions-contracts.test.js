import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeNativePaymentTransactionRecord } from "../../src/lib/domain/native-payment-transactions.js";

test("native payment transaction normalization keeps checkout and payment state explicit", () => {
  const record = normalizeNativePaymentTransactionRecord({
    id: "txn_123",
    hubId: "hub_123",
    userId: "user_123",
    kind: "membership_upgrade",
    status: "payment_received",
    provider: "stripe",
    stripeAccountId: "acct_123",
    stripeCheckoutSessionId: "cs_test_123",
    amountMinor: 1900,
    amount: "19",
    currency: "gbp",
  });

  assert.equal(record.kind, "membership_upgrade");
  assert.equal(record.status, "payment_received");
  assert.equal(record.statusLabel, "Payment received");
  assert.equal(record.statusTone, "success");
  assert.equal(record.currency, "GBP");
});

test("native payment transaction normalization supports event payment and refund fields", () => {
  const record = normalizeNativePaymentTransactionRecord({
    id: "txn_event_123",
    hubId: "hub_123",
    userId: "user_123",
    kind: "event_registration",
    status: "payment_received",
    provider: "stripe",
    stripeAccountId: "acct_123",
    stripeCheckoutSessionId: "cs_test_123",
    eventId: "event_123",
    eventTitle: "Spring Gala",
    registrationId: "registration_123",
    amountMinor: 2400,
    amount: "24",
    currency: "gbp",
    refundStatus: "refunded",
    refundAmountMinor: 2400,
    refundAmount: "24",
    refundedAt: "2026-04-30T10:00:00.000Z",
    stripeRefundId: "re_123",
  });

  assert.equal(record.kind, "event_registration");
  assert.equal(record.eventId, "event_123");
  assert.equal(record.eventTitle, "Spring Gala");
  assert.equal(record.registrationId, "registration_123");
  assert.equal(record.refundStatus, "refunded");
  assert.equal(record.refundAmountMinor, 2400);
  assert.equal(record.refundAmount, "24");
  assert.equal(record.stripeRefundId, "re_123");
});

test("native payment transaction normalization supports event booking payment linkage", () => {
  const record = normalizeNativePaymentTransactionRecord({
    id: "txn_event_booking_123",
    hubId: "hub_123",
    userId: "user_123",
    kind: "event_booking",
    status: "checkout_open",
    provider: "stripe",
    stripeAccountId: "acct_123",
    stripeCheckoutSessionId: "cs_test_123",
    eventId: "event_123",
    eventTitle: "Spring Gala",
    eventBookingId: "booking_123",
    amountMinor: 7200,
    amount: "72",
    currency: "gbp",
  });

  assert.equal(record.kind, "event_booking");
  assert.equal(record.eventId, "event_123");
  assert.equal(record.eventBookingId, "booking_123");
});

test("native payment transaction normalization supports course payment and refund fields", () => {
  const record = normalizeNativePaymentTransactionRecord({
    id: "txn_course_123",
    hubId: "hub_123",
    userId: "user_123",
    kind: "course_registration",
    status: "payment_received",
    provider: "stripe",
    stripeAccountId: "acct_123",
    stripeCheckoutSessionId: "cs_test_123",
    courseId: "course_123",
    courseTitle: "Leadership Cohort",
    registrationId: "registration_123",
    amountMinor: 4800,
    amount: "48",
    currency: "gbp",
  });

  assert.equal(record.kind, "course_registration");
  assert.equal(record.courseId, "course_123");
  assert.equal(record.courseTitle, "Leadership Cohort");
  assert.equal(record.registrationId, "registration_123");
});

test("membership upgrade checkout helper creates transactions and Stripe checkout sessions", () => {
  const source = readFileSync(
    new URL("../../src/lib/server/membership-upgrade-checkout.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /createNativePaymentTransaction/);
  assert.match(source, /stripe\.checkout\.sessions\.create/);
  assert.match(source, /application_fee_amount/);
  assert.match(source, /checkout-return/);
  assert.match(source, /requestHost/);
  assert.match(source, /buildHubRuntimeHref/);
  assert.match(source, /routeMode/);
  assert.match(source, /updateMembershipUpgradeRequestPaymentState/);
});

test("event registration checkout helper creates transactions and Stripe checkout sessions", () => {
  const source = readFileSync(
    new URL("../../src/lib/server/event-registration-checkout.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /createNativePaymentTransaction/);
  assert.match(source, /stripe\.checkout\.sessions\.create/);
  assert.match(source, /kind: "event_registration"/);
  assert.match(source, /registrationId/);
  assert.match(source, /eventId/);
  assert.match(source, /getFallbackRegionalMarket/);
  assert.match(source, /defaultCurrency/);
  assert.match(source, /checkout-return/);
  assert.match(source, /updateEventRegistrationNativePaymentState/);
});

test("event booking checkout helper creates booking-owned transactions and Stripe checkout sessions", () => {
  const source = readFileSync(
    new URL("../../src/lib/server/event-booking-checkout.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /createNativePaymentTransaction/);
  assert.match(source, /stripe\.checkout\.sessions\.create/);
  assert.match(source, /kind: "event_booking"/);
  assert.match(source, /eventBookingId/);
  assert.match(source, /bookingId/);
  assert.match(source, /sourceType: "eventBooking"/);
  assert.match(source, /quantity: attendeeCount/);
  assert.match(source, /updateEventBookingPaymentState/);
  assert.match(source, /bookingWasCancelled/);
  assert.match(source, /operationalStatus: bookingWasCancelled \? "cancelled" : ledgerState\.operationalStatus/);
  assert.match(source, /checkout-return/);
});

test("course registration checkout helper creates transactions and Stripe checkout sessions", () => {
  const source = readFileSync(
    new URL("../../src/lib/server/course-registration-checkout.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /createNativePaymentTransaction/);
  assert.match(source, /stripe\.checkout\.sessions\.create/);
  assert.match(source, /kind: "course_registration"/);
  assert.match(source, /registrationId/);
  assert.match(source, /courseId/);
  assert.match(source, /checkout-return/);
  assert.match(source, /updateCourseRegistrationNativePaymentState/);
});

test("membership upgrade action source preserves the request host port for Stripe return URLs", () => {
  const source = readFileSync(
    new URL("../../src/app/(hub)/[hubSlug]/account/membership/actions.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /getRequestHostWithPortFromHeaders/);
});

test("hub payment webhook source reconciles event registration checkout events", () => {
  const source = readFileSync(
    new URL("../../src/lib/server/hub-payment-webhooks.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /reconcileEventRegistrationCheckout/);
  assert.match(source, /metadataKind === "event_registration"/);
  assert.match(source, /updateEventRegistrationNativePaymentState/);
  assert.match(source, /updateEventRegistrationPaymentStatus/);
});

test("hub payment webhook source reconciles course registration checkout events", () => {
  const source = readFileSync(
    new URL("../../src/lib/server/hub-payment-webhooks.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /reconcileCourseRegistrationCheckout/);
  assert.match(source, /metadataKind === "course_registration"/);
  assert.match(source, /updateCourseRegistrationNativePaymentState/);
  assert.match(source, /updateCourseRegistrationPaymentStatus/);
});

test("hub payment webhook source reconciles event booking checkout events", () => {
  const source = readFileSync(
    new URL("../../src/lib/server/hub-payment-webhooks.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /reconcileEventBookingCheckout/);
  assert.match(source, /metadataKind === "event_booking"/);
  assert.match(source, /getEventBookingById/);
  assert.match(source, /updateEventBookingPaymentState/);
  assert.match(source, /bookingWasCancelled/);
  assert.match(source, /operationalStatus: bookingWasCancelled \? "cancelled" : ledgerState\.operationalStatus/);
});

test("hub payment webhook source reconciles refund events back onto event transactions", () => {
  const source = readFileSync(
    new URL("../../src/lib/server/hub-payment-webhooks.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /reconcileEventRegistrationRefund/);
  assert.match(source, /if \(metadataHubId && metadataTransactionId\)/);
  assert.match(source, /if \(metadataHubId && stripePaymentIntentId\)/);
  assert.match(source, /getNativePaymentTransactionByPaymentIntentId/);
  assert.match(source, /metadataTransactionId/);
  assert.match(source, /resolveStripeChargePaymentIntentId/);
  assert.match(source, /event\?\.type === "refund\.created"/);
  assert.match(source, /event\?\.type === "charge\.refunded"/);
  assert.match(source, /refundStatus:/);
});

test("hub payment webhook source reconciles refund events back onto course transactions", () => {
  const source = readFileSync(
    new URL("../../src/lib/server/hub-payment-webhooks.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /transaction\.kind === "course_registration"/);
  assert.match(source, /updateCourseRegistrationPaymentStatus/);
  assert.match(source, /updateCourseRegistrationNativePaymentState/);
  assert.match(source, /course_registration_refund/);
  assert.match(source, /event_booking_refund/);
});

test("hub payment webhook source reconciles refund events back onto event booking transactions", () => {
  const source = readFileSync(
    new URL("../../src/lib/server/hub-payment-webhooks.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /transaction\.kind === "event_booking"/);
  assert.match(source, /eventBookingId/);
  assert.match(source, /partialRefund \? "partially_refunded"/);
  assert.match(source, /normalizedRefundState === "refunded" \? "refunded" : "paid"/);
  assert.match(source, /"event_booking_refund"/);
});

test("hub payment webhook source claims event ids before processing and releases failed claims", () => {
  const source = readFileSync(
    new URL("../../src/lib/server/hub-payment-webhooks.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /claimStripeWebhookEventProcessing/);
  assert.match(source, /releaseStripeWebhookEventProcessing/);
  assert.match(source, /processingStatus/);
});

test("hub payment webhook source handles payment intent failures explicitly", () => {
  const source = readFileSync(
    new URL("../../src/lib/server/hub-payment-webhooks.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /reconcileCheckoutPaymentIntentFailure/);
  assert.match(source, /event\?\.type === "payment_intent\.payment_failed"/);
  assert.match(source, /status: "payment_failed"/);
  assert.match(source, /kind === "event_booking"/);
  assert.match(source, /paymentStatus: "failed"/);
});

test("payment record data source builds deterministic ids from source ownership", () => {
  const source = readFileSync(
    new URL("../../src/lib/data/payment-records.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /export function buildPaymentRecordDocumentId/);
  assert.match(source, /const documentId = buildPaymentRecordDocumentId/);
  assert.match(source, /A deterministic payment record id could not be derived/);
  assert.match(source, /getFallbackRegionalMarket/);
});

test("native payment plumbing source uses the shared regional fallback instead of hardcoded GBP defaults", () => {
  const nativeTransactionSource = readFileSync(
    new URL("../../src/lib/data/native-payment-transactions.js", import.meta.url),
    "utf8"
  );
  const webhookSource = readFileSync(
    new URL("../../src/lib/server/hub-payment-webhooks.js", import.meta.url),
    "utf8"
  );

  assert.match(nativeTransactionSource, /getFallbackRegionalMarket/);
  assert.match(webhookSource, /getFallbackRegionalMarket/);
  assert.doesNotMatch(nativeTransactionSource, /currency: normalizeString\(payload\.currency\)\.toUpperCase\(\) \|\| "GBP"/);
  assert.doesNotMatch(webhookSource, /function normalizeMinorAmountToDisplay\(amountMinor, currency = "GBP"\)/);
});

test("payment ledger sync source records last-run status for operators", () => {
  const source = readFileSync(
    new URL("../../src/lib/data/payment-ledger-sync.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /getHubPaymentLedgerSyncStatus/);
  assert.match(source, /paymentLedgerSync/);
  assert.match(source, /lastStartedAt/);
  assert.match(source, /lastCompletedAt/);
  assert.match(source, /lastStatus/);
  assert.match(source, /lastMode/);
  assert.match(source, /lastSince/);
  assert.match(source, /incremental/);
});

test("payment reconciliation source flags transaction, ledger, and workflow drift categories", () => {
  const source = readFileSync(
    new URL("../../src/lib/data/payment-reconciliation.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /transaction_missing_payment_record_link/);
  assert.match(source, /payment_record_missing_native_link/);
  assert.match(source, /workflow_native_status_drift/);
  assert.match(source, /workflow_payment_status_drift/);
  assert.match(source, /upgrade_request_status_drift/);
  assert.match(source, /export async function getHubPaymentReconciliationReport/);
});
