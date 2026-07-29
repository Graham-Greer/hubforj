import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import AdminSelect from "@/components/ui/admin-select/AdminSelect";
import EmptyState from "@/components/patterns/empty-state/EmptyState";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import {
  formatMembershipDate,
  formatMoney,
  getMembershipStatusLabel,
  getMembershipStatusTone,
} from "@/lib/domain/memberships";
import MemberMembershipProvisioningSection from "./MemberMembershipProvisioningSection";
import DetailRow from "./DetailRow";
import styles from "./AdminMemberDetailWorkspace.module.css";

export default function MemberMembershipSection({
  hub,
  detail,
  membershipPlans = [],
  membershipAction = null,
  upgradeRequestAction = null,
  revertMembershipAction = null,
  cancelScheduledMembershipChangeAction = null,
  membersQuery = "",
}) {
  const membership = detail.membership;
  const membershipUpgradeRequest = detail.membershipUpgradeRequest;
  const hasScheduledDefaultReturn =
    membership?.scheduledChangeStatus === "pending" &&
    membership?.scheduledChangeType === "default_plan_downgrade";
  const showRevertToDefaultAction =
    membership &&
    membership.isDefault !== true &&
    revertMembershipAction &&
    !hasScheduledDefaultReturn &&
    Boolean(membership.renewalDate);
  const showMissingRenewalBeforeSchedule =
    membership &&
    membership.isDefault !== true &&
    !hasScheduledDefaultReturn &&
    !membership.renewalDate;

  return (
    <WorkspaceSection
      eyebrow="Membership"
      title="Current membership"
      description="Check the current membership, renewal timing, and payment status before making changes."
      data-onboarding="member-detail-membership"
    >
      {membership ? (
        <div className={styles.sectionBody}>
          <div className={styles.badges}>
            <Badge tone={getMembershipStatusTone(membership.derivedStatus)}>
              {getMembershipStatusLabel(membership.derivedStatus)}
            </Badge>
            <Badge tone="neutral">
              {membership.isDefault ? "Default plan" : "Upgrade plan"}
            </Badge>
            {hasScheduledDefaultReturn ? <Badge tone="warning">Default plan scheduled</Badge> : null}
          </div>
          <dl className={styles.details}>
            <DetailRow label="Plan" value={membership.planTitle || "Membership"} />
            <DetailRow label="Renewal" value={formatMembershipDate(membership.renewalDate, hub.locale)} />
            <DetailRow
              label="Plan price"
              value={
                membership.pricingMode === "free"
                  ? "Free"
                  : membership.planPrice
                    ? formatMoney(membership.planPrice, membership.planCurrency, hub.locale)
                    : "Contact hub"
              }
            />
          </dl>
          {hasScheduledDefaultReturn ? (
            <div className={styles.membershipSubsection}>
              <p className={styles.cardBody}>
                This member&apos;s upgraded membership stays active until {formatMembershipDate(membership.scheduledChangeAt, hub.locale)}. It is scheduled to return to {membership.scheduledPlanTitle || "the default plan"} on that date.
              </p>
              {cancelScheduledMembershipChangeAction ? (
                <form action={cancelScheduledMembershipChangeAction} className={styles.membershipActions}>
                  <input type="hidden" name="hubSlug" value={hub.slug} />
                  <input type="hidden" name="memberId" value={detail.user.id} />
                  <input type="hidden" name="membersQuery" value={membersQuery} />
                  <Button type="submit" variant="secondary">
                    Cancel scheduled return
                  </Button>
                </form>
              ) : null}
            </div>
          ) : null}
          {showRevertToDefaultAction ? (
            <div className={styles.membershipSubsection}>
              <p className={styles.cardBody}>
                If this paid or upgraded membership should end, schedule the member to return to the default plan at the end of their current term rather than removing their baseline access.
              </p>
              <form action={revertMembershipAction} className={styles.membershipActions}>
                <input type="hidden" name="hubSlug" value={hub.slug} />
                <input type="hidden" name="memberId" value={detail.user.id} />
                <input type="hidden" name="membersQuery" value={membersQuery} />
                <Button type="submit" variant="secondary">
                  Schedule return to default plan
                </Button>
              </form>
            </div>
          ) : null}
          {showMissingRenewalBeforeSchedule ? (
            <div className={styles.membershipSubsection}>
              <p className={styles.cardBody}>
                Add a renewal date before scheduling this member to return to the default plan, so the end-of-term timing is clear.
              </p>
            </div>
          ) : null}
          {membershipUpgradeRequest ? (
            <div className={styles.sectionBody}>
              <div className={styles.badges}>
                <Badge tone="warning">Upgrade request pending</Badge>
                {membershipUpgradeRequest.paymentProcessingMode === "external" ? (
                  <Badge tone="warning">External payment</Badge>
                ) : null}
              </div>
              <dl className={styles.details}>
                <DetailRow label="Requested plan" value={membershipUpgradeRequest.planTitle || "Membership plan"} />
                <DetailRow label="Requested" value={formatMembershipDate(membershipUpgradeRequest.requestedAt, hub.locale)} />
                <DetailRow
                  label="Requested price"
                  value={
                    membershipUpgradeRequest.pricingMode === "free"
                      ? "Free"
                      : membershipUpgradeRequest.price
                        ? formatMoney(membershipUpgradeRequest.price, membershipUpgradeRequest.currency, hub.locale)
                        : "Contact hub"
                  }
                />
              </dl>
              <p className={styles.cardBody}>
                The member has started an upgrade request for this plan. Confirm payment externally if needed, then approve the request when you are ready to move them onto the requested membership.
              </p>
              {upgradeRequestAction ? (
                <form action={upgradeRequestAction} className={styles.membershipPaymentForm}>
                  <input type="hidden" name="hubSlug" value={hub.slug} />
                  <input type="hidden" name="memberId" value={detail.user.id} />
                  <input type="hidden" name="membersQuery" value={membersQuery} />
                  <input type="hidden" name="requestId" value={membershipUpgradeRequest.id} />
                  <AdminSelect
                    className={styles.membershipPaymentField}
                    name="paymentStatus"
                    label="Approval payment status"
                    defaultValue="paid"
                    options={[
                      { value: "paid", label: "Paid" },
                      { value: "unpaid", label: "Unpaid" },
                      { value: "overdue", label: "Overdue" },
                      { value: "failed", label: "Failed" },
                    ]}
                  />
                  <div className={styles.membershipActions}>
                    <Button type="submit" variant="secondary">
                      Approve upgrade request
                    </Button>
                  </div>
                </form>
              ) : null}
            </div>
          ) : null}

          <div className={styles.membershipDivider} />
          <div className={styles.membershipSubsection}>
            <h3 className={styles.subsectionTitle}>
              {detail.membership ? "Update membership assignment" : "Assign membership"}
            </h3>
            <p className={styles.cardBody}>
              Adjust the assigned plan, payment status, and renewal timing here when this member needs a different membership arrangement.
            </p>
            <MemberMembershipProvisioningSection
              hub={hub}
              detail={detail}
              membershipPlans={membershipPlans}
              membershipAction={membershipAction}
              membersQuery={membersQuery}
              embedded
            />
          </div>
        </div>
      ) : (
        <div className={styles.sectionBody}>
          <EmptyState
            eyebrow="No membership"
            title="This member has no membership yet"
            description="Assign a membership plan below to add renewal and payment context for this member."
          />
          <div className={styles.membershipDivider} />
          <div className={styles.membershipSubsection}>
            <h3 className={styles.subsectionTitle}>Assign membership</h3>
            <p className={styles.cardBody}>
              Choose the starting plan and timing details carefully so the member record and payment view stay aligned from the start.
            </p>
            <MemberMembershipProvisioningSection
              hub={hub}
              detail={detail}
              membershipPlans={membershipPlans}
              membershipAction={membershipAction}
              membersQuery={membersQuery}
              embedded
            />
          </div>
        </div>
      )}
    </WorkspaceSection>
  );
}
