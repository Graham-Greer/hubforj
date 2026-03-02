"use client";

import { useRef, useState } from "react";
import Button from "@/components/ui/button/Button";
import ConfirmModal from "@/components/ui/confirm-modal/ConfirmModal";

export default function CancelRegistrationButton({ hubSlug, eventId, registrationId, cancelAction }) {
  const [open, setOpen] = useState(false);
  const formRef = useRef(null);

  return (
    <>
      <form action={cancelAction} ref={formRef}>
        <input type="hidden" name="hubSlug" value={hubSlug} />
        <input type="hidden" name="eventId" value={eventId} />
        <input type="hidden" name="registrationId" value={registrationId} />
      </form>
      <Button type="button" variant="tertiary" intent="danger" onClick={() => setOpen(true)}>
        Cancel
      </Button>
      <ConfirmModal
        open={open}
        title="Cancel registration?"
        message="This action sets the registration status to cancelled and clears attendance."
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
