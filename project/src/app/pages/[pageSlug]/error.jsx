"use client";

import ErrorState from "@/components/ui/error-state/ErrorState";

export default function CustomDomainPageError({ error, reset }) {
  return <ErrorState title="Could not load page" body={error?.message || "Please try again."} onRetry={reset} />;
}
