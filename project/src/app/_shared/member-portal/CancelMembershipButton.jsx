"use client";

import { useRef, useState } from "react";
import Button from "@/components/ui/button/Button";
import ConfirmModal from "@/components/ui/confirm-modal/ConfirmModal";

export default function CancelMembershipButton({ action, hiddenFields = {} }) {
  const [open, setOpen] = useState(false);
  const formRef = useRef(null);

  return (
    <>
      <form action={action} ref={formRef}>
        {Object.entries(hiddenFields).map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={String(value)} />
        ))}
      </form>

      <Button type="button" variant="tertiary" intent="danger" onClick={() => setOpen(true)}>
        Cancel membership
      </Button>

      <ConfirmModal
        open={open}
        title="Cancel membership?"
        message="This action marks your membership as cancelled."
        confirmText="Yes, cancel"
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          formRef.current?.requestSubmit();
          setOpen(false);
        }}
      />
    </>
  );
}
