import AdminMemberDetailWorkspace from "@/components/patterns/admin-member-detail-workspace/AdminMemberDetailWorkspace";
import { requireHubBySlug } from "@/lib/data/hubs";
import { getMemberDetailById } from "@/lib/data/member-details";
import { listMembershipPlansByHub } from "@/lib/data/memberships";
import { notFound } from "next/navigation";
import {
  approveMembershipUpgradeRequestAction,
  assignMembershipAction,
  cancelScheduledMemberMembershipDowngradeAction,
  revertMemberToDefaultMembershipAction,
  updateMemberStatusAction,
} from "./actions";

export default async function MemberDetailPage({ params, searchParams }) {
  const { hubSlug, memberId } = await params;
  const resolvedSearchParams = await searchParams;
  const { success = "", error = "" } = resolvedSearchParams;
  const membersSearchParams = new URLSearchParams();

  ["q", "status", "membership", "attention"].forEach((key) => {
    const value = resolvedSearchParams?.[key];

    if (typeof value === "string" && value) {
      membersSearchParams.set(key, value);
    }
  });

  const membersQuery = membersSearchParams.toString();
  const hub = await requireHubBySlug(hubSlug);
  const [detail, membershipPlans] = await Promise.all([
    getMemberDetailById(hub.id, memberId),
    listMembershipPlansByHub(hub.id),
  ]);

  if (!detail) {
    notFound();
  }

  return (
    <AdminMemberDetailWorkspace
      hub={hub}
      detail={detail}
      membershipPlans={membershipPlans}
      statusAction={updateMemberStatusAction}
      membershipAction={assignMembershipAction}
      upgradeRequestAction={approveMembershipUpgradeRequestAction}
      revertMembershipAction={revertMemberToDefaultMembershipAction}
      cancelScheduledMembershipChangeAction={cancelScheduledMemberMembershipDowngradeAction}
      membersQuery={membersQuery}
      successMessage={
        success === "statusUpdated"
          ? "Member status updated."
          : success === "membershipUpdated"
            ? "Membership assignment updated."
            : success === "upgradeRequestApproved"
              ? "Membership upgrade request approved."
              : success === "membershipReturnScheduled"
                ? "Member scheduled to return to the default membership plan."
                : success === "membershipReturnScheduleCancelled"
                  ? "Scheduled membership return cancelled."
                : ""
      }
      errorMessage={typeof error === "string" ? error : ""}
    />
  );
}
