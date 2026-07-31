import {
  formatPublicCourseListingDateTime,
  formatPublicCoursePriceLabel,
  getPublicCourseDeliveryLabel,
} from "@/lib/domain/public-courses";
import { buildHubRuntimeHref } from "@/lib/domain/hub-runtime-paths";
import {
  formatPublicEventPriceLabel,
} from "@/lib/domain/public-events";
import { formatEventDateRange } from "@/lib/domain/events";
import { formatMoney, formatMoneyFromMinor } from "@/lib/domain/memberships";
import {
  getEventBookingPaymentStatusLabel,
  getEventBookingPaymentStatusTone,
  getEventBookingStatusLabel,
  getEventBookingStatusTone,
} from "@/lib/domain/event-bookings";
import {
  getCoursePaymentStatusLabel,
  getCoursePaymentStatusTone,
  getCourseRegistrationStatusLabel,
  getCourseRegistrationStatusTone,
} from "@/lib/domain/course-registrations";
import {
  getFallbackRegionalMarket,
  resolveLaunchFormattingLocale,
} from "@/lib/domain/regional-markets";

function normalizeString(value) {
  return String(value || "").trim();
}

function shouldShowPaymentBadge(registration) {
  return normalizeString(registration?.paymentStatus) !== "not_required";
}

function resolveRegistrationPriceLabel(registration, fallbackPriceLabel, locale = getFallbackRegionalMarket().defaultLocale) {
  if (Number.isFinite(Number(registration?.amountMinor))) {
    return formatMoneyFromMinor(registration.amountMinor, registration?.currency || getFallbackRegionalMarket().defaultCurrency, locale);
  }

  if (normalizeString(registration?.amountDisplay)) {
    return formatMoney(registration.amountDisplay, registration?.currency || getFallbackRegionalMarket().defaultCurrency, locale);
  }

  return fallbackPriceLabel;
}

function isRecurringEventOccurrence(offering, kind) {
  return kind === "event" && normalizeString(offering?.eventKind) === "series_occurrence";
}

