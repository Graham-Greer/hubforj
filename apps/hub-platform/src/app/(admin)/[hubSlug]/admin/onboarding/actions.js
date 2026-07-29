"use server";

import { revalidatePath } from "next/cache";
import { requireHubOperatorActionAccess } from "@/lib/auth/action-access";
import { completeHubRegionalSetupBySlug } from "@/lib/data/hubs";

function revalidateRegionalSetupPaths(hubSlug) {
  revalidatePath(`/${hubSlug}/admin`);
  revalidatePath(`/${hubSlug}/admin/onboarding`);
  revalidatePath(`/${hubSlug}/admin/events`);
  revalidatePath(`/${hubSlug}/admin/courses`);
  revalidatePath(`/${hubSlug}/admin/payments`);
  revalidatePath(`/${hubSlug}/admin/settings`);
  revalidatePath(`/${hubSlug}/admin/settings/site`);
}

export async function completeRegionalSetupAction(_previousState, formData) {
  const hubSlug = String(formData.get("hubSlug") || "").trim();
  const values = {
    country: String(formData.get("country") || ""),
    locale: String(formData.get("locale") || ""),
    timezone: String(formData.get("timezone") || ""),
    defaultCurrency: String(formData.get("defaultCurrency") || ""),
  };

  try {
    const { actorId } = await requireHubOperatorActionAccess(hubSlug);
    await completeHubRegionalSetupBySlug(hubSlug, values, actorId);
  } catch (error) {
    return {
      error: String(error?.message || "Unable to complete regional setup."),
      success: "",
      values,
    };
  }

  revalidateRegionalSetupPaths(hubSlug);

  return {
    error: "",
    success: "Regional setup complete.",
    values,
  };
}
