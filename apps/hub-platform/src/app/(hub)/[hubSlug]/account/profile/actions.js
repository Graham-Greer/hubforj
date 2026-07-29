"use server";

import { updateMemberProfileById } from "@/lib/data/users";
import { requireHubBySlug } from "@/lib/data/hubs";
import { requireCurrentMemberSessionForHub } from "@/lib/auth/member-session";

function normalizeString(value) {
  return String(value || "").trim();
}

export async function updateMemberProfileAction(previousState, formData) {
  const hubSlug = normalizeString(formData.get("hubSlug"));

  const values = {
    name: normalizeString(formData.get("name")),
  };

  try {
    const hub = await requireHubBySlug(hubSlug);
    const session = await requireCurrentMemberSessionForHub(hub, `/${hub.slug}/account/profile`);
    const member = await updateMemberProfileById(hub.id, session.user.id, values, session.user.id);

    return {
      error: "",
      success: "Profile updated.",
      values: {
        name: member.name,
      },
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to update profile.",
      success: "",
      values,
    };
  }
}
