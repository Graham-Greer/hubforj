"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertActionHubIdMatches, requireHubOperatorActionAccess } from "@/lib/auth/action-access";
import { revalidatePublicEventsCache } from "@/lib/cache/public-content";
import { deleteEventById, getEventById, updateEventById } from "@/lib/data/events";
import { assertHubRegionalSetupComplete } from "@/lib/domain/hub-regional-setup";
import { getPackageUpgradeNotice } from "@/lib/domain/package-upgrade";
import { queueEventCancelledByAdminNotifications } from "@/lib/server/booking-notification-outbox";

function revalidateEventPaths(hubSlug, eventId, hubId) {
  revalidatePath(`/${hubSlug}/admin/events`);
  revalidatePath(`/${hubSlug}/admin/events/${eventId}`);
  revalidatePath(`/${hubSlug}/events`);
  revalidatePath(`/${hubSlug}/admin/media`);
  revalidatePublicEventsCache(hubId);
}

async function queueEventCancelledByAdminNotificationsSafely(args) {
  try {
    await queueEventCancelledByAdminNotifications(args);
  } catch (error) {
    console.error("[hub-platform] unable to queue whole-event cancellation notifications", error);
  }
}

export async function updateEventAction(_previousState, formData) {
  const hubId = String(formData.get("hubId") || "").trim();
  const hubSlug = String(formData.get("hubSlug") || "").trim();
  const eventId = String(formData.get("eventId") || "").trim();
  const previousSlug = String(formData.get("previousSlug") || "").trim();
  const values = {
    title: String(formData.get("title") || ""),
    slug: String(formData.get("slug") || ""),
    summary: String(formData.get("summary") || ""),
    description: String(formData.get("description") || ""),
    imageAssetId: String(formData.get("imageAssetId") || ""),
    imageAlt: String(formData.get("imageAlt") || ""),
    location: String(formData.get("location") || ""),
    startDate: String(formData.get("startDate") || ""),
    endDate: String(formData.get("endDate") || ""),
    startTime: String(formData.get("startTime") || ""),
    endTime: String(formData.get("endTime") || ""),
    capacity: String(formData.get("capacity") || ""),
    pricingMode: String(formData.get("pricingMode") || "free"),
    price: String(formData.get("price") || ""),
    currency: String(formData.get("currency") || "USD"),
    externalPaymentUrl: String(formData.get("externalPaymentUrl") || ""),
    paymentInstructions: String(formData.get("paymentInstructions") || ""),
    refundWindowMode: String(formData.get("refundWindowMode") || "default"),
    refundWindowHours: String(formData.get("refundWindowHours") || "48"),
    refundPolicy: String(formData.get("refundPolicy") || "full_refund_before_window"),
    registrationEligibility: String(formData.get("registrationEligibility") || "members-only"),
    bookingMode: String(formData.get("bookingMode") || "single_attendee"),
    maxAttendeesPerBooking: String(formData.get("maxAttendeesPerBooking") || "2"),
    guestDetailsMode: String(formData.get("guestDetailsMode") || "name_only"),
    visibility: String(formData.get("visibility") || "public"),
    allowWaitlist: String(formData.get("allowWaitlist") || "true"),
    category: String(formData.get("category") || ""),
    status: String(formData.get("status") || "draft"),
  };
  let event;
  let previousEvent = null;

  try {
    const { hub, actorId } = await requireHubOperatorActionAccess(hubSlug);
    assertActionHubIdMatches(hub, hubId, { allowEmpty: false });
    assertHubRegionalSetupComplete(hub);
    previousEvent = await getEventById(hub.id, eventId);
    event = await updateEventById(hub.id, eventId, values, actorId);

    if (
      String(previousEvent?.status || "").trim() !== "cancelled" &&
      String(event?.status || "").trim() === "cancelled"
    ) {
      await queueEventCancelledByAdminNotificationsSafely({
        hub,
        event,
        actorId,
      });
    }
  } catch (error) {
    return {
      error: String(error?.message || "Unable to update event."),
      success: "",
      upgradeNotice: getPackageUpgradeNotice(error),
      values,
    };
  }

  revalidateEventPaths(hubSlug, eventId, hubId);
  if (previousSlug) {
    revalidatePath(`/${hubSlug}/events/${previousSlug}`);
  }
  if (event?.slug) {
    revalidatePath(`/${hubSlug}/events/${event.slug}`);
  }
  return { error: "", success: "Event details updated.", values };
}

export async function deleteEventAction(_previousState, formData) {
  const hubId = String(formData.get("hubId") || "").trim();
  const hubSlug = String(formData.get("hubSlug") || "").trim();
  const eventId = String(formData.get("eventId") || "").trim();

  if (!hubId || !hubSlug || !eventId) {
    return { error: "Event context is required." };
  }

  try {
    const { hub } = await requireHubOperatorActionAccess(hubSlug);
    assertActionHubIdMatches(hub, hubId, { allowEmpty: false });
    assertHubRegionalSetupComplete(hub);
    await deleteEventById(hub.id, eventId);
  } catch (error) {
    return { error: String(error?.message || "Unable to delete event.") };
  }

  revalidateEventPaths(hubSlug, eventId, hubId);
  redirect(`/${hubSlug}/admin/events?deleted=1`);
}
