import ErrorState from "@/components/ui/error-state/ErrorState";

export default function HubCmsPageNotFound() {
  return <ErrorState title="Page not found" body="The CMS page could not be found for this hub." variant="compact" />;
}
