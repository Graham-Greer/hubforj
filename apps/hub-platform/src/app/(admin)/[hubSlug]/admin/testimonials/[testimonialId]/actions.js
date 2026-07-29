"use server";

import { revalidatePath } from "next/cache";
import { assertActionHubIdMatches, requireHubOperatorActionAccess } from "@/lib/auth/action-access";
import { updateTestimonial } from "@/lib/data/testimonials";

export async function updateTestimonialAction(_previousState, formData) {
  const hubId = String(formData.get("hubId") || "").trim();
  const hubSlug = String(formData.get("hubSlug") || "").trim();
  const testimonialId = String(formData.get("testimonialId") || "").trim();
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

  try {
    const { hub, actorId } = await requireHubOperatorActionAccess(hubSlug);
    assertActionHubIdMatches(hub, hubId, { allowEmpty: false });
    await updateTestimonial(hub.id, testimonialId, values, actorId);
  } catch (error) {
    return { error: String(error?.message || "Unable to update testimonial."), success: "", values };
  }

  revalidatePath(`/${hubSlug}/admin/testimonials`);
  revalidatePath(`/${hubSlug}/admin/testimonials/${testimonialId}`);
  revalidatePath(`/${hubSlug}/testimonials`);

  return { error: "", success: "Testimonial updated.", values };
}
