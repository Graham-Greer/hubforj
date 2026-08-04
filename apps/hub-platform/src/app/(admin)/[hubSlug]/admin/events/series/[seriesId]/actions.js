"use server";

import { revalidatePath } from "next/cache";
import { assertActionHubIdMatches, requireHubOperatorActionAccess } from "@/lib/auth/action-access";
import { revalidatePublicEventsCache } from "@/lib/cache/public-content";
import { updateEventSeriesById } from "@/lib/data/event-series";
import { assertHubRegionalSetupComplete } from "@/lib/domain/hub-regional-setup";
import { getPackageUpgradeNotice } from "@/lib/domain/package-upgrade";

function revalidateEventSeriesPaths(hubSlug, seriesId, occurrences = []) {
  revalidatePath(`/${hubSlug}/admin/events`);
  revalidatePath(`/${hubSlug}/admin/events/series/${seriesId}`);
  revalidatePath(`/${hubSlug}/events`);
  revalidatePath(`/${hubSlug}/admin/media`);

  occurrences.forEach((occurrence) => {
    if (occurrence?.id) {
      revalidatePath(`/${hubSlug}/admin/events/${occurrence.id}`);
    }

    if (occurrence?.slug) {
      revalidatePath(`/${hubSlug}/events/${occurrence.slug}`);
    }
  });
}

function formatRecurringSaveSuccessMessage(result) {
  const sync = result?.sync || {};
  const parts = [];

  if (Number(sync.updatedCount) > 0) {
    parts.push(`${sync.updatedCount} future occurrence${sync.updatedCount === 1 ? "" : "s"} updated`);
  }

  if (Number(sync.createdCount) > 0) {
    parts.push(`${sync.createdCount} occurrence${sync.createdCount === 1 ? "" : "s"} created`);
  }

  if (Number(sync.cancelledCount) > 0) {
    parts.push(`${sync.cancelledCount} occurrence${sync.cancelledCount === 1 ? "" : "s"} cancelled`);
  }

  if (Number(sync.preservedCount) > 0) {
    parts.push(`${sync.preservedCount} booked occurrence${sync.preservedCount === 1 ? "" : "s"} preserved`);
  }

  if (!parts.length) {
    return "Recurring event updated.";
  }

  return `Recurring event updated. ${parts.join(", ")}.`;
}

export async function updateEventSeriesAction(_previousState, formData) {
  const hubId = String(formData.get("hubId") || "").trim();
  const hubSlug = String(formData.get("hubSlug") || "").trim();
  const seriesId = String(formData.get("seriesId") || "").trim();
  const values = {
    scheduleMode: "recurring",
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

  let series;

  try {
    const { hub, actorId } = await requireHubOperatorActionAccess(hubSlug);
    assertActionHubIdMatches(hub, hubId, { allowEmpty: false });
    assertHubRegionalSetupComplete(hub);
    series = await updateEventSeriesById(hub.id, seriesId, {
      ...values,
      recurrenceEnabled: true,
      recurrenceStartDate: values.startDate,
      recurrenceUntilDate: values.recurrenceUntilDate,
      recurrenceDaysOfWeek: values.recurrenceDaysOfWeek,
      recurrenceDayOfMonth: values.recurrenceDayOfMonth,
      recurrenceFrequency: values.recurrenceFrequency,
      recurrenceInterval: values.recurrenceInterval,
    }, actorId);
  } catch (error) {
    return {
      error: String(error?.message || "Unable to update recurring event."),
      success: "",
      upgradeNotice: getPackageUpgradeNotice(error),
      values,
    };
  }

  revalidateEventSeriesPaths(hubSlug, seriesId, series?.occurrences || []);
  revalidatePublicEventsCache(hubId);

  return {
    error: "",
    success: formatRecurringSaveSuccessMessage(series),
    values,
  };
}
