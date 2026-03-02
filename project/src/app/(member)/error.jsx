"use client";

import ErrorState from "@/components/ui/error-state/ErrorState";

export default function MemberError({ reset }) {
  return <ErrorState title="Member area error" body="Please try again." onRetry={reset} />;
}
