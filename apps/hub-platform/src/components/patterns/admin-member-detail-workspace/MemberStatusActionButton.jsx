"use client";

import { useState } from "react";
import Button from "@/components/ui/button/Button";
import Modal from "@/components/ui/modal/Modal";

export default function MemberStatusActionButton({
  hubSlug,
  memberId,
  nextStatus,
  actionLabel,
  statusAction,
  membersQuery = "",
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [lastActionIdentity, setLastActionIdentity] = useState({ actionLabel, nextStatus });
  const requiresConfirmation = nextStatus === "suspended";

  if (lastActionIdentity.actionLabel !== actionLabel || lastActionIdentity.nextStatus !== nextStatus) {
    setLastActionIdentity({ actionLabel, nextStatus });
    setIsOpen(false);
  }

  if (!statusAction) {
    return null;
  }

  if (!requiresConfirmation) {
    return (
      <form action={statusAction} className={className}>
        <input type="hidden" name="hubSlug" value={hubSlug} />
        <input type="hidden" name="memberId" value={memberId} />
        <input type="hidden" name="status" value={nextStatus} />
        <input type="hidden" name="membersQuery" value={membersQuery} />
        <Button type="submit" variant="secondary">
          {actionLabel}
        </Button>
      </form>
    );
  }

  return (
    <>
      <Button type="button" variant="secondary" className={className} onClick={() => setIsOpen(true)}>
        {actionLabel}
      </Button>
      {isOpen ? (
        <Modal
          title="Suspend member"
          onClose={() => setIsOpen(false)}
          actions={
            <>
              <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <form action={statusAction}>
                <input type="hidden" name="hubSlug" value={hubSlug} />
                <input type="hidden" name="memberId" value={memberId} />
                <input type="hidden" name="status" value={nextStatus} />
                <input type="hidden" name="membersQuery" value={membersQuery} />
                <Button type="submit" variant="secondary">
                  Suspend member
                </Button>
              </form>
            </>
          }
        >
          <p>
            Suspend this member? They should no longer continue through normal hub access, booking, or member workflows
            until reactivated.
          </p>
        </Modal>
      ) : null}
    </>
  );
}
