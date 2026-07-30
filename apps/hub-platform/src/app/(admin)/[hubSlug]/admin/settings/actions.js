"use server";

import { revalidatePath } from "next/cache";
import { requireHubOperatorActionAccess } from "@/lib/auth/action-access";
import {
  updateBrandingSettingsByHubSlug,
  updateCoursesPageSettingsByHubSlug,
  updateEventsPageSettingsByHubSlug,
  updateHomepageSettingsByHubSlug,
  updateSiteSettingsByHubSlug,
  updateTestimonialsPageSettingsByHubSlug,
} from "@/lib/data/site-settings";
import { checkHubCustomDomainVerificationBySlug, requestHubCustomDomainBySlug } from "@/lib/data/hub-mutations";
import { scheduleHubCustomDomainDisconnectRecord } from "@/lib/data/custom-domain-verification";

function revalidateSettingsPaths(hubSlug) {
  revalidatePath(`/${hubSlug}`);
  revalidatePath(`/${hubSlug}/about`);
  revalidatePath(`/${hubSlug}/terms`);
  revalidatePath(`/${hubSlug}/privacy`);
  revalidatePath(`/${hubSlug}/cookies`);
  revalidatePath(`/${hubSlug}/events`);
  revalidatePath(`/${hubSlug}/courses`);
  revalidatePath(`/${hubSlug}/admin`);
  revalidatePath(`/${hubSlug}/testimonials`);
  revalidatePath(`/${hubSlug}/join`);
  revalidatePath(`/${hubSlug}/sign-in`);
  revalidatePath(`/${hubSlug}/admin/settings`);
  revalidatePath(`/${hubSlug}/admin/settings/account`);
  revalidatePath(`/${hubSlug}/admin/settings/branding`);
  revalidatePath(`/${hubSlug}/admin/payments`);
  revalidatePath(`/${hubSlug}/admin/settings/pages`);
  revalidatePath(`/${hubSlug}/admin/settings/pages/courses`);
  revalidatePath(`/${hubSlug}/admin/settings/pages/events`);
  revalidatePath(`/${hubSlug}/admin/settings/pages/home`);
  revalidatePath(`/${hubSlug}/admin/settings/pages/testimonials`);
  revalidatePath(`/${hubSlug}/admin/settings/site`);
}

export async function updateBrandingSettingsAction(_previousState, formData) {
  const hubSlug = String(formData.get("hubSlug") || "").trim();
  const values = {
    logoAssetId: String(formData.get("logoAssetId") || ""),
    logoAlt: String(formData.get("logoAlt") || ""),
    themeKey: String(formData.get("themeKey") || "light"),
    templateKey: String(formData.get("templateKey") || "civic"),
    headerCtaKey: String(formData.get("headerCtaKey") || "none"),
    brandPrimaryColor: String(formData.get("brandPrimaryColor") || ""),
    brandSecondaryColor: String(formData.get("brandSecondaryColor") || ""),
  };

  try {
    const { actorId } = await requireHubOperatorActionAccess(hubSlug);
    await updateBrandingSettingsByHubSlug(hubSlug, values, actorId);
  } catch (error) {
    return { error: String(error?.message || "Unable to update branding settings."), success: "", values };
  }

  revalidateSettingsPaths(hubSlug);
  return { error: "", success: "Branding settings updated.", values };
}

export async function updateSiteSettingsAction(_previousState, formData) {
  const hubSlug = String(formData.get("hubSlug") || "").trim();
  const values = {
    hubName: String(formData.get("hubName") || ""),
    siteName: String(formData.get("siteName") || ""),
    contactEmail: String(formData.get("contactEmail") || ""),
    contactPhone: String(formData.get("contactPhone") || ""),
    country: String(formData.get("country") || ""),
    locale: String(formData.get("locale") || ""),
    timezone: String(formData.get("timezone") || ""),
    defaultCurrency: String(formData.get("defaultCurrency") || ""),
    addressLine1: String(formData.get("addressLine1") || ""),
    addressLine2: String(formData.get("addressLine2") || ""),
    addressCity: String(formData.get("addressCity") || ""),
    addressStateOrProvince: String(formData.get("addressStateOrProvince") || ""),
    addressPostalCode: String(formData.get("addressPostalCode") || ""),
    addressCountry: String(formData.get("addressCountry") || ""),
    hoursMonday: String(formData.get("hoursMonday") || ""),
    hoursTuesday: String(formData.get("hoursTuesday") || ""),
    hoursWednesday: String(formData.get("hoursWednesday") || ""),
    hoursThursday: String(formData.get("hoursThursday") || ""),
    hoursFriday: String(formData.get("hoursFriday") || ""),
    hoursSaturday: String(formData.get("hoursSaturday") || ""),
    hoursSunday: String(formData.get("hoursSunday") || ""),
    facebook: String(formData.get("facebook") || ""),
    instagram: String(formData.get("instagram") || ""),
    x: String(formData.get("x") || ""),
    linkedin: String(formData.get("linkedin") || ""),
    youtube: String(formData.get("youtube") || ""),
    seoTitle: String(formData.get("seoTitle") || ""),
    seoDescription: String(formData.get("seoDescription") || ""),
  };

  try {
    const { actorId } = await requireHubOperatorActionAccess(hubSlug);
    await updateSiteSettingsByHubSlug(hubSlug, values, actorId);
  } catch (error) {
    return { error: String(error?.message || "Unable to update site settings."), success: "", values };
  }

  revalidateSettingsPaths(hubSlug);
  return { error: "", success: "Site settings updated.", values };
}

