"use server";

import { revalidatePath } from "next/cache";
import { requireHubOperatorActionAccess } from "@/lib/auth/action-access";
import { saveLegalDocumentForHub } from "@/lib/legal/legalRepository";
import { legalDocumentTypes } from "@/lib/legal/legalValidation";

function normalizeDocumentType(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return legalDocumentTypes.includes(normalized) ? normalized : "";
}

function createLegalActionState(values = {}) {
  return {
    error: "",
    success: "",
    values: {
      content: String(values.content || ""),
    },
    legalSettings: null,
  };
}

function revalidateLegalPaths(hubSlug) {
  revalidatePath(`/${hubSlug}/admin`);
  revalidatePath(`/${hubSlug}/admin/settings`);
  revalidatePath(`/${hubSlug}/admin/settings/legal`);
  revalidatePath(`/${hubSlug}/terms`);
  revalidatePath(`/${hubSlug}/privacy`);
}

export async function saveLegalDocumentAction(_previousState, formData) {
  const hubSlug = String(formData.get("hubSlug") || "").trim();
  const documentType = normalizeDocumentType(formData.get("documentType"));
  const acknowledgementAccepted = String(formData.get("acknowledgementAccepted") || "").trim() === "true";
  const values = {
    content: String(formData.get("content") || ""),
  };

  if (!hubSlug || !documentType) {
    return {
      ...createLegalActionState(values),
      error: "Unable to determine which legal page should be saved.",
    };
  }

  try {
    const { hub, access } = await requireHubOperatorActionAccess(hubSlug);
    const legalSettings = await saveLegalDocumentForHub({
      hubId: hub.id,
      access,
      documentType,
      content: values.content,
      acknowledgementAccepted,
    });

    revalidateLegalPaths(hubSlug);

    return {
      ...createLegalActionState({
        content: values.content,
      }),
      success:
        documentType === "terms"
          ? "Terms of Service updated. The public page now shows the latest accepted content."
          : "Privacy Policy updated. The public page now shows the latest accepted content.",
      legalSettings,
    };
  } catch (error) {
    return {
      ...createLegalActionState(values),
      error: String(error?.message || "Unable to save the legal page."),
    };
  }
}
