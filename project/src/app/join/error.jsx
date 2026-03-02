"use client";

import ErrorState from "@/components/ui/error-state/ErrorState";

export default function CustomDomainJoinError({ error, reset }) {
  return <ErrorState title="Could not load join page" body={error?.message || "Please try again."} onRetry={reset} />;
}
