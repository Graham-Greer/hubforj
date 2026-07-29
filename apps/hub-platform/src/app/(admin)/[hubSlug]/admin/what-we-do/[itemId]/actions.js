"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertActionHubIdMatches, requireHubOperatorActionAccess } from "@/lib/auth/action-access";
import { updateWhatWeDoItem } from "@/lib/data/what-we-do";

function revalidateWhatWeDoPaths(hubSlug, itemId) {
  revalidatePath(`/${hubSlug}/admin/what-we-do`);
  revalidatePath(`/${hubSlug}/admin/what-we-do/${itemId}`);
  revalidatePath(`/${hubSlug}`);
  revalidatePath("/");
}

export async function updateWhatWeDoAction(_previousState, formData) {
  const hubId = String(formData.get("hubId") || "").trim();
  const hubSlug = String(formData.get("hubSlug") || "").trim();
  const itemId = String(formData.get("itemId") || "").trim();
  const values = {
    title: String(formData.get("title") || ""),
    description: String(formData.get("description") || ""),
    status: String(formData.get("status") || "draft"),
    sortOrder: String(formData.get("sortOrder") || "0"),
  };

  try {
    const { hub, actorId } = await requireHubOperatorActionAccess(hubSlug);
    assertActionHubIdMatches(hub, hubId, { allowEmpty: false });
    await updateWhatWeDoItem(hub.id, itemId, values, actorId);
  } catch (error) {
    return { error: String(error?.message || "Unable to update What we do item."), success: "", values };
  }

  revalidateWhatWeDoPaths(hubSlug, itemId);

  redirect(`/${hubSlug}/admin/what-we-do/${itemId}?saved=1`);
}
