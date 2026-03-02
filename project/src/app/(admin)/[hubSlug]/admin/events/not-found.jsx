import ErrorState from "@/components/ui/error-state/ErrorState";

export default function EventNotFound() {
  return <ErrorState title="Event not found" body="The requested event does not exist for this hub." variant="compact" />;
}
