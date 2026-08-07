"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertActionHubIdMatches, requireHubOperatorActionAccess } from "@/lib/auth/action-access";
import { revalidatePublicWhatWeDoCache } from "@/lib/cache/public-content";
import { updateWhatWeDoItem } from "@/lib/data/what-we-do";
import { normalizeAdminReturnContext } from "@/lib/navigation/admin-return-context";

function revalidateWhatWeDoPaths(hubSlug, hubId, itemId) {
  revalidatePath(`/${hubSlug}/admin/what-we-do`);
  revalidatePath(`/${hubSlug}/admin/what-we-do/${itemId}`);
  revalidatePath(`/${hubSlug}/admin/settings/pages/home`);
  revalidatePath(`/${hubSlug}`);
  revalidatePath("/");

  if (hubId) {
    revalidatePublicWhatWeDoCache(hubId);
  }
}

export async function updateWhatWeDoAction(_previousState, formData) {
  const hubId = String(formData.get("hubId") || "").trim();
  const hubSlug = String(formData.get("hubSlug") || "").trim();
  const itemId = String(formData.get("itemId") || "").trim();
  const requestedReturnContext = {
    returnTo: String(formData.get("returnTo") || ""),
    returnSection: String(formData.get("returnSection") || ""),
  };
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
    revalidateWhatWeDoPaths(hubSlug, hub.id, itemId);
  } catch (error) {
    return { error: String(error?.message || "Unable to update What we do item."), success: "", values };
  }

  const returnContext = normalizeAdminReturnContext({
    hubSlug,
    returnTo: requestedReturnContext.returnTo,
    returnSection: requestedReturnContext.returnSection,
  });

  if (returnContext.returnTo) {
    redirect(returnContext.href);
  }

  redirect(`/${hubSlug}/admin/what-we-do/${itemId}?saved=1`);
}
