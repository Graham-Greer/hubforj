"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertActionHubIdMatches, requireHubOperatorActionAccess } from "@/lib/auth/action-access";
import { revalidatePublicWhatWeDoCache } from "@/lib/cache/public-content";
import { deleteWhatWeDoItem } from "@/lib/data/what-we-do";
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

export async function deleteWhatWeDoAction(_previousState, formData) {
  const hubId = String(formData.get("hubId") || "").trim();
  const hubSlug = String(formData.get("hubSlug") || "").trim();
  const itemId = String(formData.get("itemId") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const requestedReturnContext = {
    returnTo: String(formData.get("returnTo") || ""),
    returnSection: String(formData.get("returnSection") || ""),
  };

  if (!hubId || !hubSlug || !itemId) {
    return { error: "What we do item context is required.", itemId, title };
  }

  try {
    const { hub } = await requireHubOperatorActionAccess(hubSlug);
    assertActionHubIdMatches(hub, hubId, { allowEmpty: false });
    await deleteWhatWeDoItem(hub.id, itemId);
    revalidateWhatWeDoPaths(hubSlug, hub.id, itemId);
  } catch (error) {
    return { error: String(error?.message || "Unable to delete What we do item."), itemId, title };
  }

  const returnContext = normalizeAdminReturnContext({
    hubSlug,
    returnTo: requestedReturnContext.returnTo,
    returnSection: requestedReturnContext.returnSection,
  });

  if (returnContext.returnTo) {
    redirect(returnContext.href);
  }

  redirect(`/${hubSlug}/admin/what-we-do?deleted=1`);
}