export async function updateHomepageSettingsAction(_previousState, formData) {
  const hubSlug = String(formData.get("hubSlug") || "").trim();
  const values = {
    heroMediaAssetId: String(formData.get("heroMediaAssetId") || ""),
    heroMediaAlt: String(formData.get("heroMediaAlt") || ""),
    heroEyebrow: String(formData.get("heroEyebrow") || ""),
    heroTitle: String(formData.get("heroTitle") || ""),
    heroDescription: String(formData.get("heroDescription") || ""),
    heroPrimaryActionLabel: String(formData.get("heroPrimaryActionLabel") || ""),
    heroPrimaryActionDestination: String(formData.get("heroPrimaryActionDestination") || ""),
    heroSecondaryActionLabel: String(formData.get("heroSecondaryActionLabel") || ""),
    heroSecondaryActionDestination: String(formData.get("heroSecondaryActionDestination") || ""),
    ctaEyebrow: String(formData.get("ctaEyebrow") || ""),
    ctaTitle: String(formData.get("ctaTitle") || ""),
    ctaDescription: String(formData.get("ctaDescription") || ""),
    ctaPrimaryActionLabel: String(formData.get("ctaPrimaryActionLabel") || ""),
    ctaPrimaryActionDestination: String(formData.get("ctaPrimaryActionDestination") || ""),
    ctaSecondaryActionLabel: String(formData.get("ctaSecondaryActionLabel") || ""),
    ctaSecondaryActionDestination: String(formData.get("ctaSecondaryActionDestination") || ""),
    infoMediaAssetId: String(formData.get("infoMediaAssetId") || ""),
    infoMediaAlt: String(formData.get("infoMediaAlt") || ""),
    infoEyebrow: String(formData.get("infoEyebrow") || ""),
    infoTitle: String(formData.get("infoTitle") || ""),
    infoDescription: String(formData.get("infoDescription") || ""),
    infoBody: String(formData.get("infoBody") || ""),
    infoActionLabel: String(formData.get("infoActionLabel") || ""),
    infoActionDestination: String(formData.get("infoActionDestination") || ""),
    whatWeDoEyebrow: String(formData.get("whatWeDoEyebrow") || ""),
    whatWeDoTitle: String(formData.get("whatWeDoTitle") || ""),
    whatWeDoDescription: String(formData.get("whatWeDoDescription") || ""),
    testimonialsEyebrow: String(formData.get("testimonialsEyebrow") || ""),
    testimonialsTitle: String(formData.get("testimonialsTitle") || ""),
    testimonialsDescription: String(formData.get("testimonialsDescription") || ""),
  };

  try {
    const { actorId } = await requireHubOperatorActionAccess(hubSlug);
    await updateHomepageSettingsByHubSlug(hubSlug, values, actorId);
  } catch (error) {
    return { error: String(error?.message || "Unable to update homepage settings."), success: "", values };
  }

  revalidateSettingsPaths(hubSlug);
  return { error: "", success: "Homepage settings updated.", values };
}

export async function updateEventsPageSettingsAction(_previousState, formData) {
  const hubSlug = String(formData.get("hubSlug") || "").trim();
  const values = {
    heroMediaAssetId: String(formData.get("heroMediaAssetId") || ""),
    heroMediaAlt: String(formData.get("heroMediaAlt") || ""),
    heroEyebrow: String(formData.get("heroEyebrow") || ""),
    heroTitle: String(formData.get("heroTitle") || ""),
    heroDescription: String(formData.get("heroDescription") || ""),
  };

  try {
    const { actorId } = await requireHubOperatorActionAccess(hubSlug);
    await updateEventsPageSettingsByHubSlug(hubSlug, values, actorId);
  } catch (error) {
    return { error: String(error?.message || "Unable to update events page settings."), success: "", values };
  }

  revalidateSettingsPaths(hubSlug);
  return { error: "", success: "Events page settings updated.", values };
}

