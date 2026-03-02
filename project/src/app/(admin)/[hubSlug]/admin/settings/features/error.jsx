"use client";

import ErrorState from "@/components/ui/error-state/ErrorState";

export default function AdminFeaturesError({ error, reset }) {
  return <ErrorState title="Could not load feature flags" body={error?.message || "Please try again."} onRetry={reset} />;
}
