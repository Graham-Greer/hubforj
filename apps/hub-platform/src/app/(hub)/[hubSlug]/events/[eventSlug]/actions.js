"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  buildPrimaryBookerAttendee,
  resolveEventBookingConfiguration,
} from "@/lib/domain/event-bookings";
import { requireHubBySlug } from "@/lib/data/hubs";
import {
  createEventBookingForMember,
  getActiveOrWaitlistedEventBookingByBooker,
} from "@/lib/data/event-bookings";
import { getHubPaymentConfigurationByHubId } from "@/lib/data/hub-payment-configurations";
import { requireCurrentMemberSessionForHub } from "@/lib/auth/member-session";
import { getEventBySlug } from "@/lib/data/events";
import { getRequestHostWithPortFromHeaders, resolveHubRuntimeRouteMode } from "@/lib/domain/hub-hosts";
import { startEventBookingCheckout } from "@/lib/server/event-booking-checkout";
import { queueInitialEventBookingNotification } from "@/lib/server/booking-notification-outbox";

function normalizeString(value) {
  return String(value || "").trim();
}

async function queueInitialEventBookingNotificationSafely(args) {
  try {
    await queueInitialEventBookingNotification(args);
  } catch (error) {
    console.error("[hub-platform] unable to queue initial event booking notification", error);
  }
}

function isRedirectLikeError(error) {
  return String(error?.digest || "").includes("NEXT_REDIRECT");
}

function splitFullName(value) {
  const fullName = normalizeString(value).replace(/\s+/g, " ");

  if (!fullName) {
    return null;
  }

  const [firstName = "", ...rest] = fullName.split(" ");

  return {
    firstName,
    lastName: rest.join(" "),
    displayName: fullName,
    fullName,
  };
}

function parseRequestedGuestAttendees(formData, guestCount) {
  return Array.from({ length: Math.max(0, guestCount) }, (_, index) =>
    splitFullName(formData.get(`attendeeFullName_${index}`))
  );
}

async function submitPublicEventBooking(formData) {
  const hubSlug = normalizeString(formData.get("hubSlug"));
  const eventId = normalizeString(formData.get("eventId"));
  const eventSlug = normalizeString(formData.get("eventSlug"));

  if (!hubSlug || !eventId || !eventSlug) {
    redirect(hubSlug ? `/${hubSlug}/events` : "/");
  }

  const hub = await requireHubBySlug(hubSlug);
  const detailPath = `/${hub.slug}/events/${eventSlug}`;
  const nextStepsPath = `/${hub.slug}/events/${eventSlug}/booking/next-steps`;
  const memberSession = await requireCurrentMemberSessionForHub(hub, detailPath);
  const event = await getEventBySlug(hub.slug, eventSlug);

  if (!event || event.id !== eventId) {
    redirect(detailPath);
  }

  let booking;

  booking = await getActiveOrWaitlistedEventBookingByBooker(hub.id, eventId, memberSession.user.id);

  if (!booking) {
    const bookingConfiguration = resolveEventBookingConfiguration(event);
    let attendees;

    if (bookingConfiguration.registrationEligibility !== "members-only") {
      const requestedAttendeeCount = Number.parseInt(String(formData.get("attendeeCount") || ""), 10) || 1;
      const includePrimaryBooker = formData.get("includePrimaryBooker") !== null;
      const guestCount = Math.max(0, requestedAttendeeCount - (includePrimaryBooker ? 1 : 0));
      const guestAttendees = parseRequestedGuestAttendees(formData, guestCount);

      if (guestAttendees.some((attendee) => !attendee?.fullName)) {
        throw new Error("Guest full name is required for every attendee.");
      }

      attendees = [
        ...(includePrimaryBooker ? [buildPrimaryBookerAttendee(memberSession.user)] : []),
        ...guestAttendees,
      ];
    }

    try {
      booking = await createEventBookingForMember(
        hub.id,
        eventId,
        memberSession.user,
        attendees ? { attendees } : {},
        memberSession.user.id
      );
    } catch (error) {
      const message = String(error?.message || "");

      if (message.includes("already have a booking")) {
        booking = await getActiveOrWaitlistedEventBookingByBooker(hub.id, eventId, memberSession.user.id);
      } else {
        throw error;
      }
    }
  }

  if (
    hub.packagePaymentProcessingMode === "internal" &&
    normalizeString(event.pricingMode) === "paid" &&
    normalizeString(booking?.status) === "active" &&
    normalizeString(booking?.paymentStatus) !== "paid" &&
    normalizeString(booking?.nativePaymentStatus) !== "checkout_open" &&
    normalizeString(booking?.nativePaymentStatus) !== "payment_received"
  ) {
    const paymentConfiguration = await getHubPaymentConfigurationByHubId(hub.id);

    if (paymentConfiguration?.isReady && normalizeString(paymentConfiguration?.stripeAccountId)) {
      const requestHeaders = await headers();
      const requestHost = getRequestHostWithPortFromHeaders(requestHeaders);
      const routeMode = resolveHubRuntimeRouteMode(requestHost);
      const checkout = await startEventBookingCheckout({
        hub,
        event,
        booking,
        memberSession,
        actorId: memberSession.user.id,
        requestHost,
        routeMode,
      });

      revalidatePath(detailPath);
      revalidatePath(`/${hub.slug}/account/bookings`);
      revalidatePath(nextStepsPath);
      await queueInitialEventBookingNotificationSafely({
        hub,
        event,
        booking,
        bookerUser: memberSession.user,
        actorId: memberSession.user.id,
        paymentUrl: checkout.checkoutUrl,
      });
      redirect(checkout.checkoutUrl);
    }
  }

  revalidatePath(detailPath);
  revalidatePath(`/${hub.slug}/account/bookings`);
  revalidatePath(nextStepsPath);
  await queueInitialEventBookingNotificationSafely({
    hub,
    event,
    booking,
    bookerUser: memberSession.user,
    actorId: memberSession.user.id,
  });
  redirect(nextStepsPath);
}

export async function bookPublicEventAction(formData) {
  return submitPublicEventBooking(formData);
}

export async function bookPublicEventWithAttendeesAction(_previousState, formData) {
  try {
    await submitPublicEventBooking(formData);
  } catch (error) {
    if (isRedirectLikeError(error)) {
      throw error;
    }

    return {
      error: String(error?.message || "Unable to create this booking."),
    };
  }

  return {
    error: "",
  };
}
