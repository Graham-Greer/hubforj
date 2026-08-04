"use server";

import { redirect } from "next/navigation";
import { requireHubOperatorActionAccess } from "@/lib/auth/action-access";
import { revalidatePublicEventsCache } from "@/lib/cache/public-content";
import { createEventByHubSlug } from "@/lib/data/events";
import { createEventSeriesByHubSlug } from "@/lib/data/event-series";
import { assertHubRegionalSetupComplete } from "@/lib/domain/hub-regional-setup";
import { getPackageUpgradeNotice } from "@/lib/domain/package-upgrade";

export async function createEventAction(_previousState, formData) {
  const hubSlug = String(formData.get("hubSlug") || "").trim();
  const scheduleMode = String(formData.get("scheduleMode") || "single").trim();
  const values = {
    scheduleMode,
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
    recurrenceUntilDate: String(formData.get("recurrenceUntilDate") || ""),
    recurrenceFrequency: String(formData.get("recurrenceFrequency") || "weekly"),
    recurrenceInterval: String(formData.get("recurrenceInterval") || "1"),
    recurrenceDaysOfWeek: String(formData.get("recurrenceDaysOfWeek") || ""),
    recurrenceDayOfMonth: String(formData.get("recurrenceDayOfMonth") || "1"),
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
  const isRecurring = scheduleMode === "recurring";
  let event;
  let series;
  let hubId = "";

  try {
    const { hub, actorId } = await requireHubOperatorActionAccess(hubSlug);
    assertHubRegionalSetupComplete(hub);
    hubId = hub.id;

    if (isRecurring) {
      series = await createEventSeriesByHubSlug(
        hubSlug,
        {
          ...values,
          recurrenceEnabled: true,
          recurrenceStartDate: values.startDate,
          recurrenceUntilDate: values.recurrenceUntilDate,
          recurrenceDaysOfWeek: values.recurrenceDaysOfWeek,
          recurrenceDayOfMonth: values.recurrenceDayOfMonth,
          recurrenceFrequency: values.recurrenceFrequency,
          recurrenceInterval: values.recurrenceInterval,
        },
        actorId
      );
    } else {
      event = await createEventByHubSlug(hubSlug, values, actorId);
    }
  } catch (error) {
    return {
      error: String(error?.message || "Unable to create event."),
      upgradeNotice: getPackageUpgradeNotice(error),
      values,
    };
  }

  revalidatePublicEventsCache(hubId);

  if (series?.id) {
    redirect(`/${hubSlug}/admin/events/series/${series.id}`);
  }

  redirect(`/${hubSlug}/admin/events/${event.id}`);
}
