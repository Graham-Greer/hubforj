"use client";

import ErrorState from "@/components/ui/error-state/ErrorState";

export default function CustomDomainMembershipError({ error, reset }) {
  return <ErrorState title="Could not load membership" body={error?.message || "Please try again."} onRetry={reset} />;
}
