import ErrorState from "@/components/ui/error-state/ErrorState";

export default function PublicEventsNotFound() {
  return (
    <ErrorState
      title="Events not found"
      body="This hub does not have a published event for the requested route."
      variant="compact"
    />
  );
}