function buildBaseModel({
  kind,
  hub,
  offering,
  registration,
  statusLabel,
  statusTone,
  paymentStatusLabel,
  paymentStatusTone,
  scheduleLabel,
  locationLabel,
  priceLabel,
}) {
  const recurringEventOccurrence = isRecurringEventOccurrence(offering, kind);
  const offeringLabel = kind === "course"
    ? "Course enrolment"
    : recurringEventOccurrence
      ? "Recurring event booking"
      : "Event booking";
  const offeringPath =
    kind === "course"
      ? buildHubRuntimeHref(hub.slug, `/courses/${offering.slug}`, hub.routeMode)
      : buildHubRuntimeHref(hub.slug, `/events/${offering.slug}`, hub.routeMode);
  const bookingsPath = buildHubRuntimeHref(hub.slug, "/account/bookings", hub.routeMode);
  const restartCheckoutPath =
    kind === "course"
      ? buildHubRuntimeHref(hub.slug, `/courses/${offering.slug}/enrolment/restart-checkout`, hub.routeMode)
      : buildHubRuntimeHref(hub.slug, `/events/${offering.slug}/booking/restart-checkout`, hub.routeMode);
  const isWaitlisted = normalizeString(registration?.status) === "waitlisted";
  const pricingMode = normalizeString(offering?.pricingMode) || "free";
  const paymentProcessingMode = normalizeString(hub?.packagePaymentProcessingMode) || "none";
  const paymentInstructions = normalizeString(offering?.paymentInstructions);
  const externalPaymentUrl = normalizeString(offering?.externalPaymentUrl);
  const isExternalPaymentFlow =
    !isWaitlisted &&
    pricingMode === "paid" &&
    paymentProcessingMode === "external" &&
    Boolean(externalPaymentUrl || paymentInstructions);
  const isFreeFlow = pricingMode === "free" || normalizeString(registration?.paymentStatus) === "not_required";
  const isInternalPaidFlow =
    !isWaitlisted &&
    pricingMode === "paid" &&
    paymentProcessingMode === "internal";
  const confirmedTitle =
    kind === "course" ? "Enrolment confirmed" : "Booking confirmed";
  const confirmedDescription =
    kind === "course"
      ? "Your place is confirmed and no payment is required for this free course."
      : "Your place is confirmed and no payment is required for this free event.";

  let title = confirmedTitle;
  let description = confirmedDescription;
  let paymentCardTitle = "No payment needed";
  let paymentCardDescription =
    kind === "course"
      ? "This enrolment is fully recorded. You can return to My Bookings at any time to track the latest status."
      : "This booking is fully recorded. You can return to My Bookings at any time to track the latest status.";
  let paymentPrimaryAction = null;

  if (isWaitlisted) {
    title = "You're on the waitlist";
    description =
      kind === "course"
        ? "Your enrolment has been recorded on the waitlist. The hub team will let you know if a place opens up."
        : "Your booking has been recorded on the waitlist. The hub team will let you know if a place opens up.";
    paymentCardTitle = "No payment needed yet";
    paymentCardDescription =
      kind === "course"
        ? "Wait until the hub confirms a place before completing any payment steps."
        : "Wait until the hub confirms a place before completing any payment steps.";
  } else if (isExternalPaymentFlow) {
    title = kind === "course" ? "Complete payment for this course" : "Complete payment for this event";
    description =
      kind === "course"
        ? "Your enrolment has been recorded. Complete the payment step below, then the hub team can confirm everything from their side."
        : "Your booking has been recorded. Complete the payment step below, then the hub team can confirm everything from their side.";
    paymentCardTitle = externalPaymentUrl ? "Payment details" : "Payment instructions";
    if (externalPaymentUrl && paymentInstructions) {
      paymentCardDescription =
        kind === "course"
          ? "To secure your enrolment for this course, please complete payment via the payment instructions provided below or alternatively via the payment button provided. After payment, the hub team will review your enrolment and update your status in your account under the My Bookings tab."
          : "To secure your booking for this event, please complete payment via the payment instructions provided below or alternatively via the payment button provided. After payment, the hub team will review your booking and update your status in your account under the My Bookings tab.";
    } else if (externalPaymentUrl) {
      paymentCardDescription =
        kind === "course"
          ? "To secure your enrolment for this course, please complete payment via the payment button provided below. After payment, the hub team will review your enrolment and update your status in your account under the My Bookings tab."
          : "To secure your booking for this event, please complete payment via the payment button provided below. After payment, the hub team will review your booking and update your status in your account under the My Bookings tab.";
    } else {
      paymentCardDescription =
        kind === "course"
          ? "To secure your enrolment for this course, please complete payment via the payment instructions provided below. After payment, the hub team will review your enrolment and update your status in your account under the My Bookings tab."
          : "To secure your booking for this event, please complete payment via the payment instructions provided below. After payment, the hub team will review your booking and update your status in your account under the My Bookings tab.";
    }
    paymentPrimaryAction = externalPaymentUrl
      ? {
          href: externalPaymentUrl,
          label: "Continue to payment",
          external: true,
        }
      : null;
  } else if (isInternalPaidFlow) {
    const nativePaymentStatus = normalizeString(registration?.nativePaymentStatus);
    const nativePaymentCheckoutUrl = normalizeString(registration?.nativePaymentCheckoutUrl);

    if (nativePaymentStatus === "checkout_open" && nativePaymentCheckoutUrl) {
      title = kind === "course" ? "Complete payment for this course" : "Complete payment for this event";
      description =
        kind === "course"
          ? "Your enrolment has been recorded. Complete the Stripe checkout below to confirm payment for this course."
          : "Your booking has been recorded. Complete the Stripe checkout below to confirm payment for this event.";
      paymentCardTitle = "Stripe checkout";
      paymentCardDescription =
        kind === "course"
          ? "Finish the secure checkout to complete payment for this enrolment. Your record stays in My Bookings throughout."
          : "Finish the secure checkout to complete payment for this booking. Your booking record stays in My Bookings throughout.";
      paymentPrimaryAction = {
        href: nativePaymentCheckoutUrl,
        label: "Continue checkout",
      };
    } else if (nativePaymentStatus === "checkout_cancelled" || nativePaymentStatus === "payment_failed") {
      title = kind === "course" ? "Retry payment for this course" : "Retry payment for this event";
      description = nativePaymentStatus === "payment_failed"
        ? kind === "course"
          ? "Your enrolment is still recorded, but the previous payment attempt did not complete successfully."
          : "Your booking is still recorded, but the previous payment attempt did not complete successfully."
        : kind === "course"
          ? "Your enrolment is still recorded, but the previous checkout was cancelled before payment finished."
          : "Your booking is still recorded, but the previous checkout was cancelled before payment finished.";
      paymentCardTitle = "Restart checkout";
      paymentCardDescription =
        kind === "course"
          ? "Start a fresh Stripe checkout to complete payment for this course."
          : "Start a fresh Stripe checkout to complete payment for this event.";
      paymentPrimaryAction = {
        href: restartCheckoutPath,
        label: "Restart checkout",
      };
    } else if (nativePaymentStatus === "checkout_completed") {
      title = "Payment submitted";
      description =
        kind === "course"
          ? "Your enrolment is recorded and the checkout finished. We are confirming the payment result now."
          : "Your booking is recorded and the checkout finished. We are confirming the payment result now.";
      paymentCardTitle = "Payment confirmation";
      paymentCardDescription =
        kind === "course"
          ? "Stripe has returned from checkout. Your enrolment record will update here once payment confirmation finishes."
          : "Stripe has returned from checkout. Your booking record will update here once payment confirmation finishes.";
    } else if (normalizeString(registration?.paymentStatus) === "paid" || nativePaymentStatus === "payment_received") {
      title = "Payment received";
      description =
        kind === "course"
          ? "Your course payment has been received and your enrolment is recorded in My Bookings."
          : "Your event payment has been received and your booking is recorded in My Bookings.";
      paymentCardTitle = "Payment complete";
      paymentCardDescription =
        kind === "course"
          ? "No further payment steps are needed for this enrolment."
          : "No further payment steps are needed for this booking.";
    } else {
      title = kind === "course" ? "Enrolment recorded" : "Booking recorded";
      description =
        kind === "course"
          ? "Your place has been recorded. Payment handling stays with the hub, and any updates will appear in My Bookings."
          : "Your place has been recorded. Payment handling stays with the hub, and any updates will appear in My Bookings.";
      paymentCardTitle = "Payment follow-up";
      paymentCardDescription =
        kind === "course"
          ? "Your enrolment stays recorded while we wait for payment confirmation or the next checkout step."
          : "The hub will manage payment confirmation for this event and update your booking record if anything changes.";
    }
  }

  return {
    eyebrow: offeringLabel,
    title,
    description,
    statusCard: {
      title: offering.title || offeringLabel,
      description:
        kind === "course"
          ? "This page keeps the immediate next step clear, while My Bookings remains your ongoing tracking view."
          : "This page keeps the immediate next step clear, while My Bookings remains your ongoing tracking view.",
      badges: [
        { label: statusLabel, tone: statusTone },
        ...(recurringEventOccurrence ? [{ label: "Recurring event", tone: "neutral" }] : []),
        ...(shouldShowPaymentBadge(registration)
          ? [{ label: paymentStatusLabel, tone: paymentStatusTone }]
          : []),
      ],
      details: [
        { label: kind === "course" ? "Course" : "Event", value: offering.title || offeringLabel },
        { label: kind === "course" ? "Schedule" : "Date", value: scheduleLabel },
        { label: kind === "course" ? "Delivery" : "Location", value: locationLabel },
        { label: "Price", value: priceLabel },
      ],
    },
    paymentCard: {
      title: paymentCardTitle,
      description: paymentCardDescription,
      instructions: isExternalPaymentFlow ? paymentInstructions : "",
      primaryAction: paymentPrimaryAction,
      secondaryAction: {
        href: bookingsPath,
        label: "Go to My Bookings",
      },
    },
    backAction: {
      href: offeringPath,
      label: kind === "course" ? "Back to course" : "Back to event",
    },
  };
}

