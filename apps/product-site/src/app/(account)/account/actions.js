"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { sendCommercialAccountVerificationEmail } from "@/lib/server/commercial-account-email";
import { requireCommercialAccountContext } from "@/lib/server/commercial-account-context";
import { provisionOwnerAdminFromProductSite } from "@/lib/server/provision-owner-admin";

export async function resendCommercialAccountVerificationEmailAction() {
  const accountContext = await requireCommercialAccountContext();
  const { account, currentHub } = accountContext;

  if (account.emailVerified) {
    redirect("/account?verification=resend-not-needed");
  }

  try {
    const delivery = await sendCommercialAccountVerificationEmail({
      account,
      communityName: currentHub.name,
    });

    redirect(`/account?verification=${encodeURIComponent(String(delivery?.status || "sent"))}`);
  } catch (error) {
    unstable_rethrow(error);
    redirect("/account?verification=retry");
  }
}

export async function activateHubAdminAccessAction() {
  const accountContext = await requireCommercialAccountContext();
  const { account, currentHub } = accountContext;

  if (!account.emailVerified) {
    redirect("/account?adminActivation=verification-required");
  }

  if (!account.authUid) {
    redirect("/account?adminActivation=missing-auth");
  }

  if (!currentHub.id || !currentHub.slug) {
    redirect("/account?adminActivation=missing-hub");
  }

  try {
    const handoff = await provisionOwnerAdminFromProductSite({
      hubId: currentHub.id,
      hubSlug: currentHub.slug,
      authUid: account.authUid,
      ownerEmail: account.ownerEmail,
      ownerFullName: account.ownerFullName,
    });

    redirect(handoff.signInHref);
  } catch (error) {
    unstable_rethrow(error);
    redirect("/account?adminActivation=error");
  }
}
