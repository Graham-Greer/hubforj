"use client";

import ErrorState from "@/components/ui/error-state/ErrorState";

export default function MembershipPlansError({ error, reset }) {
  return <ErrorState title="Could not load memberships" body={error?.message || "Please try again."} onRetry={reset} />;
}
