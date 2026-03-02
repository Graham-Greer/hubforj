import ErrorState from "@/components/ui/error-state/ErrorState";

export default function MembershipPlansNotFound() {
  return <ErrorState title="Hub not found" body="Membership management is unavailable for this hub." variant="compact" />;
}
