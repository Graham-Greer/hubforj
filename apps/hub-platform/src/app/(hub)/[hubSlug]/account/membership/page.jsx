import { headers } from "next/headers";
import MemberMembershipWorkspace from "@/components/patterns/member-membership-workspace/MemberMembershipWorkspace";
import { requireCurrentMemberSessionForHub } from "@/lib/auth/member-session";
import { requireHubBySlug } from "@/lib/data/hubs";
import { getCurrentMembershipByUser, getPendingMembershipUpgradeRequestByUser, listMembershipPlansByHub } from "@/lib/data/memberships";
import { getNativePaymentTransactionById } from "@/lib/data/native-payment-transactions";
import { getRequestHostFromHeaders, resolveHubRuntimeRouteMode } from "@/lib/domain/hub-hosts";

export default async function MembershipPage({ params, searchParams }) {
  const { hubSlug } = await params;
  const { success = "", error = "" } = await searchParams;
  const hubRecord = await requireHubBySlug(hubSlug);
  const requestHeaders = await headers();
  const routeMode = resolveHubRuntimeRouteMode(getRequestHostFromHeaders(requestHeaders));
  const hub = { ...hubRecord, routeMode };
  const memberSession = await requireCurrentMemberSessionForHub(hub, `/${hub.slug}/account/membership`);
  const [membership, membershipPlans, upgradeRequest] = await Promise.all([
    getCurrentMembershipByUser(hub.id, memberSession.user.id),
    listMembershipPlansByHub(hub.id),
    getPendingMembershipUpgradeRequestByUser(hub.id, memberSession.user.id),
  ]);
  const upgradeTransaction = upgradeRequest?.nativePaymentTransactionId
    ? await getNativePaymentTransactionById(hub.id, upgradeRequest.nativePaymentTransactionId)
    : null;
  const successMessage =
    typeof success !== "string"
      ? ""
      : success === "upgradeRequested"
        ? "Your membership upgrade request has been sent to the hub team."
        : success === "checkoutSubmitted"
          ? "Your Stripe checkout completed. We're finalising your membership upgrade now."
        : success === "checkoutCompleted"
          ? "Your checkout finished. We're confirming the payment status now."
          : success === "checkoutCancelled"
            ? "Checkout was cancelled. You can continue the upgrade whenever you are ready."
            : success === "membershipReturnScheduled"
              ? "Your upgraded membership will return to the default plan at the end of the current term."
              : success === "membershipReturnScheduleCancelled"
                ? "Your scheduled return to the default membership has been cancelled."
            : "";

  return (
    <MemberMembershipWorkspace
      hub={hub}
      membership={membership}
      membershipPlans={membershipPlans}
      upgradeRequest={upgradeRequest}
      upgradeTransaction={upgradeTransaction}
      successMessage={successMessage}
      errorMessage={typeof error === "string" ? error : ""}
    />
  );
}
