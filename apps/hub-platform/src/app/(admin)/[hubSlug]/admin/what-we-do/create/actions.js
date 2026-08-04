"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireHubOperatorActionAccess } from "@/lib/auth/action-access";
import { revalidatePublicWhatWeDoCache } from "@/lib/cache/public-content";
import { createWhatWeDoItemByHubSlug } from "@/lib/data/what-we-do";

function revalidateWhatWeDoPaths(hubSlug, hubId) {
  revalidatePath(`/${hubSlug}/admin/what-we-do`);
  revalidatePath(`/${hubSlug}`);
  revalidatePath("/");

  if (hubId) {
    revalidatePublicWhatWeDoCache(hubId);
  }
}

export async function createWhatWeDoAction(_previousState, formData) {
  const hubSlug = String(formData.get("hubSlug") || "").trim();
  const values = {
    title: String(formData.get("title") || ""),
    description: String(formData.get("description") || ""),
    status: String(formData.get("status") || "draft"),
    sortOrder: String(formData.get("sortOrder") || "0"),
  };

  let item;
  try {
    const { hub, actorId } = await requireHubOperatorActionAccess(hubSlug);
    item = await createWhatWeDoItemByHubSlug(hubSlug, values, actorId);
    revalidateWhatWeDoPaths(hubSlug, hub.id);
  } catch (error) {
    return { error: String(error?.message || "Unable to create What we do item."), values };
  }

  redirect(`/${hubSlug}/admin/what-we-do/${item.id}?created=1`);
}
