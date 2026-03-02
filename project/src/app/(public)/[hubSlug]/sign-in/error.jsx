"use client";

import ErrorState from "@/components/ui/error-state/ErrorState";

export default function PublicSignInError({ error, reset }) {
  return <ErrorState title="Could not load sign-in page" body={error?.message || "Please try again."} onRetry={reset} />;
}
