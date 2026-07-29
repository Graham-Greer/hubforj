"use client";

import Button from "@/components/ui/button/Button";
import { useAdminFormRuntime } from "./AdminFormRuntime";

export default function AdminDirtyAwareBackButton({
  href,
  label,
  variant = "secondary",
  hideWhenDirty = true,
  ...rest
}) {
  const { isDirty } = useAdminFormRuntime();

  if (hideWhenDirty && isDirty) {
    return null;
  }

  return (
    <Button href={href} variant={variant} {...rest}>
      {label}
    </Button>
  );
}
