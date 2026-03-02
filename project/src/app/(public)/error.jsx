"use client";

import ErrorState from "@/components/ui/error-state/ErrorState";

export default function PublicError({ reset }) {
  return <ErrorState title="Public site error" body="Please try again." onRetry={reset} />;
}
