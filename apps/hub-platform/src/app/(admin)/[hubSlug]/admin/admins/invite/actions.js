"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireHubAdminManagerActionAccess } from "@/lib/auth/action-access";
import { createAdminInvite, markAdminInviteDelivery } from "@/lib/data/invites";
import { sendHubAdminInviteEmail } from "@/lib/server/admin-invite-email";

export async function createHubAdminInviteAction(_previousState, formData) {
  const hubSlug = String(formData.get("hubSlug") || "").trim();
  const values = {
    email: String(formData.get("email") || ""),
    role: String(formData.get("role") || "admin"),
  };
  let hub;
  let redirectTarget = "";

  try {
    const result = await requireHubAdminManagerActionAccess(hubSlug, {
      forbiddenMessage: "Only the owner can invite admins.",
    });
    hub = result.hub;
    const access = result.access;

    const invite = await createAdminInvite(
      hub.id,
      values,
      access.actorId
    );

    try {
      const delivery = await sendHubAdminInviteEmail({ hub, invite });
      await markAdminInviteDelivery(hub.id, invite.id, delivery, access.actorId);
      redirectTarget = `/${hub.slug}/admin/admins?success=${
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
        access.actorId
      );
      redirectTarget = `/${hub.slug}/admin/admins?error=${encodeURIComponent(
        "Invite created, but the email could not be sent. Copy the acceptance link or try resending."
      )}`;
    }
    revalidatePath(`/${hub.slug}/admin`);
    revalidatePath(`/${hub.slug}/admin/admins`);
  } catch (error) {
    return {
      error: String(error?.message || "Unable to create invite."),
      values,
    };
  }

  redirect(redirectTarget || `/${hub.slug}/admin/admins?success=inviteCreated`);
}
