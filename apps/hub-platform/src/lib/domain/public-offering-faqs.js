function normalizeString(value) {
  return String(value || "").trim();
}

function buildPaymentAnswer(kind, paymentProcessingMode = "none") {
  const isCourse = kind === "course";
  const offeringLabel = isCourse ? "course" : "event";
  const registrationLabel = isCourse ? "enrolment" : "booking";
  const normalizedPaymentProcessingMode = normalizeString(paymentProcessingMode) || "none";

  if (normalizedPaymentProcessingMode === "external") {
    return `Free ${kind === "course" ? "courses" : "events"} do not require payment. For paid ${kind === "course" ? "courses" : "events"}, your ${registrationLabel} is recorded first, then you are guided to the payment instructions or payment button for that ${offeringLabel}. After payment, the hub team reviews the ${registrationLabel} and updates the status in My Bookings.`;
  }

  if (normalizedPaymentProcessingMode === "internal") {
    return `Free ${kind === "course" ? "courses" : "events"} do not require payment. For paid ${kind === "course" ? "courses" : "events"}, your ${registrationLabel} is recorded first and the hub team manages payment follow-up directly. Any updates will appear in My Bookings.`;
  }

  return `If the ${offeringLabel} is free, no payment is required.`;
}

function buildBaseFaqItems({ kind, hub }) {
  const isCourse = kind === "course";
  const noun = isCourse ? "course" : "event";
  const verb = isCourse ? "enrol" : "book";
  const article = isCourse ? "a" : "an";
  const nounPlural = isCourse ? "courses" : "events";
  const nounPluralTitle = isCourse ? "Course enrolment" : "Booking";
  const paymentProcessingMode = normalizeString(hub?.packagePaymentProcessingMode) || "none";

  return [
    {
      id: `${kind}_how_to_start`,
      question: isCourse ? "How do I enrol on a course?" : `How do I ${verb} ${article} ${noun}?`,
      answer: `Open the ${noun} you want, review the details, then use the main ${isCourse ? "enrolment" : "booking"} action. If you are not signed in yet, the platform will ask you to sign in first so the ${nounPluralTitle.toLowerCase()} can be linked to your member account.`,
    },
    {
      id: `${kind}_sign_in`,
      question: `Do I need to sign in before I ${verb}?`,
      answer: `Yes. You need to sign in as a member before continuing so the hub can connect your ${isCourse ? "enrolment" : "booking"} and any payment follow-up to the correct account.`,
    },
    {
      id: `${kind}_full`,
      question: `What happens if a ${noun} is full?`,
      answer: `If places are still available, you can continue normally. If the ${noun} is full and waitlist is enabled, you can join the waitlist instead. If waitlist is not enabled, the ${noun} will show as sold out and no further ${isCourse ? "enrolments" : "bookings"} can be accepted.`,
    },
    {
      id: `${kind}_payment`,
      question: `When do I pay for ${nounPlural}?`,
      answer: buildPaymentAnswer(kind, paymentProcessingMode),
    },
    {
      id: `${kind}_status`,
      question: `Where can I check my ${isCourse ? "enrolment" : "booking"} status?`,
      answer: `Use My Bookings to track your current ${isCourse ? "enrolments" : "bookings"}, payment status, and any waitlist or confirmation updates from the hub team.`,
    },
  ];
}

export function buildPublicEventFaqItems({ hub }) {
  return buildBaseFaqItems({ kind: "event", hub });
}

export function buildPublicCourseFaqItems({ hub }) {
  return buildBaseFaqItems({ kind: "course", hub });
}
