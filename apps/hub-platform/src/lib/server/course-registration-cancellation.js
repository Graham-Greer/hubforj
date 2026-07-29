try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getCourseById } from "@/lib/data/courses";
import {
  updateCourseRegistrationNativePaymentState,
  updateCourseRegistrationPaymentStatus,
  updateCourseRegistrationStatus,
} from "@/lib/data/course-registrations";
import {
  getNativePaymentTransactionById,
  updateNativePaymentTransaction,
} from "@/lib/data/native-payment-transactions";
import {
  getPaymentRecordById,
  getPaymentRecordByNativeTransactionId,
  updatePaymentRecord,
} from "@/lib/data/payment-records";
import { resolveOfferingRegistrationLedgerState } from "@/lib/domain/payment-records";
import { evaluateCourseRefundEligibility } from "@/lib/domain/courses";
import { getStripeServerClient } from "@/lib/server/stripe";

function normalizeString(value) {
  return String(value || "").trim();
}

async function expireOpenCheckoutIfNeeded(hub, registration, transaction, actorId) {
  if (
    !transaction ||
    normalizeString(transaction.status) !== "checkout_open" ||
    !normalizeString(transaction.stripeCheckoutSessionId) ||
    !normalizeString(transaction.stripeAccountId)
  ) {
    return false;
  }

  const stripe = getStripeServerClient();

  await stripe.checkout.sessions.expire(
    transaction.stripeCheckoutSessionId,
    {},
    {
      stripeAccount: transaction.stripeAccountId,
    }
  );

  await updateNativePaymentTransaction(
    hub.id,
    transaction.id,
    {
      status: "checkout_cancelled",
    },
    actorId
  );

  await updateCourseRegistrationNativePaymentState(
    hub.id,
    registration.courseId,
    registration.id,
    {
      nativePaymentStatus: "checkout_cancelled",
      nativePaymentCheckoutUrl: "",
      nativePaymentSessionId: "",
    },
    actorId
  );
  const paymentRecord = transaction?.paymentRecordId
    ? await getPaymentRecordById(hub.id, transaction.paymentRecordId)
    : await getPaymentRecordByNativeTransactionId(hub.id, transaction?.id);

  if (paymentRecord) {
    const ledgerState = resolveOfferingRegistrationLedgerState("checkout_cancelled");

    await updatePaymentRecord(
      hub.id,
      paymentRecord.id,
      {
        operationalStatus: ledgerState.operationalStatus,
        financialStatus: ledgerState.financialStatus,
      },
      actorId
    );
  }

  return true;
}

function buildCancellationOutcomeMessage({ refunded, refundEvaluation, checkoutExpired, paymentStatus }) {
  if (refunded) {
    return "Enrolment cancelled and refund initiated.";
  }

  if (checkoutExpired) {
    return "Enrolment cancelled and the open checkout was closed.";
  }

  if (normalizeString(paymentStatus) === "paid") {
    if (refundEvaluation?.reason === "policy_non_refundable") {
      return "Enrolment cancelled. This course is non-refundable.";
    }

    if (refundEvaluation?.reason === "outside_refund_window" || refundEvaluation?.reason === "course_started") {
      return "Enrolment cancelled. This course was outside the refund window, so no refund was issued.";
    }
  }

  return "Enrolment cancelled.";
}

export async function cancelCourseRegistrationWithRefundHandling({
  hub,
  course,
  registration,
  actorId = "system",
}) {
  const normalizedHubId = normalizeString(hub?.id);
  const normalizedCourseId = normalizeString(course?.id || registration?.courseId);
  const normalizedRegistrationId = normalizeString(registration?.id);

  if (!normalizedHubId || !normalizedCourseId || !normalizedRegistrationId) {
    throw new Error("Hub, course, and registration are required.");
  }

  const resolvedCourse = course || (await getCourseById(normalizedHubId, normalizedCourseId));

  if (!resolvedCourse) {
    throw new Error("Course not found.");
  }

  const transaction = registration.nativePaymentTransactionId
    ? await getNativePaymentTransactionById(normalizedHubId, registration.nativePaymentTransactionId)
    : null;

  const checkoutExpired = await expireOpenCheckoutIfNeeded(hub, registration, transaction, actorId);
  const usesInternalPayments =
    normalizeString(hub?.packagePaymentProcessingMode) === "internal" &&
    normalizeString(resolvedCourse.pricingMode) === "paid";
  const refundEvaluation = usesInternalPayments
    ? evaluateCourseRefundEligibility(resolvedCourse, { paymentStatus: registration.paymentStatus })
    : null;

  let refunded = false;

  if (usesInternalPayments && normalizeString(registration.paymentStatus) === "paid" && refundEvaluation?.refundable) {
    if (!transaction?.stripePaymentIntentId || !transaction?.stripeAccountId) {
      throw new Error("This course payment cannot be refunded automatically right now.");
    }

    const stripe = getStripeServerClient();
    const refundPayload = {
      payment_intent: transaction.stripePaymentIntentId,
      metadata: {
        kind: "course_registration_refund",
        hubId: normalizedHubId,
        hubSlug: normalizeString(hub?.slug),
        courseId: normalizedCourseId,
        registrationId: normalizedRegistrationId,
        nativePaymentTransactionId: transaction.id,
      },
    };

    if (Number(transaction.applicationFeeAmountMinor) > 0) {
      refundPayload.refund_application_fee = true;
    }

    const refund = await stripe.refunds.create(refundPayload, {
      stripeAccount: transaction.stripeAccountId,
    });

    const now = new Date().toISOString();

    await updateNativePaymentTransaction(
      normalizedHubId,
      transaction.id,
      {
        refundStatus: "refunded",
        refundAmountMinor: transaction.amountMinor,
        refundAmount: transaction.amount,
        refundedAt: now,
        stripeRefundId: normalizeString(refund.id),
      },
      actorId
    );
    const paymentRecord = transaction.paymentRecordId
      ? await getPaymentRecordById(normalizedHubId, transaction.paymentRecordId)
      : await getPaymentRecordByNativeTransactionId(normalizedHubId, transaction.id);

    await updateCourseRegistrationPaymentStatus(
      normalizedHubId,
      normalizedCourseId,
      normalizedRegistrationId,
      "refunded",
      actorId
    );

    if (paymentRecord) {
      const ledgerState = resolveOfferingRegistrationLedgerState(transaction.status, {
        refunded: true,
      });

      await updatePaymentRecord(
        normalizedHubId,
        paymentRecord.id,
        {
          operationalStatus: ledgerState.operationalStatus,
          financialStatus: ledgerState.financialStatus,
          refundedAt: now,
          refundAmountMinor: transaction.amountMinor,
          refundDisplay: transaction.amount,
          stripeRefundId: normalizeString(refund.id),
        },
        actorId
      );
    }

    refunded = true;
  }

  const updatedRegistration =
    normalizeString(registration.status) === "cancelled"
      ? registration
      : await updateCourseRegistrationStatus(
          normalizedHubId,
          normalizedCourseId,
          normalizedRegistrationId,
          "cancelled",
          actorId
        );

  return {
    registration: updatedRegistration,
    refunded,
    checkoutExpired,
    refundEvaluation,
    message: buildCancellationOutcomeMessage({
      refunded,
      refundEvaluation,
      checkoutExpired,
      paymentStatus: registration.paymentStatus,
    }),
  };
}
