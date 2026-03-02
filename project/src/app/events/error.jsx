"use client";

import ErrorState from "@/components/ui/error-state/ErrorState";

export default function CustomDomainEventsError({ error, reset }) {
  return (
    <ErrorState
      title="Could not load events"
      body={error?.message || "Please retry."}
      onRetry={reset}
    />
  );
}
