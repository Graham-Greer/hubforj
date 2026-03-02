"use client";

import ErrorState from "@/components/ui/error-state/ErrorState";

export default function HubCmsError({ error, reset }) {
  return <ErrorState title="Could not load CMS pages" body={error?.message || "Please try again."} onRetry={reset} />;
}
