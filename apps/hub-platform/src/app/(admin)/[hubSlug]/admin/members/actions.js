"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireHubOperatorActionAccess } from "@/lib/auth/action-access";
import { repairHubMemberDirectoryReconciliation, syncHubMemberDirectory } from "@/lib/data/member-directory";

function normalizeString(value) {
  return String(value || "").trim();
}

function buildMembersRedirect(hubSlug, feedback = "") {
  const params = new URLSearchParams();

  if (feedback) {
    const [key, value] = feedback.split("=", 2);
    if (key && value) {
      params.set(key, value);
    }
  }

  const queryString = params.toString();
  return `/${hubSlug}/admin/members${queryString ? `?${queryString}` : ""}`;
}

async function requireSupportMemberDirectoryAccess(hubSlug) {
  const result = await requireHubOperatorActionAccess(hubSlug, {
    unauthorizedMessage: "You are not authorized to maintain this member directory.",
  });

  if (result.access?.mode !== "support") {
    throw new Error("Member directory maintenance is available only in support mode.");
  }

  return result;
}

export async function syncHubMemberDirectoryAction(formData) {
  const hubSlug = normalizeString(formData.get("hubSlug"));

  if (!hubSlug) {
    redirect(buildMembersRedirect(hubSlug, `error=${encodeURIComponent("Hub context is required.")}`));
  }

  try {
    const { hub, actorId } = await requireSupportMemberDirectoryAccess(hubSlug);
    await syncHubMemberDirectory(hub.id, actorId);
    revalidatePath(`/${hubSlug}/admin/members`);
  } catch (error) {
    redirect(buildMembersRedirect(hubSlug, `error=${encodeURIComponent(String(error?.message || "Unable to sync member directory."))}`));
  }

  redirect(buildMembersRedirect(hubSlug, "success=memberDirectorySynced"));
}

export async function repairHubMemberDirectoryReconciliationAction(formData) {
  const hubSlug = normalizeString(formData.get("hubSlug"));

  if (!hubSlug) {
    redirect(buildMembersRedirect(hubSlug, `error=${encodeURIComponent("Hub context is required.")}`));
  }

  try {
    const { hub, actorId } = await requireSupportMemberDirectoryAccess(hubSlug);
    await repairHubMemberDirectoryReconciliation(hub.id, actorId);
    revalidatePath(`/${hubSlug}/admin/members`);
  } catch (error) {
    redirect(buildMembersRedirect(hubSlug, `error=${encodeURIComponent(String(error?.message || "Unable to repair member directory."))}`));
  }

  redirect(buildMembersRedirect(hubSlug, "success=memberDirectoryRepaired"));
}
