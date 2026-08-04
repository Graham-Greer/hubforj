"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { requireHubOperatorActionAccess } from "@/lib/auth/action-access";
import { revalidatePublicCoursesCache } from "@/lib/cache/public-content";
import { createCourseByHubSlug } from "@/lib/data/courses";
import { getRequestHostFromHeaders, resolveHubRuntimeRouteMode } from "@/lib/domain/hub-hosts";
import { buildHubRuntimeHref } from "@/lib/domain/hub-runtime-paths";
import { assertHubRegionalSetupComplete } from "@/lib/domain/hub-regional-setup";

async function buildAdminActionHref(hubSlug, pathname) {
  const headerStore = await headers();
  const routeMode = resolveHubRuntimeRouteMode(getRequestHostFromHeaders(headerStore));
  return buildHubRuntimeHref(hubSlug, pathname, routeMode);
}

export async function createCourseAction(_previousState, formData) {
  const hubSlug = String(formData.get("hubSlug") || "").trim();
  const values = {
    title: String(formData.get("title") || ""),
    slug: String(formData.get("slug") || ""),
    summary: String(formData.get("summary") || ""),
    description: String(formData.get("description") || ""),
    imageAssetId: String(formData.get("imageAssetId") || ""),
    imageAlt: String(formData.get("imageAlt") || ""),
    courseType: String(formData.get("courseType") || ""),
    subtypeLabel: String(formData.get("subtypeLabel") || ""),
    courseLevel: String(formData.get("courseLevel") || ""),
    customLevelLabel: String(formData.get("customLevelLabel") || ""),
    format: String(formData.get("format") || "in-person"),
    location: String(formData.get("location") || ""),
    onlineMeetingLink: String(formData.get("onlineMeetingLink") || ""),
    timezone: String(formData.get("timezone") || ""),
    accessInstructions: String(formData.get("accessInstructions") || ""),
    startDate: String(formData.get("startDate") || ""),
    endDate: String(formData.get("endDate") || ""),
    startTime: String(formData.get("startTime") || ""),
    endTime: String(formData.get("endTime") || ""),
    registrationOpenDate: String(formData.get("registrationOpenDate") || ""),
    registrationCloseDate: String(formData.get("registrationCloseDate") || ""),
    sessionCount: String(formData.get("sessionCount") || ""),
    capacity: String(formData.get("capacity") || ""),
    pricingMode: String(formData.get("pricingMode") || "free"),
    price: String(formData.get("price") || ""),
    currency: String(formData.get("currency") || "USD"),
    externalPaymentUrl: String(formData.get("externalPaymentUrl") || ""),
    paymentInstructions: String(formData.get("paymentInstructions") || ""),
    requiresDeposit: String(formData.get("requiresDeposit") || "false"),
    depositAmount: String(formData.get("depositAmount") || ""),
    paymentDeadline: String(formData.get("paymentDeadline") || ""),
    refundWindowMode: String(formData.get("refundWindowMode") || "custom"),
    refundWindowHours: String(formData.get("refundWindowHours") || "48"),
    refundPolicy: String(formData.get("refundPolicy") || "full_refund_before_window"),
    registrationEligibility: "members-only",
    visibility: String(formData.get("visibility") || "public"),
    allowWaitlist: String(formData.get("allowWaitlist") || "true"),
    status: String(formData.get("status") || "draft"),
  };

  let course;
  let hubId = "";
  try {
    const { hub, actorId } = await requireHubOperatorActionAccess(hubSlug);
    assertHubRegionalSetupComplete(hub);
    hubId = hub.id;
    course = await createCourseByHubSlug(hubSlug, values, actorId);
  } catch (error) {
    return {
      error: String(error?.message || "Unable to create course."),
      values,
    };
  }

  revalidatePublicCoursesCache(hubId);

  redirect(await buildAdminActionHref(hubSlug, `/admin/courses/${course.id}`));
}
