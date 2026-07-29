"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertActionHubIdMatches, requireHubOperatorActionAccess } from "@/lib/auth/action-access";
import { deleteTestimonial } from "@/lib/data/testimonials";

export async function deleteTestimonialAction(_previousState, formData) {
  const hubId = String(formData.get("hubId") || "").trim();
  const hubSlug = String(formData.get("hubSlug") || "").trim();
  const testimonialId = String(formData.get("testimonialId") || "").trim();
  const authorName = String(formData.get("authorName") || "").trim();

  if (!hubId || !hubSlug || !testimonialId) {
    return { error: "Testimonial context is required.", testimonialId, authorName };
  }

  try {
    const { hub } = await requireHubOperatorActionAccess(hubSlug);
    assertActionHubIdMatches(hub, hubId, { allowEmpty: false });
    await deleteTestimonial(hub.id, testimonialId);
  } catch (error) {
    return { error: String(error?.message || "Unable to delete testimonial."), testimonialId, authorName };
  }

  revalidatePath(`/${hubSlug}/admin/testimonials`);
  revalidatePath(`/${hubSlug}/admin/testimonials/${testimonialId}`);
  revalidatePath(`/${hubSlug}/testimonials`);

  redirect(`/${hubSlug}/admin/testimonials?deleted=1`);
}
