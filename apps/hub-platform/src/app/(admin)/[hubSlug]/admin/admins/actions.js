"use server";

import { redirect } from "next/navigation";
import { requireHubAdminManagerActionAccess } from "@/lib/auth/action-access";
import { canTransferHubOwnership } from "@/lib/domain/users";
import { markAdminInviteDelivery, resendAdminInvite, revokeAdminInvite } from "@/lib/data/invites";
import { transferHubOwnershipById, updateHubAdminStatusById } from "@/lib/data/users";
import { sendHubAdminInviteEmail } from "@/lib/server/admin-invite-email";

async function requireAdminAccessManager(hub) {
  return requireHubAdminManagerActionAccess(hub.slug, {
    forbiddenMessage: "Only the owner can manage admin access.",
  });
}

export async function revokeHubAdminInviteAction(formData) {
  const hubSlug = String(formData.get("hubSlug") || "").trim();
  const inviteId = String(formData.get("inviteId") || "").trim();

  try {
    const { hub, access } = await requireAdminAccessManager({ slug: hubSlug });
    await revokeAdminInvite(hub.id, inviteId, access.actorId);
  } catch (error) {
    redirect(`/${hubSlug}/admin/admins?error=${encodeURIComponent(String(error?.message || "Unable to revoke invite."))}`);
  }

  redirect(`/${hubSlug}/admin/admins?success=inviteRevoked`);
}

export async function resendHubAdminInviteAction(formData) {
  const hubSlug = String(formData.get("hubSlug") || "").trim();
  const inviteId = String(formData.get("inviteId") || "").trim();
  let redirectTarget = `/${hubSlug}/admin/admins?success=inviteResent`;

  try {
    const { hub, access } = await requireAdminAccessManager({ slug: hubSlug });
    const invite = await resendAdminInvite(hub.id, inviteId, access.actorId);

    try {
      const delivery = await sendHubAdminInviteEmail({ hub, invite });
      await markAdminInviteDelivery(hub.id, invite.id, delivery, access.actorId);
      redirectTarget = `/${hubSlug}/admin/admins?success=${
        delivery.status === "logged" ? "inviteResentLogged" : "inviteResent"
      }`;
    } catch (error) {
      await markAdminInviteDelivery(
        hub.id,
        invite.id,
        {
          status: "failed",
          attemptedAt: new Date().toISOString(),
          error: String(error?.message || "Unable to send invite email."),
          provider: "resend",
        },
        access.actorId
      );
      redirectTarget = `/${hubSlug}/admin/admins?error=${encodeURIComponent(
        "Invite expiry was refreshed, but the email could not be sent. Copy the acceptance link or try resending."
      )}`;
    }
  } catch (error) {
    redirect(`/${hubSlug}/admin/admins?error=${encodeURIComponent(String(error?.message || "Unable to resend invite."))}`);
  }

  redirect(redirectTarget);
}

export async function suspendHubAdminAccessAction(formData) {
  const hubSlug = String(formData.get("hubSlug") || "").trim();
  const userId = String(formData.get("userId") || "").trim();

  try {
    const { hub, access } = await requireAdminAccessManager({ slug: hubSlug });
    await updateHubAdminStatusById(hub.id, userId, { status: "suspended" }, access.actorId, access.actorRole);
  } catch (error) {
    redirect(`/${hubSlug}/admin/admins?error=${encodeURIComponent(String(error?.message || "Unable to suspend admin access."))}`);
  }

  redirect(`/${hubSlug}/admin/admins?success=adminSuspended`);
}

export async function reactivateHubAdminAccessAction(formData) {
  const hubSlug = String(formData.get("hubSlug") || "").trim();
  const userId = String(formData.get("userId") || "").trim();

  try {
    const { hub, access } = await requireAdminAccessManager({ slug: hubSlug });
    await updateHubAdminStatusById(hub.id, userId, { status: "active" }, access.actorId, access.actorRole);
  } catch (error) {
    redirect(`/${hubSlug}/admin/admins?error=${encodeURIComponent(String(error?.message || "Unable to reactivate admin access."))}`);
  }

  redirect(`/${hubSlug}/admin/admins?success=adminReactivated`);
}

export async function transferHubOwnershipAction(formData) {
  const hubSlug = String(formData.get("hubSlug") || "").trim();
  const userId = String(formData.get("userId") || "").trim();

  try {
    const { hub, access } = await requireAdminAccessManager({ slug: hubSlug });

    if (!canTransferHubOwnership(access.actorRole)) {
      throw new Error("Only the owner can transfer ownership.");
    }

    await transferHubOwnershipById(hub.id, userId, access.actorId, access.actorRole);
  } catch (error) {
    redirect(`/${hubSlug}/admin/admins?error=${encodeURIComponent(String(error?.message || "Unable to transfer ownership."))}`);
  }

  redirect(`/${hubSlug}/admin/admins?success=ownershipTransferred`);
}
