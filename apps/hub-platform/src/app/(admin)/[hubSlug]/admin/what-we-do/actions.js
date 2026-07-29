"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertActionHubIdMatches, requireHubOperatorActionAccess } from "@/lib/auth/action-access";
import { deleteWhatWeDoItem } from "@/lib/data/what-we-do";

function revalidateWhatWeDoPaths(hubSlug, itemId) {
  revalidatePath(`/${hubSlug}/admin/what-we-do`);
  revalidatePath(`/${hubSlug}/admin/what-we-do/${itemId}`);
  revalidatePath(`/${hubSlug}`);
  revalidatePath("/");
}

export async function deleteWhatWeDoAction(_previousState, formData) {
  const hubId = String(formData.get("hubId") || "").trim();
  const hubSlug = String(formData.get("hubSlug") || "").trim();
  const itemId = String(formData.get("itemId") || "").trim();
  const title = String(formData.get("title") || "").trim();

  if (!hubId || !hubSlug || !itemId) {
    return { error: "What we do item context is required.", itemId, title };
  }

  try {
    const { hub } = await requireHubOperatorActionAccess(hubSlug);
    assertActionHubIdMatches(hub, hubId, { allowEmpty: false });
    await deleteWhatWeDoItem(hub.id, itemId);
  } catch (error) {
    return { error: String(error?.message || "Unable to delete What we do item."), itemId, title };
  }

  revalidateWhatWeDoPaths(hubSlug, itemId);

  redirect(`/${hubSlug}/admin/what-we-do?deleted=1`);
}
