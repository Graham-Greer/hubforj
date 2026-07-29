"use server";

import { redirect } from "next/navigation";
import { requirePlatformOperatorActionAccess } from "@/lib/auth/action-access";
import { createAdminInvite, markAdminInviteDelivery } from "@/lib/data/invites";
import { getHubById } from "@/lib/data/hubs";
import { sendHubAdminInviteEmail } from "@/lib/server/admin-invite-email";

export async function createAdminInviteAction(_previousState, formData) {
  const hubId = String(formData.get("hubId") || "").trim();
  const values = {
    email: String(formData.get("email") || ""),
    role: String(formData.get("role") || "admin"),
  };
  let hub;
  let redirectTarget = "";
  const { actorId } = await requirePlatformOperatorActionAccess(`/platform/hubs/${hubId}/invite-admin`);

  try {
    hub = await getHubById(hubId);
    if (!hub) {
      throw new Error("Hub not found.");
    }

    const invite = await createAdminInvite(
      hubId,
      values,
      actorId
    );

    try {
      const delivery = await sendHubAdminInviteEmail({ hub, invite });
      await markAdminInviteDelivery(hub.id, invite.id, delivery, actorId);
      redirectTarget = `/platform/hubs/${hub.id}?success=${
        delivery.status === "logged" ? "inviteCreatedLogged" : "inviteCreated"
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
        actorId
      );
      redirectTarget = `/platform/hubs/${hub.id}?error=${encodeURIComponent(
        "Invite created, but the email could not be sent. Copy the acceptance link or try resending from the hub admin route."
      )}`;
    }
  } catch (error) {
    return {
      error: String(error?.message || "Unable to create invite."),
      values,
    };
  }

  redirect(redirectTarget || `/platform/hubs/${hub.id}?success=inviteCreated`);
}
