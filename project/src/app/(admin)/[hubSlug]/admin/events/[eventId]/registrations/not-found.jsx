import ErrorState from "@/components/ui/error-state/ErrorState";

export default function RegistrationsNotFound() {
  return <ErrorState title="Event not found" body="Registrations cannot be shown for this event." variant="compact" />;
}
