import ErrorState from "@/components/ui/error-state/ErrorState";

export default function CustomDomainPageNotFound() {
  return <ErrorState title="Page not found" body="The requested page does not exist for this domain." variant="compact" />;
}