export function buildPublicEventNextStepsModel({ hub, event, booking = null, registration = null }) {
  const resolvedBooking = booking || registration || null;
  const locale = resolveLaunchFormattingLocale(hub?.locale, hub?.country);
  const fallbackPriceLabel = formatPublicEventPriceLabel(event, locale);

  return buildBaseModel({
    kind: "event",
    hub,
    offering: event,
    registration: resolvedBooking,
    statusLabel: getEventBookingStatusLabel(resolvedBooking?.status),
    statusTone: getEventBookingStatusTone(resolvedBooking?.status),
    paymentStatusLabel: getEventBookingPaymentStatusLabel(resolvedBooking?.paymentStatus),
    paymentStatusTone: getEventBookingPaymentStatusTone(resolvedBooking?.paymentStatus),
    scheduleLabel: formatEventDateRange(event, locale),
    locationLabel: normalizeString(event?.location) || "Location to be confirmed",
    priceLabel: resolveRegistrationPriceLabel(resolvedBooking, fallbackPriceLabel, locale),
  });
}

export function buildPublicCourseNextStepsModel({ hub, course, registration }) {
  const locale = resolveLaunchFormattingLocale(hub?.locale, hub?.country);

  return buildBaseModel({
    kind: "course",
    hub,
    offering: course,
    registration,
    statusLabel: getCourseRegistrationStatusLabel(registration?.status),
    statusTone: getCourseRegistrationStatusTone(registration?.status),
    paymentStatusLabel: getCoursePaymentStatusLabel(registration?.paymentStatus),
    paymentStatusTone: getCoursePaymentStatusTone(registration?.paymentStatus),
    scheduleLabel: formatPublicCourseListingDateTime(course, locale),
    locationLabel: getPublicCourseDeliveryLabel(course),
    priceLabel: formatPublicCoursePriceLabel(course, locale),
  });
}
