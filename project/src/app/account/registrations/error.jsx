"use client";

import ErrorState from "@/components/ui/error-state/ErrorState";

export default function CustomDomainRegistrationsError({ error, reset }) {
  return <ErrorState title="Could not load registrations" body={error?.message || "Please try again."} onRetry={reset} />;
}
