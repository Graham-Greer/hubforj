"use client";

import { useFormStatus } from "react-dom";
import Button from "@/components/ui/button/Button";

export default function SubmitButton({
  idleLabel,
  pendingLabel,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  onboardingKey = "",
  ...rest
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      className={className}
      disabled={pending || disabled}
      data-onboarding={onboardingKey || undefined}
      {...rest}
    >
      {pending ? pendingLabel : idleLabel}
    </Button>
  );
}
