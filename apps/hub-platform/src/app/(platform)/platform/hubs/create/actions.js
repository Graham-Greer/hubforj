"use server";

import { redirect } from "next/navigation";
import { requirePlatformOperatorActionAccess } from "@/lib/auth/action-access";
import { createHub } from "@/lib/data/hub-mutations";

export async function createHubAction(_previousState, formData) {
  const values = {
    hubName: String(formData.get("hubName") || ""),
    hubSlug: String(formData.get("hubSlug") || ""),
    primaryDomain: String(formData.get("primaryDomain") || ""),
    template: String(formData.get("template") || "civic"),
    theme: String(formData.get("theme") || "light"),
    contactEmail: String(formData.get("contactEmail") || ""),
    description: String(formData.get("description") || ""),
    country: String(formData.get("country") || "US"),
    timezone: String(formData.get("timezone") || ""),
    locale: String(formData.get("locale") || "en-US"),
    defaultCurrency: String(formData.get("defaultCurrency") || "USD"),
    packageTier: String(formData.get("packageTier") || "free"),
  };
  const payload = {
    name: values.hubName,
    slug: values.hubSlug,
    customDomain: values.primaryDomain,
    template: values.template,
    theme: values.theme,
    contactEmail: values.contactEmail,
    description: values.description,
    country: values.country,
    timezone: values.timezone,
    locale: values.locale,
    defaultCurrency: values.defaultCurrency,
    packageTier: values.packageTier,
  };
  let hub;
  const { actorId } = await requirePlatformOperatorActionAccess("/platform/hubs/create");

  try {
    hub = await createHub(payload, actorId);
  } catch (error) {
    return {
      error: String(error?.message || "Unable to create hub."),
      values,
    };
  }

  redirect(`/platform/hubs/${hub.id}`);
}
