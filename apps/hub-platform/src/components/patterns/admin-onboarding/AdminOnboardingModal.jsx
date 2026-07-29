"use client";

import AdminOnboardingSpotlightLayer from "./AdminOnboardingSpotlightLayer";

export default function AdminOnboardingModal({
  open = false,
  journey = null,
  step = null,
  stepIndex = 0,
  theme = "light",
  reducedMotion = false,
  onClose,
  onNext,
}) {
  if (!open || !journey || !step) {
    return null;
  }

  return (
    <AdminOnboardingSpotlightLayer
      journey={journey}
      step={step}
      stepIndex={stepIndex}
      theme={theme}
      reducedMotion={reducedMotion}
      onClose={onClose}
      onNext={onNext}
    />
  );
}
