import FormMessage from "@/components/ui/form-message/FormMessage";
import MemberIdentitySection from "./MemberIdentitySection";
import MemberMembershipSection from "./MemberMembershipSection";
import MemberPaymentHistorySection from "./MemberPaymentHistorySection";
import MemberRegistrationsSection from "./MemberRegistrationsSection";
import MemberStateSection from "./MemberStateSection";
import MemberStatsRow from "./MemberStatsRow";
import TimedFormMessage from "./TimedFormMessage";
import { buildMemberActivityItems } from "./admin-member-detail-helpers";
import { buildMemberBillingItems } from "@/lib/domain/member-account";
import styles from "./AdminMemberDetailWorkspace.module.css";

export default function AdminMemberDetailWorkspace({
  hub,
  detail,
  membershipPlans = [],
  statusAction = null,
  membershipAction = null,
  upgradeRequestAction = null,
  revertMembershipAction = null,
  cancelScheduledMembershipChangeAction = null,
  membersQuery = "",
  successMessage = "",
  errorMessage = "",
}) {
  const activityItems = buildMemberActivityItems(detail);
  const paymentHistoryItems = buildMemberBillingItems({
    hub,
    items: detail.paymentItems || [],
  });

  return (
    <div className={styles.root}>
      {errorMessage ? <FormMessage tone="danger">{errorMessage}</FormMessage> : null}
      {successMessage ? <TimedFormMessage tone="success">{successMessage}</TimedFormMessage> : null}
      <MemberIdentitySection hub={hub} user={detail.user} statusAction={statusAction} membersQuery={membersQuery} />
      <MemberStatsRow detail={detail} />

      <MemberStateSection hub={hub} user={detail.user} statusAction={statusAction} membersQuery={membersQuery} />
      <MemberMembershipSection
        hub={hub}
        detail={detail}
        membershipPlans={membershipPlans}
        membershipAction={membershipAction}
        upgradeRequestAction={upgradeRequestAction}
        revertMembershipAction={revertMembershipAction}
        cancelScheduledMembershipChangeAction={cancelScheduledMembershipChangeAction}
        membersQuery={membersQuery}
      />

      <MemberPaymentHistorySection
        hub={hub}
        paymentItems={paymentHistoryItems}
        membershipPaymentHistory={detail.membershipPaymentHistory || []}
      />

      <MemberRegistrationsSection
        eyebrow="Booking activity"
        title="Events and courses"
        description="Review the member's booking and enrolment history in one place."
        emptyEyebrow="No activity"
        emptyTitle="This member has no bookings or enrolments yet"
        emptyDescription="Event and course activity will appear here once the member starts using the public or member surfaces."
        items={activityItems}
      />
    </div>
  );
}
