"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import Modal from "@/components/ui/modal/Modal";
import { useAdminFormRuntime } from "./AdminFormRuntime";

export default function AdminDiscardChangesButton({
  href,
  label = "Cancel updates",
  variant = "secondary",
  title = "Discard unsaved changes?",
  description = "Your unsaved updates will be lost if you leave this form.",
}) {
  const router = useRouter();
  const { isDirty } = useAdminFormRuntime();
  const [isOpen, setIsOpen] = useState(false);

  if (!isDirty || !href) {
    return null;
  }

  function handleConfirm() {
    setIsOpen(false);
    router.push(href);
  }

  return (
    <>
      <Button type="button" variant={variant} onClick={() => setIsOpen(true)}>
        {label}
      </Button>
      {isOpen ? (
        <Modal
          title={title}
          onClose={() => setIsOpen(false)}
          actions={
            <>
              <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                Keep editing
              </Button>
              <Button type="button" onClick={handleConfirm}>
                Discard changes
              </Button>
            </>
          }
        >
          <p>{description}</p>
        </Modal>
      ) : null}
    </>
  );
}
