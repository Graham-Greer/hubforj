"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireHubOperatorActionAccess } from "@/lib/auth/action-access";
import { createWhatWeDoItemByHubSlug } from "@/lib/data/what-we-do";

function revalidateWhatWeDoPaths(hubSlug) {
  revalidatePath(`/${hubSlug}/admin/what-we-do`);
  revalidatePath(`/${hubSlug}`);
  revalidatePath("/");
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
    const { actorId } = await requireHubOperatorActionAccess(hubSlug);
    item = await createWhatWeDoItemByHubSlug(hubSlug, values, actorId);
  } catch (error) {
    return { error: String(error?.message || "Unable to create What we do item."), values };
  }

  revalidateWhatWeDoPaths(hubSlug);

  redirect(`/${hubSlug}/admin/what-we-do/${item.id}?created=1`);
}
