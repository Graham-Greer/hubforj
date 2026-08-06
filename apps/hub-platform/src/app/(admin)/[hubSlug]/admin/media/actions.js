"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireHubOperatorActionAccess } from "@/lib/auth/action-access";
import { rebuildHubMediaUsageProjections } from "@/lib/data/media-usage-projection";

function normalizeString(value) {
  return String(value || "").trim();
}

function buildMediaRedirect(hubSlug, feedback = "") {
  const params = new URLSearchParams();

  if (feedback) {
    const [key, value] = feedback.split("=", 2);
    if (key && value) {
      params.set(key, value);
    }
  }

  const queryString = params.toString();
  return `/${hubSlug}/admin/media${queryString ? `?${queryString}` : ""}`;
}

async function requireSupportMediaAccess(hubSlug) {
  const result = await requireHubOperatorActionAccess(hubSlug, {
    unauthorizedMessage: "You are not authorized to maintain this media library.",
  });

  if (result.access?.mode !== "support") {
    throw new Error("Media projection maintenance is available only in support mode.");
  }

  return result;
}

export async function syncHubMediaUsageProjectionsAction(formData) {
  const hubSlug = normalizeString(formData.get("hubSlug"));

  if (!hubSlug) {
    redirect("/platform");
  }

  try {
    const { hub, actorId } = await requireSupportMediaAccess(hubSlug);
    await rebuildHubMediaUsageProjections(hub.id, actorId);
    revalidatePath(`/${hub.slug}/admin/media`);
  } catch (error) {
    redirect(buildMediaRedirect(hubSlug, `error=${encodeURIComponent(String(error?.message || "Unable to sync media usage projections."))}`));
  }

  redirect(buildMediaRedirect(hubSlug, "success=mediaUsageSynced"));
}
