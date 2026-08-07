"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireHubOperatorActionAccess } from "@/lib/auth/action-access";
import { revalidatePublicWhatWeDoCache } from "@/lib/cache/public-content";
import { createWhatWeDoItemByHubSlug } from "@/lib/data/what-we-do";
import { normalizeAdminReturnContext } from "@/lib/navigation/admin-return-context";

function revalidateWhatWeDoPaths(hubSlug, hubId) {
  revalidatePath(`/${hubSlug}/admin/what-we-do`);
  revalidatePath(`/${hubSlug}/admin/settings/pages/home`);
  revalidatePath(`/${hubSlug}`);
  revalidatePath("/");

  if (hubId) {
    revalidatePublicWhatWeDoCache(hubId);
  }
}

export async function createWhatWeDoAction(_previousState, formData) {
  const hubSlug = String(formData.get("hubSlug") || "").trim();
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

  let item;
  try {
    const { hub, actorId } = await requireHubOperatorActionAccess(hubSlug);
    item = await createWhatWeDoItemByHubSlug(hubSlug, values, actorId);
    revalidateWhatWeDoPaths(hubSlug, hub.id);
  } catch (error) {
    return { error: String(error?.message || "Unable to create What we do item."), values };
  }

  const returnContext = normalizeAdminReturnContext({
    hubSlug,
    returnTo: requestedReturnContext.returnTo,
    returnSection: requestedReturnContext.returnSection,
  });

  if (returnContext.returnTo) {
    redirect(returnContext.href);
  }

  redirect(`/${hubSlug}/admin/what-we-do/${item.id}?created=1`);
}
