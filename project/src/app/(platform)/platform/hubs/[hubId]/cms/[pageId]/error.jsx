"use client";

import ErrorState from "@/components/ui/error-state/ErrorState";

export default function HubCmsPageError({ error, reset }) {
  return <ErrorState title="Could not load CMS page editor" body={error?.message || "Please try again."} onRetry={reset} />;
}
