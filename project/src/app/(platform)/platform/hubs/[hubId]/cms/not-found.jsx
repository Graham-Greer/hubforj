import ErrorState from "@/components/ui/error-state/ErrorState";

export default function HubCmsNotFound() {
  return <ErrorState title="CMS resource not found" body="The requested hub or page could not be found." variant="compact" />;
}
