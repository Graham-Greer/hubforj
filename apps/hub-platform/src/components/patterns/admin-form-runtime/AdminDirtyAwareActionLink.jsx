"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import Modal from "@/components/ui/modal/Modal";
import { useAdminFormRuntime } from "./AdminFormRuntime";

export default function AdminDirtyAwareActionLink({
  href,
  children,
  variant = "secondary",
  title = "Leave this form?",
  description = "Your unsaved updates will be lost if you leave this form.",
  confirmLabel = "Leave form",
  cancelLabel = "Keep editing",
  ...rest
}) {
  const router = useRouter();
  const { isDirty } = useAdminFormRuntime();
  const [isOpen, setIsOpen] = useState(false);

  if (!href) {
    return null;
  }

  function handleConfirm() {
    setIsOpen(false);
    router.push(href);
  }

  if (!isDirty) {
    return (
      <Button href={href} variant={variant} {...rest}>
        {children}
      </Button>
    );
  }

  return (
    <>
      <Button type="button" variant={variant} onClick={() => setIsOpen(true)} {...rest}>
        {children}
      </Button>
      {isOpen ? (
        <Modal
          title={title}
          onClose={() => setIsOpen(false)}
          actions={
            <>
              <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                {cancelLabel}
              </Button>
              <Button type="button" onClick={handleConfirm}>
                {confirmLabel}
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
