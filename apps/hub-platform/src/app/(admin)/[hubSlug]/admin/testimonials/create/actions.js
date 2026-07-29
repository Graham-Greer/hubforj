"use server";

import { redirect } from "next/navigation";
import { requireHubOperatorActionAccess } from "@/lib/auth/action-access";
import { createTestimonialByHubSlug } from "@/lib/data/testimonials";

export async function createTestimonialAction(_previousState, formData) {
  const hubSlug = String(formData.get("hubSlug") || "").trim();
  const values = {
    quote: String(formData.get("quote") || ""),
    authorName: String(formData.get("authorName") || ""),
    authorRole: String(formData.get("authorRole") || ""),
    authorOrganization: String(formData.get("authorOrganization") || ""),
    authorImageAssetId: String(formData.get("authorImageAssetId") || ""),
    authorImageAlt: String(formData.get("authorImageAlt") || ""),
    status: String(formData.get("status") || "draft"),
    featured: String(formData.get("featured") || "false"),
    sortOrder: String(formData.get("sortOrder") || "0"),
  };

  let testimonial;
  try {
    const { actorId } = await requireHubOperatorActionAccess(hubSlug);
    testimonial = await createTestimonialByHubSlug(hubSlug, values, actorId);
  } catch (error) {
    return { error: String(error?.message || "Unable to create testimonial."), values };
  }

  redirect(`/${hubSlug}/admin/testimonials/${testimonial.id}`);
}
