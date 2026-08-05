"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireCurrentMemberSessionForHub } from "@/lib/auth/member-session";
import { requireHubBySlug } from "@/lib/data/hubs";
import {
  cancelMembershipUpgradeRequest,
  cancelScheduledMembershipDefaultPlanDowngradeForUser,
  createMembershipUpgradeRequest,
  getCurrentMembershipByUser,
  getPendingMembershipUpgradeRequestByUser,
  listMembershipPlansByHub,
  scheduleMembershipDefaultPlanDowngradeForUser,
  updateMembershipUpgradeRequestPaymentState,
} from "@/lib/data/memberships";
import { getNativePaymentTransactionById, updateNativePaymentTransaction } from "@/lib/data/native-payment-transactions";
import { getRequestHostWithPortFromHeaders, resolveHubRuntimeRouteMode } from "@/lib/domain/hub-hosts";
import { resolveMembershipPlanPricingMode } from "@/lib/domain/memberships";
import { startMembershipUpgradeCheckout } from "@/lib/server/membership-upgrade-checkout";
import { getStripeServerClient } from "@/lib/server/stripe";

function normalizeString(value) {
  return String(value || "").trim();
}

function revalidateMembershipPaths(hubSlug) {
  revalidatePath(`/${hubSlug}/admin`);
  revalidatePath(`/${hubSlug}/account`);
  revalidatePath(`/${hubSlug}/account/membership`);
}

export async function requestMembershipUpgradeAction(formData) {
  const hubSlug = normalizeString(formData.get("hubSlug"));
  const planId = normalizeString(formData.get("planId"));

  if (!hubSlug || !planId) {
    redirect(`/${hubSlug || ""}/account/membership?error=upgradeRequestMissingContext`);
  }

  let redirectPath = `/${hubSlug}/account/membership?success=upgradeRequested`;

  try {
    const hub = await requireHubBySlug(hubSlug);
    const memberSession = await requireCurrentMemberSessionForHub(hub, `/${hub.slug}/account/membership`);
    const requestHeaders = await headers();
    const requestHost = getRequestHostWithPortFromHeaders(requestHeaders);
    const routeMode = resolveHubRuntimeRouteMode(requestHost);
    const membershipPlans = await listMembershipPlansByHub(hub.id);
    const plan = membershipPlans.find((entry) => entry.id === planId);

    if (!plan) {
      throw new Error("This membership plan could not be found.");
    }

    const pricingMode = resolveMembershipPlanPricingMode(plan);

    if (hub.packagePaymentProcessingMode === "internal" && pricingMode === "paid") {
      const checkout = await startMembershipUpgradeCheckout({
        hub,
        memberSession,
        plan,
        actorId: memberSession.user.id,
        requestHost,
        routeMode,
      });
      revalidateMembershipPaths(hub.slug);
      redirectPath = checkout.checkoutUrl;
    } else {
      await createMembershipUpgradeRequest(hub.id, memberSession.user.id, planId, memberSession.user.id);
      revalidateMembershipPaths(hub.slug);
    }
  } catch (error) {
    const message = encodeURIComponent(String(error?.message || "Unable to start the membership upgrade."));
    redirectPath = `/${hubSlug}/account/membership?error=${message}`;
  }

  redirect(redirectPath);
}

