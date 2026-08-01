"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { sendCommercialAccountVerificationEmail } from "@/lib/server/commercial-account-email";
import { requireCommercialAccountContext } from "@/lib/server/commercial-account-context";

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