export async function updateCoursesPageSettingsAction(_previousState, formData) {
  const hubSlug = String(formData.get("hubSlug") || "").trim();
  const values = {
    heroMediaAssetId: String(formData.get("heroMediaAssetId") || ""),
    heroMediaAlt: String(formData.get("heroMediaAlt") || ""),
    heroEyebrow: String(formData.get("heroEyebrow") || ""),
    heroTitle: String(formData.get("heroTitle") || ""),
    heroDescription: String(formData.get("heroDescription") || ""),
  };

  try {
    const { actorId } = await requireHubOperatorActionAccess(hubSlug);
    await updateCoursesPageSettingsByHubSlug(hubSlug, values, actorId);
  } catch (error) {
    return { error: String(error?.message || "Unable to update courses page settings."), success: "", values };
  }

  revalidateSettingsPaths(hubSlug);
  return { error: "", success: "Courses page settings updated.", values };
}

export async function updateTestimonialsPageSettingsAction(_previousState, formData) {
  const hubSlug = String(formData.get("hubSlug") || "").trim();
  const values = {
    heroMediaAssetId: String(formData.get("heroMediaAssetId") || ""),
    heroMediaAlt: String(formData.get("heroMediaAlt") || ""),
    heroEyebrow: String(formData.get("heroEyebrow") || ""),
    heroTitle: String(formData.get("heroTitle") || ""),
    heroDescription: String(formData.get("heroDescription") || ""),
    ctaEyebrow: String(formData.get("ctaEyebrow") || ""),
    ctaTitle: String(formData.get("ctaTitle") || ""),
    ctaDescription: String(formData.get("ctaDescription") || ""),
    ctaPrimaryActionLabel: String(formData.get("ctaPrimaryActionLabel") || ""),
    ctaPrimaryActionDestination: String(formData.get("ctaPrimaryActionDestination") || ""),
    ctaSecondaryActionLabel: String(formData.get("ctaSecondaryActionLabel") || ""),
    ctaSecondaryActionDestination: String(formData.get("ctaSecondaryActionDestination") || ""),
  };

  try {
    const { actorId } = await requireHubOperatorActionAccess(hubSlug);
    await updateTestimonialsPageSettingsByHubSlug(hubSlug, values, actorId);
  } catch (error) {
    return { error: String(error?.message || "Unable to update testimonials page settings."), success: "", values };
  }

  revalidateSettingsPaths(hubSlug);
  return { error: "", success: "Testimonials page settings updated.", values };
}

export async function requestCustomDomainAction(_previousState, formData) {
  const hubSlug = String(formData.get("hubSlug") || "").trim();
  const values = {
    hostname: String(formData.get("hostname") || "").trim(),
  };

  try {
    const { actorId } = await requireHubOperatorActionAccess(hubSlug);
    await requestHubCustomDomainBySlug(hubSlug, values.hostname, actorId);
  } catch (error) {
    return {
      error: String(error?.message || "Unable to start custom-domain setup."),
      success: "",
      values,
    };
  }

  revalidateSettingsPaths(hubSlug);

  return {
    error: "",
    success: "Custom-domain setup has been requested. Verification will continue from the stored pending state.",
    values,
  };
}

export async function checkCustomDomainVerificationAction(_previousState, formData) {
  const hubSlug = String(formData.get("hubSlug") || "").trim();

  try {
    const { actorId } = await requireHubOperatorActionAccess(hubSlug);
    const result = await checkHubCustomDomainVerificationBySlug(hubSlug, actorId);
    revalidateSettingsPaths(hubSlug);

    return {
      error: "",
      success: result.matched
        ? "DNS verification record detected. Connection activation is the next step."
        : "Verification record not found yet. DNS propagation may still be in progress.",
    };
  } catch (error) {
    return {
      error: String(error?.message || "Unable to check domain verification."),
      success: "",
    };
  }
}

export async function disconnectCustomDomainAction(_previousState, formData) {
  const hubSlug = String(formData.get("hubSlug") || "").trim();
  const confirmation = String(formData.get("confirmation") || "").trim();

  try {
    const { hub, actorId } = await requireHubOperatorActionAccess(hubSlug);
    const hostname = String(hub?.customDomain?.hostname || "").trim();

    if (!hostname) {
      throw new Error("No custom domain is configured for this hub.");
    }

    if (confirmation !== hostname) {
      return {
        error: "Enter the current custom domain exactly to confirm removal.",
        success: "",
        confirmation,
      };
    }

    await scheduleHubCustomDomainDisconnectRecord(hub, {
      actorId,
      disconnectAt: new Date().toISOString(),
      reason: "manual_disconnect",
    });
    revalidateSettingsPaths(hubSlug);

    return {
      error: "",
      success:
        "Custom-domain disconnect has been scheduled immediately. The hub will return to its Hubforj-hosted address once the disconnect processor runs.",
      confirmation: "",
    };
  } catch (error) {
    return {
      error: String(error?.message || "Unable to disconnect custom domain."),
      success: "",
      confirmation,
    };
  }
}
