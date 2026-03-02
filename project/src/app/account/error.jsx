"use client";

import ErrorState from "@/components/ui/error-state/ErrorState";

export default function CustomDomainAccountError({ error, reset }) {
  return <ErrorState title="Could not load account" body={error?.message || "Please try again."} onRetry={reset} />;
}
