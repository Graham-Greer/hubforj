"use client";

import { useRef, useState } from "react";
import Button from "@/components/ui/button/Button";
import ConfirmModal from "@/components/ui/confirm-modal/ConfirmModal";

export default function DeletePlanButton({ hubSlug, planId, action }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  return (
    <>
      <form action={action} ref={ref}>
        <input type="hidden" name="hubSlug" value={hubSlug} />
        <input type="hidden" name="planId" value={planId} />
      </form>
      <Button type="button" size="sm" variant="tertiary" intent="danger" onClick={() => setOpen(true)}>
        Delete
      </Button>
      <ConfirmModal
        open={open}
        title="Delete membership plan?"
        message="This plan will be removed from the hub. Existing memberships keep their planId reference."
        confirmText="Delete plan"
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          ref.current?.requestSubmit();
          setOpen(false);
        }}
      />
    </>
  );
}
