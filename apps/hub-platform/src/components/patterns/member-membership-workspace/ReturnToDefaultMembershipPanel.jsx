"use client";

import { useState } from "react";
import Button from "@/components/ui/button/Button";
import Modal from "@/components/ui/modal/Modal";
import {
  cancelScheduledMembershipDowngradeAction,
  scheduleCurrentMembershipDowngradeAction,
} from "@/app/(hub)/[hubSlug]/account/membership/actions";
import { formatMembershipDate } from "@/lib/domain/memberships";
import styles from "./MemberMembershipWorkspace.module.css";

function normalizeString(value) {
  return String(value || "").trim();
}

export default function ReturnToDefaultMembershipPanel({
  hubSlug,
  currentPlanTitle,
  scheduledPlanTitle = "default membership",
  scheduledChangeAt = "",
  locale = "en-GB",
  hasScheduledDefaultReturn = false,
  canScheduleDefaultReturn = true,
}) {
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const scheduledDateLabel = formatMembershipDate(scheduledChangeAt, locale);
  const normalizedScheduledPlanTitle = normalizeString(scheduledPlanTitle) || "default membership";
  const normalizedCurrentPlanTitle = normalizeString(currentPlanTitle) || "your current membership";

  return (
    <div className={styles.membershipActionsPanel}>
      {hasScheduledDefaultReturn ? (
        <>
          <p className={styles.notes}>
            {normalizedCurrentPlanTitle} stays active until {scheduledDateLabel}. Your membership is scheduled to return to {normalizedScheduledPlanTitle} on that date.
          </p>
          <div className={styles.sectionActions}>
            <Button type="button" variant="secondary" onClick={() => setShowCancelModal(true)}>
              Keep upgraded membership
            </Button>
          </div>
        </>
      ) : canScheduleDefaultReturn ? (
        <>
          <p className={styles.notes}>
            If you want to end this upgraded membership, you can schedule it to return to the hub&apos;s default membership at the end of your current term. Your current access stays in place until {scheduledDateLabel}.
          </p>
          <div className={styles.sectionActions}>
            <Button type="button" variant="ghost" onClick={() => setShowScheduleModal(true)}>
              Return to default membership
            </Button>
          </div>
        </>
      ) : (
        <p className={styles.notes}>
          This membership does not have a confirmed renewal date yet. Contact the hub team before returning to the default membership so the timing is clear.
        </p>
      )}

      {showScheduleModal ? (
        <Modal
          title="Return to default membership?"
          onClose={() => setShowScheduleModal(false)}
          actions={
            <>
              <Button type="button" variant="secondary" onClick={() => setShowScheduleModal(false)}>
                Keep current membership
              </Button>
              <form action={scheduleCurrentMembershipDowngradeAction}>
                <input type="hidden" name="hubSlug" value={hubSlug} />
                <Button type="submit" variant="primary">
                  Schedule return
                </Button>
              </form>
            </>
          }
        >
          <div className={styles.modalContent}>
            <p className={styles.notes}>
              {normalizedCurrentPlanTitle} will stay active until {scheduledDateLabel}. After that, your account will automatically move to {normalizedScheduledPlanTitle}.
            </p>
            <p className={styles.notes}>
              You can cancel this scheduled change before it takes effect.
            </p>
          </div>
        </Modal>
      ) : null}

      {showCancelModal ? (
        <Modal
          title="Keep upgraded membership?"
          onClose={() => setShowCancelModal(false)}
          actions={
            <>
              <Button type="button" variant="secondary" onClick={() => setShowCancelModal(false)}>
                Keep scheduled return
              </Button>
              <form action={cancelScheduledMembershipDowngradeAction}>
                <input type="hidden" name="hubSlug" value={hubSlug} />
                <Button type="submit" variant="primary">
                  Keep upgraded membership
                </Button>
              </form>
            </>
          }
        >
          <div className={styles.modalContent}>
            <p className={styles.notes}>
              This removes the scheduled move to {normalizedScheduledPlanTitle}. {normalizedCurrentPlanTitle} will stay active unless you schedule another change.
            </p>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