export async function cancelMembershipUpgradeRequestAction(formData) {
  const hubSlug = normalizeString(formData.get("hubSlug"));

  if (!hubSlug) {
    redirect("/account/membership?error=upgradeRequestMissingContext");
  }

  let redirectPath = `/${hubSlug}/account/membership`;

  try {
    const hub = await requireHubBySlug(hubSlug);
    const memberSession = await requireCurrentMemberSessionForHub(hub, `/${hub.slug}/account/membership`);
    const pendingRequest = await getPendingMembershipUpgradeRequestByUser(hub.id, memberSession.user.id);

    if (!pendingRequest) {
      throw new Error("No pending membership upgrade request was found.");
    }

    if (pendingRequest.nativePaymentTransactionId) {
      const transaction = await getNativePaymentTransactionById(hub.id, pendingRequest.nativePaymentTransactionId);

      if (transaction?.status === "checkout_open" && transaction.stripeCheckoutSessionId && transaction.stripeAccountId) {
        const stripe = getStripeServerClient();

        await stripe.checkout.sessions.expire(
          transaction.stripeCheckoutSessionId,
          {},
          {
            stripeAccount: transaction.stripeAccountId,
          }
        );

        await updateNativePaymentTransaction(
          hub.id,
          transaction.id,
          {
            status: "checkout_cancelled",
          },
          memberSession.user.id
        );
        await updateMembershipUpgradeRequestPaymentState(
          hub.id,
          pendingRequest.id,
          {
            nativePaymentStatus: "checkout_cancelled",
          },
          memberSession.user.id
        );
      }
    }

    await cancelMembershipUpgradeRequest(hub.id, pendingRequest.id, memberSession.user.id);
    revalidateMembershipPaths(hub.slug);
  } catch (error) {
    const message = encodeURIComponent(String(error?.message || "Unable to cancel the membership upgrade."));
    redirectPath = `/${hubSlug}/account/membership?error=${message}`;
  }

  redirect(redirectPath);
}

export async function scheduleCurrentMembershipDowngradeAction(formData) {
  const hubSlug = normalizeString(formData.get("hubSlug"));

  if (!hubSlug) {
    redirect("/account/membership?error=membershipCancellationMissingContext");
  }

  let redirectPath = `/${hubSlug}/account/membership?success=membershipReturnScheduled`;

  try {
    const hub = await requireHubBySlug(hubSlug);
    const memberSession = await requireCurrentMemberSessionForHub(hub, `/${hub.slug}/account/membership`);
    const [currentMembership, pendingRequest] = await Promise.all([
      getCurrentMembershipByUser(hub.id, memberSession.user.id),
      getPendingMembershipUpgradeRequestByUser(hub.id, memberSession.user.id),
    ]);

    if (!currentMembership) {
      throw new Error("No active membership was found for your account.");
    }

    if (currentMembership.isDefault) {
      throw new Error("You are already on the default membership plan.");
    }

    if (pendingRequest) {
      throw new Error("Finish or cancel the current upgrade request before changing your membership again.");
    }

    if (currentMembership.scheduledChangeStatus === "pending") {
      throw new Error("Your membership is already scheduled to return to the default plan.");
    }

    await scheduleMembershipDefaultPlanDowngradeForUser(
      hub.id,
      memberSession.user.id,
      memberSession.user.id,
      "Member scheduled their upgraded membership to return to the default plan."
    );
    revalidateMembershipPaths(hub.slug);
  } catch (error) {
    const message = encodeURIComponent(String(error?.message || "Unable to update your membership."));
    redirectPath = `/${hubSlug}/account/membership?error=${message}`;
  }

  redirect(redirectPath);
}

export async function cancelScheduledMembershipDowngradeAction(formData) {
  const hubSlug = normalizeString(formData.get("hubSlug"));

  if (!hubSlug) {
    redirect("/account/membership?error=membershipScheduleMissingContext");
  }

  let redirectPath = `/${hubSlug}/account/membership?success=membershipReturnScheduleCancelled`;

  try {
    const hub = await requireHubBySlug(hubSlug);
    const memberSession = await requireCurrentMemberSessionForHub(hub, `/${hub.slug}/account/membership`);

    await cancelScheduledMembershipDefaultPlanDowngradeForUser(
      hub.id,
      memberSession.user.id,
      memberSession.user.id,
      "Member cancelled the scheduled return to the default plan."
    );
    revalidateMembershipPaths(hub.slug);
  } catch (error) {
    const message = encodeURIComponent(String(error?.message || "Unable to update your membership schedule."));
    redirectPath = `/${hubSlug}/account/membership?error=${message}`;
  }

  redirect(redirectPath);
}
