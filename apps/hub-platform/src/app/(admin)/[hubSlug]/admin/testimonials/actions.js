"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertActionHubIdMatches, requireHubOperatorActionAccess } from "@/lib/auth/action-access";
import { revalidatePublicTestimonialsCache } from "@/lib/cache/public-content";
import { deleteTestimonial } from "@/lib/data/testimonials";

function revalidateTestimonialPaths(hubSlug, hubId, testimonialId) {
  revalidatePath(`/${hubSlug}/admin/testimonials`);
  revalidatePath(`/${hubSlug}/admin/testimonials/${testimonialId}`);
  revalidatePath(`/${hubSlug}/testimonials`);
  revalidatePath(`/${hubSlug}`);

  if (hubId) {
    revalidatePublicTestimonialsCache(hubId);
  }
}

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
    revalidateTestimonialPaths(hubSlug, hub.id, testimonialId);
  } catch (error) {
    return { error: String(error?.message || "Unable to delete testimonial."), testimonialId, authorName };
  }

  redirect(`/${hubSlug}/admin/testimonials?deleted=1`);
}
