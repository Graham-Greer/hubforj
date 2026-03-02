"use client";

import { useRef, useState } from "react";
import Button from "@/components/ui/button/Button";
import ConfirmModal from "@/components/ui/confirm-modal/ConfirmModal";

export default function CancelMembershipButton({ hubSlug, membershipId, action }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  return (
    <>
      <form action={action} ref={ref}>
        <input type="hidden" name="hubSlug" value={hubSlug} />
        <input type="hidden" name="membershipId" value={membershipId} />
      </form>
      <Button type="button" size="sm" variant="tertiary" intent="danger" onClick={() => setOpen(true)}>
        Cancel
      </Button>
      <ConfirmModal
        open={open}
        title="Cancel membership?"
        message="This marks the membership as cancelled. Members must be renewed/reactivated manually later."
        confirmText="Cancel membership"
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          ref.current?.requestSubmit();
          setOpen(false);
        }}
      />
    </>
  );
}
