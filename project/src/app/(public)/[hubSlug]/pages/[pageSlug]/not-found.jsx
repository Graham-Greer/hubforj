import ErrorState from "@/components/ui/error-state/ErrorState";

export default function PublicPageNotFound() {
  return <ErrorState title="Page not found" body="This page is not available." variant="compact" />;
}
